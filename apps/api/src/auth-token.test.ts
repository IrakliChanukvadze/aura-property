import { after, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const databaseUrl = new URL(
  process.env.DATABASE_URL ?? "postgresql://invalid/",
);
if (
  !["localhost", "127.0.0.1"].includes(databaseUrl.hostname) ||
  !/^\/aura_.*(?:audit|test)$/.test(databaseUrl.pathname)
)
  throw new Error(
    "Auth token tests require an isolated local Aura audit/test database",
  );
process.env.NODE_ENV = "test";
process.env.DEV_INTEGRATIONS = "true";
for (const key of [
  "EMAIL_WEBHOOK_URL",
  "EMAIL_WEBHOOK_TOKEN",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "SMS_WEBHOOK_URL",
  "TRANSLATION_WEBHOOK_URL",
  "OPENROUTER_API_KEY",
  "OPENAI_API_KEY",
  "STORAGE_WEBHOOK_URL",
  "R2_ACCOUNT_ID",
])
  delete process.env[key];
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => {
  throw new Error(
    "Unexpected provider request: real network is disabled in this suite",
  );
};
const { buildApp } = await import("./server.js");
const { db } = await import("./db.js");
const { digest, hashPassword, verifyPassword } = await import("./domain.js");
const app = await buildApp();
const prefix = `auth-token-${randomUUID()}`;
const userIds: string[] = [];
const originalPassword = "Existing-auth-test-password!";
const replacementPassword = "Replacement-auth-test-password!";
const usedMessage =
  "This link has already been used. Sign in with your password, or use Forgot password to reset it.";

async function account() {
  const id = `${prefix}-${userIds.length}`;
  userIds.push(id);
  const user = await db.user.create({
    data: {
      id,
      email: `${id}@example.test`,
      name: "Auth token test",
      passwordHash: hashPassword(originalPassword),
      locale: "en",
    },
  });
  await db.session.create({
    data: {
      id: digest(id),
      userId: id,
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  return user;
}
const accept = (token: string, password = replacementPassword) =>
  app.inject({
    method: "POST",
    url: "/api/auth/accept-invitation",
    payload: { token, password, locale: "he" },
  });
const snapshot = async (userId: string) => ({
  user: await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { passwordHash: true, locale: true },
  }),
  tokens: await db.token.findMany({
    where: { userId },
    orderBy: { id: "asc" },
  }),
  sessions: await db.session.findMany({
    where: { userId },
    orderBy: { id: "asc" },
  }),
});
after(async () => {
  await db.token.deleteMany({ where: { userId: { in: userIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await app.close();
  await db.$disconnect();
  globalThis.fetch = originalFetch;
});

test("used, expired and unknown links have distinct feedback and leave passwords, tokens and sessions untouched", async () => {
  const user = await account();
  for (const kind of ["INVITATION", "RECOVERY"]) {
    for (const state of ["used", "expired", "unknown"] as const) {
      const token = randomUUID();
      if (state !== "unknown")
        await db.token.create({
          data: {
            userId: user.id,
            hash: digest(token),
            kind,
            expiresAt: new Date(
              Date.now() + (state === "expired" ? -60000 : 3600000),
            ),
            usedAt: state === "used" ? new Date(Date.now() - 60000) : null,
          },
        });
      const before = await snapshot(user.id);
      const response = await accept(token);
      assert.equal(response.statusCode, 400, response.body);
      assert.equal(response.json().error.code, "INVALID_TOKEN");
      const messages = {
        used: usedMessage,
        expired:
          "This link has expired. Use Forgot password to request a new link.",
        unknown:
          "This link is invalid. Open the complete link from your email, or use Forgot password to request a new one.",
      };
      assert.equal(response.json().error.message, messages[state]);
      assert.deepEqual(await snapshot(user.id), before);
    }
  }
});

test("valid invitations and recovery links still update passwords once, save language and revoke sessions", async () => {
  for (const kind of ["INVITATION", "RECOVERY"]) {
    const user = await account();
    const token = randomUUID();
    await db.token.create({
      data: {
        userId: user.id,
        hash: digest(token),
        kind,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    const before = await snapshot(user.id);
    const invalidPassword = await accept(token, "short");
    assert.equal(invalidPassword.statusCode, 400);
    assert.equal(invalidPassword.json().error.code, "VALIDATION");
    assert.deepEqual(await snapshot(user.id), before);
    const response = await accept(token);
    assert.equal(response.statusCode, 200, response.body);
    const accepted = await snapshot(user.id);
    assert.equal(accepted.user.locale, "he");
    assert.ok(verifyPassword(replacementPassword, accepted.user.passwordHash!));
    assert.ok(accepted.tokens[0].usedAt);
    assert.equal(accepted.sessions.length, 0);
    const repeat = await accept(token, "Different-long-test-password!");
    assert.equal(repeat.statusCode, 400);
    assert.equal(repeat.json().error.message, usedMessage);
    assert.deepEqual(await snapshot(user.id), accepted);
  }
});

test("simultaneous acceptance claims a link once and tells the other submission it was already used", async () => {
  const user = await account();
  const token = randomUUID();
  await db.token.create({
    data: {
      userId: user.id,
      hash: digest(token),
      kind: "INVITATION",
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  const passwords = [replacementPassword, "Another-auth-test-password!"];
  const responses = await Promise.all(
    passwords.map((password) => accept(token, password)),
  );
  assert.deepEqual(
    responses.map((response) => response.statusCode).sort(),
    [200, 400],
  );
  assert.equal(
    responses.find((response) => response.statusCode === 400)!.json().error
      .message,
    usedMessage,
  );
  const accepted = await snapshot(user.id);
  const winner = responses.findIndex((response) => response.statusCode === 200);
  assert.ok(verifyPassword(passwords[winner], accepted.user.passwordHash!));
  assert.ok(
    !verifyPassword(passwords[1 - winner], accepted.user.passwordHash!),
  );
  assert.ok(accepted.tokens[0].usedAt);
  assert.equal(accepted.sessions.length, 0);
});
