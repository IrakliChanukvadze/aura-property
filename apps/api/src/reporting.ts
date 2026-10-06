import { agencyDate } from "./domain.js";
import type { FastifyInstance } from "fastify";
import { db, scope, ApiError, saleFor } from "./db.js";
import { authenticate } from "./auth.js";
import { z } from "zod";
export function periodBounds(month: string, yearly = false) {
  const [year, number] = month.split("-").map(Number);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(number) ||
    number < 1 ||
    number > 12
  )
    throw new ApiError(400, "INVALID_PERIOD", "Valid year and month required");
  const start = new Date(
    Date.UTC(year, yearly ? 0 : number - 1, 1) - 4 * 3600000,
  );
  const end = new Date(
    Date.UTC(yearly ? year + 1 : year, yearly ? 0 : number, 1) - 4 * 3600000,
  );
  return { start, end };
}
export async function reportingRoutes(app: FastifyInstance) {
  app.get("/api/notifications", { preHandler: authenticate }, async (req) => {
    const visible =
      req.actor.role === "EDITOR"
        ? []
        : await db.lead.findMany({
            where: await scope(req.actor),
            select: { id: true },
          });
    return {
      data: await db.notification.findMany({
        where: {
          userId: req.actor.id,
          OR: [{ leadId: null }, { leadId: { in: visible.map((l) => l.id) } }],
        },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
    };
  });
  app.patch(
    "/api/notifications/:id",
    { preHandler: authenticate },
    async (req) => {
      await db.notification.updateMany({
        where: { id: (req.params as any).id, userId: req.actor.id },
        data: { readAt: new Date() },
      });
      return { data: true };
    },
  );
  app.get("/api/commissions", { preHandler: authenticate }, async (req) => {
    const u = req.actor;
    const month = (req.query as any).month;
    const selectedPeriod = month ? periodBounds(month) : null;
    const sales = await db.sale.findMany({
      where: {
        reversedAt: null,
        ...(selectedPeriod
          ? { signedAt: { gte: selectedPeriod.start, lt: selectedPeriod.end } }
          : {}),
        ...(u.role === "SUPER_ADMIN"
          ? {}
          : u.role === "TEAM_LEAD"
            ? { teamId: u.teamId }
            : {
                OR: [
                  { agentId: u.id },
                  { leadUserId: u.id },
                  { actingUserId: u.id },
                ],
              }),
      },
      orderBy: { signedAt: "desc" },
    });
    return {
      data: sales.map((s) => {
        if (u.role === "SUPER_ADMIN" || u.role === "TEAM_LEAD") return s;
        return {
          id: s.id,
          signedAt: s.signedAt,
          currency: "GEL",
          amount:
            Number(s.agentId === u.id ? s.agentAmount : 0) +
            Number(s.leadUserId === u.id ? s.leadAmount : 0) +
            Number(s.actingUserId === u.id ? s.actingAmount : 0),
        };
      }),
    };
  });
  const leaderboard = async (period: string, month: string) => {
    const { start, end } = periodBounds(month, period === "yearly");
    const sales = await db.sale.findMany({
      where: { reversedAt: null, signedAt: { gte: start, lt: end } },
    });
    const agents = new Map<string, any>(),
      teams = new Map<string, any>();
    for (const s of sales) {
      for (const [id, map] of [
        [s.agentId, agents],
        [s.teamId, teams],
      ] as const) {
        if (!id) continue;
        const value = map.get(id) ?? { id, count: 0, gelTotal: 0 };
        value.count++;
        value.gelTotal += Number(s.gelTotal);
        map.set(id, value);
      }
    }
    const rank = async (map: Map<string, any>, isTeam: boolean) => {
      const rows = [...map.values()].sort((a, b) => b.count - a.count);
      let last = -1,
        ranking = 0;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].count !== last) ranking = i + 1;
        last = rows[i].count;
        rows[i].rank = ranking;
        const entity = isTeam
          ? await db.team.findUnique({ where: { id: rows[i].id } })
          : await db.user.findUnique({ where: { id: rows[i].id } });
        rows[i].name = entity?.name ?? "Former member";
      }
      return rows;
    };
    return {
      agents: await rank(agents, false),
      teams: period === "yearly" ? [] : await rank(teams, true),
    };
  };
  app.get("/api/leaderboards", { preHandler: authenticate }, async (req) => {
    const q = z
      .object({
        period: z.enum(["monthly", "yearly"]).default("monthly"),
        month: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .default(agencyDate(new Date()).slice(0, 7)),
      })
      .parse(req.query);
    return { data: await leaderboard(q.period, q.month) };
  });
  app.get("/api/dashboard", { preHandler: authenticate }, async (req) => {
    const q = z
      .object({
        month: z
          .string()
          .regex(/^\d{4}-\d{2}$/)
          .default(agencyDate(new Date()).slice(0, 7)),
      })
      .parse(req.query);
    const { start, end } = periodBounds(q.month);
    const visibility = await scope(req.actor);
    const leads = await db.lead.findMany({
      where: visibility,
      include: { customer: true },
    });
    const saleWhere: any = {
      reversedAt: null,
      signedAt: { gte: start, lt: end },
      ...(req.actor.role === "SUPER_ADMIN"
        ? {}
        : req.actor.role === "TEAM_LEAD"
          ? { teamId: req.actor.teamId }
          : { agentId: req.actor.id }),
    };
    const sales = await db.sale.findMany({
      where: saleWhere,
      include: { lead: { include: { customer: true } } },
      orderBy: { createdAt: "desc" },
    });
    const earningSales = await db.sale.findMany({
      where: {
        reversedAt: null,
        signedAt: { gte: start, lt: end },
        ...(req.actor.role === "SUPER_ADMIN"
          ? {}
          : {
              OR: [
                { agentId: req.actor.id },
                { leadUserId: req.actor.id },
                { actingUserId: req.actor.id },
              ],
            }),
      },
    });
    const apartmentNumbers = new Map(
      (
        await db.unit.findMany({
          where: { id: { in: sales.map((s) => s.unitId) } },
          select: { id: true, number: true },
        })
      ).map((u) => [u.id, u.number]),
    );
    return {
      data: {
        month: q.month,
        counts: {
          new: leads.filter((l) => l.stage === "NEW").length,
          active: leads.filter((l) => !["LOST", "WON"].includes(l.stage))
            .length,
          lost: leads.filter((l) => l.stage === "LOST").length,
          received: leads.filter(
            (l) => l.createdAt >= start && l.createdAt < end,
          ).length,
          sold: sales.length,
        },
        earnings: earningSales.reduce(
          (a, s) =>
            a +
            (req.actor.role === "SUPER_ADMIN"
              ? Number(s.agentAmount) +
                Number(s.leadAmount) +
                Number(s.actingAmount)
              : Number(s.agentId === req.actor.id ? s.agentAmount : 0) +
                Number(s.leadUserId === req.actor.id ? s.leadAmount : 0) +
                Number(s.actingUserId === req.actor.id ? s.actingAmount : 0)),
          0,
        ),
        latestWon: sales.slice(0, 3).map((s) => ({
          ...saleFor(req.actor, s),
          unitNumber: apartmentNumbers.get(s.unitId),
          customerName: s.lead.customer.name,
        })),
        leaderboards: await leaderboard("monthly", q.month),
      },
    };
  });
  app.get("/api/calendar", { preHandler: authenticate }, async (req) => {
    const u = req.actor;
    const leads = await db.lead.findMany({
      where: await scope(u),
      include: { customer: true, reminders: { where: { state: "PENDING" } } },
    });
    const leaves = await db.leave.findMany({
      where: {
        status: "APPROVED",
        ...(u.role === "SUPER_ADMIN"
          ? {}
          : u.role === "TEAM_LEAD"
            ? { teamId: u.teamId }
            : { userId: u.id }),
      },
    });
    return {
      data: [
        ...leads.flatMap((l) => [
          ...(l.viewingAt
            ? [
                {
                  id: `viewing-${l.id}`,
                  type: "VIEWING",
                  title: l.customer.name,
                  startsAt: l.viewingAt,
                  leadId: l.id,
                  location: l.viewingLocation,
                },
              ]
            : []),
          ...l.reminders
            .filter((r) => r.kind === "MANUAL")
            .map((r) => ({
              id: r.id,
              type: "FOLLOW_UP",
              title: r.text,
              startsAt: r.dueAt,
              leadId: l.id,
            })),
        ]),
        ...leaves.map((l) => ({
          id: l.id,
          type: "VACATION",
          title: "Vacation",
          startsAt: l.startsAt,
          endsAt: l.returnAt ?? l.endsAt,
          userId: l.userId,
        })),
      ],
    };
  });
}
