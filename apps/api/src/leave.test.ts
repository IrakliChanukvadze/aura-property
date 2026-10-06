import { test } from "node:test";
import assert from "node:assert/strict";
import {
  workingDates,
  consumedLeaveDays,
  validEarlyReturn,
  agencyDate,
} from "./domain.js";
test("flexible schedules snapshot working dates in agency timezone including exceptions", () => {
  const dates = workingDates(
    new Date("2026-10-04T20:00:00Z"),
    new Date("2026-10-10T20:00:00Z"),
    [0, 1, 2, 3, 4],
    { "2026-10-06": false, "2026-10-09": true },
  );
  assert.deepEqual(dates, [
    "2026-10-05",
    "2026-10-07",
    "2026-10-08",
    "2026-10-09",
    "2026-10-11",
  ]);
  assert.equal(agencyDate(new Date("2026-10-05T22:00:00Z")), "2026-10-06");
});
test("early return restores unused original dates and excludes return day", () => {
  const original = ["2026-10-05", "2026-10-06", "2026-10-08", "2026-10-09"];
  assert.equal(
    consumedLeaveDays(original, new Date("2026-10-07T20:00:00Z")),
    2,
  );
  assert.equal(
    consumedLeaveDays(original, new Date("2026-10-04T20:00:00Z")),
    0,
  );
  assert.deepEqual(original, [
    "2026-10-05",
    "2026-10-06",
    "2026-10-08",
    "2026-10-09",
  ]);
});
test("early return rejects retroactive and beyond-leave dates", () => {
  const start = new Date("2026-10-05"),
    end = new Date("2026-10-12"),
    now = new Date("2026-10-08");
  assert.equal(
    validEarlyReturn(start, end, new Date("2026-10-07"), now),
    false,
  );
  assert.equal(
    validEarlyReturn(start, end, new Date("2026-10-13"), now),
    false,
  );
  assert.equal(validEarlyReturn(start, end, new Date("2026-10-08"), now), true);
  assert.equal(validEarlyReturn(start, end, new Date("2026-10-12"), now), true);
});
test(
  "database approval races preserve advance limit, nomination scope and explicit schedule review",
  { skip: !process.env.DATABASE_URL },
  async () => {
    process.env.NODE_ENV = "test";
    process.env.DEV_INTEGRATIONS = "true";
    const { buildApp } = await import("./server.js");
    const { db } = await import("./db.js");
    const { digest } = await import("./domain.js");
    const { randomUUID } = await import("node:crypto");
    const app = await buildApp(),
      tag = `leave-test-${randomUUID()}`,
      ids = [`${tag}-owner`, `${tag}-lead`, `${tag}-agent`];
    let teamId = "";
    async function call(
      userId: string,
      method: any,
      url: string,
      payload?: any,
    ) {
      return app.inject({
        method,
        url,
        payload,
        headers: {
          cookie: `aura_session=${userId}`,
          origin: "http://localhost:5173",
        },
      });
    }
    try {
      for (const [i, role] of ["SUPER_ADMIN", "TEAM_LEAD", "AGENT"].entries()) {
        await db.user.create({
          data: {
            id: ids[i],
            email: `${ids[i]}@example.test`,
            name: role,
            role,
            joinedAt: new Date(),
          },
        });
        await db.session.create({
          data: {
            id: digest(ids[i]),
            userId: ids[i],
            expiresAt: new Date(Date.now() + 3600000),
          },
        });
      }
      const team = await db.team.create({
        data: { name: tag, leadId: ids[1] },
      });
      teamId = team.id;
      await db.user.updateMany({
        where: { id: { in: ids.slice(1) } },
        data: { teamId },
      });
      await db.schedule.create({
        data: {
          userId: ids[2],
          weekdays: [1, 2, 3, 4, 5],
          approved: true,
          createdBy: ids[1],
        },
      });
      const a = await db.leave.create({
        data: {
          userId: ids[2],
          teamId,
          startsAt: new Date("2027-01-04T00:00:00Z"),
          endsAt: new Date("2027-01-05T00:00:00Z"),
          days: 2,
          workingDates: ["2027-01-04", "2027-01-05"],
        },
      });
      const b = await db.leave.create({
        data: {
          userId: ids[2],
          teamId,
          startsAt: new Date("2027-01-11T00:00:00Z"),
          endsAt: new Date("2027-01-12T00:00:00Z"),
          days: 2,
          workingDates: ["2027-01-11", "2027-01-12"],
        },
      });
      const race = await Promise.all([
        call(ids[1], "POST", `/api/leave/${a.id}/approve`, {}),
        call(ids[1], "POST", `/api/leave/${b.id}/approve`, {}),
      ]);
      assert.deepEqual(race.map((r) => r.statusCode).sort(), [200, 400]);
      const selected = await db.leave.findFirstOrThrow({
        where: { userId: ids[2], status: "APPROVED" },
      });
      assert.equal(selected.days, 2);
      const balance = await call(ids[2], "GET", "/api/leave/balance");
      assert.equal(balance.json().data.balance, -2);
      const self = await call(ids[2], "POST", `/api/leave/${b.id}/approve`, {});
      assert.equal(self.statusCode, 403);
      const nominate = await call(ids[2], "POST", "/api/leave", {
        startsAt: "2027-02-01T00:00:00Z",
        endsAt: "2027-02-02T00:00:00Z",
        actingUserId: ids[2],
      });
      assert.equal(nominate.statusCode, 400);
      const changed = {
        userId: ids[2],
        weekdays: [0, 2, 3, 4, 5],
        exceptions: {},
      };
      const unreviewed = await call(ids[1], "POST", "/api/schedules", changed);
      assert.equal(unreviewed.statusCode, 409);
      assert.equal(unreviewed.json().error.code, "LEAVE_REAPPROVAL_REQUIRED");
      assert.equal(
        (await db.leave.findUniqueOrThrow({ where: { id: selected.id } })).days,
        2,
      );
      assert.equal(
        (
          await call(ids[1], "POST", "/api/schedules", {
            ...changed,
            reviewLeaveIds: [selected.id],
          })
        ).statusCode,
        200,
      );
      assert.equal(
        (await db.leave.findUniqueOrThrow({ where: { id: selected.id } })).days,
        1,
      );
      const request = await call(
        ids[2],
        "POST",
        `/api/leave/${selected.id}/cancel`,
        {},
      );
      assert.equal(request.statusCode, 200);
      assert.equal(
        (await db.leave.findUniqueOrThrow({ where: { id: selected.id } }))
          .status,
        "APPROVED",
      );
      assert.equal(
        (
          await call(
            ids[1],
            "POST",
            `/api/leave/${selected.id}/cancel-review`,
            { approve: true },
          )
        ).statusCode,
        200,
      );
      assert.equal(
        (await db.leave.findUniqueOrThrow({ where: { id: selected.id } }))
          .status,
        "CANCELLED",
      );
    } finally {
      await db.notification.deleteMany({ where: { userId: { in: ids } } });
      await db.audit.deleteMany({ where: { actorId: { in: ids } } });
      await db.leave.deleteMany({ where: { userId: { in: ids } } });
      await db.schedule.deleteMany({ where: { userId: { in: ids } } });
      if (teamId) await db.team.delete({ where: { id: teamId } });
      await db.user.deleteMany({ where: { id: { in: ids } } });
      await app.close();
      await db.$disconnect();
    }
  },
);
