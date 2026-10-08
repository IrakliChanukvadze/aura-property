import { after, beforeEach, test } from "node:test";
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
    "Invitation resend tests require an isolated local Aura audit/test database",
  );
process.env.NODE_ENV = "test";
process.env.DEV_INTEGRATIONS = "true";
for (const key of [
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "EMAIL_WEBHOOK_TOKEN",
  "SMS_WEBHOOK_URL",
  "TRANSLATION_WEBHOOK_URL",
  "OPENROUTER_API_KEY",
  "OPENAI_API_KEY",
  "STORAGE_WEBHOOK_URL",
  "R2_ACCOUNT_ID",
])
  delete process.env[key];
process.env.EMAIL_WEBHOOK_URL = "https://email.example.test";
process.env.ADMIN_URL = "https://admin.example.test";
const originalFetch = globalThis.fetch;
type Mail = { to: string; subject: string; text: string };
let mails: Mail[] = [];
let deliver: (mail: Mail) => Promise<Response>;
globalThis.fetch = async (url, options) => {
  assert.equal(
    url,
    "https://email.example.test",
    "Unexpected external provider request",
  );
  const mail = JSON.parse(String(options?.body)) as Mail;
  mails.push(mail);
  return deliver(mail);
};
const { buildApp } = await import("./server.js");
const { db } = await import("./db.js");
const { digest, hashPassword } = await import("./domain.js");
const app = await buildApp();
const prefix = `invite-resend-${randomUUID()}`;
const users: string[] = [];
const teams: string[] = [];
const password = "Invitation-regression-password!";
const passwordHash = hashPassword(password);

