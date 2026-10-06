import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, ApiError, requireAdmin, acting } from "./db.js";
import { authenticate } from "./auth.js";
import {
  accrued,
  agencyDate,
  workingDates,
  consumedLeaveDays,
  validEarlyReturn,
} from "./domain.js";
async function approveAuthority(u: any, target: any) {
  if (target.id === u.id)
    throw new ApiError(403, "FORBIDDEN", "Leave cannot be self-approved");
  if (u.role === "SUPER_ADMIN") return;
  if (
    target.role === "TEAM_LEAD" ||
    !u.teamId ||
    u.teamId !== target.teamId ||
    !(u.role === "TEAM_LEAD" || (await acting(u)))
  )
    throw new ApiError(403, "FORBIDDEN", "Authorized approver required");
}
async function lockUser(tx: any, id: string) {
  await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
}
async function checkedCover(tx: any, target: any, id: string | null) {
  if (!id) return;
  const team = target.teamId
    ? await tx.team.findUnique({ where: { id: target.teamId } })
    : null;
  const cover = await tx.user.findUnique({ where: { id } });
  if (
    target.role !== "TEAM_LEAD" ||
    team?.leadId !== target.id ||
    !cover?.active ||
    cover.id === target.id ||
    cover.teamId !== target.teamId ||
    cover.role !== "AGENT"
  )
    throw new ApiError(
      400,
      "INVALID_COVER",
      "Only permanent lead leave permits an active same-team agent as cover",
    );
}
function snapshot(leave: any) {
  const dates = leave.workingDates;
  if (!Array.isArray(dates) || dates.some((d: any) => typeof d !== "string"))
    throw new ApiError(
      409,
      "SNAPSHOT_REQUIRED",
      "Existing leave needs a reviewed working-day snapshot",
    );
  return dates as string[];
}
async function notify(tx: any, userId: string, text: string) {
  await tx.notification.create({ data: { userId, kind: "LEAVE", text } });
}
async function audience(u: any) {
  if (u.role === "SUPER_ADMIN") return {};
  if (u.role === "TEAM_LEAD" || (await acting(u))) return { teamId: u.teamId };
  return { id: u.id };
}
export async function leaveRoutes(app: FastifyInstance) {
  app.get("/api/schedules", { preHandler: authenticate }, async (req) => {
    const ids = (
      await db.user.findMany({
        where: await audience(req.actor),
        select: { id: true },
      })
    ).map((u) => u.id);
    return {
      data: await db.schedule.findMany({ where: { userId: { in: ids } } }),
    };
  });
  app.post("/api/schedules", { preHandler: authenticate }, async (req) => {
    const b = z
      .object({
        userId: z.string(),
        weekdays: z.array(z.number().int().min(0).max(6)).length(5),
        exceptions: z.record(z.boolean()).default({}),
        reviewLeaveIds: z.array(z.string()).default([]),
      })
      .parse(req.body);
    if (
      new Set(b.weekdays).size !== 5 ||
      Object.keys(b.exceptions).some((d) => !/^\d{4}-\d{2}-\d{2}$/.test(d))
    )
      throw new ApiError(
        400,
        "INVALID_SCHEDULE",
        "Five distinct working days and dated exceptions required",
      );
    const target = await db.user.findUniqueOrThrow({ where: { id: b.userId } });
    if (
      req.actor.role !== "SUPER_ADMIN" &&
      !(
        req.actor.role === "TEAM_LEAD" &&
        target.teamId === req.actor.teamId &&
        (target.role === "AGENT" || target.id === req.actor.id)
      )
    )
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Team lead fills own and agent schedules",
      );
    return {
      data: await db.$transaction(async (tx) => {
        await lockUser(tx, target.id);
        const approved =
          req.actor.role === "SUPER_ADMIN" || target.role !== "TEAM_LEAD";
        const leaves = await tx.leave.findMany({
          where: {
            userId: target.id,
            status: "APPROVED",
            endsAt: { gte: new Date() },
            OR: [{ returnAt: null }, { returnAt: { gt: new Date() } }],
          },
        });
        const changed = leaves
          .map((l) => ({
            leave: l,
            dates: workingDates(l.startsAt, l.endsAt, b.weekdays, b.exceptions),
          }))
          .filter(
            ({ leave, dates }) =>
              JSON.stringify(dates) !== JSON.stringify(snapshot(leave)),
          );
        if (changed.length) {
          if (
            !approved ||
            changed.some(({ leave }) => !b.reviewLeaveIds.includes(leave.id))
          )
            throw new ApiError(
              409,
              "LEAVE_REAPPROVAL_REQUIRED",
              "Schedule affects approved leave; authorized approver must explicitly review affected requests",
            );
          await approveAuthority(req.actor, target);
          const used = await tx.leave.aggregate({
            where: { userId: target.id, status: "APPROVED" },
            _sum: { days: true },
          });
          const delta = changed.reduce(
            (sum, { leave, dates }) =>
              sum +
              (leave.returnAt
                ? consumedLeaveDays(dates, leave.returnAt)
                : dates.length) -
              leave.days,
            0,
          );
          if (
            accrued(target.joinedAt, new Date()) -
              (used._sum.days ?? 0) -
              delta <
            -2
          )
            throw new ApiError(
              400,
              "INSUFFICIENT_BALANCE",
              "Reviewed schedule would exceed negative two days",
            );
          for (const { leave, dates } of changed) {
            // Past consumed dates are immutable. Future schedule changes cannot rewrite leave already taken.
            const today = agencyDate(new Date());
            const oldPast = snapshot(leave).filter((d) => d < today),
              newPast = dates.filter((d) => d < today);
            if (JSON.stringify(oldPast) !== JSON.stringify(newPast))
              throw new ApiError(
                409,
                "PAST_LEAVE_FIXED",
                "Schedule cannot change already consumed vacation",
              );
            await tx.leave.update({
              where: { id: leave.id },
              data: {
                workingDates: dates,
                days: leave.returnAt
                  ? consumedLeaveDays(dates, leave.returnAt)
                  : dates.length,
                approvedBy: req.actor.id,
              },
            });
            await tx.audit.create({
              data: {
                actorId: req.actor.id,
                action: "LEAVE_SCHEDULE_REAPPROVED",
                data: {
                  leaveId: leave.id,
                  before: snapshot(leave),
                  after: dates,
                },
              },
            });
          }
        }
        const data = {
          userId: b.userId,
          weekdays: b.weekdays,
          exceptions: b.exceptions,
          approved,
          createdBy: req.actor.id,
        };
        const result = await tx.schedule.upsert({
          where: { userId: b.userId },
          create: data,
          update: data,
        });
        if (!approved) {
          const admins = await tx.user.findMany({
            where: { role: "SUPER_ADMIN", active: true },
          });
          for (const a of admins)
            await notify(tx, a.id, "Team lead schedule needs approval");
        }
        return result;
      }),
    };
  });
  app.post(
    "/api/schedules/:id/approve",
    { preHandler: authenticate },
    async (req) => {
      requireAdmin(req.actor);
      return {
        data: await db.$transaction(async (tx) => {
          const s = await tx.schedule.findUniqueOrThrow({
            where: { id: (req.params as any).id },
          });
          await lockUser(tx, s.userId);
          return tx.schedule.update({
            where: { id: s.id },
            data: { approved: true },
          });
        }),
      };
    },
  );
  app.get("/api/leave", { preHandler: authenticate }, async (req) => {
    const people = await db.user.findMany({
      where: await audience(req.actor),
      select: { id: true },
    });
    return {
      data: await db.leave.findMany({
        where: { userId: { in: people.map((p) => p.id) } },
        orderBy: { createdAt: "desc" },
      }),
    };
  });
  app.get("/api/leave/balance", { preHandler: authenticate }, async (req) => {
    const u = await db.user.findUniqueOrThrow({ where: { id: req.actor.id } });
    const used = await db.leave.aggregate({
      where: { userId: u.id, status: "APPROVED" },
      _sum: { days: true },
    });
    return {
      data: {
        earned: accrued(u.joinedAt, new Date()),
        used: used._sum.days ?? 0,
        balance: accrued(u.joinedAt, new Date()) - (used._sum.days ?? 0),
      },
    };
  });
  app.post("/api/leave", { preHandler: authenticate }, async (req) => {
    const b = z
      .object({
        startsAt: z.string().datetime(),
        endsAt: z.string().datetime(),
        actingUserId: z.string().optional(),
      })
      .parse(req.body);
    return {
      data: await db.$transaction(async (tx) => {
        await lockUser(tx, req.actor.id);
        const target = await tx.user.findUniqueOrThrow({
          where: { id: req.actor.id },
        });
        if (b.actingUserId) await checkedCover(tx, target, b.actingUserId);
        const s = await tx.schedule.findUnique({
          where: { userId: target.id },
        });
        if (!s?.approved)
          throw new ApiError(
            400,
            "SCHEDULE_REQUIRED",
            "Approved schedule required",
          );
        const start = new Date(b.startsAt),
          end = new Date(b.endsAt);
        if (end < start || agencyDate(start) < agencyDate(new Date()))
          throw new ApiError(
            400,
            "INVALID_DATES",
            "Future ordered dates required",
          );
        const dates = workingDates(start, end, s.weekdays, s.exceptions as any);
        if (!dates.length)
          throw new ApiError(
            400,
            "NO_WORKDAYS",
            "No scheduled working days selected",
          );
        const result = await tx.leave.create({
          data: {
            ...b,
            startsAt: start,
            endsAt: end,
            userId: target.id,
            teamId: target.teamId,
            days: dates.length,
            workingDates: dates,
          },
        });
        const team = target.teamId
          ? await tx.team.findUnique({ where: { id: target.teamId } })
          : null;
        const recipients =
          target.role === "TEAM_LEAD" || !team
            ? (
                await tx.user.findMany({
                  where: { role: "SUPER_ADMIN", active: true },
                })
              ).map((u) => u.id)
            : [team.leadId];
        for (const id of recipients)
          await notify(tx, id, "Vacation request needs approval");
        return result;
      }),
    };
  });
  app.post(
    "/api/leave/:id/approve",
    { preHandler: authenticate },
    async (req) => {
      const initial = await db.leave.findUniqueOrThrow({
        where: { id: (req.params as any).id },
      });
      const target = await db.user.findUniqueOrThrow({
        where: { id: initial.userId },
      });
      await approveAuthority(req.actor, target);
      const b = z
        .object({
          decision: z.enum(["APPROVE", "REJECT"]).default("APPROVE"),
          reassign: z
            .array(
              z.object({
                leadId: z.string(),
                agentId: z.string().optional(),
                automatic: z.boolean().optional(),
              }),
            )
            .default([]),
          actingRate: z.number().min(0).optional(),
        })
        .parse(req.body ?? {});
      if (b.actingRate !== undefined) requireAdmin(req.actor);
      return {
        data: await db.$transaction(async (tx) => {
          await lockUser(tx, target.id);
          const leave = await tx.leave.findUniqueOrThrow({
            where: { id: initial.id },
          });
          if (leave.status !== "PENDING")
            throw new ApiError(
              400,
              "INVALID_STATE",
              "Pending request required",
            );
          let dates = snapshot(leave);
          if (b.decision === "APPROVE") {
            await checkedCover(tx, target, leave.actingUserId);
            const schedule = await tx.schedule.findUnique({
              where: { userId: target.id },
            });
            if (!schedule?.approved)
              throw new ApiError(
                400,
                "SCHEDULE_REQUIRED",
                "Approved schedule required",
              );
            dates = workingDates(
              leave.startsAt,
              leave.endsAt,
              schedule.weekdays,
              schedule.exceptions as any,
            );
            if (!dates.length)
              throw new ApiError(
                400,
                "NO_WORKDAYS",
                "No scheduled working days selected",
              );
            if (
              await tx.leave.findFirst({
                where: {
                  userId: target.id,
                  status: "APPROVED",
                  startsAt: { lte: leave.endsAt },
                  endsAt: { gte: leave.startsAt },
                  OR: [
                    { returnAt: null },
                    { returnAt: { gt: leave.startsAt } },
                  ],
                },
              })
            )
              throw new ApiError(
                409,
                "OVERLAPPING_LEAVE",
                "Approved vacation already covers these dates",
              );
            const used = await tx.leave.aggregate({
              where: { userId: target.id, status: "APPROVED" },
              _sum: { days: true },
            });
            if (
              accrued(target.joinedAt, new Date()) -
                (used._sum.days ?? 0) -
                dates.length <
              -2
            )
              throw new ApiError(
                400,
                "INSUFFICIENT_BALANCE",
                "Leave may not exceed negative two days",
              );
            if (
              leave.actingUserId &&
              Number(b.actingRate ?? leave.actingRate) > Number(target.leadRate)
            )
              throw new ApiError(
                400,
                "INVALID_RATE",
                "Acting share cannot exceed permanent lead rate",
              );
            for (const plan of b.reassign) {
              const lead = await tx.lead.findUnique({
                where: { id: plan.leadId },
              });
              if (
                !lead ||
                lead.teamId !== target.teamId ||
                lead.agentId !== target.id ||
                ["LOST", "WON"].includes(lead.stage)
              )
                throw new ApiError(
                  400,
                  "INVALID_REASSIGNMENT",
                  "Select only this employee active leads",
                );
              if (plan.agentId) {
                const recipient = await tx.user.findUnique({
                  where: { id: plan.agentId },
                });
                if (
                  !recipient?.active ||
                  recipient.teamId !== target.teamId ||
                  recipient.role !== "AGENT" ||
                  recipient.id === target.id
                )
                  throw new ApiError(
                    400,
                    "INVALID_AGENT",
                    "Choose another active same-team agent",
                  );
              }
            }
          }
          const result = await tx.leave.update({
            where: { id: leave.id },
            data: {
              status: b.decision === "APPROVE" ? "APPROVED" : "REJECTED",
              approvedBy: req.actor.id,
              reassign: b.decision === "APPROVE" ? b.reassign : [],
              actingRate: b.actingRate,
              days: dates.length,
              workingDates: dates,
            },
          });
          await notify(
            tx,
            target.id,
            `Vacation ${result.status.toLowerCase()}`,
          );
          return result;
        }),
      };
    },
  );
  app.post(
    "/api/leave/:id/cancel",
    { preHandler: authenticate },
    async (req) => {
      const b = z
        .object({ returnAt: z.string().datetime().optional() })
        .parse(req.body ?? {});
      return {
        data: await db.$transaction(async (tx) => {
          const initial = await tx.leave.findUniqueOrThrow({
            where: { id: (req.params as any).id },
          });
          if (initial.userId !== req.actor.id)
            throw new ApiError(403, "FORBIDDEN", "Own request only");
          await lockUser(tx, initial.userId);
          const l = await tx.leave.findUniqueOrThrow({
            where: { id: initial.id },
          });
          if (l.status === "PENDING")
            return tx.leave.update({
              where: { id: l.id },
              data: { status: "CANCELLED" },
            });
          if (l.status !== "APPROVED" || l.returnAt)
            throw new ApiError(
              400,
              "INVALID_STATE",
              "Current approved leave required",
            );
          if (agencyDate(l.endsAt) < agencyDate(new Date()))
            throw new ApiError(
              400,
              "INVALID_DATES",
              "Completed leave cannot be cancelled",
            );
          if (
            b.returnAt &&
            !validEarlyReturn(
              l.startsAt,
              l.endsAt,
              new Date(b.returnAt),
              new Date(),
            )
          )
            throw new ApiError(
              400,
              "INVALID_RETURN",
              "Return must be today or later within approved leave",
            );
          const result = await tx.leave.update({
            where: { id: l.id },
            data: {
              cancellationRequested: true,
              requestedReturnAt: b.returnAt ? new Date(b.returnAt) : null,
            },
          });
          if (l.approvedBy)
            await notify(
              tx,
              l.approvedBy,
              "Vacation cancellation/early return needs approval",
            );
          return result;
        }),
      };
    },
  );
  app.post(
    "/api/leave/:id/cancel-review",
    { preHandler: authenticate },
    async (req) => {
      const initial = await db.leave.findUniqueOrThrow({
        where: { id: (req.params as any).id },
      });
      const target = await db.user.findUniqueOrThrow({
        where: { id: initial.userId },
      });
      await approveAuthority(req.actor, target);
      const b = z.object({ approve: z.boolean() }).parse(req.body);
      return {
        data: await db.$transaction(async (tx) => {
          await lockUser(tx, target.id);
          const l = await tx.leave.findUniqueOrThrow({
            where: { id: initial.id },
          });
          if (l.status !== "APPROVED" || !l.cancellationRequested)
            throw new ApiError(
              400,
              "INVALID_STATE",
              "Approved cancellation request required",
            );
          if (!b.approve)
            return tx.leave.update({
              where: { id: l.id },
              data: { cancellationRequested: false, requestedReturnAt: null },
            });
          if (agencyDate(l.startsAt) > agencyDate(new Date()))
            return tx.leave.update({
              where: { id: l.id },
              data: {
                status: "CANCELLED",
                cancellationRequested: false,
                requestedReturnAt: null,
                reassign: [],
              },
            });
          const at = l.requestedReturnAt ?? new Date();
          if (!validEarlyReturn(l.startsAt, l.endsAt, at, new Date()))
            throw new ApiError(
              400,
              "INVALID_RETURN",
              "Return must be today or later within approved leave",
            );
          const days = consumedLeaveDays(snapshot(l), at);
          const result = await tx.leave.update({
            where: { id: l.id },
            data: {
              returnAt: at,
              days,
              cancellationRequested: false,
              requestedReturnAt: null,
              reassign: [],
            },
          });
          await notify(tx, target.id, "Vacation early return approved");
          return result;
        }),
      };
    },
  );
}
