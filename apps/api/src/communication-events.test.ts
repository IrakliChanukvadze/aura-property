import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const target = new URL(process.env.DATABASE_URL ?? "postgresql://invalid/");
if (
  !["localhost", "127.0.0.1"].includes(target.hostname) ||
  !/^\/aura_.*(?:audit|test)$/.test(target.pathname)
)
  throw new Error(
    "Communication tests require an isolated local Aura audit/test database",
  );
process.env.NODE_ENV = "test";
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  throw new Error("No external communication requests allowed");
};
const { db } = await import("./db.js");
const {
  receiveVerifiedCommunicationEvent: receive,
  claimCommunicationEvent: claim,
  processCommunicationEvent: processEvent,
  communicationPolicy,
} = await import("./communication-events.js");
const { buildApp } = await import("./server.js");
const { digest } = await import("./domain.js");
const app = await buildApp();
const prefix = `comm-test-${randomUUID()}`;
const userIds: string[] = [];
const payload = {
  kind: "message" as const,
  direction: "inbound" as const,
  occurredAt: new Date().toISOString(),
  contact: {
    externalId: "customer-private-id",
    name: "Private customer",
    phone: "+995599123456",
  },
  text: "Private conversation",
};
const input = (externalEventId: string, accountId = prefix) => ({
  provider: "whatsapp" as const,
  accountId,
  externalEventId,
  payload,
});
async function actor(role: string) {
  const id = `${prefix}-${role}`;
  userIds.push(id);
  await db.user.create({
    data: { id, role, name: "Queue test", email: `${id}@example.test` },
  });
  await db.session.create({
    data: {
      id: digest(id),
      userId: id,
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  return id;
}
async function clearEvents() {
  await db.communicationEvent.deleteMany({
    where: { accountId: { startsWith: prefix } },
  });
}
beforeEach(clearEvents);
after(async () => {
  globalThis.fetch = originalFetch;
  await clearEvents();
  await db.audit.deleteMany({ where: { action: prefix } });
  await db.session.deleteMany({ where: { userId: { in: userIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await app.close();
  await db.$disconnect();
});
test("normalized verified receipts deduplicate concurrently by provider/account and never overwrite", async () => {
  const receipts = await Promise.all(
    Array.from({ length: 12 }, () => receive(input("same-event"))),
  );
  assert.equal(new Set(receipts.map((r) => r.id)).size, 1);
  assert.equal(receipts.filter((r) => !r.duplicate).length, 1);
  const retry = await receive({
    ...input("same-event"),
    payload: { ...payload, text: "Changed duplicate" },
  });
  assert.equal(retry.duplicate, true);
  assert.equal(
    (await db.communicationEvent.findUniqueOrThrow({ where: { id: retry.id } }))
      .payload &&
      (
        (
          await db.communicationEvent.findUniqueOrThrow({
            where: { id: retry.id },
          })
        ).payload as any
      ).text,
    payload.text,
  );
  assert.notEqual(
    (await receive(input("same-event", `${prefix}-other`))).id,
    retry.id,
  );
  await assert.rejects(() =>
    receive({
      ...input("bad"),
      payload: { ...payload, authorization: "secret" },
    } as any),
  );
  await assert.rejects(() =>
    receive({
      ...input("oversize"),
      payload: { ...payload, text: "😀".repeat(5000) },
    }),
  );
  await clearEvents();
});
test("concurrent claims and duplicate processing commit database effects once", async () => {
  const received = await receive(input("once"));
  const claimed = await Promise.all([
    claim(new Date(Date.now() + 100)),
    claim(new Date(Date.now() + 100)),
  ]);
  assert.equal(claimed.filter(Boolean).length, 1);
  const work = claimed.find(Boolean)!;
  assert.equal(work.id, received.id);
  const handler = async (tx: any) => {
    await tx.audit.create({
      data: { action: prefix, data: { eventId: work.id } },
    });
    return "processed" as const;
  };
  const outcomes = await Promise.all([
    processEvent(work, handler),
    processEvent(work, handler),
  ]);
  assert.deepEqual(outcomes.sort(), ["processed", "stale"]);
  assert.equal(await db.audit.count({ where: { action: prefix } }), 1);
  assert.equal(await claim(), null);
  await clearEvents();
});
test("expired leases recover after restart and old worker cannot commit", async () => {
  await receive(input("restart"));
  const start = new Date(Date.now() + 100);
  const first = (await claim(start))!;
  const recovery = new Date(start.getTime() + communicationPolicy.leaseMs + 1);
  const second = (await claim(recovery))!;
  assert.equal(second.id, first.id);
  assert.notEqual(second.leaseToken, first.leaseToken);
  assert.equal(
    await processEvent(first, async () => "processed", recovery),
    "stale",
  );
  assert.equal(
    await processEvent(second, async () => "ignored", recovery),
    "ignored",
  );
  assert.equal(
    (
      await db.communicationEvent.findUniqueOrThrow({
        where: { id: second.id },
      })
    ).attempts,
    2,
  );
  await clearEvents();
});
test("handler failure rolls back effects, backs off durably and dead-letters after five attempts", async () => {
  const receipt = await receive(input("failure"));
  let now = new Date(Date.now() + 100);
  for (let attempt = 1; attempt <= communicationPolicy.maxAttempts; attempt++) {
    const work = (await claim(now))!;
    assert.ok(work);
    assert.equal(work.id, receipt.id);
    const outcome = await processEvent(
      work,
      async (tx) => {
        await tx.audit.create({
          data: { action: `${prefix}-rollback`, data: {} },
        });
        throw new Error("secret key and private text");
      },
      now,
    );
    assert.equal(outcome, attempt === 5 ? "failed" : "retry_scheduled");
    const row = await db.communicationEvent.findUniqueOrThrow({
      where: { id: receipt.id },
    });
    assert.equal(row.lastErrorCode, "HANDLER_FAILED");
    assert.equal(row.attempts, attempt);
    assert.equal(await claim(now), null);
    now = new Date(row.nextAttemptAt.getTime() + 1);
  }
  assert.equal(await claim(new Date(now.getTime() + 10000000)), null);
  assert.equal(
    await db.audit.count({ where: { action: `${prefix}-rollback` } }),
    0,
  );
  await clearEvents();
});
test("poison payload and final-attempt crashed leases become terminal", async () => {
  const receipt = await receive(input("poison"));
  await db.communicationEvent.update({
    where: { id: receipt.id },
    data: { payload: { rawHeaders: { authorization: "secret" } } },
  });
  const work = (await claim(new Date(Date.now() + 100)))!;
  let invoked = false;
  assert.equal(
    await processEvent(work, async () => {
      invoked = true;
      return "processed";
    }),
    "failed",
  );
  assert.equal(invoked, false);
  assert.equal(
    (
      await db.communicationEvent.findUniqueOrThrow({
        where: { id: receipt.id },
      })
    ).lastErrorCode,
    "INVALID_PAYLOAD",
  );
  await clearEvents();
  const crashed = await receive(input("crashed"));
  await db.communicationEvent.update({
    where: { id: crashed.id },
    data: {
      state: "PROCESSING",
      attempts: 5,
      leaseToken: "expired",
      leaseExpiresAt: new Date(0),
    },
  });
  assert.equal(await claim(), null);
  assert.equal(
    (
      await db.communicationEvent.findUniqueOrThrow({
        where: { id: crashed.id },
      })
    ).state,
    "FAILED",
  );
  await clearEvents();
});
test("operator diagnostics are SuperAdmin only and redact conversation/customer/provider IDs", async () => {
  await receive(input("private-provider-event-id"));
  const owner = await actor("SUPER_ADMIN");
  assert.equal(
    (await app.inject({ url: "/api/communication-events" })).statusCode,
    401,
  );
  for (const role of ["AGENT", "TEAM_LEAD", "EDITOR"]) {
    const user = await actor(role);
    assert.equal(
      (
        await app.inject({
          url: "/api/communication-events",
          headers: { cookie: `aura_session=${user}` },
        })
      ).statusCode,
      403,
    );
  }
  const response = await app.inject({
    url: "/api/communication-events",
    headers: { cookie: `aura_session=${owner}` },
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["cache-control"], "no-store");
  assert.equal(response.json().data.enabled, false);
  for (const secret of [
    prefix,
    "private-provider-event-id",
    "customer-private-id",
    "Private customer",
    "Private conversation",
    "+995599123456",
  ])
    assert.ok(!response.body.includes(secret));
  assert.equal(
    (
      await app.inject({
        method: "POST",
        url: "/api/communication-events",
        payload: input("unsafe"),
      })
    ).statusCode,
    404,
  );
  await clearEvents();
});
