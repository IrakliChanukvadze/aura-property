import { PrismaClient } from "@prisma/client";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";

const PROJECT_ID = "pini-boulevard-copy";
const PROJECT_SLUG = "tbilisi-boulevard";
const SOURCE_COMPLEX_ID = "63b089e4-8ce6-424e-9022-a02df29f303c";
const snapshotUrl = new URL(
  "../packages/database/prisma/imports/tbilisi-boulevard.json",
  import.meta.url,
);
const inventoryDetails = [
  "id",
  "floor_id",
  "project_id",
  "unit_identifier",
  "rooms",
  "area_m2",
  "price",
  "currency",
  "status",
  "balcony",
  "orientation",
  "description",
  "created_at",
  "updated_at",
  "polygon",
  "floor_number",
  "photos",
  "areaKnown",
  "roomsKnown",
  "priceKnown",
];
// Only public inventory attributes are copied; source account/site configuration
// and any future contact or CRM fields are deliberately excluded.
const sourceProjectFields = [
  "id",
  "parent_complex_id",
  "complex_id",
  "slug",
  "name",
  "name_en",
  "name_ru",
  "description",
  "description_en",
  "description_ru",
  "city",
  "district",
  "address",
  "city_id",
  "district_id",
  "location",
  "cover_image_url",
  "parent_polygon",
  "complex_polygon",
  "label_anchor",
  "display_order",
  "status",
  "created_at",
  "updated_at",
  "total_floors",
  "delivery_date",
  "amenities",
  "footprint",
  "amenity_translations",
];
const floorFields = [
  "id",
  "project_id",
  "floor_number",
  "floor_plan_image_url",
  "created_at",
  "y_top_pct",
  "y_bottom_pct",
  "polygon",
  "unit_count",
  "building_id",
];
const pick = (value, keys) =>
  Object.fromEntries(
    keys
      .filter((key) => Object.hasOwn(value, key))
      .map((key) => [key, value[key]]),
  );
const object = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);
function assert(condition, message) {
  if (!condition) throw new Error(`Boulevard import: ${message}`);
}
function text(value, name) {
  assert(
    typeof value === "string" && value.trim().length > 0,
    `${name} must be a nonempty string`,
  );
}
function unique(set, id, name) {
  text(id, name);
  assert(!set.has(id), `duplicate ${name}: ${id}`);
  set.add(id);
}
function polygon(value, name) {
  assert(
    Array.isArray(value) && (value.length === 0 || value.length >= 3),
    `${name} must be empty or have at least 3 points`,
  );
  assert(
    value.every(
      (p) =>
        Array.isArray(p) &&
        p.length === 2 &&
        p.every(
          (n) =>
            typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100,
        ),
    ),
    `${name} must use finite percentage coordinates`,
  );
}

/** Validate before opening a database connection. Empty source geometry is kept
 * as missing rather than fabricating apartment plans or inventory facts. */
