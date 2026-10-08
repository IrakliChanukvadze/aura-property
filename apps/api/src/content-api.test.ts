import { after, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm, unlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
process.env.NODE_ENV = "test";
process.env.DEV_INTEGRATIONS = "true";
// Tests exercise local adapters only, never configured external destinations.
for (const key of [
  "EMAIL_WEBHOOK_URL",
  "SMS_WEBHOOK_URL",
  "TRANSLATION_WEBHOOK_URL",
  "OPENROUTER_API_KEY",
  "OPENAI_API_KEY",
  "STORAGE_WEBHOOK_URL",
  "R2_ACCOUNT_ID",
])
  delete process.env[key];
const uploadDir = await mkdtemp(join(tmpdir(), "aura-content-api-"));
process.env.UPLOAD_DIR = uploadDir;
const { buildApp } = await import("./server.js");
const { db } = await import("./db.js");
const { hashPassword } = await import("./domain.js");
const app = await buildApp();
const prefix = `content-audit-${randomUUID()}`;
const userIds: string[] = [];
const projectIds: string[] = [];
const postIds: string[] = [];
const customerIds: string[] = [];
const password = "Content-audit-long-password!";
const polygon = [
  [0, 0],
  [90, 0],
  [90, 90],
  [0, 90],
];
const buildings = [
  {
    id: "building",
    coverImage: "building.jpg",
    floors: [{ id: "floor", number: 1, image: "floor.png", polygon }],
  },
];
const translations = (key: string) =>
  Object.fromEntries(
    ["en", "ka", "ru", "he"].map((locale) => [
      locale,
      { title: "Audit content", [key]: "Audit body", reviewed: true },
    ]),
  );
async function account(role: string, contentEdit = false) {
  const u = await db.user.create({
    data: {
      id: `${prefix}-${userIds.length}`,
      email: `${prefix}-${userIds.length}@example.test`,
      name: "Audit person",
      role,
      contentEdit,
      passwordHash: hashPassword(password),
    },
  });
  userIds.push(u.id);
  const response = await app.inject({
    method: "POST",
    url: "/api/auth/login",
    remoteAddress: `127.0.2.${userIds.length}`,
    payload: { email: u.email, password },
  });
  assert.equal(response.statusCode, 200, response.body);
  return { u, cookie: String(response.headers["set-cookie"]).split(";")[0] };
}
async function request(
  a: { cookie: string },
  method: any,
  url: string,
  payload?: any,
) {
  return app.inject({
    method,
    url,
    payload,
    headers: { cookie: a.cookie, origin: "http://localhost:5173" },
  });
}
after(async () => {
  await db.media.deleteMany({ where: { ownerId: { in: userIds } } });
  await db.lead.deleteMany({ where: { customerId: { in: customerIds } } });
  await db.customer.deleteMany({ where: { id: { in: customerIds } } });
  await db.unit.deleteMany({ where: { projectId: { in: projectIds } } });
  await db.project.deleteMany({ where: { id: { in: projectIds } } });
  await db.post.deleteMany({ where: { id: { in: postIds } } });
  await db.token.deleteMany({ where: { userId: { in: userIds } } });
  await db.audit.deleteMany({ where: { actorId: { in: userIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await app.close();
  await db.$disconnect();
  await rm(uploadDir, { recursive: true, force: true });
});

test("editor invitations grant content access by default while explicit per-user denial is preserved", async () => {
  const owner = await account("SUPER_ADMIN");
  for (const explicit of [false, true]) {
    const response = await request(owner, "POST", "/api/users", {
      name: "Invited editor",
      email: `${prefix}-invited-${explicit}@example.test`,
      role: "EDITOR",
      ...(explicit ? { contentEdit: false } : {}),
    });
    assert.equal(response.statusCode, 200, response.body);
    const invited = response.json().data;
    userIds.push(invited.id);
    assert.equal(invited.contentEdit, !explicit);
    const token = new URL(invited.developmentInvitation.text).searchParams.get(
      "token",
    );
    const accepted = await app.inject({
      method: "POST",
      url: "/api/auth/accept-invitation",
      payload: { token, password, locale: "he" },
    });
    assert.equal(accepted.statusCode, 200, accepted.body);
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/api/auth/accept-invitation",
          payload: { token, password },
        })
      ).statusCode,
      400,
    );
    const login = await app.inject({
      method: "POST",
      url: "/api/auth/login",
      payload: { email: invited.email, password },
    });
    assert.equal(login.statusCode, 200, login.body);
    const session = {
      cookie: String(login.headers["set-cookie"]).split(";")[0],
    };
    assert.equal(
      (await request(session, "GET", "/api/site")).statusCode,
      explicit ? 403 : 200,
    );
    assert.equal((await request(session, "GET", "/api/leads")).statusCode, 403);
  }
});

test("project edits validate explorer structure and unit parents before publishing", async () => {
  const editor = await account("EDITOR", true);
  const created = await request(editor, "POST", "/api/projects", {
    slug: `${prefix}-project`,
    city: "Tbilisi",
    coverImage: "cover.jpg",
    translations: translations("description"),
    buildings,
  });
  assert.equal(created.statusCode, 200, created.body);
  const project = created.json().data;
  projectIds.push(project.id);
  assert.equal(
    (await app.inject({ url: `/api/public/projects/${project.slug}` }))
      .statusCode,
    404,
  );
  assert.equal(
    (
      await request(editor, "PATCH", `/api/projects/${project.id}`, {
        buildings: [null],
      })
    ).statusCode,
    400,
  );
  assert.equal(
    (
      await request(editor, "PATCH", `/api/projects/${project.id}`, {
        buildings: [{ id: "bad", floors: [null] }],
      })
    ).statusCode,
    400,
  );
  const unitBody = {
    buildingId: "building",
    floorId: "floor",
    number: "101",
    area: 50,
    bedrooms: 1,
    price: 120000,
    polygon,
  };
  assert.equal(
    (
      await request(editor, "POST", `/api/projects/${project.id}/units`, {
        ...unitBody,
        floorId: "foreign",
      })
    ).statusCode,
    400,
  );
  const createdUnit = await request(
    editor,
    "POST",
    `/api/projects/${project.id}/units`,
    unitBody,
  );
  assert.equal(createdUnit.statusCode, 200, createdUnit.body);
  const unit = createdUnit.json().data;
  assert.equal(
    (
      await request(editor, "PATCH", `/api/units/${unit.id}`, {
        minimumPrice: 100000,
      })
    ).statusCode,
    403,
  );
  assert.equal(
    (await request(editor, "PATCH", `/api/units/${unit.id}`, { price: 125000 }))
      .statusCode,
    200,
  );
  const publish = await request(
    editor,
    "PATCH",
    `/api/projects/${project.id}`,
    { published: true },
  );
  assert.equal(publish.statusCode, 200, publish.body);
  const published = await app.inject({
    url: `/api/public/projects/${project.slug}`,
  });
  assert.equal(published.statusCode, 200, published.body);
  assert.equal(
    published.json().data.buildings[0].floors[0].units[0].price,
    125000,
  );
});

test("articles enforce reviewed translations and draft visibility", async () => {
  const editor = await account("EDITOR", true);
  assert.equal(
    (
      await request(editor, "POST", "/api/posts", {
        slug: `${prefix}-invalid-post`,
        translations: {},
        published: true,
      })
    ).statusCode,
    400,
  );
  const response = await request(editor, "POST", "/api/posts", {
    slug: `${prefix}-post`,
    translations: translations("body"),
    published: true,
  });
  assert.equal(response.statusCode, 200, response.body);
  const post = response.json().data;
  postIds.push(post.id);
  assert.equal(
    (await app.inject({ url: `/api/public/posts/${post.slug}` })).statusCode,
    200,
  );
  assert.equal(
    (
      await request(editor, "PATCH", `/api/posts/${post.id}`, {
        published: false,
      })
    ).statusCode,
    200,
  );
  assert.equal(
    (await app.inject({ url: `/api/public/posts/${post.slug}` })).statusCode,
    404,
  );
});

test("malformed Excel uploads return an actionable 400 rather than an internal error", async () => {
  const agent = await account("AGENT");
  for (const file of [
    "",
    "not base64",
    Buffer.from("not an Excel workbook").toString("base64"),
  ]) {
    const response = await request(agent, "POST", "/api/leads/import/preview", {
      file,
    });
    assert.equal(response.statusCode, 400, response.body);
    assert.equal(response.json().error.code, "INVALID_FILE");
  }
});

test("translation endpoint distinguishes configuration, invalid requests and provider failures", async () => {
  const editor = await account("EDITOR", true);
  const payload = { text: "Hello", source: "en", target: "ka" };
  assert.equal(
    (
      await request(editor, "POST", "/api/translate", {
        ...payload,
        target: "xx",
      })
    ).statusCode,
    400,
  );
  assert.equal(
    (await request(editor, "POST", "/api/translate", payload)).statusCode,
    503,
  );
  const realFetch = globalThis.fetch;
  process.env.TRANSLATION_WEBHOOK_URL = "https://translation.example.test";
  try {
    globalThis.fetch = async () => {
      throw new TypeError("fetch failed");
    };
    assert.equal(
      (await request(editor, "POST", "/api/translate", payload)).statusCode,
      502,
    );
    for (const response of [
      new Response("upstream error", { status: 500 }),
      new Response("not JSON"),
      Response.json({ result: "missing contract" }),
    ]) {
      globalThis.fetch = async () => response;
      const failed = await request(editor, "POST", "/api/translate", payload);
      assert.equal(failed.statusCode, 502, failed.body);
    }
    globalThis.fetch = async () => Response.json({ translation: "გამარჯობა" });
    const translated = await request(editor, "POST", "/api/translate", payload);
    assert.equal(translated.statusCode, 200, translated.body);
    assert.equal(translated.json().data.text, "გამარჯობა");
  } finally {
    globalThis.fetch = realFetch;
    delete process.env.TRANSLATION_WEBHOOK_URL;
  }
});

test("uploads respect private previews, publication and missing-file boundaries", async () => {
  const editor = await account("EDITOR", true);
  const agent = await account("AGENT");
  const image = {
    name: "audit.png",
    mime: "image/png",
    purpose: "PROJECT",
    file: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aXioAAAAASUVORK5CYII=",
  };
  assert.equal(
    (await request(agent, "POST", "/api/uploads", image)).statusCode,
    403,
  );
  const uploaded = await request(editor, "POST", "/api/uploads", image);
  assert.equal(uploaded.statusCode, 200, uploaded.body);
  const media = uploaded.json().data;
  assert.equal((await app.inject({ url: media.url })).statusCode, 404);
  assert.equal(
    (await request(editor, "GET", `/api/uploads/${media.id}`)).statusCode,
    200,
  );
  assert.equal(
    (await request(agent, "GET", `/api/uploads/${media.id}`)).statusCode,
    403,
  );
  const project = await db.project.create({
    data: {
      slug: `${prefix}-media`,
      city: "Tbilisi",
      coverImage: media.url,
      translations: {},
      buildings: [],
      published: true,
    },
  });
  projectIds.push(project.id);
  assert.equal((await app.inject({ url: media.url })).statusCode, 200);
  const stored = await db.media.findUniqueOrThrow({ where: { id: media.id } });
  await unlink(join(uploadDir, stored.path));
  const missing = await request(editor, "GET", `/api/uploads/${media.id}`);
  assert.equal(missing.statusCode, 404, missing.body);
  assert.match(String(missing.headers["content-type"]), /application\/json/);
  assert.equal(
    (
      await request(editor, "POST", "/api/uploads", {
        ...image,
        file: Buffer.from("not an image").toString("base64"),
      })
    ).statusCode,
    400,
  );
  const realFetch = globalThis.fetch;
  process.env.STORAGE_WEBHOOK_URL = "https://storage.example.test";
  try {
    globalThis.fetch = async () => {
      throw new TypeError("fetch failed");
    };
    const offline = await request(editor, "POST", "/api/uploads", image);
    assert.equal(offline.statusCode, 502, offline.body);
    globalThis.fetch = async (_url, options) => {
      assert.ok(options?.signal instanceof AbortSignal);
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.error(new TypeError("Response stream interrupted"));
          },
        }),
      );
    };
    const interrupted = await request(
      editor,
      "GET",
      `/api/uploads/${media.id}`,
    );
    assert.equal(interrupted.statusCode, 502, interrupted.body);
    assert.equal(interrupted.json().error.code, "STORAGE_FAILED");
    assert.match(
      String(interrupted.headers["content-type"]),
      /application\/json/,
    );
  } finally {
    globalThis.fetch = realFetch;
    delete process.env.STORAGE_WEBHOOK_URL;
  }
});

