import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
process.env.NODE_ENV = "test";
process.env.DEV_INTEGRATIONS = "true";
const { buildApp } = await import("./server.js");
const { db } = await import("./db.js");
const { hashPassword } = await import("./domain.js");
const app = await buildApp();
const prefix = `test-${randomUUID()}`;
const users: string[] = [];
const projectIds: string[] = [];
const customerIds: string[] = [];
async function account(role: string, teamId: string | null = null) {
  const id = `${prefix}-${role}-${users.length}`;
  users.push(id);
  const u = await db.user.create({
    data: {
      id,
      email: `${id.toLowerCase()}@example.test`,
      name: role,
      role,
      teamId,
      passwordHash: hashPassword("Test-password-long!"),
    },
  });
  const login = await app.inject({
    remoteAddress: `127.0.1.${users.length}`,
    method: "POST",
    url: "/api/auth/login",
    payload: { email: u.email, password: "Test-password-long!" },
  });
  assert.equal(login.statusCode, 200);
  return { u, cookie: login.headers["set-cookie"]!.toString().split(";")[0] };
}
async function request(a: any, method: any, url: string, payload?: any) {
  return app.inject({
    method,
    url,
    payload,
    headers: { cookie: a.cookie, origin: "http://localhost:5173" },
  });
}
after(async () => {
  const leads = await db.lead.findMany({
    where: { customerId: { in: customerIds } },
  });
  const ids = leads.map((l) => l.id);
  await db.inquiryPending.deleteMany({
    where: {
      phone: {
        in: (
          await db.customer.findMany({
            where: { id: { in: customerIds } },
            select: { phone: true },
          })
        ).map((c) => c.phone),
      },
    },
  });
  await db.media.deleteMany({ where: { ownerId: { in: users } } });
  await db.comment.deleteMany({ where: { leadId: { in: ids } } });
  await db.notification.deleteMany({
    where: { OR: [{ userId: { in: users } }, { leadId: { in: ids } }] },
  });
  await db.sale.deleteMany({ where: { leadId: { in: ids } } });
  await db.lead.deleteMany({ where: { id: { in: ids } } });
  await db.customer.deleteMany({ where: { id: { in: customerIds } } });
  await db.unit.deleteMany({ where: { projectId: { in: projectIds } } });
  await db.project.deleteMany({ where: { id: { in: projectIds } } });
  await db.leave.deleteMany({ where: { userId: { in: users } } });
  await db.schedule.deleteMany({ where: { userId: { in: users } } });
  await db.commissionRate.deleteMany({ where: { userId: { in: users } } });
  await db.team.deleteMany({ where: { leadId: { in: users } } });
  await db.user.deleteMany({ where: { id: { in: users } } });
  await app.close();
  await db.$disconnect();
});
test("authorization scopes lead details, exports, content-only editor and deactivated sessions", async () => {
  const a = await account("AGENT"),
    b = await account("AGENT"),
    owner = await account("SUPER_ADMIN"),
    editor = await account("EDITOR");
  const customer = await db.customer.create({
    data: {
      name: "Scoped buyer",
      phone: `+1${Date.now().toString().slice(-10)}`,
    },
  });
  customerIds.push(customer.id);
  const lead = await db.lead.create({
    data: { customerId: customer.id, agentId: a.u.id, source: "MANUAL" },
  });
  assert.equal(
    (await request(b, "GET", `/api/leads/${lead.id}`)).statusCode,
    404,
  );
  assert.equal((await request(a, "GET", "/api/leads/export")).statusCode, 403);
  assert.equal(
    (
      await request(editor, "POST", "/api/leads", {
        name: "No CRM",
        phone: "+19995555555",
        nationality: "Unknown",
      })
    ).statusCode,
    403,
  );
  assert.equal(
    (await request(a, "PATCH", `/api/users/${b.u.id}`, { active: false }))
      .statusCode,
    403,
  );
  assert.equal(
    (
      await request(owner, "PATCH", `/api/users/${a.u.id}`, {
        active: false,
        redistribution: "TEAM_LEAD",
      })
    ).statusCode,
    200,
  );
  assert.equal((await request(a, "GET", "/api/auth/me")).statusCode, 401);
});
test("editor cannot use CRM lists with query strings or dashboard", async () => {
  const editor = await account("EDITOR");
  assert.equal(
    (await request(editor, "GET", "/api/leads?scope=active")).statusCode,
    403,
  );
  assert.equal(
    (await request(editor, "GET", "/api/dashboard?month=2026-10")).statusCode,
    403,
  );
});
test("two concurrent unanswered calls count exactly twice and Lost requires permanent review", async () => {
  const agent = await account("AGENT");
  const customer = await db.customer.create({
    data: {
      name: "Call buyer",
      phone: `+2${Date.now().toString().slice(-10)}`,
    },
  });
  customerIds.push(customer.id);
  const l = await db.lead.create({
    data: { customerId: customer.id, agentId: agent.u.id, source: "MANUAL" },
  });
  const results = await Promise.all([
    request(agent, "POST", `/api/leads/${l.id}/calls`, {
      outcome: "NO_ANSWER",
      comment: "First no answer",
      requestId: "first",
    }),
    request(agent, "POST", `/api/leads/${l.id}/calls`, {
      outcome: "NO_ANSWER",
      comment: "Second no answer",
      requestId: "second",
    }),
  ]);
  assert.ok(results.every((r) => r.statusCode === 200));
  const updated = await db.lead.findUniqueOrThrow({ where: { id: l.id } });
  assert.equal(updated.unanswered, 2);
  assert.equal(updated.stage, "LOST");
  assert.equal(updated.lostReview, true);
  assert.equal(
    await db.reminder.count({ where: { leadId: l.id, state: "PENDING" } }),
    0,
  );
  assert.equal(
    (
      await request(agent, "POST", `/api/leads/${l.id}/review`, {
        decision: "CONFIRM",
      })
    ).statusCode,
    403,
  );
});
test("Won requires deposit, enforces price floor and is terminal; concurrent reservation release cannot unsell", async () => {
  const agent = await account("AGENT"),
    owner = await account("SUPER_ADMIN");
  const customer = await db.customer.create({
    data: {
      name: "Sale buyer",
      phone: `+3${Date.now().toString().slice(-10)}`,
    },
  });
  customerIds.push(customer.id);
  const l = await db.lead.create({
    data: { customerId: customer.id, agentId: agent.u.id, source: "MANUAL" },
  });
  const p = await db.project.create({
    data: {
      slug: `${prefix}-sale`,
      city: "Tbilisi",
      coverImage: "demo",
      translations: {},
      buildings: [],
    },
  });
  projectIds.push(p.id);
  const unit = await db.unit.create({
    data: {
      projectId: p.id,
      buildingId: "a",
      floorId: "1",
      number: "1",
      area: 50,
      bedrooms: 1,
      polygon: [],
      price: 100000,
      priceCurrency: "GEL",
      minimumPrice: 90000,
      minimumCurrency: "GEL",
    },
  });
  const reserve = await request(agent, "POST", `/api/leads/${l.id}/reserve`, {
    unitId: unit.id,
  });
  assert.equal(reserve.statusCode, 200);
  const r = reserve.json().data;
  const sale = {
    unitId: unit.id,
    price: 100000,
    currency: "GEL",
    deposit: 10000,
    depositCurrency: "GEL",
    depositDate: new Date().toISOString(),
    signedAt: new Date().toISOString(),
    confirmed: true,
  };
  assert.equal(
    (
      await request(agent, "POST", `/api/leads/${l.id}/sales`, {
        ...sale,
        deposit: 0,
      })
    ).statusCode,
    400,
  );
  assert.equal(
    (
      await request(agent, "POST", `/api/leads/${l.id}/sales`, {
        ...sale,
        price: 80000,
      })
    ).statusCode,
    400,
  );
  const race = await Promise.all([
    request(agent, "POST", `/api/leads/${l.id}/sales`, sale),
    request(agent, "POST", `/api/reservations/${r.id}/review`, {
      decision: "REMOVE",
    }),
  ]);
  assert.equal(race[0].statusCode, 200);
  assert.equal(
    (await db.unit.findUniqueOrThrow({ where: { id: unit.id } })).status,
    "SOLD",
  );
  assert.equal(
    (
      await request(agent, "POST", `/api/leads/${l.id}/viewing`, {
        date: new Date().toISOString(),
      })
    ).statusCode,
    400,
  );
  assert.equal(
    (await request(agent, "POST", `/api/leads/${l.id}/stage`, { stage: "NEW" }))
      .statusCode,
    400,
  );
  const s = race[0].json().data;
  assert.equal(
    (
      await request(agent, "POST", `/api/sales/${s.id}/reverse`, {
        reason: "Cancelled signed purchase",
        destination: "LOST",
      })
    ).statusCode,
    403,
  );
  const details = (await request(agent, "GET", `/api/leads/${l.id}`)).json()
    .data;
  assert.equal(details.sales[0].leadAmount, undefined);
  assert.equal(
    (
      await request(owner, "POST", `/api/sales/${s.id}/reverse`, {
        reason: "Cancelled signed purchase",
        destination: "LOST",
      })
    ).statusCode,
    200,
  );
  assert.equal(
    (await db.unit.findUniqueOrThrow({ where: { id: unit.id } })).status,
    "AVAILABLE",
  );
});
test("public project projection hides minimum and undisclosed prices and draft cannot be fetched", async () => {
  const project = await db.project.create({
    data: {
      slug: `${prefix}-private`,
      city: "Tbilisi",
      coverImage: "demo",
      translations: {},
      buildings: [{ id: "a", floors: [{ id: "1", number: 1 }] }],
      published: false,
    },
  });
  projectIds.push(project.id);
  await db.unit.create({
    data: {
      projectId: project.id,
      buildingId: "a",
      floorId: "1",
      number: "2",
      area: 50,
      bedrooms: 1,
      polygon: [],
      price: 123456,
      minimumPrice: 100000,
      showPrice: false,
    },
  });
  assert.equal(
    (await app.inject({ url: `/api/public/projects/${project.slug}` }))
      .statusCode,
    404,
  );
  await db.project.update({
    where: { id: project.id },
    data: { published: true },
  });
  const response = await app.inject({
    url: `/api/public/projects/${project.slug}`,
  });
  assert.equal(response.statusCode, 200);
  assert.ok(!response.body.includes("123456"));
  assert.ok(!response.body.includes("minimumPrice"));
});