export function validateSnapshot(snapshot) {
  assert(
    object(snapshot) &&
      object(snapshot.project) &&
      Array.isArray(snapshot.units),
    "expected project and units",
  );
  const { project, units } = snapshot;
  assert(
    project.id === PROJECT_ID && project.slug === PROJECT_SLUG,
    "unexpected target project",
  );
  assert(
    project.metadata?.sourceComplexId === SOURCE_COMPLEX_ID &&
      project.metadata?.sourceComplex?.id === SOURCE_COMPLEX_ID,
    "unexpected Pini complex",
  );
  text(project.city, "project city");
  text(project.coverImage, "project cover");
  assert(
    ["ONGOING", "COMPLETED"].includes(project.constructionStatus),
    "invalid construction status",
  );
  assert(
    typeof project.published === "boolean" && object(project.translations),
    "invalid publication or translations",
  );
  assert(
    Array.isArray(project.buildings) &&
      project.buildings.length > 0 &&
      units.length > 0,
    "refusing an empty inventory snapshot",
  );
  assert(
    Array.isArray(project.metadata.blocks) &&
      project.metadata.blocks.length > 0,
    "missing source blocks",
  );
  const buildingIds = new Set();
  const floorIds = new Set();
  const buildings = new Map();
  const floors = new Map();
  for (const b of project.buildings) {
    assert(object(b), "invalid building");
    unique(buildingIds, b.id, "building ID");
    text(b.name, "building name");
    text(b.coverImage, "building cover");
    text(b.sourceBlockId, "source block ID");
    assert(
      Array.isArray(b.floors) && b.floors.length > 0,
      `missing floors for ${b.id}`,
    );
    buildings.set(b.id, b);
    const numbers = new Set();
    for (const f of b.floors) {
      assert(object(f), "invalid floor");
      unique(floorIds, f.id, "floor ID");
      assert(
        Number.isInteger(f.number) && !numbers.has(f.number),
        `invalid or duplicate floor number in ${b.id}`,
      );
      numbers.add(f.number);
      assert(typeof f.image === "string", `invalid floor image for ${f.id}`);
      polygon(f.polygon, `floor polygon ${f.id}`);
      if (f.sourceData) {
        assert(
          f.sourceData.id === f.id &&
            f.sourceData.project_id === b.sourceBlockId,
          `source floor relationship mismatch: ${f.id}`,
        );
        assert(
          f.sourceData.building_id == null || f.sourceData.building_id === b.id,
          `source floor building mismatch: ${f.id}`,
        );
      }
      floors.set(f.id, b.id);
    }
  }
  const blocks = new Set();
  const blockBuildings = new Set();
  for (const b of project.metadata.blocks) {
    assert(object(b), "invalid block");
    unique(blocks, b.id, "block ID");
    text(b.name, "block name");
    polygon(b.polygon, `block polygon ${b.id}`);
    assert(
      Array.isArray(b.buildingIds) && b.buildingIds.length > 0,
      `missing block buildings: ${b.id}`,
    );
    for (const id of b.buildingIds) {
      unique(blockBuildings, id, "block building ID");
      assert(
        buildings.get(id)?.sourceBlockId === b.id,
        `block/building mismatch: ${id}`,
      );
    }
  }
  assert(
    blockBuildings.size === buildingIds.size,
    "every building must belong to one block",
  );
  const unitIds = new Set();
  for (const u of units) {
    assert(object(u), "invalid unit");
    unique(unitIds, u.id, "unit ID");
    assert(
      u.projectId == null || u.projectId === PROJECT_ID,
      `unexpected unit project: ${u.id}`,
    );
    assert(
      buildings.has(u.buildingId) && floors.get(u.floorId) === u.buildingId,
      `unit building/floor mismatch: ${u.id}`,
    );
    text(u.number, "unit number");
    assert(
      typeof u.area === "number" && Number.isFinite(u.area) && u.area >= 0,
      `invalid unit area: ${u.id}`,
    );
    assert(
      Number.isInteger(u.bedrooms) && u.bedrooms >= 0,
      `invalid bedrooms: ${u.id}`,
    );
    assert(
      typeof u.price === "number" && Number.isFinite(u.price) && u.price >= 0,
      `invalid unit price: ${u.id}`,
    );
    assert(
      ["AVAILABLE", "RESERVED", "SOLD"].includes(u.status),
      `invalid unit status: ${u.id}`,
    );
    assert(
      ["USD", "GEL"].includes(u.priceCurrency) &&
        ["TOTAL", "PER_M2"].includes(u.priceMode) &&
        typeof u.showPrice === "boolean",
      `invalid unit price options: ${u.id}`,
    );
    polygon(u.polygon, `unit polygon ${u.id}`);
    assert(
      object(u.details) &&
        u.details.id === u.id &&
        u.details.floor_id === u.floorId &&
        u.details.project_id === buildings.get(u.buildingId).sourceBlockId,
      `source unit relationship mismatch: ${u.id}`,
    );
  }
  return { project, units, buildingIds, floors, blocks };
}

