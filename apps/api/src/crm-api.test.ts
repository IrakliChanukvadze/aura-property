import { after, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
process.env.NODE_ENV = "test";
process.env.DEV_INTEGRATIONS = "true";
for (const key of [
  "EMAIL_WEBHOOK_URL",
  "EMAIL_WEBHOOK_TOKEN",
  "RESEND_API_KEY",
  "EMAIL_FROM",
])
  delete process.env[key];
const { buildApp } = await import("./server.js");
const { db, ApiError } = await import("./db.js");
const { hashPassword } = await import("./domain.js");
const { signingRate, sendEmail, sendOtp } = await import("./adapters.js");
const { periodBounds } = await import("./reporting.js");
const app = await buildApp();
const prefix = `crm-audit-${randomUUID()}`;
const userIds: string[] = [],
  customerIds: string[] = [],
  projectIds: string[] = [],
  teamIds: string[] = [],
  fxDates: string[] = [];
async function account(role: string) {
  const id = `${prefix}-${userIds.length}`;
  userIds.push(id);
  const user = await db.user.create({
    data: {
      id,
      email: `${id}@example.test`,
      name: "API audit fixture",
      role,
      passwordHash: hashPassword("API-audit-fixture-password"),
    },
  });
  const response = await app.inject({
    remoteAddress: `127.1.0.${userIds.length}`,
    method: "POST",
    url: "/api/auth/login",
    payload: { email: user.email, password: "API-audit-fixture-password" },
  });
  assert.equal(response.statusCode, 200, response.body);
  return {
    id,
    cookie: response.headers["set-cookie"]!.toString().split(";")[0],
  };
}
const request = (
  user: { cookie: string },
  method: "GET" | "POST",
  url: string,
  payload?: object,
) =>
  app.inject({
    method,
    url,
    payload,
    headers: { cookie: user.cookie, origin: "http://localhost:5173" },
  });
async function purchaseFixture(
  agentId: string,
  currency = "USD",
  teamId: string | null = null,
) {
  const customer = await db.customer.create({
    data: {
      name: "Disposable audit buyer",
      phone: `+${randomUUID().replace(/\D/g, "").padEnd(15, "0").slice(0, 15)}`,
    },
  });
  customerIds.push(customer.id);
  const lead = await db.lead.create({
    data: { customerId: customer.id, source: "MANUAL", agentId, teamId },
  });
  const project = await db.project.create({
    data: {
      slug: `${prefix}-${projectIds.length}`,
      city: "Test city",
      coverImage: "test",
      translations: {},
      buildings: [],
    },
  });
  projectIds.push(project.id);
  const unit = await db.unit.create({
    data: {
      projectId: project.id,
      buildingId: "test-building",
      floorId: "test-floor",
      number: "TEST1",
      area: 50,
      bedrooms: 1,
      polygon: [],
      price: 100000,
      priceCurrency: currency,
      minimumPrice: 90000,
      minimumCurrency: currency,
    },
  });
  return { lead, unit };
}
after(async () => {
  const leads = await db.lead.findMany({
    where: { customerId: { in: customerIds } },
    select: { id: true },
  });
  const leadIds = leads.map((lead) => lead.id);
  await db.notification.deleteMany({
    where: { OR: [{ userId: { in: userIds } }, { leadId: { in: leadIds } }] },
  });
  await db.comment.deleteMany({ where: { leadId: { in: leadIds } } });
  await db.sale.deleteMany({ where: { leadId: { in: leadIds } } });
  await db.lead.deleteMany({ where: { id: { in: leadIds } } });
  await db.customer.deleteMany({ where: { id: { in: customerIds } } });
  await db.unit.deleteMany({ where: { projectId: { in: projectIds } } });
  await db.project.deleteMany({ where: { id: { in: projectIds } } });
  await db.leave.deleteMany({ where: { userId: { in: userIds } } });
  await db.team.deleteMany({ where: { id: { in: teamIds } } });
  await db.audit.deleteMany({ where: { actorId: { in: userIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await db.fxRate.deleteMany({ where: { date: { in: fxDates } } });
  await app.close();
  await db.$disconnect();
});

test("CRM accepts empty optional filters serialized by the admin", async () => {
  const adminQuery =
    "/api/leads?scope=active&search=&projectId=&agentId=&source=&from=&to=";
  for (const role of ["SUPER_ADMIN", "AGENT"]) {
    const actor = await account(role);
    for (const url of [
      adminQuery,
      `${adminQuery}&stage=&teamId=`,
      "/api/leads?scope=&stage=&search=&projectId=&agentId=&source=&from=&to=",
    ]) {
      const result = await request(actor, "GET", url);
      assert.equal(result.statusCode, 200, `${role} ${url}: ${result.body}`);
      assert.ok(Array.isArray(result.json().data));
    }
  }
});

test("CRM and reporting reject malformed query filters before Prisma", async () => {
  const owner = await account("SUPER_ADMIN");
  for (const url of [
    "/api/leads?search=first&search=second",
    "/api/leads?agentId=first&agentId=second",
    "/api/leads?from=2026-02-30",
    "/api/leads?from=2026-10-31&to=2026-10-01",
    "/api/leads?stage=TYPO",
    "/api/leads?stage=&stage=",
    "/api/leads?source=&source=MANUAL",
    "/api/leads?from=&from=2026-10-01",
    "/api/commissions?month=2026-10&month=2026-11",
    "/api/commissions?month=2026-13",
    "/api/commissions?month=2026-10-extra",
    "/api/dashboard?month=0000-01",
    "/api/leaderboards?month=9999-12",
  ]) {
    const result = await request(owner, "GET", url);
    assert.equal(result.statusCode, 400, `${url}: ${result.body}`);
  }
  const bounds = periodBounds("2026-10");
  assert.equal(bounds.start.toISOString(), "2026-09-30T20:00:00.000Z");
  assert.equal(bounds.end.toISOString(), "2026-10-31T20:00:00.000Z");
});

test("USD sale reports missing signing-date FX, then succeeds with a verified immutable snapshot", async () => {
  const owner = await account("SUPER_ADMIN"),
    agent = await account("AGENT");
  const { lead, unit } = await purchaseFixture(agent.id);
  let year = 1800;
  while (await db.fxRate.findUnique({ where: { date: `${year}-06-11` } }))
    year++;
  const date = `${year}-06-11`;
  const signedAt = `${date}T08:00:00.000Z`;
  const payload = {
    unitId: unit.id,
    price: 100000,
    currency: "USD",
    deposit: 10000,
    depositCurrency: "USD",
    depositDate: signedAt,
    signedAt,
    confirmed: true,
  };
  const previous = process.env.FX_WEBHOOK_URL;
  delete process.env.FX_WEBHOOK_URL;
  try {
    const missing = await request(
      agent,
      "POST",
      `/api/leads/${lead.id}/sales`,
      payload,
    );
    assert.equal(missing.statusCode, 409, missing.body);
    assert.equal(missing.json().error.code, "FX_RATE_REQUIRED");
    assert.ok(missing.json().error.message.includes(date));
    assert.equal(await db.sale.count({ where: { leadId: lead.id } }), 0);
    assert.equal(
      (await db.unit.findUniqueOrThrow({ where: { id: unit.id } })).status,
      "AVAILABLE",
    );
    assert.equal(
      (await db.lead.findUniqueOrThrow({ where: { id: lead.id } })).stage,
      "NEW",
    );
    assert.equal(
      (
        await request(agent, "POST", "/api/fx", {
          date,
          usdGel: 2.7,
          source: "Disposable test fixture, not a market rate",
        })
      ).statusCode,
      403,
    );
    const rate = await request(owner, "POST", "/api/fx", {
      date,
      usdGel: 2.7,
      source: "Disposable test fixture, not a market rate",
    });
    assert.equal(rate.statusCode, 200, rate.body);
    fxDates.push(date);
    const result = await request(
      agent,
      "POST",
      `/api/leads/${lead.id}/sales`,
      payload,
    );
    assert.equal(result.statusCode, 200, result.body);
    const sale = result.json().data;
    assert.equal(Number(sale.gelRate), 2.7);
    assert.equal(Number(sale.gelTotal), 270000);
    assert.equal(Number(sale.agentAmount), 2700);
    assert.equal(
      (await db.unit.findUniqueOrThrow({ where: { id: unit.id } })).status,
      "SOLD",
    );
    assert.equal(
      (await db.lead.findUniqueOrThrow({ where: { id: lead.id } })).stage,
      "WON",
    );
    assert.equal(
      (
        await request(owner, "POST", "/api/fx", {
          date,
          usdGel: 2.8,
          source: "Updated test fixture",
        })
      ).statusCode,
      200,
    );
    assert.equal(
      Number(
        (await db.sale.findUniqueOrThrow({ where: { id: sale.id } })).gelRate,
      ),
      2.7,
    );
    for (const url of [
      `/api/leads/${lead.id}`,
      `/api/commissions?month=${year}-06`,
      `/api/dashboard?month=${year}-06`,
      `/api/leaderboards?month=${year}-06`,
      "/api/calendar",
      "/api/notifications",
    ]) {
      const response = await request(agent, "GET", url);
      assert.equal(response.statusCode, 200, `${url}: ${response.body}`);
    }
  } finally {
    if (previous === undefined) delete process.env.FX_WEBHOOK_URL;
    else process.env.FX_WEBHOOK_URL = previous;
  }
});

test("inconsistent signing-date commission configuration blocks the sale without mutating inventory", async () => {
  const agent = await account("AGENT"),
    leader = await account("TEAM_LEAD");
  const team = await db.team.create({
    data: { name: `${prefix}-team`, leadId: leader.id },
  });
  teamIds.push(team.id);
  await db.user.update({ where: { id: agent.id }, data: { teamId: team.id } });
  await db.user.update({
    where: { id: leader.id },
    data: { teamId: team.id, leadRate: 0.1 },
  });
  const { lead, unit } = await purchaseFixture(agent.id, "GEL", team.id);
  await db.leave.create({
    data: {
      userId: leader.id,
      teamId: team.id,
      startsAt: new Date("1800-01-01"),
      endsAt: new Date("1800-01-03"),
      days: 2,
      status: "APPROVED",
      actingUserId: agent.id,
      actingRate: 0.25,
    },
  });
  const date = "1800-01-02T08:00:00.000Z";
  const response = await request(agent, "POST", `/api/leads/${lead.id}/sales`, {
    unitId: unit.id,
    price: 100000,
    currency: "GEL",
    deposit: 10000,
    depositCurrency: "GEL",
    depositDate: date,
    signedAt: date,
    confirmed: true,
  });
  assert.equal(response.statusCode, 409, response.body);
  assert.equal(response.json().error.code, "COMMISSION_CONFIGURATION");
  assert.equal(await db.sale.count({ where: { leadId: lead.id } }), 0);
  assert.equal(
    (await db.unit.findUniqueOrThrow({ where: { id: unit.id } })).status,
    "AVAILABLE",
  );
});

test("provider adapters bound requests, preserve FX URL parameters, and return actionable failures", async () => {
  const previousFetch = globalThis.fetch;
  const variables = [
    "FX_WEBHOOK_URL",
    "EMAIL_WEBHOOK_URL",
    "SMS_WEBHOOK_URL",
  ] as const;
  const previousEnv = Object.fromEntries(
    variables.map((key) => [key, process.env[key]]),
  );
  try {
    process.env.FX_WEBHOOK_URL = "https://example.test/rates?base=USD";
    globalThis.fetch = (async (input, options) => {
      const url = new URL(String(input));
      assert.equal(url.searchParams.get("base"), "USD");
      assert.equal(url.searchParams.get("date"), "2026-10-07");
      assert.ok(options?.signal);
      return new Response(JSON.stringify({ usdGel: 2.7 }));
    }) as typeof fetch;
    assert.equal(await signingRate("2026-10-07"), 2.7);
    for (const response of [
      "not JSON",
      JSON.stringify({ usdGel: "2.7" }),
      JSON.stringify({ usdGel: -1 }),
    ]) {
      globalThis.fetch = (async () => new Response(response)) as typeof fetch;
      await assert.rejects(
        signingRate("2026-10-07"),
        (error: unknown) =>
          error instanceof ApiError &&
          error.status === 503 &&
          error.code === "FX_UNAVAILABLE",
      );
    }
    process.env.EMAIL_WEBHOOK_URL = "https://example.test/email";
    process.env.SMS_WEBHOOK_URL = "https://example.test/sms";
    globalThis.fetch = (async () => {
      throw new Error("Network unavailable");
    }) as typeof fetch;
    await assert.rejects(
      sendEmail("nobody@example.test", "Test", "Test"),
      (error: unknown) =>
        error instanceof ApiError &&
        error.status === 503 &&
        error.code === "EMAIL_UNAVAILABLE",
    );
    await assert.rejects(
      sendOtp("+15550000000", "123456"),
      (error: unknown) =>
        error instanceof ApiError &&
        error.status === 503 &&
        error.code === "SMS_UNAVAILABLE",
    );
  } finally {
    globalThis.fetch = previousFetch;
    for (const key of variables) {
      if (previousEnv[key] === undefined) delete process.env[key];
      else process.env[key] = previousEnv[key];
    }
  }
});