test("concurrent first inquiry cannot bypass duplicate OTP and optional verification limits persist", async () => {
  const value = {
    name: "Concurrent inquiry",
    phone: `+4${Date.now().toString().slice(-10)}`,
    locale: "en",
    consent: true,
  };
  const results = await Promise.all([
    app.inject({
      method: "POST",
      url: "/api/public/inquiries",
      payload: value,
    }),
    app.inject({
      method: "POST",
      url: "/api/public/inquiries",
      payload: value,
    }),
  ]);
  assert.ok(results.every((r) => r.statusCode === 200));
  const data = results.map((r) => r.json().data);
  assert.equal(data.filter((d) => d.accepted).length, 1);
  assert.equal(data.filter((d) => d.requiresOtp).length, 1);
  const c = await db.customer.findUniqueOrThrow({
    where: { phone: value.phone },
  });
  customerIds.push(c.id);
  assert.equal(await db.lead.count({ where: { customerId: c.id } }), 1);
  const existing = data.find((d) => d.requiresOtp);
  const verified = await app.inject({
    method: "POST",
    url: "/api/public/inquiries",
    payload: {
      ...value,
      requestId: existing.requestId,
      otpCode: existing.developmentOtp.code,
    },
  });
  assert.equal(verified.statusCode, 200);
  assert.equal(await db.lead.count({ where: { customerId: c.id } }), 2);
  const leadId = data.find((d) => d.accepted).id;
  const request = await app.inject({
    method: "POST",
    url: `/api/public/inquiries/${leadId}/verify-request`,
    payload: { phone: value.phone },
  });
  assert.equal(request.statusCode, 200);
  const pending = request.json().data;
  for (let i = 0; i < 5; i++) {
    const wrong = await app.inject({
      method: "POST",
      url: "/api/public/inquiries/verify",
      payload: { requestId: pending.requestId, otpCode: "incorrect" },
    });
    assert.equal(wrong.statusCode, 400);
  }
  assert.equal(
    (
      await db.inquiryPending.findUniqueOrThrow({
        where: { id: pending.requestId },
      })
    ).attempts,
    5,
  );
  const blocked = await app.inject({
    method: "POST",
    url: "/api/public/inquiries/verify",
    payload: {
      requestId: pending.requestId,
      otpCode: pending.developmentOtp.code,
    },
  });
  assert.equal(blocked.statusCode, 400);
});