beforeEach(() => {
  mails = [];
  deliver = async () => new Response(null, { status: 204 });
});
async function account(
  role = "AGENT",
  teamId: string | null = null,
  activated = true,
  active = true,
) {
  const id = `${prefix}-${users.length}`;
  users.push(id);
  const user = await db.user.create({
    data: {
      id,
      email: `${id}@example.test`,
      name: "Invitation test",
      role,
      teamId,
      active,
      passwordHash: activated ? passwordHash : null,
    },
  });
  if (activated && active)
    await db.session.create({
      data: {
        id: digest(id),
        userId: id,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
  return user;
}
async function team() {
  const lead = await account("TEAM_LEAD");
  const group = await db.team.create({
    data: { name: prefix, leadId: lead.id },
  });
  teams.push(group.id);
  const assignedLead = await db.user.update({
    where: { id: lead.id },
    data: { teamId: group.id },
  });
  return { ...group, lead: assignedLead };
}
async function pendingToken(userId: string, kind = "INVITATION") {
  const token = randomUUID();
  await db.token.create({
    data: {
      userId,
      kind,
      hash: digest(token),
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  return token;
}
function request(
  actorId: string,
  method: "GET" | "POST",
  url: string,
  payload?: Record<string, unknown>,
  remoteAddress = "127.0.0.1",
) {
  return app.inject({
    method,
    url,
    payload,
    remoteAddress,
    headers: {
      cookie: `aura_session=${actorId}`,
      origin: "http://localhost:5173",
    },
  });
}
const resend = (
  actorId: string,
  userId: string,
  payload?: Record<string, unknown>,
) =>
  request(actorId, "POST", `/api/users/${userId}/resend-invitation`, payload);
const accept = (token: string) =>
  app.inject({
    method: "POST",
    url: "/api/auth/accept-invitation",
    payload: { token, password },
  });
const mailedToken = (mail: Mail) =>
  new URL(mail.text.match(/https:\/\/[^\s]+/)![0]).searchParams.get("token")!;
const tokensFor = (userId: string) =>
  db.token.findMany({ where: { userId }, orderBy: { id: "asc" } });
async function sendAudit(userId: string) {
  return db.audit.findMany({
    where: {
      action: "INVITATION_RESENT",
      data: { path: ["userId"], equals: userId },
    },
  });
}
after(async () => {
  await db.leave.deleteMany({ where: { userId: { in: users } } });
  await db.token.deleteMany({ where: { userId: { in: users } } });
  await db.audit.deleteMany({ where: { actorId: { in: users } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await db.team.deleteMany({ where: { id: { in: teams } } });
  await app.close();
  await db.$disconnect();
  globalThis.fetch = originalFetch;
  delete process.env.EMAIL_WEBHOOK_URL;
});

test("users report safe invitation state and permanent/acting leads can resend only their own team's agents", async () => {
  const owner = await account("SUPER_ADMIN");
  const own = await team();
  const other = await team();
  const agent = await account("AGENT", own.id);
  const editor = await account("EDITOR", own.id);
  const actingLead = await account("AGENT", own.id);
  await db.leave.create({
    data: {
      userId: own.lead.id,
      teamId: own.id,
      actingUserId: actingLead.id,
      startsAt: new Date(Date.now() - 60000),
      endsAt: new Date(Date.now() + 3600000),
      days: 1,
      status: "APPROVED",
    },
  });
  const pending = await account("AGENT", own.id, false);
  const otherPending = await account("AGENT", other.id, false);
  const pendingEditor = await account("EDITOR", own.id, false);
  const blocked = await account("AGENT", own.id, false, false);
  for (const actor of [owner, own.lead, actingLead, agent, editor]) {
    const response = await request(actor.id, "GET", "/api/users");
    assert.equal(response.statusCode, 200, response.body);
    assert.ok(
      !/passwordHash|developmentInvitation|accept-invitation|"hash"/.test(
        response.body,
      ),
    );
    for (const row of response.json().data) {
      assert.equal(typeof row.invitationPending, "boolean");
      assert.equal(typeof row.canResendInvitation, "boolean");
      if (row.id === pending.id) {
        assert.equal(row.invitationPending, true);
        assert.equal(
          row.canResendInvitation,
          [owner.id, own.lead.id, actingLead.id].includes(actor.id),
        );
      }
      if (row.id === pendingEditor.id)
        assert.equal(row.canResendInvitation, actor.id === owner.id);
      if (row.id === blocked.id) {
        assert.equal(row.invitationPending, true);
        assert.equal(row.canResendInvitation, false);
      }
      if (row.id === actor.id) assert.equal(row.invitationPending, false);
    }
  }
  for (const actor of [agent, editor])
    assert.equal((await resend(actor.id, pending.id)).statusCode, 403);
  for (const target of [otherPending, pendingEditor, own.lead])
    assert.equal((await resend(own.lead.id, target.id)).statusCode, 403);
  assert.equal((await resend(own.lead.id, pending.id)).statusCode, 200);
  const secondPending = await account("AGENT", own.id, false);
  assert.equal((await resend(actingLead.id, secondPending.id)).statusCode, 200);
  assert.equal((await resend(owner.id, pendingEditor.id)).statusCode, 200);
  assert.equal(mails.length, 3);
});

test("resend delivers only to stored email, expires older setup links, and yields one-use 48-hour activation without leaking tokens", async () => {
  const owner = await account("SUPER_ADMIN");
  const target = await account("AGENT", null, false);
  const oldInvitation = await pendingToken(target.id);
  const oldRecovery = await pendingToken(target.id, "RECOVERY");
  const began = Date.now();
  const response = await resend(owner.id, target.id, {
    email: "untrusted@example.test",
  });
  assert.equal(response.statusCode, 200, response.body);
  assert.deepEqual(response.json().data, {
    message: "Invitation sent. The link is valid for 48 hours.",
    invitationPending: true,
    canResendInvitation: true,
  });
  assert.equal(mails.length, 1);
  assert.equal(mails[0].to, target.email);
  assert.match(mails[0].text, /48 hours/);
  assert.match(mails[0].text, /latest email/);
  const freshToken = mailedToken(mails[0]);
  assert.ok(!response.body.includes(freshToken));
  const fresh = await db.token.findUniqueOrThrow({
    where: { hash: digest(freshToken) },
  });
  assert.ok(fresh.expiresAt.getTime() >= began + 172800000);
  assert.ok(fresh.expiresAt.getTime() <= Date.now() + 172800000);
  for (const old of [oldInvitation, oldRecovery])
    assert.equal((await accept(old)).statusCode, 400);
  assert.equal((await accept(freshToken)).statusCode, 200);
  assert.equal((await accept(freshToken)).statusCode, 400);
  const afterActivation = await resend(owner.id, target.id);
  assert.equal(afterActivation.statusCode, 409);
  assert.equal(afterActivation.json().error.code, "ACCOUNT_ACTIVE");
  assert.equal(mails.length, 1);
});

test("activated, deactivated, missing and unauthorized accounts never receive replacement links", async () => {
  const owner = await account("SUPER_ADMIN");
  const activated = await account();
  const inactive = await account("AGENT", null, false, false);
  for (const [target, code] of [
    [activated, "ACCOUNT_ACTIVE"],
    [inactive, "ACCOUNT_INACTIVE"],
  ] as const) {
    const before = await tokensFor(target.id);
    const response = await resend(owner.id, target.id);
    assert.equal(response.statusCode, 409);
    assert.equal(response.json().error.code, code);
    assert.deepEqual(await tokensFor(target.id), before);
    assert.equal((await sendAudit(target.id)).length, 0);
  }
  assert.equal((await resend(owner.id, `${prefix}-missing`)).statusCode, 404);
  const group = await team();
  const formerLead = await account("TEAM_LEAD", group.id);
  const pending = await account("AGENT", group.id, false);
  assert.equal((await resend(formerLead.id, pending.id)).statusCode, 403);
  await db.team.update({ where: { id: group.id }, data: { active: false } });
  assert.equal((await resend(group.lead.id, pending.id)).statusCode, 403);
  assert.equal(mails.length, 0);
});

test("failed delivery preserves previous invitations and allows an immediate retry without a target cooldown", async () => {
  const owner = await account("SUPER_ADMIN");
  const target = await account("AGENT", null, false);
  const old = await pendingToken(target.id);
  const before = await tokensFor(target.id);
  deliver = async () => {
    throw new Error("Private provider detail must not be returned");
  };
  const failed = await resend(owner.id, target.id);
  assert.equal(failed.statusCode, 503);
  assert.equal(failed.json().error.code, "EMAIL_UNAVAILABLE");
  assert.ok(!failed.body.includes("Private provider"));
  assert.deepEqual(await tokensFor(target.id), before);
  assert.equal((await sendAudit(target.id)).length, 0);
  assert.equal(
    (await db.user.findUniqueOrThrow({ where: { id: target.id } }))
      .passwordHash,
    null,
  );
  deliver = async () => new Response(null, { status: 204 });
  assert.equal((await resend(owner.id, target.id)).statusCode, 200);
  assert.equal(mails.length, 2);
  assert.equal((await accept(old)).statusCode, 400);
});

test("simultaneous resends send one email and enforce a persisted target cooldown across actors", async () => {
  const firstActor = await account("SUPER_ADMIN");
  const otherActor = await account("SUPER_ADMIN");
  const target = await account("AGENT", null, false);
  let release!: () => void;
  let started!: () => void;
  const entered = new Promise<void>((resolve) => {
    started = resolve;
  });
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  deliver = async () => {
    started();
    await pending;
    return new Response(null, { status: 204 });
  };
  const first = resend(firstActor.id, target.id);
  await entered;
  const second = resend(otherActor.id, target.id);
  release();
  const responses = await Promise.all([first, second]);
  assert.deepEqual(responses.map((r) => r.statusCode).sort(), [200, 429]);
  const limited = responses.find((r) => r.statusCode === 429)!;
  assert.equal(limited.json().error.code, "INVITATION_COOLDOWN");
  assert.ok(Number(limited.headers["retry-after"]) > 0);
  assert.equal(mails.length, 1);
  assert.equal((await tokensFor(target.id)).length, 1);
  const audit = await sendAudit(target.id);
  assert.equal(audit.length, 1);
  await db.audit.update({
    where: { id: audit[0].id },
    data: { createdAt: new Date(Date.now() - 61000) },
  });
  assert.equal((await resend(otherActor.id, target.id)).statusCode, 200);
  assert.equal(mails.length, 2);
});

test("acceptance racing a resend waits and cannot activate through the replaced link", async () => {
  const owner = await account("SUPER_ADMIN");
  const target = await account("AGENT", null, false);
  const old = await pendingToken(target.id);
  let release!: () => void;
  let started!: () => void;
  const entered = new Promise<void>((resolve) => {
    started = resolve;
  });
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  deliver = async () => {
    started();
    await pending;
    return new Response(null, { status: 204 });
  };
  const resending = resend(owner.id, target.id);
  await entered;
  const acceptingOld = accept(old);
  release();
  const [sent, rejected] = await Promise.all([resending, acceptingOld]);
  assert.equal(sent.statusCode, 200);
  assert.equal(rejected.statusCode, 400);
  assert.equal(
    (await db.user.findUniqueOrThrow({ where: { id: target.id } }))
      .passwordHash,
    null,
  );
  assert.equal((await accept(mailedToken(mails[0]))).statusCode, 200);
});

test("resend abuse limit is bound to the actor even across source IPs", async () => {
  const owner = await account("SUPER_ADMIN");
  const otherOwner = await account("SUPER_ADMIN");
  const target = await account();
  for (let index = 0; index < 10; index++)
    assert.equal(
      (
        await request(
          owner.id,
          "POST",
          `/api/users/${target.id}/resend-invitation`,
          undefined,
          `127.1.0.${index + 1}`,
        )
      ).statusCode,
      409,
    );
  const limited = await resend(owner.id, target.id);
  assert.equal(limited.statusCode, 429);
  assert.equal(limited.json().error.code, "RATE_LIMIT");
  assert.equal((await resend(otherOwner.id, target.id)).statusCode, 409);
  assert.equal(mails.length, 0);
});

test("resend serializes with pending-account recovery and preserves the generic recovery response", async () => {
  const owner = await account("SUPER_ADMIN");
  const target = await account("AGENT", null, false);
  let release!: () => void;
  let started!: () => void;
  const entered = new Promise<void>((resolve) => {
    started = resolve;
  });
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  deliver = async () => {
    started();
    await pending;
    return new Response(null, { status: 204 });
  };
  const recovering = app.inject({
    method: "POST",
    url: "/api/auth/recover",
    payload: { email: target.email },
  });
  await entered;
  const resending = resend(owner.id, target.id);
  release();
  const [recovered, sent] = await Promise.all([recovering, resending]);
  assert.equal(recovered.statusCode, 200);
  assert.equal(sent.statusCode, 200);
  assert.equal(mails.length, 2);
  assert.equal((await accept(mailedToken(mails[0]))).statusCode, 400);
  assert.equal((await accept(mailedToken(mails[1]))).statusCode, 200);
  const unknown = await app.inject({
    method: "POST",
    url: "/api/auth/recover",
    payload: { email: `${prefix}-unknown@example.test` },
  });
  assert.equal(unknown.statusCode, 200);
  assert.deepEqual(unknown.json(), recovered.json());
  assert.equal(mails.length, 2);
});
