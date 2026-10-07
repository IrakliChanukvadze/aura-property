import { PrismaClient } from "@prisma/client";
export const db = new PrismaClient();
export type Actor = {
  id: string;
  role: string;
  teamId: string | null;
  contentEdit: boolean;
  locale: string;
  name: string;
  email: string;
};
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
export function requireAdmin(u: Actor) {
  if (u.role !== "SUPER_ADMIN")
    throw new ApiError(403, "FORBIDDEN", "SuperAdmin required");
}
export function content(u: Actor) {
  if (u.role !== "SUPER_ADMIN" && !u.contentEdit)
    throw new ApiError(403, "FORBIDDEN", "Content editing permission required");
}
export async function acting(u: Actor) {
  if (!u.teamId) return false;
  const team = await db.team.findUnique({ where: { id: u.teamId } });
  if (!team?.leadId) return false;
  return !!(await db.leave.findFirst({
    where: {
      userId: team.leadId,
      teamId: u.teamId,
      actingUserId: u.id,
      status: "APPROVED",
      startsAt: { lte: new Date() },
      endsAt: { gte: new Date() },
      OR: [{ returnAt: null }, { returnAt: { gt: new Date() } }],
    },
  }));
}
export async function permanent(u: Actor) {
  return (
    u.role === "TEAM_LEAD" &&
    Boolean(u.teamId) &&
    Boolean(
      await db.team.findFirst({
        where: { id: u.teamId!, leadId: u.id, active: true },
      }),
    )
  );
}
export async function scope(u: Actor) {
  if (u.role === "SUPER_ADMIN") return {};
  if (u.role === "EDITOR") return { id: "__no_crm_access__" };
  const personal = {
    OR: [
      { agentId: u.id, stage: { in: ["LOST", "WON"] } },
      { agentId: u.id, teamId: u.teamId, stage: { notIn: ["LOST", "WON"] } },
    ],
  };
  if (await permanent(u))
    return {
      OR: [
        { teamId: u.teamId },
        { agentId: u.id, stage: { in: ["LOST", "WON"] } },
      ],
    };
  if (await acting(u))
    return {
      OR: [personal, { teamId: u.teamId, stage: { notIn: ["LOST", "WON"] } }],
    };
  return personal;
}
export async function accessible(u: Actor, id: string) {
  const lead = await db.lead.findFirst({
    where: { id, ...(await scope(u)) },
    include: { customer: true },
  });
  if (!lead) throw new ApiError(404, "NOT_FOUND", "Lead not found");
  return lead;
}
export const event = (
  tx: any,
  leadId: string,
  actorId: string | null,
  type: string,
  data: any,
) => tx.event.create({ data: { leadId, actorId, type, data } });
export async function teamAuthority(u: Actor) {
  if (u.role === "SUPER_ADMIN" || (await permanent(u)) || (await acting(u)))
    return;
  throw new ApiError(403, "FORBIDDEN", "Team authority required");
}
export function saleFor(u: Actor, s: any) {
  if (
    u.role === "SUPER_ADMIN" ||
    (u.role === "TEAM_LEAD" && s.teamId === u.teamId)
  )
    return s;
  const {
    leadAmount,
    actingAmount,
    agentAmount,
    leadRate,
    actingRate,
    agentRate,
    ...rest
  } = s;
  return {
    ...rest,
    agentAmount: s.agentId === u.id ? agentAmount : undefined,
    agentRate: s.agentId === u.id ? agentRate : undefined,
    leadAmount: s.leadUserId === u.id ? leadAmount : undefined,
    leadRate: s.leadUserId === u.id ? leadRate : undefined,
    actingAmount: s.actingUserId === u.id ? actingAmount : undefined,
    actingRate: s.actingUserId === u.id ? actingRate : undefined,
  };
}
