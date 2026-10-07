import type { FastifyInstance } from "fastify";
import { z } from "zod";
import {
  db,
  ApiError,
  event,
  accessible,
  scope,
  teamAuthority,
  requireAdmin,
  acting,
  saleFor,
} from "./db.js";
import { authenticate } from "./auth.js";
import { phone, stages, commission, agencyDate } from "./domain.js";
import { assignTeam, chooseAgent, reassign } from "./routing.js";
import { signingRate } from "./adapters.js";
const contactBody = z.object({
  name: z.string().trim().min(2),
  phone: z.string(),
  email: z.string().email().optional().or(z.literal("")),
  nationality: z.string().min(1).default("Unknown"),
  language: z.enum(["ka", "ru", "he", "en"]).default("en"),
  projectIds: z.array(z.string()).default([]),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  budgetCurrency: z.enum(["USD", "GEL"]).default("USD"),
  autoAssign: z.boolean().optional(),
});
async function lost(tx: any, lead: any, u: any, comment: string) {
  const reviewed = u.role === "SUPER_ADMIN" || u.role === "TEAM_LEAD";
  await tx.lead.update({
    where: { id: lead.id },
    data: { stage: "LOST", previousStage: lead.stage, lostReview: !reviewed },
  });
  const reservations = await tx.reservation.findMany({
    where: { leadId: lead.id, releasedAt: null },
  });
  for (const r of reservations) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${r.unitId}))`;
    const current = await tx.reservation.findUniqueOrThrow({
      where: { id: r.id },
    });
    if (current.releasedAt) continue;
    await tx.unit.update({
      where: { id: r.unitId },
      data: { status: "AVAILABLE" },
    });
    await tx.reservation.update({
      where: { id: r.id },
      data: { releasedAt: new Date(), activeUnitId: null },
    });
  }
  await tx.reminder.updateMany({
    where: { leadId: lead.id, state: "PENDING" },
    data: { state: "CANCELLED" },
  });
  await event(tx, lead.id, u.id, "LOST", {
    comment,
    previousStage: lead.stage,
    reviewed,
  });
  if (!reviewed && lead.teamId) {
    const t = await tx.team.findUnique({ where: { id: lead.teamId } });
    if (t?.leadId)
      await tx.notification.create({
        data: {
          userId: t.leadId,
          leadId: lead.id,
          kind: "LOST_REVIEW",
          text: comment,
        },
      });
  }
}
export async function crmRoutes(app: FastifyInstance) {
  app.get("/api/leads", { preHandler: authenticate }, async (req) => {
    const q = req.query as any;
    const and: any[] = [await scope(req.actor)];
    if (q.scope === "active") and.push({ stage: { notIn: ["LOST", "WON"] } });
    if (q.scope === "lost") and.push({ stage: "LOST" });
    if (q.scope === "won") and.push({ stage: "WON" });
    if (q.stage) and.push({ stage: q.stage });
    if (q.agentId) and.push({ agentId: q.agentId });
    if (q.projectId) and.push({ projectIds: { has: q.projectId } });
    if (q.source) and.push({ source: q.source });
    if (q.from || q.to) {
      const range: any = {};
      if (q.from) range.gte = new Date(`${q.from}T00:00:00+04:00`);
      if (q.to) {
        const end = new Date(`${q.to}T00:00:00+04:00`);
        end.setUTCDate(end.getUTCDate() + 1);
        range.lt = end;
      }
      if (Object.values(range).some((d: any) => !Number.isFinite(d.getTime())))
        throw new ApiError(400, "INVALID_DATES", "Invalid date filter");
      and.push({ createdAt: range });
    }
    if (q.teamId) {
      if (req.actor.role !== "SUPER_ADMIN")
        throw new ApiError(
          403,
          "FORBIDDEN",
          "Team filtering is restricted to SuperAdmin",
        );
      and.push({ teamId: q.teamId });
    }
    if (q.search)
      and.push({
        customer: {
          OR: [
            { name: { contains: q.search, mode: "insensitive" } },
            { phone: { contains: q.search } },
          ],
        },
      });
    return {
      data: await db.lead.findMany({
        where: { AND: and },
        include: { customer: true },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
    };
  });
  app.get("/api/leads/:id", { preHandler: authenticate }, async (req) => {
    const l = await accessible(req.actor, (req.params as any).id);
    const result = await db.lead.findUnique({
      where: { id: l.id },
      include: {
        customer: true,
        events: { orderBy: { createdAt: "asc" } },
        sales: true,
        reminders: true,
        reservations: true,
      },
    });
    const comments = await db.comment.findMany({
      where: { leadId: l.id, deleted: false },
      orderBy: { createdAt: "asc" },
    });
    const deletedIds = new Set(
      (
        await db.comment.findMany({
          where: { leadId: l.id, deleted: true },
          select: { id: true },
        })
      ).map((c) => c.id),
    );
    const actorNames = new Map(
      (
        await db.user.findMany({
          where: {
            id: {
              in: (result?.events || [])
                .map((e) => e.actorId)
                .filter((id): id is string => Boolean(id)),
            },
          },
          select: { id: true, name: true },
        })
      ).map((u) => [u.id, u.name]),
    );
    return {
      data: result
        ? {
            ...result,
            events: result.events.map((e) => ({
              ...e,
              actorName: e.actorId ? actorNames.get(e.actorId) : null,
              data: deletedIds.has((e.data as any)?.id)
                ? { id: (e.data as any).id, deleted: true }
                : e.data,
            })),
            customer: { ...result.customer, language: result.contactLanguage },
            comments,
            sales: result.sales.map((s) => saleFor(req.actor, s)),
          }
        : null,
    };
  });
  app.post("/api/leads", { preHandler: authenticate }, async (req) => {
    const b = contactBody.parse(req.body);
    if (
      b.budgetMin !== undefined &&
      b.budgetMax !== undefined &&
      b.budgetMin > b.budgetMax
    )
      throw new ApiError(400, "INVALID_BUDGET", "Minimum exceeds maximum");
    const p = phone(b.phone);
    return {
      data: await db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(481529)`;
        if (await tx.customer.findUnique({ where: { phone: p } }))
          throw new ApiError(
            409,
            "DUPLICATE",
            "This phone already exists; no records were merged",
          );
        const c = await tx.customer.create({
          data: {
            name: b.name,
            phone: p,
            email: b.email || null,
            nationality: b.nationality,
            language: b.language,
          },
        });
        let routing: any = { teamId: req.actor.teamId, agentId: req.actor.id };
        if (req.actor.role === "SUPER_ADMIN") routing = await assignTeam(tx);
        if (b.autoAssign && routing.teamId && req.actor.role !== "AGENT")
          routing.agentId = await chooseAgent(tx, routing.teamId);
        const l = await tx.lead.create({
          data: {
            customerId: c.id,
            ...routing,
            source: "MANUAL",
            contactLanguage: b.language,
            projectIds: b.projectIds,
            budgetMin: b.budgetMin,
            budgetMax: b.budgetMax,
            budgetCurrency: b.budgetCurrency,
          },
        });
        await event(tx, l.id, req.actor.id, "CREATED", {});
        return { ...l, customer: c };
      }),
    };
  });
  app.patch("/api/leads/:id", { preHandler: authenticate }, async (req) => {
    const l = await accessible(req.actor, (req.params as any).id);
    const b = contactBody.partial().omit({ autoAssign: true }).parse(req.body);
    return {
      data: await db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${l.id}))`;
        const latest = await tx.lead.findUniqueOrThrow({ where: { id: l.id } });
        const minimum = b.budgetMin ?? latest.budgetMin,
          maximum = b.budgetMax ?? latest.budgetMax;
        if (
          minimum != null &&
          maximum != null &&
          Number(minimum) > Number(maximum)
        )
          throw new ApiError(400, "INVALID_BUDGET", "Minimum exceeds maximum");
        const { name, phone: raw, email, nationality, language, ...fields } = b;
        const p = raw ? phone(raw) : undefined;
        if (
          p &&
          (await tx.customer.findFirst({
            where: { phone: p, id: { not: l.customerId } },
          }))
        )
          throw new ApiError(
            409,
            "DUPLICATE",
            "Phone belongs to another customer",
          );
        await tx.customer.update({
          where: { id: l.customerId },
          data: {
            name,
            phone: p,
            email: email === undefined ? undefined : email || null,
            nationality,
            language,
          },
        });
        await event(tx, l.id, req.actor.id, "DETAILS_UPDATED", b);
        return tx.lead.update({
          where: { id: l.id },
          data: {
            ...fields,
            ...(language ? { contactLanguage: language } : {}),
          },
          include: { customer: true },
        });
      }),
    };
  });

  app.post(
    "/api/leads/:id/purchases",
    { preHandler: authenticate },
    async (req) => {
      const original = await accessible(req.actor, (req.params as any).id);
      const b = z
        .object({ projectIds: z.array(z.string()).default([]) })
        .parse(req.body ?? {});
      const result = await db.$transaction(async (tx) => {
        const assigned = original.agentId
          ? await tx.user.findUnique({ where: { id: original.agentId } })
          : null;
        const created = await tx.lead.create({
          data: {
            customerId: original.customerId,
            teamId: assigned?.teamId ?? original.teamId,
            agentId: original.agentId,
            contactLanguage: original.contactLanguage,
            source: "MANUAL",
            projectIds: b.projectIds,
          },
        });
        await event(tx, created.id, req.actor.id, "LINKED_PURCHASE", {
          from: original.id,
        });
        await event(tx, original.id, req.actor.id, "LINKED_PURCHASE", {
          to: created.id,
        });
        return created;
      });
      return { data: result };
    },
  );
  app.post(
    "/api/leads/:id/stage",
    { preHandler: authenticate },
    async (req) => {
      const l = await accessible(req.actor, (req.params as any).id);
      const b = z
        .object({
          stage: z.enum(stages),
          comment: z.string().trim().optional(),
        })
        .parse(req.body);
      if (l.stage === "WON" || b.stage === "WON")
        throw new ApiError(
          400,
          "SALE_FLOW_REQUIRED",
          "Use confirmed sale action; Won is final",
        );
      if (l.stage === "LOST")
        throw new ApiError(
          400,
          "REVIEW_REQUIRED",
          "Use Lost review or reopen action",
        );
      if (b.stage === "LOST" && !b.comment)
        throw new ApiError(400, "REASON_REQUIRED", "Loss explanation required");
      return {
        data: await db.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${l.id}))`;
          const current = await tx.lead.findUniqueOrThrow({
            where: { id: l.id },
          });
          if (current.stage === "WON" || current.stage === "LOST")
            throw new ApiError(
              400,
              "INVALID_STATE",
              "Lead stage changed; refresh",
            );
          if (b.stage === "LOST")
            await lost(tx, current, req.actor, b.comment!);
          else {
            await tx.lead.update({
              where: { id: l.id },
              data: { stage: b.stage },
            });
            if (b.stage === "CONTACTED")
              await tx.reminder.updateMany({
                where: { leadId: l.id, kind: "UNANSWERED", state: "PENDING" },
                data: { state: "CANCELLED" },
              });
            await event(tx, l.id, req.actor.id, "STAGE", {
              from: l.stage,
              to: b.stage,
              comment: b.comment ?? "",
            });
          }
          return tx.lead.findUnique({
            where: { id: l.id },
            include: { customer: true },
          });
        }),
      };
    },
  );
  app.post(
    "/api/leads/:id/review",
    { preHandler: authenticate },
    async (req) => {
      const l = await accessible(req.actor, (req.params as any).id);
      if (req.actor.role !== "SUPER_ADMIN" && req.actor.role !== "TEAM_LEAD")
        throw new ApiError(403, "FORBIDDEN", "Permanent lead review required");
      const b = z
        .object({ decision: z.enum(["CONFIRM", "RETURN"]) })
        .parse(req.body);
      if (l.stage !== "LOST")
        throw new ApiError(400, "INVALID_STATE", "Not Lost");
      return {
        data: await db.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${l.id}))`;
          const current = await tx.lead.findUniqueOrThrow({
            where: { id: l.id },
          });
          if (current.stage !== "LOST" || !current.lostReview)
            throw new ApiError(
              409,
              "REVIEW_CHANGED",
              "This Lost review has already changed",
            );
          const result = await tx.lead.update({
            where: { id: l.id },
            data: {
              lostReview: false,
              stage:
                b.decision === "RETURN"
                  ? (l.previousStage ?? "CONTACTED")
                  : "LOST",
            },
          });
          await event(tx, l.id, req.actor.id, "LOST_REVIEW", b);
          return result;
        }),
      };
    },
  );
  app.post(
    "/api/leads/:id/reopen",
    { preHandler: authenticate },
    async (req) => {
      const l = await accessible(req.actor, (req.params as any).id);
      if (req.actor.role !== "SUPER_ADMIN" && l.teamId !== req.actor.teamId)
        throw new ApiError(
          400,
          "TEAM_CHANGED",
          "Ask SuperAdmin to reassign this historical lead before reopening it",
        );
      if (l.stage !== "LOST" || l.lostReview)
        throw new ApiError(
          400,
          "REVIEW_REQUIRED",
          "Confirmed Lost record required",
        );
      return {
        data: await db.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${l.id}))`;
          const current = await tx.lead.findUniqueOrThrow({
            where: { id: l.id },
          });
          if (current.stage !== "LOST" || current.lostReview)
            throw new ApiError(
              409,
              "REVIEW_CHANGED",
              "Confirmed Lost record required",
            );
          await event(tx, l.id, req.actor.id, "REOPEN", {});
          return tx.lead.update({
            where: { id: l.id },
            data: { stage: "CONTACTED" },
          });
        }),
      };
    },
  );
  app.delete("/api/leads/:id", { preHandler: authenticate }, async (req) => {
    requireAdmin(req.actor);
    const l = await accessible(req.actor, (req.params as any).id);
    if (l.stage !== "LOST" || (req.body as any)?.confirmed !== true)
      throw new ApiError(
        400,
        "CONFIRMATION_REQUIRED",
        "Only Lost records with explicit confirmation may be deleted",
      );
    if (await db.sale.count({ where: { leadId: l.id, reversedAt: null } }))
      throw new ApiError(400, "HAS_SALES", "Lead has completed purchases");
    await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${l.id}))`;
      const current = await tx.lead.findUniqueOrThrow({ where: { id: l.id } });
      if (
        current.stage !== "LOST" ||
        (await tx.sale.count({ where: { leadId: l.id, reversedAt: null } }))
      )
        throw new ApiError(
          409,
          "STATE_CHANGED",
          "Only Lost records without completed purchases may be deleted",
        );
      await tx.audit.create({
        data: {
          actorId: req.actor.id,
          action: "LEAD_DELETED",
          data: { id: l.id, customerId: l.customerId },
        },
      });
      await tx.comment.deleteMany({ where: { leadId: l.id } });
      await tx.notification.deleteMany({ where: { leadId: l.id } });
      await tx.sale.deleteMany({
        where: { leadId: l.id, reversedAt: { not: null } },
      });
      await tx.lead.delete({ where: { id: l.id } });
      if (!(await tx.lead.count({ where: { customerId: l.customerId } })))
        await tx.customer.delete({ where: { id: l.customerId } });
    });
    return { data: true };
  });
  app.post(
    "/api/leads/:id/calls",
    { preHandler: authenticate },
    async (req) => {
      const l = await accessible(req.actor, (req.params as any).id);
      const b = z
        .object({
          outcome: z.enum(["ANSWERED", "NO_ANSWER"]),
          comment: z.string().trim().min(1),
          requestId: z.string().optional(),
        })
        .parse(req.body);
      if (["LOST", "WON"].includes(l.stage))
        throw new ApiError(400, "INVALID_STATE", "Active lead required");
      return {
        data: await db.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${l.id}))`;
          const current = await tx.lead.findUniqueOrThrow({
            where: { id: l.id },
          });
          if (["LOST", "WON"].includes(current.stage))
            throw new ApiError(400, "INVALID_STATE", "Active lead required");
          if (
            b.requestId &&
            (await tx.event.findFirst({
              where: {
                leadId: l.id,
                type: "CALL",
                data: { path: ["requestId"], equals: b.requestId },
              },
            }))
          )
            return tx.lead.findUnique({ where: { id: l.id } });
          await event(tx, l.id, req.actor.id, "CALL", b);
          if (b.outcome === "ANSWERED") {
            await tx.lead.update({
              where: { id: l.id },
              data: {
                answered: true,
                stage: ["NEW", "NOT_ANSWERED"].includes(l.stage)
                  ? "CONTACTED"
                  : l.stage,
              },
            });
            await tx.reminder.updateMany({
              where: { leadId: l.id, kind: "UNANSWERED", state: "PENDING" },
              data: { state: "CANCELLED" },
            });
          } else if (!current.answered) {
            const count = current.unanswered + 1;
            await tx.lead.update({
              where: { id: l.id },
              data: { unanswered: count },
            });
            if (count === 1) {
              await tx.lead.update({
                where: { id: l.id },
                data: { stage: "NOT_ANSWERED" },
              });
              if (l.agentId)
                await tx.reminder.create({
                  data: {
                    leadId: l.id,
                    userId: l.agentId,
                    kind: "UNANSWERED",
                    dueAt: new Date(Date.now() + 5400000),
                    text: "Follow up after unanswered call",
                  },
                });
            } else await lost(tx, current, req.actor, b.comment);
          }
          return tx.lead.findUnique({
            where: { id: l.id },
            include: { customer: true },
          });
        }),
      };
    },
  );
  app.post(
    "/api/leads/:id/comments",
    { preHandler: authenticate },
    async (req) => {
      const l = await accessible(req.actor, (req.params as any).id);
      const b = z
        .object({ text: z.string().trim().min(1).max(10000) })
        .parse(req.body);
      return {
        data: await db.$transaction(async (tx) => {
          const c = await tx.comment.create({
            data: { leadId: l.id, actorId: req.actor.id, text: b.text },
          });
          await event(tx, l.id, req.actor.id, "COMMENT", {
            id: c.id,
            text: b.text,
          });
          return c;
        }),
      };
    },
  );
  app.patch("/api/comments/:id", { preHandler: authenticate }, async (req) => {
    const c = await db.comment.findUniqueOrThrow({
      where: { id: (req.params as any).id },
    });
    await accessible(req.actor, c.leadId);
    if (c.actorId !== req.actor.id || c.deleted)
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Only your own comment may be edited",
      );
    const b = z.object({ text: z.string().trim().min(1) }).parse(req.body);
    return {
      data: await db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${c.id}))`;
        const current = await tx.comment.findUniqueOrThrow({
          where: { id: c.id },
        });
        if (current.deleted)
          throw new ApiError(
            409,
            "COMMENT_DELETED",
            "Comment has been deleted",
          );
        const updated = await tx.comment.update({
          where: { id: c.id },
          data: {
            text: b.text,
            versions: [
              ...(current.versions as any[]),
              { text: current.text, at: current.updatedAt.toISOString() },
            ],
          },
        });
        await event(tx, c.leadId, req.actor.id, "COMMENT_EDIT", {
          id: c.id,
          from: current.text,
          to: b.text,
        });
        return updated;
      }),
    };
  });
  app.delete("/api/comments/:id", { preHandler: authenticate }, async (req) => {
    requireAdmin(req.actor);
    const c = await db.comment.findUniqueOrThrow({
      where: { id: (req.params as any).id },
    });
    await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${c.id}))`;
      const current = await tx.comment.findUniqueOrThrow({
        where: { id: c.id },
      });
      if (current.deleted) return;
      await tx.comment.update({
        where: { id: c.id },
        data: { deleted: true, text: "" },
      });
      await event(tx, c.leadId, req.actor.id, "COMMENT_DELETED", { id: c.id });
    });
    return { data: true };
  });
  app.post(
    "/api/leads/:id/assign",
    { preHandler: authenticate },
    async (req) => {
      await teamAuthority(req.actor);
      const l = await accessible(req.actor, (req.params as any).id);
      if (["WON", "LOST"].includes(l.stage))
        throw new ApiError(400, "INVALID_STATE", "Active leads only");
      const b = z
        .object({
          agentId: z.string().optional(),
          automatic: z.boolean().optional(),
        })
        .parse(req.body);
      await db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(481529)`;
        const id =
          (b.automatic || !b.agentId) && l.teamId
            ? await chooseAgent(tx, l.teamId)
            : b.agentId;
        if (!id) throw new ApiError(400, "AGENT_REQUIRED", "Choose agent");
        await reassign(tx, l, id, req.actor.id);
      });
      return { data: true };
    },
  );
  app.post(
    "/api/leads/:id/viewing",
    { preHandler: authenticate },
    async (req) => {
      const l = await accessible(req.actor, (req.params as any).id);
      if (["LOST", "WON"].includes(l.stage))
        throw new ApiError(
          400,
          "INVALID_STATE",
          "Viewing requires active lead",
        );
      const b = z
        .object({
          date: z.string().datetime().nullable(),
          location: z.string().optional(),
        })
        .parse(req.body);
      await db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${l.id}))`;
        const current = await tx.lead.findUniqueOrThrow({
          where: { id: l.id },
        });
        if (["LOST", "WON"].includes(current.stage))
          throw new ApiError(
            400,
            "INVALID_STATE",
            "Viewing requires active lead",
          );
        await tx.reminder.updateMany({
          where: { leadId: l.id, kind: "VIEWING", state: "PENDING" },
          data: { state: "CANCELLED" },
        });
        await tx.lead.update({
          where: { id: l.id },
          data: {
            viewingAt: b.date ? new Date(b.date) : null,
            viewingLocation: b.location,
            stage: b.date ? "VIEWING_SCHEDULED" : undefined,
          },
        });
        if (b.date && l.agentId)
          await tx.reminder.create({
            data: {
              leadId: l.id,
              userId: l.agentId,
              kind: "VIEWING",
              dueAt: new Date(
                Math.max(Date.now(), new Date(b.date).getTime() - 3600000),
              ),
              text: "Viewing in one hour",
            },
          });
        await event(tx, l.id, req.actor.id, "VIEWING", b);
      });
      return { data: true };
    },
  );
  app.post(
    "/api/leads/:id/reminders",
    { preHandler: authenticate },
    async (req) => {
      const l = await accessible(req.actor, (req.params as any).id);
      const b = z
        .object({
          dueAt: z.string().datetime(),
          text: z.string().trim().min(1),
        })
        .parse(req.body);
      if (!l.agentId)
        throw new ApiError(400, "UNASSIGNED", "Assign an agent first");
      return {
        data: await db.reminder.create({
          data: {
            leadId: l.id,
            userId: l.agentId,
            kind: "MANUAL",
            dueAt: new Date(b.dueAt),
            text: b.text,
          },
        }),
      };
    },
  );
  app.patch("/api/reminders/:id", { preHandler: authenticate }, async (req) => {
    const r = await db.reminder.findUniqueOrThrow({
      where: { id: (req.params as any).id },
    });
    await accessible(req.actor, r.leadId);
    if (r.kind !== "MANUAL")
      throw new ApiError(
        400,
        "AUTOMATIC",
        "Automatic reminder cannot be manually changed",
      );
    const b = z
      .object({
        state: z.enum(["CANCELLED", "COMPLETED"]).optional(),
        dueAt: z.string().datetime().optional(),
      })
      .parse(req.body);
    return {
      data: await db.$transaction(async (tx) => {
        await event(tx, r.leadId, req.actor.id, "REMINDER_UPDATED", {
          id: r.id,
          ...b,
        });
        return tx.reminder.update({
          where: { id: r.id },
          data: {
            state: b.state ?? (b.dueAt ? "PENDING" : undefined),
            dueAt: b.dueAt ? new Date(b.dueAt) : undefined,
          },
        });
      }),
    };
  });
  app.post(
    "/api/leads/:id/reserve",
    { preHandler: authenticate },
    async (req) => {
      const l = await accessible(req.actor, (req.params as any).id);
      if (["LOST", "WON"].includes(l.stage))
        throw new ApiError(400, "INVALID_STATE", "Active lead required");
      const b = z.object({ unitId: z.string() }).parse(req.body);
      return {
        data: await db.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${l.id}))`;
          const current = await tx.lead.findUniqueOrThrow({
            where: { id: l.id },
          });
          if (["LOST", "WON"].includes(current.stage))
            throw new ApiError(400, "INVALID_STATE", "Active lead required");
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${b.unitId}))`;
          const changed = await tx.unit.updateMany({
            where: { id: b.unitId, status: "AVAILABLE" },
            data: { status: "RESERVED" },
          });
          if (!changed.count)
            throw new ApiError(409, "UNAVAILABLE", "Apartment unavailable");
          const r = await tx.reservation.create({
            data: {
              leadId: l.id,
              unitId: b.unitId,
              activeUnitId: b.unitId,
              nextReviewAt: new Date(Date.now() + 86400000),
            },
          });
          await event(tx, l.id, req.actor.id, "RESERVED", { unitId: b.unitId });
          return r;
        }),
      };
    },
  );
  app.post(
    "/api/reservations/:id/review",
    { preHandler: authenticate },
    async (req) => {
      const r = await db.reservation.findUniqueOrThrow({
        where: { id: (req.params as any).id },
      });
      await accessible(req.actor, r.leadId);
      if (r.releasedAt)
        throw new ApiError(400, "RELEASED", "Reservation released");
      const b = z
        .object({ decision: z.enum(["KEEP", "REMOVE"]) })
        .parse(req.body);
      await db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${r.unitId}))`;
        const current = await tx.reservation.findUniqueOrThrow({
          where: { id: r.id },
        });
        if (current.releasedAt)
          throw new ApiError(400, "RELEASED", "Reservation released");
        const unit = await tx.unit.findUniqueOrThrow({
          where: { id: r.unitId },
        });
        if (unit.status !== "RESERVED")
          throw new ApiError(
            409,
            "STALE_RESERVATION",
            "Reservation no longer controls apartment",
          );
        if (b.decision === "REMOVE")
          await tx.unit.update({
            where: { id: r.unitId },
            data: { status: "AVAILABLE" },
          });
        await tx.reservation.update({
          where: { id: r.id },
          data:
            b.decision === "REMOVE"
              ? { releasedAt: new Date(), activeUnitId: null }
              : {
                  missed: 0,
                  escalated: false,
                  nextReviewAt: new Date(Date.now() + 86400000),
                },
        });
        await event(tx, r.leadId, req.actor.id, "RESERVATION_REVIEW", b);
      });
      return { data: true };
    },
  );
  app.post(
    "/api/leads/:id/sales",
    { preHandler: authenticate },
    async (req) => {
      const l = await accessible(req.actor, (req.params as any).id);
      const b = z
        .object({
          unitId: z.string(),
          price: z.number().positive(),
          currency: z.enum(["USD", "GEL"]).default("GEL"),
          deposit: z.number().positive(),
          depositCurrency: z.enum(["USD", "GEL"]).default("GEL"),
          depositDate: z.string().datetime(),
          signedAt: z.string().datetime(),
          confirmed: z.literal(true),
        })
        .parse(req.body);
      if (l.stage === "LOST")
        throw new ApiError(400, "INVALID_STATE", "Reopen the lead first");
      if (
        new Date(b.signedAt) > new Date() ||
        new Date(b.depositDate) > new Date()
      )
        throw new ApiError(
          400,
          "FUTURE_SALE",
          "Contract and received deposit dates cannot be in the future",
        );
      const date = agencyDate(new Date(b.signedAt));
      let fx = 1;
      if (b.currency === "USD") {
        const stored = await db.fxRate.findUnique({ where: { date } });
        fx = stored ? Number(stored.usdGel) : await signingRate(date);
      }
      return {
        data: await db.$transaction(async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${l.id}))`;
          const current = await tx.lead.findUniqueOrThrow({
            where: { id: l.id },
          });
          if (current.stage === "LOST")
            throw new ApiError(
              400,
              "INVALID_STATE",
              "Active or existing Won purchase required",
            );
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${b.unitId}))`;
          const unit = await tx.unit.findUniqueOrThrow({
            where: { id: b.unitId },
          });
          if (unit.status === "SOLD")
            throw new ApiError(409, "SOLD", "Apartment already sold");
          if (
            unit.status === "RESERVED" &&
            !(await tx.reservation.findFirst({
              where: { leadId: l.id, unitId: unit.id, releasedAt: null },
            }))
          )
            throw new ApiError(409, "RESERVED", "Reserved by another customer");
          const currency = unit.minimumCurrency ?? unit.priceCurrency;
          const minimum = unit.minimumPrice
            ? Number(unit.minimumPrice)
            : Number(unit.price) *
              (unit.priceMode === "PER_M2" ? Number(unit.area) : 1);
          if (currency !== b.currency)
            throw new ApiError(
              400,
              "CURRENCY_MISMATCH",
              "Minimum and sale must use same currency",
            );
          if (b.price < minimum)
            throw new ApiError(
              400,
              "BELOW_MINIMUM",
              "Sale is below allowed minimum",
            );
          const agent = l.agentId
            ? await tx.user.findUnique({ where: { id: l.agentId } })
            : null;
          if (!agent)
            throw new ApiError(
              400,
              "AGENT_REQUIRED",
              "Assign the selling agent before completing sale",
            );
          const team = l.teamId
            ? await tx.team.findUnique({ where: { id: l.teamId } })
            : null;
          const leader = team?.leadId
            ? await tx.user.findUnique({ where: { id: team.leadId } })
            : null;
          const cover = team?.leadId
            ? await tx.leave.findFirst({
                where: {
                  userId: team.leadId,
                  status: "APPROVED",
                  startsAt: { lte: new Date(b.signedAt) },
                  endsAt: { gte: new Date(b.signedAt) },
                  actingUserId: { not: null },
                  OR: [
                    { returnAt: null },
                    { returnAt: { gt: new Date(b.signedAt) } },
                  ],
                },
              })
            : null;
          const agentHistory = agent
            ? await tx.commissionRate.findFirst({
                where: {
                  userId: agent.id,
                  effectiveAt: { lte: new Date(b.signedAt) },
                },
                orderBy: { effectiveAt: "desc" },
              })
            : null;
          const leadHistory = leader
            ? await tx.commissionRate.findFirst({
                where: {
                  userId: leader.id,
                  effectiveAt: { lte: new Date(b.signedAt) },
                },
                orderBy: { effectiveAt: "desc" },
              })
            : null;
          const agentRate = Number(
              agentHistory?.agentRate ?? agent?.agentRate ?? 1,
            ),
            leadRate = leader
              ? Number(leadHistory?.leadRate ?? leader.leadRate)
              : 0,
            actingRate = Number(cover?.actingRate ?? 0);
          const amounts = commission(
            b.price,
            fx,
            agentRate,
            leadRate,
            actingRate,
          );
          const sale = await tx.sale.create({
            data: {
              leadId: l.id,
              unitId: unit.id,
              activeUnitId: unit.id,
              agentId: l.agentId,
              teamId: l.teamId,
              leadUserId: leader?.id,
              actingUserId: cover?.actingUserId,
              price: b.price,
              currency: b.currency,
              agentRate,
              leadRate,
              actingRate,
              gelRate: fx,
              ...amounts,
              deposit: b.deposit,
              depositCurrency: b.depositCurrency,
              depositDate: new Date(b.depositDate),
              signedAt: new Date(b.signedAt),
            },
          });
          await tx.unit.update({
            where: { id: unit.id },
            data: { status: "SOLD" },
          });
          await tx.reservation.updateMany({
            where: { unitId: unit.id, releasedAt: null },
            data: { releasedAt: new Date(), activeUnitId: null },
          });
          await tx.lead.update({ where: { id: l.id }, data: { stage: "WON" } });
          await tx.reminder.updateMany({
            where: { leadId: l.id, state: "PENDING" },
            data: { state: "CANCELLED" },
          });
          await event(tx, l.id, req.actor.id, "SALE_WON", {
            saleId: sale.id,
            unitId: unit.id,
            price: b.price,
            currency: b.currency,
          });
          return saleFor(req.actor, sale);
        }),
      };
    },
  );
  app.post(
    "/api/sales/:id/reverse",
    { preHandler: authenticate },
    async (req) => {
      requireAdmin(req.actor);
      const b = z
        .object({
          reason: z.string().trim().min(10),
          destination: z.enum(stages).refine((s) => s !== "WON"),
          unitStatus: z.enum(["AVAILABLE", "RESERVED"]).optional(),
        })
        .parse(req.body);
      return {
        data: await db.$transaction(async (tx) => {
          let s = await tx.sale.findUniqueOrThrow({
            where: { id: (req.params as any).id },
          });
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${s.leadId}))`;
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${s.unitId}))`;
          s = await tx.sale.findUniqueOrThrow({ where: { id: s.id } });
          if (s.reversedAt)
            throw new ApiError(400, "REVERSED", "Already reversed");
          const l = await tx.lead.findUniqueOrThrow({
            where: { id: s.leadId },
          });
          if (b.destination !== "LOST" && !b.unitStatus)
            throw new ApiError(
              400,
              "STATUS_REQUIRED",
              "Choose apartment availability",
            );
          await tx.sale.update({
            where: { id: s.id },
            data: { reversedAt: new Date(), activeUnitId: null },
          });
          const status = b.destination === "LOST" ? "AVAILABLE" : b.unitStatus!;
          await tx.unit.update({ where: { id: s.unitId }, data: { status } });
          const remaining = await tx.sale.count({
            where: { leadId: l.id, reversedAt: null },
          });
          let destinationLeadId = l.id;
          if (remaining) {
            const linked = await tx.lead.create({
              data: {
                customerId: l.customerId,
                agentId: l.agentId,
                teamId: l.teamId,
                source: "MANUAL",
                stage: b.destination,
                projectIds: l.projectIds,
              },
            });
            destinationLeadId = linked.id;
            await event(tx, linked.id, req.actor.id, "SALE_REVERSAL_LINK", {
              saleId: s.id,
              from: l.id,
              reason: b.reason,
            });
          }
          if (status === "RESERVED")
            await tx.reservation.create({
              data: {
                leadId: destinationLeadId,
                unitId: s.unitId,
                activeUnitId: s.unitId,
                nextReviewAt: new Date(Date.now() + 86400000),
              },
            });
          await tx.lead.update({
            where: { id: l.id },
            data: { stage: remaining ? "WON" : b.destination },
          });
          await event(tx, l.id, req.actor.id, "SALE_REVERSED", {
            saleId: s.id,
            reason: b.reason,
            destination: b.destination,
          });
          return true;
        }),
      };
    },
  );
}
