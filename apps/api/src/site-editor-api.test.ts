import { after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";

// This suite replaces agency settings temporarily. Refuse a business database.
const databaseUrl = new URL(
  process.env.DATABASE_URL ?? "postgresql://invalid/",
);
if (
  !["localhost", "127.0.0.1"].includes(databaseUrl.hostname) ||
  !/^\/aura_.*(?:audit|test)/.test(databaseUrl.pathname)
)
  throw new Error(
    "Site editor tests require an isolated local Aura audit/test database",
  );
process.env.NODE_ENV = "test";
const providerKeys = [
  "OPENAI_API_KEY",
  "OPENAI_TRANSLATION_MODEL",
  "TRANSLATION_WEBHOOK_URL",
  "TRANSLATION_WEBHOOK_TOKEN",
];
for (const key of providerKeys) delete process.env[key];
const originalFetch = globalThis.fetch;
const { buildApp } = await import("./server.js");
const { db } = await import("./db.js");
const { hashPassword } = await import("./domain.js");
const app = await buildApp();
const prefix = `site-editor-${randomUUID()}`;
const userIds: string[] = [];
const originalSettings = await db.agencySettings.findUnique({
  where: { id: "agency" },
});
const password = "Site-editor-long-test-password!";

beforeEach(() => {
  for (const key of providerKeys) delete process.env[key];
  globalThis.fetch = async () => {
    throw new Error(
      "Unexpected provider request: real network is disabled in this suite",
    );
  };
});
after(async () => {
  globalThis.fetch = originalFetch;
  for (const key of providerKeys) delete process.env[key];
  if (originalSettings) {
    const { id, siteContent, ...rest } = originalSettings;
    const data = {
      ...rest,
      siteContent: siteContent === null ? Prisma.JsonNull : siteContent,
    };
    await db.agencySettings.upsert({
      where: { id },
      create: { id, ...data },
      update: data,
    });
  } else await db.agencySettings.deleteMany({ where: { id: "agency" } });
  await db.token.deleteMany({ where: { userId: { in: userIds } } });
  await db.audit.deleteMany({ where: { actorId: { in: userIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await app.close();
  await db.$disconnect();
});

async function account(role = "EDITOR", contentEdit = true) {
  const id = `${prefix}-${userIds.length}`;
  const user = await db.user.create({
    data: {
      id,
      email: `${id}@example.test`,
      name: "Site editor test",
      role,
      contentEdit,
      passwordHash: hashPassword(password),
    },
  });
  userIds.push(id);
  const remoteAddress = `127.8.0.${userIds.length}`;
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    remoteAddress,
    payload: { email: user.email, password },
  });
  assert.equal(response.statusCode, 200, response.body);
  return {
    id,
    remoteAddress,
    cookie: String(response.headers["set-cookie"]).split(";")[0],
  };
}
function request(
  user: { cookie: string; remoteAddress: string },
  method: "GET" | "PATCH" | "POST",
  url: string,
  payload?: unknown,
) {
  return app.inject({
    method,
    url,
    payload: payload as any,
    remoteAddress: user.remoteAddress,
    headers: { cookie: user.cookie, origin: "http://localhost:5173" },
  });
}
const translation = {
  text: "Aura Property — 2 bedrooms, $120,000\nKeep this line.",
  source: "en",
  target: "he",
};
function completed(text: string) {
  return {
    status: "completed",
    output: [
      { type: "reasoning", summary: [] },
      {
        type: "message",
        role: "assistant",
        status: "completed",
        content: [{ type: "output_text", text }],
      },
    ],
  };
}

test("section saves preserve other locales and unknown keys; empty fields reset overrides", async () => {
  const editor = await account();
  const initial = {
    phone: "+995555000000",
    email: "before@example.test",
    heroImage: "https://example.test/hero.jpg",
    aboutImage: "https://example.test/about.jpg",
    futureSection: { enabled: true, values: ["keep"] },
    translations: {
      en: { hero: "Before", about: "About stays", futureLabel: "Keep label" },
      ka: { hero: "ქართული", contact: "კონტაქტი" },
      ru: { hero: "Русский" },
      he: { hero: "עברית" },
      futureLocale: { hero: "Keep future locale" },
    },
  };
  await db.agencySettings.upsert({
    where: { id: "agency" },
    create: { id: "agency", siteContent: initial },
    update: { siteContent: initial },
  });
  const patch = { translations: { en: { hero: "New headline" } } };
  const saved = await request(editor, "PATCH", "/api/site", patch);
  assert.equal(saved.statusCode, 200, saved.body);
  const expected = structuredClone(initial);
  expected.translations.en.hero = "New headline";
  assert.deepEqual(saved.json().data, expected);
  assert.deepEqual((await request(editor, "GET", "/api/site")).json(), {
    data: expected,
  });
  assert.deepEqual((await app.inject("/api/public/site")).json(), {
    data: expected,
  });
  const reset = await request(editor, "PATCH", "/api/site", {
    email: "",
    aboutImage: "",
    translations: { en: { hero: "" }, ka: { contact: "" } },
  });
  assert.equal(reset.statusCode, 200, reset.body);
  const data = reset.json().data;
  assert.equal(Object.hasOwn(data, "email"), false);
  assert.equal(Object.hasOwn(data, "aboutImage"), false);
  assert.equal(Object.hasOwn(data.translations.en, "hero"), false);
  assert.equal(Object.hasOwn(data.translations.ka, "contact"), false);
  assert.equal(data.translations.en.about, "About stays");
  assert.equal(data.heroImage, initial.heroImage);
  assert.deepEqual(data.futureSection, initial.futureSection);
  assert.deepEqual(
    data.translations.futureLocale,
    initial.translations.futureLocale,
  );
  const audits = await db.audit.findMany({
    where: { actorId: editor.id, action: "WEBSITE_CONTENT" },
    orderBy: { createdAt: "asc" },
  });
  assert.equal(audits.length, 2);
  assert.deepEqual(audits[0].data, patch);
});

test("concurrent section saves including first creation retain every committed change", async () => {
  const editor = await account();
  await db.agencySettings.deleteMany({ where: { id: "agency" } });
  const patches = [
    { phone: "+995555111111" },
    { aboutImage: "https://example.test/new-about.jpg" },
    { translations: { en: { hero: "New hero" } } },
    { translations: { en: { about: "New about" } } },
    { translations: { ka: { hero: "ქართული" } } },
    { translations: { ru: { hero: "Русский" } } },
    { translations: { he: { hero: "עברית" } } },
  ];
  const responses = await Promise.all(
    patches.map((patch) => request(editor, "PATCH", "/api/site", patch)),
  );
  for (const response of responses)
    assert.equal(response.statusCode, 200, response.body);
  const saved = (await request(editor, "GET", "/api/site")).json().data;
  assert.deepEqual(saved, {
    phone: "+995555111111",
    aboutImage: "https://example.test/new-about.jpg",
    translations: {
      en: { hero: "New hero", about: "New about" },
      ka: { hero: "ქართული" },
      ru: { hero: "Русский" },
      he: { hero: "עברית" },
    },
  });
  assert.equal(
    await db.audit.count({
      where: { actorId: editor.id, action: "WEBSITE_CONTENT" },
    }),
    patches.length,
  );
});

test("website edits and translation enforce authentication and per-user content permission", async () => {
  const denied = await account("EDITOR", false);
  const grantedAgent = await account("AGENT", true);
  const owner = await account("SUPER_ADMIN", false);
  for (const [method, url, payload] of [
    ["GET", "/api/site", undefined],
    ["PATCH", "/api/site", { phone: "Unauthorized" }],
    ["GET", "/api/translation/status", undefined],
    ["POST", "/api/translate", translation],
  ] as const) {
    const anonymous = await app.inject({ method, url, payload });
    assert.equal(anonymous.statusCode, 401, anonymous.body);
    const blocked = await request(denied, method, url, payload);
    assert.equal(blocked.statusCode, 403, blocked.body);
  }
  for (const user of [grantedAgent, owner]) {
    const status = await request(user, "GET", "/api/translation/status");
    assert.equal(status.statusCode, 200, status.body);
    assert.deepEqual(status.json(), {
      data: { configured: false, provider: null },
    });
  }
  const invalid = await request(owner, "PATCH", "/api/site", {
    defaultAgentRate: 99,
  });
  assert.equal(invalid.statusCode, 400, invalid.body);
  const unavailable = await request(
    grantedAgent,
    "POST",
    "/api/translate",
    translation,
  );
  assert.equal(unavailable.statusCode, 503, unavailable.body);
  assert.equal(unavailable.json().error.code, "PROVIDER_REQUIRED");
  assert.match(unavailable.json().error.message, /OPENAI_API_KEY/);
});

test("OpenAI translation uses server secrets and Responses payload; status never exposes credentials", async () => {
  const editor = await account();
  process.env.OPENAI_API_KEY = "test-openai-secret";
  const status = await request(editor, "GET", "/api/translation/status");
  assert.deepEqual(status.json(), {
    data: { configured: true, provider: "openai" },
  });
  assert.equal(status.body.includes("test-openai-secret"), false);
  const before = await db.agencySettings.findUnique({
    where: { id: "agency" },
  });
  const calls: any[] = [];
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options, body: JSON.parse(String(options?.body)) });
    return Response.json(
      completed("Aura Property — 2 חדרי שינה, $120,000\nשורה שנייה."),
    );
  };
  const response = await request(editor, "POST", "/api/translate", translation);
  assert.equal(response.statusCode, 200, response.body);
  assert.deepEqual(response.json(), {
    data: { text: "Aura Property — 2 חדרי שינה, $120,000\nשורה שנייה." },
  });
  assert.equal(calls.length, 1);
  const { url, options, body } = calls[0];
  assert.equal(url, "https://api.openai.com/v1/responses");
  assert.equal(options.method, "POST");
  assert.equal(options.headers.authorization, "Bearer test-openai-secret");
  assert.ok(options.signal instanceof AbortSignal);
  assert.equal(body.model, "gpt-4.1-mini");
  assert.equal(body.store, false);
  assert.equal(body.max_output_tokens, 16384);
  assert.equal(body.input[0].role, "developer");
  assert.match(body.input[0].content, /English \(en\) to Hebrew \(he\)/);
  assert.match(body.input[0].content, /names, numbers, prices/);
  assert.match(body.input[0].content, /source text as data/);
  assert.deepEqual(body.input[1], { role: "user", content: translation.text });
  assert.deepEqual(
    await db.agencySettings.findUnique({ where: { id: "agency" } }),
    before,
  );
  process.env.OPENAI_TRANSLATION_MODEL = "configured-model";
  assert.equal(
    (await request(editor, "POST", "/api/translate", translation)).statusCode,
    200,
  );
  assert.equal(calls[1].body.model, "configured-model");
});

