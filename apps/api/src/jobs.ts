import { db, event } from "./db.js";
import { chooseAgent, reassign } from "./routing.js";
export async function runJobs() {
  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(481530)`;
    const due = await tx.reminder.findMany({
      where: { state: "PENDING", dueAt: { lte: now } },
    });
    const reservations = await tx.reservation.findMany({
      where: { releasedAt: null, nextReviewAt: { lte: now } },
      include: { lead: true },
    });
    const leaves = await tx.leave.findMany({
      where: {
        status: "APPROVED",
        reassign: { not: [] },
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
    });
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(481529)`;
    const userIds = [...new Set(leaves.map((l: any) => l.userId))].sort();
    for (const id of userIds)
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
    const leadIds = [
      ...new Set([
        ...due.map((r: any) => r.leadId),
        ...reservations.map((r: any) => r.leadId),
        ...leaves.flatMap((l: any) =>
          (l.reassign as any[]).map((p) => p.leadId),
        ),
      ]),
    ]
      .filter(Boolean)
      .sort();
    for (const id of leadIds)
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
    for (const initial of due) {
      const r = await tx.reminder.findUniqueOrThrow({
        where: { id: initial.id },
      });
      const claimed = await tx.reminder.updateMany({
        where: { id: r.id, state: "PENDING", dueAt: { lte: now } },
        data: { state: "DELIVERED" },
      });
      if (!claimed.count) continue;
      await tx.notification.create({
        data: {
          userId: r.userId,
          leadId: r.leadId,
          kind: r.kind,
          text: r.text,
        },
      });
      await tx.reminder.update({
        where: { id: r.id },
        data: { state: "DELIVERED" },
      });
    }
    for (const initial of reservations) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${initial.unitId}))`;
      const r = await tx.reservation.findUniqueOrThrow({
        where: { id: initial.id },
        include: { lead: true },
      });
      if (r.releasedAt || r.nextReviewAt > now) continue;
      const team = r.lead.teamId
        ? await tx.team.findUnique({ where: { id: r.lead.teamId } })
        : null;
      for (const id of new Set(
        [r.lead.agentId, team?.leadId].filter(Boolean) as string[],
      ))
        await tx.notification.create({
          data: {
            userId: id,
            leadId: r.leadId,
            kind: "RESERVATION",
            text: "Apartment still reserved: keep or remove?",
          },
        });
      const missed = r.missed + 1;
      if (missed >= 2 && !r.escalated) {
        const admins = await tx.user.findMany({
          where: { role: "SUPER_ADMIN", active: true },
        });
        for (const u of admins)
          await tx.notification.create({
            data: {
              userId: u.id,
              leadId: r.leadId,
              kind: "RESERVATION_ESCALATION",
              text: "Reservation review unanswered for 48 hours",
            },
          });
      }
      await tx.reservation.update({
        where: { id: r.id },
        data: {
          missed,
          nextReviewAt: new Date(r.nextReviewAt.getTime() + 86400000),
          escalated: r.escalated || missed >= 2,
        },
      });
    }
    for (const initial of leaves) {
      const l = await tx.leave.findUniqueOrThrow({ where: { id: initial.id } });
      if (l.status !== "APPROVED" || (l.returnAt && l.returnAt <= now))
        continue;
      const plans = l.reassign as any[];
      if (!plans.length) continue;
      for (const p of plans) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${p.leadId}))`;
        const lead = await tx.lead.findUnique({ where: { id: p.leadId } });
        if (
          !lead ||
          lead.agentId !== l.userId ||
          ["LOST", "WON"].includes(lead.stage) ||
          lead.teamId !== l.teamId
        )
          continue;
        const id =
          p.automatic && l.teamId ? await chooseAgent(tx, l.teamId) : p.agentId;
        if (id) await reassign(tx, lead, id, l.approvedBy ?? l.userId);
      }
      await tx.leave.update({ where: { id: l.id }, data: { reassign: [] } });
    }
  });
}
