import test from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { createHash } from "node:crypto";
import {
  mkdtemp,
  mkdir,
  writeFile,
  symlink,
  rm,
  readFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  sanitizeContent,
  validateSnapshot,
  databaseIdentity,
  checkStaticAssets,
  importContent,
  emptyDestination,
  report,
} from "./public-content.mjs";
const raw = JSON.parse(
  await readFile(
    new URL(
      "../packages/database/prisma/imports/tbilisi-boulevard.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const bytes = Buffer.from("fake local image fixture");
const digest = createHash("sha256").update(bytes).digest("hex");
function fixture() {
  const source = structuredClone(raw);
  source.project.showPrices = true;
  source.project.createdAt = new Date("2026-10-08");
  source.project.updatedAt = new Date("2026-10-08");
  source.project.coverImage = "/images/test.png";
  for (const b of source.project.buildings) {
    b.coverImage = "/images/test.png";
    for (const f of b.floors) f.image = "/images/test.png";
  }
  const units = source.units
    .slice(0, 3)
    .map((u) => ({
      ...u,
      projectId: source.project.id,
      details: { ...u.details, photos: [] },
    }));
  return {
    format: "aura-public-content-v1",
    exportedAt: new Date().toISOString(),
    sourceFingerprint: databaseIdentity(
      "postgresql://test:test@source.invalid/source",
    ).fingerprint,
    ...sanitizeContent(source.project, units, {}, []),
    assets: [{ url: "/images/test.png", size: bytes.length, sha256: digest }],
    media: [],
  };
}
test("allowlist excludes CRM, minimum prices, source account fields and hidden team profiles", () => {
  const s = structuredClone(raw);
  const p = {
    ...s.project,
    showPrices: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    passwordHash: "SECRET",
  };
  p.metadata.account = { email: "SECRET" };
  p.buildings[0].sourceData = { password: "SECRET" };
  const units = s.units
    .slice(0, 1)
    .map((u) => ({
      ...u,
      projectId: p.id,
      minimumPrice: 500,
      minimumCurrency: "USD",
      customer: { name: "SECRET" },
      details: { ...u.details, phone: "SECRET", leadId: "SECRET" },
    }));
  const out = sanitizeContent(p, units, {
    defaultAgentRate: 5,
    secret: "SECRET",
    teamMembers: [
      { id: "hidden", visible: false, name: "SECRET" },
      {
        id: "visible",
        name: "Member",
        title: "Agent",
        bio: "Bio",
        photo: "/images/test.png",
        visible: true,
        email: "SECRET",
      },
    ],
    translations: { en: { hero: "Welcome", password: "SECRET" } },
  });
  assert.equal(JSON.stringify(out).includes("SECRET"), false);
  assert.equal(out.units[0].minimumPrice, undefined);
  assert.equal(out.siteContent.defaultAgentRate, undefined);
  assert.equal(out.siteContent.teamMembers.length, 1);
  assert.equal(out.siteContent.translations.en.hero, "Welcome");
});
test("valid inventory maintains IDs, geometry, statuses and nonreviewed language state", () => {
  const s = fixture();
  s.project.translations.he.reviewed = false;
  s.project.translations.he.fallbackLocale = "en";
  const checked = validateSnapshot(s);
  assert.equal(checked.units[0].id, raw.units[0].id);
  assert.deepEqual(checked.units[0].polygon, raw.units[0].polygon);
  assert.equal(
    report(checked).warnings.unreviewedProjectLocales.includes("he"),
    true,
  );
});
test("rejects unknown top-level, JSON, owner/CRM and media fields", () => {
  for (const mutate of [
    (s) => (s.users = []),
    (s) => (s.project.metadata.customer = { name: "Private" }),
    (s) => (s.units[0].details.phone = "private"),
    (s) => (s.siteContent.passwordHash = "private"),
    (s) =>
      s.media.push({
        id: "private",
        ownerId: "demo",
        leadId: "private",
        purpose: "AGREEMENT",
      }),
  ]) {
    const s = fixture();
    mutate(s);
    assert.throws(() => validateSnapshot(s));
  }
});
test("rejects orphan units, duplicate identities and unreferenced assets", () => {
  for (const mutate of [
    (s) => (s.units[0].floorId = "wrong"),
    (s) => s.units.push(s.units[0]),
    (s) => s.project.metadata.blocks[0].buildingIds.push("unknown"),
    (s) => s.assets.push({ ...s.assets[0], url: "/images/unreferenced.png" }),
  ]) {
    const s = fixture();
    mutate(s);
    assert.throws(() => validateSnapshot(s));
  }
});
test("published demo article is rejected even if accidentally selected", () => {
  const s = fixture();
  s.posts.push({
    id: "seed",
    slug: "buying-in-georgia",
    coverImage: null,
    published: true,
    publishedAt: null,
    updatedAt: new Date().toISOString(),
    translations: { en: { title: "Seed", body: "Seed", reviewed: true } },
  });
  assert.throws(() => validateSnapshot(s), /Seed\/demo/);
});
test("image verification detects changed bytes and symlink escape", async () => {
  const dir = await mkdtemp(join(tmpdir(), "aura-public-assets-"));
  try {
    await mkdir(join(dir, "public", "images"), { recursive: true });
    await writeFile(join(dir, "public", "images", "test.png"), bytes);
    await checkStaticAssets(fixture(), join(dir, "public"));
    await writeFile(join(dir, "public", "images", "test.png"), "changed");
    await assert.rejects(
      checkStaticAssets(fixture(), join(dir, "public")),
      /hash mismatch/,
    );
    await rm(join(dir, "public", "images", "test.png"));
    await writeFile(join(dir, "private.png"), bytes);
    await symlink(
      join(dir, "private.png"),
      join(dir, "public", "images", "test.png"),
    );
    await assert.rejects(
      checkStaticAssets(fixture(), join(dir, "public")),
      /outside/,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
test("refuses source destination reuse regardless of password and missing apply confirmation", async () => {
  const s = fixture();
  await assert.rejects(
    importContent({}, s, "postgresql://test:different@source.invalid/source"),
    /different databases/,
  );
  await assert.rejects(
    importContent({}, s, "postgresql://test:test@dest.invalid/dest", {
      apply: true,
    }),
    /confirmation/,
  );
});
test("any existing table blocks the initial import, including auth and CRM", async () => {
  for (const name of [
    "user",
    "session",
    "customer",
    "lead",
    "sale",
    "reservation",
    "project",
    "agencySettings",
  ]) {
    const db = new Proxy(
      {},
      { get: (_, key) => ({ count: async () => (key === name ? 1 : 0) }) },
    );
    await assert.rejects(emptyDestination(db), /not empty/);
  }
});
test(
  "real empty database: dry run does not write, apply is atomic, subsequent import refuses",
  { skip: !process.env.PUBLIC_CONTENT_TEST_DATABASE_URL },
  async () => {
    const url = process.env.PUBLIC_CONTENT_TEST_DATABASE_URL;
    assert.match(
      databaseIdentity(url).name,
      /^aura_public_content_test_[a-z0-9_]+$/,
    );
    const db = new PrismaClient({ datasources: { db: { url } } });
    try {
      const s = fixture();
      assert.equal((await importContent(db, s, url)).dryRun, true);
      assert.equal(await db.project.count(), 0);
      await db.$executeRawUnsafe(
        `CREATE FUNCTION reject_content_test() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'deliberate import failure'; END $$`,
      );
      await db.$executeRawUnsafe(
        `CREATE TRIGGER reject_content_test BEFORE INSERT ON "AgencySettings" FOR EACH ROW EXECUTE FUNCTION reject_content_test()`,
      );
      await assert.rejects(
        importContent(db, s, url, {
          apply: true,
          confirmDatabase: databaseIdentity(url).name,
        }),
      );
      assert.equal(await db.project.count(), 0);
      assert.equal(await db.unit.count(), 0);
      await db.$executeRawUnsafe(
        `DROP TRIGGER reject_content_test ON "AgencySettings"`,
      );
      await db.$executeRawUnsafe(`DROP FUNCTION reject_content_test()`);
      const result = await importContent(db, s, url, {
        apply: true,
        confirmDatabase: databaseIdentity(url).name,
      });
      assert.equal(result.applied, true);
      assert.equal(await db.unit.count(), s.units.length);
      assert.equal(await db.user.count(), 0);
      assert.equal(await db.customer.count(), 0);
      assert.equal(await db.lead.count(), 0);
      assert.equal(await db.sale.count(), 0);
      assert.equal(await db.token.count(), 0);
      const actual = await db.project.findUnique({
        where: { id: s.project.id },
      });
      assert.deepEqual(actual.buildings, s.project.buildings);
      assert.deepEqual(actual.metadata, s.project.metadata);
      await assert.rejects(
        importContent(db, s, url, {
          apply: true,
          confirmDatabase: databaseIdentity(url).name,
        }),
        /not empty/,
      );
      assert.equal(await db.unit.count(), s.units.length);
    } finally {
      await db.$disconnect();
    }
  },
);
