import { db, ApiError, event } from "./db.js";
export async function assignTeam(tx: any) {
  const teams = await tx.team.findMany({
    where: { active: true },
    orderBy: [{ lastAssignedAt: "asc" }, { id: "asc" }],
  });
  let selected: any = null,
    min = Infinity;
  for (const t of teams) {
    const lead = await tx.user.findUnique({ where: { id: t.leadId } });
    if (!lead?.active) continue;
    const n = await tx.lead.count({
      where: { teamId: t.id, stage: { in: ["NEW", "NOT_ANSWERED"] } },
    });
    if (n < min) {
      selected = t;
      min = n;
    }
  }
  if (!selected) return { teamId: null, agentId: null };
  await tx.team.update({
    where: { id: selected.id },
    data: { lastAssignedAt: new Date() },
  });
  return { teamId: selected.id, agentId: selected.leadId };
}
export async function chooseAgent(tx: any, teamId: string) {
  const users = await tx.user.findMany({
    where: { teamId, active: true, role: "AGENT" },
    orderBy: [{ lastAssignedAt: "asc" }, { id: "asc" }],
  });
  let chosen: any = null,
    min = Infinity;
  for (const u of users) {
    if (
      await tx.leave.findFirst({
        where: {
          userId: u.id,
          status: "APPROVED",
          startsAt: { lte: new Date() },
          endsAt: { gte: new Date() },
          OR: [{ returnAt: null }, { returnAt: { gt: new Date() } }],
        },
      })
    )
      continue;
    const n = await tx.lead.count({
      where: { agentId: u.id, stage: { in: ["NEW", "NOT_ANSWERED"] } },
    });
    if (n < min) {
      chosen = u;
      min = n;
    }
  }
  if (chosen) {
    await tx.user.update({
      where: { id: chosen.id },
      data: { lastAssignedAt: new Date() },
    });
    return chosen.id;
  }
  const team = await tx.team.findUnique({ where: { id: teamId } });
  return team?.leadId ?? null;
}
export async function reassign(
  tx: any,
  lead: any,
  agentId: string,
  actorId: string,
) {
  const u = await tx.user.findUnique({ where: { id: agentId } });
  if (!u?.active || u.teamId !== lead.teamId)
    throw new ApiError(
      400,
      "INVALID_AGENT",
      "Choose active member of the same team",
    );
  await tx.lead.update({ where: { id: lead.id }, data: { agentId } });
  await tx.reminder.updateMany({
    where: { leadId: lead.id, state: "PENDING" },
    data: { userId: agentId },
  });
  await tx.notification.deleteMany({
    where: { leadId: lead.id, userId: lead.agentId ?? "none" },
  });
  await event(tx, lead.id, actorId, "ASSIGNED", {
    from: lead.agentId,
    to: agentId,
  });
}