test("password changes revoke previous sessions and invalid inquiry phones return 400", async () => {
  const agent = await account("AGENT");
  const changed = await request(agent, "POST", "/api/auth/password", {
    currentPassword: password,
    newPassword: "Replacement-long-password!",
  });
  assert.equal(changed.statusCode, 200, changed.body);
  assert.equal((await request(agent, "GET", "/api/auth/me")).statusCode, 401);
  const inquiry = await app.inject({
    method: "POST",
    url: "/api/public/inquiries",
    payload: { name: "Audit visitor", phone: "abc", consent: true },
  });
  assert.equal(inquiry.statusCode, 400, inquiry.body);
  assert.equal(inquiry.json().error.code, "INVALID_PHONE");
  assert.equal(
    (
      await app.inject({
        method: "POST",
        url: "/api/public/inquiries/missing/verify-request",
        payload: { phone: "abc" },
      })
    ).statusCode,
    400,
  );
});

test("R2 adapter bounds requests and classifies missing files versus provider failures", async (t) => {
  const { S3Client } = await import("@aws-sdk/client-s3");
  const { r2Get, r2Put } = await import("./storage.js");
  const send = t.mock.method(
    S3Client.prototype,
    "send",
    async (...args: any[]) => {
      assert.ok(args[1].abortSignal instanceof AbortSignal);
      throw new Error("Provider offline");
    },
  );
  await assert.rejects(
    r2Put("audit.png", Buffer.from("fixture"), "image/png"),
    { status: 502, code: "STORAGE_FAILED" },
  );
  await assert.rejects(r2Get("audit.png"), {
    status: 502,
    code: "STORAGE_FAILED",
  });
  send.mock.mockImplementation(async () => {
    throw Object.assign(new Error("Missing object"), { name: "NoSuchKey" });
  });
  await assert.rejects(r2Get("missing.png"), {
    status: 404,
    code: "NOT_FOUND",
  });
  send.mock.mockImplementation(async () => ({
    Body: { transformToByteArray: async () => Buffer.from("fixture") },
  }));
  assert.equal((await r2Get("audit.png")).toString(), "fixture");
});
