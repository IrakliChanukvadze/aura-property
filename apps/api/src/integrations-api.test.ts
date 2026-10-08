import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const url = new URL(process.env.DATABASE_URL ?? "postgresql://invalid/");
if (
  !["localhost", "127.0.0.1"].includes(url.hostname) ||
  !/^\/aura_.*(?:audit|test)$/.test(url.pathname)
)
  throw new Error(
    "Integration tests require an isolated local Aura audit/test database",
  );
process.env.NODE_ENV = "test";
process.env.DEV_INTEGRATIONS = "false";
const keys = [
  "EMAIL_WEBHOOK_URL",
  "EMAIL_WEBHOOK_TOKEN",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "TRANSLATION_WEBHOOK_URL",
  "TRANSLATION_WEBHOOK_TOKEN",
  "OPENROUTER_API_KEY",
  "OPENAI_API_KEY",
  "R2_ACCOUNT_ID",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "STORAGE_WEBHOOK_URL",
  "SMS_WEBHOOK_URL",
  "FX_WEBHOOK_URL",
];
const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
const originalFetch = globalThis.fetch;
let fetchCount = 0;
globalThis.fetch = async () => {
  fetchCount++;
  throw new Error("Integrations must not make outbound requests");
};
const { buildApp } = await import("./server.js");
const { db } = await import("./db.js");
const { digest } = await import("./domain.js");
const app = await buildApp();
const prefix = `integrations-${randomUUID()}`;
const ids: string[] = [];
async function actor(role: string, contentEdit = false) {
  const id = `${prefix}-${ids.length}`;
  ids.push(id);
  await db.user.create({
    data: {
      id,
      role,
      contentEdit,
      name: "Integrations test",
      email: `${id}@example.test`,
    },
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
const owner = await actor("SUPER_ADMIN");
const roles = await Promise.all([
  actor("TEAM_LEAD", true),
  actor("AGENT", true),
  actor("EDITOR", true),
]);
const request = (
  method: "GET" | "POST",
  path: string,
  user = owner,
  payload?: object,
) =>
  app.inject({
    method,
    url: path,
    headers: {
      cookie: `aura_session=${user}`,
      origin: "http://localhost:5173",
    },
    ...(payload ? { payload } : {}),
  });
beforeEach(() => {
  keys.forEach((k) => delete process.env[k]);
  fetchCount = 0;
});
after(async () => {
  globalThis.fetch = originalFetch;
  for (const key of keys)
    saved[key] === undefined
      ? delete process.env[key]
      : (process.env[key] = saved[key]);
  await db.session.deleteMany({ where: { userId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  await app.close();
  await db.$disconnect();
});
test("integration inventory and checks require SuperAdmin regardless of content permission", async () => {
  assert.equal(
    (await app.inject({ url: "/api/integrations" })).statusCode,
    401,
  );
  for (const user of roles) {
    assert.equal(
      (await request("GET", "/api/integrations", user)).statusCode,
      403,
    );
    assert.equal(
      (await request("POST", "/api/integrations/email/check", user, {}))
        .statusCode,
      403,
    );
  }
  const response = await request("GET", "/api/integrations");
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers["cache-control"], "no-store");
  assert.equal(response.json().data.items.length, 5);
  assert.ok(
    response
      .json()
      .data.items.every(
        (item: any) => item.state === "not_configured" && !item.configured,
      ),
  );
});
test("configuration inventory redacts every credential and preserves adapter precedence", async () => {
  process.env.RESEND_API_KEY = "private-resend-key";
  process.env.EMAIL_FROM = "Aura <sender@example.test>";
  process.env.EMAIL_WEBHOOK_URL = "https://private.example.test/secret-path";
  process.env.EMAIL_WEBHOOK_TOKEN = "private-webhook-token";
  process.env.OPENROUTER_API_KEY = "private-router-key";
  process.env.OPENAI_API_KEY = "private-openai-key";
  process.env.R2_ACCOUNT_ID = "a".repeat(32);
  process.env.R2_ACCESS_KEY_ID = "private-storage-key";
  process.env.R2_SECRET_ACCESS_KEY = "private-storage-secret";
  process.env.R2_BUCKET = "private-bucket";
  process.env.STORAGE_WEBHOOK_URL = "https://private.example.test/storage";
  const response = await request("GET", "/api/integrations");
  assert.equal(response.statusCode, 200);
  for (const value of [
    "private-resend-key",
    "sender@example.test",
    "private.example.test",
    "private-webhook-token",
    "private-router-key",
    "private-openai-key",
    "private-storage-key",
    "private-storage-secret",
    "private-bucket",
    "a".repeat(32),
  ])
    assert.ok(!response.body.includes(value));
  const items = response.json().data.items;
  assert.equal(items.find((i: any) => i.id === "email").provider, "webhook");
  assert.equal(
    items.find((i: any) => i.id === "translation").provider,
    "openrouter",
  );
  assert.equal(items.find((i: any) => i.id === "storage").provider, "r2");
  assert.equal(fetchCount, 0);
});
test("partial and malformed configurations return actionable safe check failures without external requests", async () => {
  process.env.RESEND_API_KEY = "valid-placeholder";
  process.env.EMAIL_FROM = "invalid\nFrom: attacker@example.test";
  process.env.R2_ACCOUNT_ID = "bad-account";
  process.env.SMS_WEBHOOK_URL = "file:///private/secret";
  process.env.FX_WEBHOOK_URL = "https://user:password@example.test";
  for (const id of ["email", "storage", "sms", "fx"]) {
    const response = await request(
      "POST",
      `/api/integrations/${id}/check`,
      owner,
      {},
    );
    assert.equal(response.statusCode, 200);
    assert.equal(response.headers["cache-control"], "no-store");
    const data = response.json().data;
    assert.equal(data.status, "configuration_incomplete");
    assert.ok(data.checks.some((c: any) => !c.passed));
    assert.ok(Number.isFinite(Date.parse(data.checkedAt)));
    assert.ok(!response.body.includes("attacker@example.test"));
    assert.ok(!response.body.includes("password@example.test"));
  }
  assert.equal(fetchCount, 0);
});
test("configuration success makes no paid calls and rejects client-supplied credentials or URLs", async () => {
  process.env.OPENROUTER_API_KEY = "valid-placeholder";
  const response = await request(
    "POST",
    "/api/integrations/translation/check",
    owner,
    {},
  );
  assert.equal(response.statusCode, 200);
  assert.equal(response.json().data.status, "configuration_valid");
  assert.match(
    response.json().data.message,
    /Provider access remains unverified/,
  );
  assert.equal(
    (await request("POST", "/api/integrations/unknown/check", owner, {}))
      .statusCode,
    404,
  );
  assert.equal(
    (
      await request("POST", "/api/integrations/translation/check", owner, {
        url: "http://localhost",
        key: "secret",
      })
    ).statusCode,
    400,
  );
  assert.equal(fetchCount, 0);
});