/** Never accept source minimum prices or blindly replace locally owned details. */
export function unitWriteData(unit, existing, protectedStatus = false) {
  return {
    ...pick(unit, [
      "buildingId",
      "floorId",
      "number",
      "area",
      "bedrooms",
      "polygon",
      "status",
      "price",
      "priceCurrency",
      "priceMode",
      "showPrice",
    ]),
    ...(protectedStatus ? { status: existing.status } : {}),
    details: {
      ...(object(existing?.details) ? existing.details : {}),
      ...pick(unit.details, inventoryDetails),
    },
  };
}

function projectWriteData(project, existing) {
  const metadata = project.metadata;
  return {
    ...pick(project, [
      "slug",
      "city",
      "coverImage",
      "constructionStatus",
      "translations",
    ]),
    buildings: project.buildings.map((b) => ({
      ...pick(b, ["id", "name", "coverImage", "sourceBlockId"]),
      floors: b.floors.map((f) => ({
        ...pick(f, ["id", "number", "image", "polygon"]),
        ...(f.sourceData
          ? { sourceData: pick(f.sourceData, floorFields) }
          : {}),
      })),
    })),
    metadata: {
      ...(object(existing?.metadata) ? existing.metadata : {}),
      ...pick(metadata, [
        "source",
        "sourceComplexId",
        "copiedAt",
        "missingHebrewTranslation",
      ]),
      blocks: metadata.blocks.map((b) =>
        pick(b, ["id", "name", "polygon", "buildingIds"]),
      ),
      sourceComplex: pick(metadata.sourceComplex, sourceProjectFields),
      sourceBlocks: (metadata.sourceBlocks ?? []).map((b) =>
        pick(b, sourceProjectFields),
      ),
      sourceImages: (metadata.sourceImages ?? []).map((i) =>
        pick(i, [
          "id",
          "project_id",
          "complex_id",
          "url",
          "image_url",
          "caption",
          "alt",
          "display_order",
          "created_at",
        ]),
      ),
    },
  };
}