test("reporting boundaries use calendar month and year in Tbilisi independent of host timezone", async () => {
  const { periodBounds } = await import("./reporting.js");
  const month = periodBounds("2026-10");
  assert.equal(month.start.toISOString(), "2026-09-30T20:00:00.000Z");
  assert.equal(month.end.toISOString(), "2026-10-31T20:00:00.000Z");
  const year = periodBounds("2026-10", true);
  assert.equal(year.start.toISOString(), "2025-12-31T20:00:00.000Z");
  assert.equal(year.end.toISOString(), "2026-12-31T20:00:00.000Z");
});

test("only owner changes agency defaults and new-user rates do not mutate existing earnings", async () => {
  const owner = await account("SUPER_ADMIN");
  const agent = await account("AGENT");
  const before = (await request(owner, "GET", "/api/settings")).json().data;
  assert.equal(
    (
      await request(agent, "PATCH", "/api/settings", {
        defaultAgentRate: 2,
        defaultLeadRate: 0.8,
      })
    ).statusCode,
    403,
  );
  try {
    assert.equal(
      (
        await request(owner, "PATCH", "/api/settings", {
          defaultAgentRate: 1.2,
          defaultLeadRate: 0.6,
        })
      ).statusCode,
      200,
    );
    const email = `${prefix}-defaults@example.test`;
    const created = await request(owner, "POST", "/api/users", {
      name: "Defaults preview",
      email,
      role: "EDITOR",
    });
    assert.equal(created.statusCode, 200);
    users.push(created.json().data.id);
    const saved = await db.user.findUniqueOrThrow({ where: { email } });
    assert.equal(Number(saved.agentRate), 1.2);
    assert.equal(Number(saved.leadRate), 0.6);
    const unchanged = await db.user.findUniqueOrThrow({
      where: { id: agent.u.id },
    });
    assert.equal(Number(unchanged.agentRate), 1);
  } finally {
    await request(owner, "PATCH", "/api/settings", {
      defaultAgentRate: Number(before.defaultAgentRate),
      defaultLeadRate: Number(before.defaultLeadRate),
    });
  }
});

