import { db, event } from "./db.js";
import { chooseAgent, reassign } from "./routing.js";
export async function runJobs() {
  const now = new Date();
  await db.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(481530)`;
    const due = await tx.reminder.findMany({
      where: { state: "PENDING", dueAt: { lte: now } },
    });
    for (const r of due) {
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
    const reservations = await tx.reservation.findMany({
      where: { releasedAt: null, nextReviewAt: { lte: now } },
      include: { lead: true },
    });
    for (const r of reservations) {
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
    const leaves = await tx.leave.findMany({
      where: {
        status: "APPROVED",
        startsAt: { lte: now },
        endsAt: { gte: now },
      },
    });
    for (const l of leaves) {
      const plans = l.reassign as any[];
      if (!plans.length) continue;
      for (const p of plans) {
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