export async function importSnapshot(
  db,
  snapshot,
  backupDirectory = new URL("../.local/imports/", import.meta.url),
) {
  const { project, units, floors } = validateSnapshot(snapshot);
  const local = backupDirectory;
  await mkdir(local, { recursive: true, mode: 0o700 });
  const backup = new URL(`aura-boulevard-before-${Date.now()}.json`, local);
  const result = await db.$transaction(
    async (tx) => {
      // Public inquiries use this lock; sales/reservations use the unit locks below.
      // Keeping the same order and not acquiring lead locks avoids CRM lock cycles.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(481529)`;
      await tx.$queryRaw`SELECT id FROM "Project" WHERE id = ${project.id} FOR UPDATE`;
      const initialUnits = await tx.unit.findMany({
        where: { projectId: project.id },
        select: { id: true },
      });
      const allIds = [
        ...new Set([
          ...initialUnits.map((u) => u.id),
          ...units.map((u) => u.id),
        ]),
      ].sort();
      for (const id of allIds)
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${id}))`;
      await tx.$queryRaw`SELECT id FROM "Unit" WHERE "projectId" = ${project.id} FOR UPDATE`;
      const before = await tx.project.findUnique({
        where: { id: project.id },
        include: { units: true },
      });
      const collision = await tx.unit.findFirst({
        where: {
          id: { in: units.map((u) => u.id) },
          projectId: { not: project.id },
        },
        select: { id: true },
      });
      assert(
        !collision,
        `unit ID belongs to another project: ${collision?.id}`,
      );
      const sameSlug = await tx.project.findUnique({
        where: { slug: project.slug },
        select: { id: true },
      });
      assert(
        !sameSlug || sameSlug.id === project.id,
        "target slug belongs to another project",
      );
      if (before)
        assert(
          before.metadata?.sourceComplexId === SOURCE_COMPLEX_ID,
          "existing target has a different source complex",
        );

      const incoming = new Set(units.map((u) => u.id));
      const oldBlocks = new Set(
        (before?.buildings ?? []).map((b) => b.sourceBlockId),
      );
      // Retain apartments created only inside Aura. A removed source apartment is
      // identified by source provenance, never just by absence from the new file.
      const stale = (before?.units ?? []).filter(
        (u) =>
          !incoming.has(u.id) &&
          u.details?.id === u.id &&
          oldBlocks.has(u.details?.project_id),
      );
      const staleIds = stale.map((u) => u.id);
      const [sales, reservations, inquiries] = await Promise.all([
        tx.sale.findMany({
          where: { unitId: { in: allIds } },
          select: { unitId: true, reversedAt: true },
        }),
        tx.reservation.findMany({
          where: { unitId: { in: allIds } },
          select: { unitId: true, releasedAt: true },
        }),
        tx.lead.findMany({
          where: { inquiryUnitId: { in: staleIds } },
          select: { inquiryUnitId: true },
        }),
      ]);
      const referenced = new Set([
        ...sales.map((s) => s.unitId),
        ...reservations.map((r) => r.unitId),
        ...inquiries.map((l) => l.inquiryUnitId),
      ]);
      const protectedStale = staleIds.filter((id) => referenced.has(id));
      assert(
        !protectedStale.length,
        `${protectedStale.length} removed source apartments have Aura sale/reservation/inquiry references; import aborted: ${protectedStale.join(", ")}`,
      );
      const staleSet = new Set(staleIds);
      const retainedLocal = (before?.units ?? []).filter(
        (u) => !incoming.has(u.id) && !staleSet.has(u.id),
      );
      for (const u of retainedLocal)
        assert(
          floors.get(u.floorId) === u.buildingId,
          `retained Aura apartment ${u.id} needs a building/floor removed from the source; import aborted`,
        );
      const active = new Set([
        ...sales.filter((s) => !s.reversedAt).map((s) => s.unitId),
        ...reservations.filter((r) => !r.releasedAt).map((r) => r.unitId),
      ]);
      const existing = new Map((before?.units ?? []).map((u) => [u.id, u]));
      const protectedStatusIds = units
        .filter(
          (u) => active.has(u.id) && existing.get(u.id)?.status !== u.status,
        )
        .map((u) => u.id);

      // Snapshot is taken only after inventory locks and is durable before writes.
      // It contains this project's inventory only, never customers or credentials.
      await writeFile(
        backup,
        JSON.stringify(
          { capturedAt: new Date().toISOString(), project: before },
          null,
          2,
        ),
        { mode: 0o600, flag: "wx" },
      );
      const data = projectWriteData(project, before);
      await tx.project.upsert({
        where: { id: project.id },
        create: { id: project.id, ...data, published: project.published },
        update: data, // Aura's publication/showPrices settings remain locally owned.
      });
      for (const unit of units) {
        const previous = existing.get(unit.id);
        const values = unitWriteData(
          unit,
          previous,
          active.has(unit.id) && Boolean(previous),
        );
        await tx.unit.upsert({
          where: { id: unit.id },
          create: { id: unit.id, projectId: project.id, ...values },
          update: values, // Does not touch minimumPrice/minimumCurrency/projectId.
        });
      }
      if (staleIds.length)
        await tx.unit.deleteMany({
          where: { projectId: project.id, id: { in: staleIds } },
        });
      const count = await tx.unit.count({ where: { projectId: project.id } });
      assert(
        count === units.length + retainedLocal.length,
        "imported count mismatch; transaction rolled back",
      );
      return {
        project: project.slug,
        imported: units.length,
        added: units.filter((u) => !existing.has(u.id)).length,
        updated: units.filter((u) => existing.has(u.id)).length,
        removed: staleIds.length,
        retainedLocal: retainedLocal.length,
        protectedStatusIds,
        totalUnits: count,
        backup: fileURLToPath(backup),
      };
    },
    { timeout: 120000, maxWait: 10000 },
  );
  return result;
}

async function main() {
  const snapshot = JSON.parse(await readFile(snapshotUrl, "utf8"));
  const checked = validateSnapshot(snapshot);
  if (process.argv.includes("--validate-only")) {
    console.log(
      JSON.stringify({
        valid: true,
        project: checked.project.slug,
        buildings: checked.buildingIds.size,
        floors: checked.floors.size,
        units: checked.units.length,
      }),
    );
    return;
  }
  const db = new PrismaClient();
  try {
    console.log(JSON.stringify(await importSnapshot(db, snapshot)));
  } finally {
    await db.$disconnect();
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await main();