test("Excel template preview flags duplicates and imports only valid rows to agent", async () => {
  const { default: ExcelJS } = await import("exceljs");
  const agent = await account("AGENT");
  const template = await request(agent, "GET", "/api/leads/import/template");
  assert.equal(template.statusCode, 200);
  const book = new ExcelJS.Workbook();
  await book.xlsx.load(template.rawPayload as any);
  const sheet = book.worksheets[0];
  sheet.spliceRows(2, 1);
  const p = `+1555${Math.floor(Math.random() * 9000000 + 1000000)}`;
  sheet.addRow(["Import preview", p, "", "Unknown", "en", ""]);
  sheet.addRow(["Duplicate preview", p, "", "Unknown", "en", ""]);
  sheet.addRow(["Invalid preview", "abc", "", "Unknown", "en", ""]);
  const file = Buffer.from(await book.xlsx.writeBuffer()).toString("base64");
  const preview = await request(agent, "POST", "/api/leads/import/preview", {
    file,
  });
  assert.equal(preview.statusCode, 200);
  assert.equal(preview.json().data.valid, 1);
  assert.equal(preview.json().data.skipped, 2);
  const confirmed = await request(agent, "POST", "/api/leads/import/confirm", {
    previewId: preview.json().data.previewId,
  });
  assert.equal(confirmed.statusCode, 200);
  assert.equal(confirmed.json().data.imported, 1);
  const customer = await db.customer.findUniqueOrThrow({ where: { phone: p } });
  customerIds.push(customer.id);
  const lead = await db.lead.findFirstOrThrow({
    where: { customerId: customer.id },
  });
  assert.equal(lead.agentId, agent.u.id);
  assert.equal(lead.stage, "NEW");
  assert.equal(
    (
      await request(agent, "POST", "/api/leads/import/confirm", {
        previewId: preview.json().data.previewId,
      })
    ).statusCode,
    400,
  );
});

test("website content is editable per-user and public projection excludes private commission settings", async()=>{
 const owner=await account("SUPER_ADMIN"),agent=await account("AGENT");
 const before=(await request(owner,"GET","/api/site")).json().data;
 assert.equal((await request(agent,"PATCH","/api/site",{translations:{en:{hero:"Unauthorized"}}})).statusCode,403);
 try {
  const response=await request(owner,"PATCH","/api/site",{heroVariant:"cityscape",translations:{en:{hero:"Preview headline"}}});
  assert.equal(response.statusCode,200);
  const publicResult=(await app.inject({method:"GET",url:"/api/public/site"})).json().data;
  assert.equal(publicResult.translations.en.hero,"Preview headline");
  assert.equal(publicResult.defaultAgentRate,undefined);
 } finally {await request(owner,"PATCH","/api/site",before);}
});
