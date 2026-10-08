import { after, test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { Prisma } from "@prisma/client";

// Tests temporarily replace the singleton settings row, never a working database.
const databaseUrl = new URL(
  process.env.DATABASE_URL ?? "postgresql://invalid/",
);
if (
  !["localhost", "127.0.0.1"].includes(databaseUrl.hostname) ||
  !/^\/aura_.*(?:audit|test)/.test(databaseUrl.pathname)
) {
  throw new Error(
    "Team profile tests require an isolated local Aura audit/test database",
  );
}
process.env.NODE_ENV = "test";
process.env.DEV_INTEGRATIONS = "true";
for (const key of Object.keys(process.env)) {
  if (
    key.includes("WEBHOOK") ||
    key.startsWith("R2_") ||
    key.startsWith("OPENAI_") ||
    key.startsWith("OPENROUTER_") ||
    key === "RESEND_API_KEY" ||
    key === "EMAIL_FROM"
  )
    delete process.env[key];
}
const uploadDir = await mkdtemp(join(tmpdir(), "aura-team-profiles-"));
process.env.UPLOAD_DIR = uploadDir;
const { buildApp } = await import("./server.js");
const { db } = await import("./db.js");
const { hashPassword } = await import("./domain.js");
const app = await buildApp();
const prefix = `team-profile-${randomUUID()}`;
const userIds: string[] = [];
const originalSettings = await db.agencySettings.findUnique({
  where: { id: "agency" },
});
const password = "Team-profile-long-test-password!";

after(async () => {
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
  await db.media.deleteMany({ where: { ownerId: { in: userIds } } });
  await db.token.deleteMany({ where: { userId: { in: userIds } } });
  await db.audit.deleteMany({ where: { actorId: { in: userIds } } });
  await db.user.deleteMany({ where: { id: { in: userIds } } });
  await app.close();
  await db.$disconnect();
  await rm(uploadDir, { recursive: true, force: true });
});

async function account(role = "EDITOR", contentEdit = true) {
  const id = `${prefix}-${userIds.length}`;
  const user = await db.user.create({
    data: {
      id,
      email: `${id}@example.test`,
      name: "Profile test",
      role,
      contentEdit,
      passwordHash: hashPassword(password),
    },
  });
  userIds.push(id);
  const remoteAddress = `127.9.0.${userIds.length}`;
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
const profile = (id = "public-profile") => ({
  id,
  name: "სატესტო წევრი",
  title: "Sales lead",
  bio: "An editorial team biography.",
  photo: "/images/team/mock-portrait.svg",
  visible: true,
  translations: {
    en: { name: "Team member", title: "Sales lead", bio: "English biography." },
    ka: { name: "სატესტო წევრი" },
    he: { title: "מנהל מכירות" },
  },
});

test("only SuperAdmin can change website-only team profiles; partial content edits preserve them", async () => {
  const owner = await account("SUPER_ADMIN", false);
  const editor = await account("EDITOR", true);
  const agent = await account("AGENT", true);
  const initial = {
    phone: "+995555000000",
    heroImage: "/hero.jpg",
    translations: {
      ka: { aboutTitle: "ჩვენ შესახებ" },
      en: { hero: "Keep headline" },
    },
  };
  await db.agencySettings.upsert({
    where: { id: "agency" },
    create: { id: "agency", siteContent: initial },
    update: { siteContent: initial },
  });
  const originalUserCount = await db.user.count();
  for (const denied of [editor, agent]) {
    const response = await request(denied, "PATCH", "/api/site", {
      teamMembers: [profile()],
    });
    assert.equal(response.statusCode, 403, response.body);
    assert.deepEqual(
      (await db.agencySettings.findUniqueOrThrow({ where: { id: "agency" } }))
        .siteContent,
      initial,
    );
  }
  const saved = await request(owner, "PATCH", "/api/site", {
    teamMembers: [profile()],
  });
  assert.equal(saved.statusCode, 200, saved.body);
  assert.deepEqual(saved.json().data, { ...initial, teamMembers: [profile()] });
  assert.equal(
    await db.user.count(),
    originalUserCount,
    "Website profiles must not create CRM accounts",
  );
  const ordinarySave = await request(editor, "PATCH", "/api/site", {
    translations: { en: { hero: "Updated hero" } },
  });
  assert.equal(ordinarySave.statusCode, 200, ordinarySave.body);
  assert.deepEqual(ordinarySave.json().data.teamMembers, [profile()]);
  assert.deepEqual(
    ordinarySave.json().data.translations.ka,
    initial.translations.ka,
  );
  const removed = await request(owner, "PATCH", "/api/site", {
    teamMembers: [],
  });
  assert.equal(removed.statusCode, 200, removed.body);
  assert.deepEqual(removed.json().data.teamMembers, []);
  assert.equal(removed.json().data.heroImage, initial.heroImage);
});

test("public team publishes visible editorial profiles and active public CRM profiles only", async () => {
  const owner = await account("SUPER_ADMIN", false);
  const staff = await account("AGENT", false);
  const privateStaff = await account("AGENT", false);
  const inactive = await account("AGENT", false);
  const staffData = {
    title: "Agent",
    photo: "/staff.jpg",
    bio: "Existing profile",
  };
  await db.user.update({
    where: { id: staff.id },
    data: { publicProfile: true, publicData: staffData },
  });
  await db.user.update({
    where: { id: inactive.id },
    data: { active: false, publicProfile: true, publicData: staffData },
  });
  const visible = profile(`${prefix}-visible`);
  const hidden = {
    ...profile(`${prefix}-hidden`),
    visible: false,
    bio: "Private draft",
  };
  const saved = await request(owner, "PATCH", "/api/site", {
    teamMembers: [visible, hidden],
  });
  assert.equal(saved.statusCode, 200, saved.body);
  const team = await app.inject("/api/public/team");
  assert.equal(team.statusCode, 200, team.body);
  const profiles = team.json().data;
  assert.deepEqual(
    profiles.find((p: any) => p.id === visible.id),
    {
      id: visible.id,
      name: visible.name,
      publicData: {
        title: visible.title,
        bio: visible.bio,
        photo: visible.photo,
        translations: visible.translations,
      },
    },
  );
  assert.deepEqual(
    profiles.find((p: any) => p.id === staff.id),
    { id: staff.id, name: "Profile test", publicData: staffData },
  );
  assert.equal(
    profiles.some((p: any) =>
      [hidden.id, privateStaff.id, inactive.id].includes(p.id),
    ),
    false,
  );
  assert.equal(
    Object.hasOwn(
      (await app.inject("/api/public/site")).json().data,
      "teamMembers",
    ),
    false,
  );
  const privateContent = (await request(owner, "GET", "/api/site")).json().data;
  assert.deepEqual(privateContent.teamMembers, [visible, hidden]);
});

test("team profile validation rejects duplicate IDs, unknown fields/locales and unbounded content", async () => {
  const owner = await account("SUPER_ADMIN", false);
  for (const teamMembers of [
    [profile(), profile()],
    [{ ...profile(), email: "not-a-crm-profile@example.test" }],
    [{ ...profile(), translations: { fr: { name: "Not supported" } } }],
    [{ ...profile(), translations: { en: { role: "SUPER_ADMIN" } } }],
    [{ ...profile(), name: "   " }],
    [{ ...profile(), bio: "x".repeat(6001) }],
    Array.from({ length: 51 }, (_, i) => profile(`member-${i}`)),
  ]) {
    const response = await request(owner, "PATCH", "/api/site", {
      teamMembers,
    });
    assert.equal(response.statusCode, 400, response.body);
    assert.equal(response.json().error.code, "VALIDATION");
  }
});

test("a hidden team portrait is private and becomes public only while its profile is visible", async () => {
  const owner = await account("SUPER_ADMIN", false);
  const bytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const upload = await request(owner, "POST", "/api/uploads", {
    name: "portrait-test.png",
    mime: "image/png",
    file: bytes.toString("base64"),
    purpose: "PROFILE",
  });
  assert.equal(upload.statusCode, 200, upload.body);
  const media = upload.json().data;
  const member = {
    ...profile(`${prefix}-portrait`),
    photo: media.url,
    visible: false,
  };
  const save = async () => {
    const response = await request(owner, "PATCH", "/api/site", {
      teamMembers: [member],
    });
    assert.equal(response.statusCode, 200, response.body);
  };
  await save();
  assert.equal((await app.inject(media.url)).statusCode, 404);
  assert.equal(
    (await request(owner, "GET", `/api/uploads/${media.id}`)).statusCode,
    200,
  );
  member.visible = true;
  await save();
  const publicPhoto = await app.inject(media.url);
  assert.equal(publicPhoto.statusCode, 200, publicPhoto.body);
  assert.equal(publicPhoto.headers["content-type"], "image/png");
  assert.deepEqual(publicPhoto.rawPayload, bytes);
  member.visible = false;
  await save();
  assert.equal((await app.inject(media.url)).statusCode, 404);
});