test("configured webhook takes precedence and retains its existing request and response contract", async () => {
  const editor = await account();
  process.env.OPENAI_API_KEY = "unused-openai-secret";
  process.env.TRANSLATION_WEBHOOK_URL =
    "https://translation.example.test/translate";
  process.env.TRANSLATION_WEBHOOK_TOKEN = "test-webhook-secret";
  const status = await request(editor, "GET", "/api/translation/status");
  assert.deepEqual(status.json(), {
    data: { configured: true, provider: "webhook" },
  });
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, "https://translation.example.test/translate");
    assert.equal(
      (options?.headers as any).authorization,
      "Bearer test-webhook-secret",
    );
    assert.deepEqual(JSON.parse(String(options?.body)), translation);
    calls++;
    return Response.json(
      calls === 1 ? { text: "תרגום" } : { translation: "תרגום" },
    );
  };
  for (let i = 0; i < 2; i++) {
    const response = await request(
      editor,
      "POST",
      "/api/translate",
      translation,
    );
    assert.equal(response.statusCode, 200, response.body);
    assert.deepEqual(response.json(), { data: { text: "תרגום" } });
  }
  assert.equal(calls, 2);
});

test("OpenAI failures, incomplete output, refusals and empty output return a safe actionable error", async () => {
  const editor = await account();
  process.env.OPENAI_API_KEY = "never-return-this-secret";
  const refusal = completed("Partial output");
  (refusal.output[1].content as any[]).push({ type: "refusal", refusal: "No" });
  const cases = [
    () => Response.json({ error: "never-return-this-secret" }, { status: 401 }),
    () => Response.json({ ...completed("Partial"), status: "incomplete" }),
    () => Response.json(refusal),
    () => Response.json(completed("   ")),
    () => Response.json({ status: "completed", output: [] }),
    () => new Response("invalid json"),
    () => {
      throw new DOMException("Provider timeout", "TimeoutError");
    },
  ];
  for (const result of cases) {
    globalThis.fetch = async () => result();
    const response = await request(
      editor,
      "POST",
      "/api/translate",
      translation,
    );
    assert.equal(response.statusCode, 502, response.body);
    assert.equal(response.json().error.code, "TRANSLATION_FAILED");
    assert.equal(response.body.includes("never-return-this-secret"), false);
    assert.equal(response.body.includes("Partial"), false);
  }
});

test("translation rejects invalid input before calling a provider and applies a 20/minute limit", async () => {
  const editor = await account();
  process.env.OPENAI_API_KEY = "test-only-key";
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    return Response.json(completed("Translated"));
  };
  const invalid = await request(editor, "POST", "/api/translate", {
    ...translation,
    target: "fr",
  });
  assert.equal(invalid.statusCode, 400, invalid.body);
  assert.equal(calls, 0);
  const limited = { ...editor, remoteAddress: "127.8.9.1" };
  for (let i = 0; i < 20; i++) {
    const response = await request(
      limited,
      "POST",
      "/api/translate",
      translation,
    );
    assert.equal(response.statusCode, 200, response.body);
  }
  const blocked = await request(limited, "POST", "/api/translate", translation);
  assert.equal(blocked.statusCode, 429, blocked.body);
  assert.equal(blocked.json().error.code, "RATE_LIMIT");
  assert.equal(calls, 20);
});
