import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  importSnapshot,
  unitWriteData,
  validateSnapshot,
} from "../import-boulevard.mjs";

const snapshot = JSON.parse(
  await readFile(
    new URL(
      "../../packages/database/prisma/imports/tbilisi-boulevard.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const fixture = () => {
  const next = structuredClone(snapshot);
  next.units = next.units.slice(0, 3);
  return next;
};

// A transaction-isolated fake exercises the actual import flow, including its
// queries and writes. It cannot connect to or mutate the development database.
function memoryDatabase(projects, refs = {}) {
  const db = {
    state: {
      projects: structuredClone(projects),
      sales: refs.sales ?? [],
      reservations: refs.reservations ?? [],
      leads: refs.leads ?? [],
    },
  };
  db.$transaction = async (run) => {
    const draft = structuredClone(db.state);
    const allUnits = () => draft.projects.flatMap((p) => p.units);
    const projectFor = (where) =>
      draft.projects.find((p) =>
        where.id ? p.id === where.id : p.slug === where.slug,
      );
    const tx = {
      $executeRaw: async () => 0,
      $queryRaw: async () => [],
      project: {
        findUnique: async ({ where }) =>
          structuredClone(projectFor(where) ?? null),
        upsert: async ({ where, create, update }) => {
          const p = projectFor(where);
          if (p) Object.assign(p, structuredClone(update));
          else draft.projects.push({ ...structuredClone(create), units: [] });
        },
      },
      unit: {
        findMany: async ({ where }) =>
          allUnits()
            .filter((u) => u.projectId === where.projectId)
            .map(({ id }) => ({ id })),
        findFirst: async ({ where }) =>
          allUnits().find(
            (u) =>
              where.id.in.includes(u.id) && u.projectId !== where.projectId.not,
          ) ?? null,
        upsert: async ({ where, create, update }) => {
          const unit = allUnits().find((u) => u.id === where.id);
          if (unit) Object.assign(unit, structuredClone(update));
          else
            projectFor({ id: create.projectId }).units.push(
              structuredClone(create),
            );
        },
        deleteMany: async ({ where }) => {
          const p = projectFor({ id: where.projectId });
          p.units = p.units.filter((u) => !where.id.in.includes(u.id));
        },
        count: async ({ where }) =>
          allUnits().filter((u) => u.projectId === where.projectId).length,
      },
      sale: {
        findMany: async ({ where }) =>
          draft.sales.filter((s) => where.unitId.in.includes(s.unitId)),
      },
      reservation: {
        findMany: async ({ where }) =>
          draft.reservations.filter((r) => where.unitId.in.includes(r.unitId)),
      },
      lead: {
        findMany: async ({ where }) =>
          draft.leads.filter((l) =>
            where.inquiryUnitId.in.includes(l.inquiryUnitId),
          ),
      },
    };
    const result = await run(tx);
    db.state = draft;
    return result;
  };
  return db;
}
function storedProject(source, units = source.units) {
  return {
    ...structuredClone(source.project),
    units: units.map((u) => ({
      ...structuredClone(u),
      projectId: source.project.id,
    })),
  };
}
async function backupDirectory(t) {
  const directory = await mkdtemp(join(tmpdir(), "aura-boulevard-test-"));
  t.after(() => rm(directory, { recursive: true, force: true }));
  return { directory, url: pathToFileURL(`${directory}/`) };
}

test("snapshot rejects wrong targets, duplicate identities and broken geometry/relationships", () => {
  assert.equal(validateSnapshot(snapshot).units.length, snapshot.units.length);
  const cases = [
    [
      (s) => {
        s.project.slug = "other-project";
      },
      /unexpected target/,
    ],
    [
      (s) => {
        s.project.metadata.sourceComplexId = "other-complex";
      },
      /unexpected Pini complex/,
    ],
    [
      (s) => {
        s.units.push(s.units[0]);
      },
      /duplicate unit ID/,
    ],
    [
      (s) => {
        s.units[0].floorId = "foreign-floor";
      },
      /building\/floor mismatch/,
    ],
    [
      (s) => {
        s.units[0].details.project_id = "foreign-block";
      },
      /source unit relationship/,
    ],
    [
      (s) => {
        s.project.metadata.blocks[0].buildingIds.push(
          s.project.metadata.blocks[0].buildingIds[0],
        );
      },
      /duplicate block building/,
    ],
    [
      (s) => {
        s.units = [];
      },
      /empty inventory/,
    ],
    [
      (s) => {
        s.units[0].polygon = [
          [0, 0],
          [1, 1],
          [101, 2],
        ];
      },
      /percentage coordinates/,
    ],
    [
      (s) => {
        s.units[0].price = -1;
      },
      /unit price/,
    ],
  ];
  for (const [change, message] of cases) {
    const source = fixture();
    change(source);
    assert.throws(() => validateSnapshot(source), message);
  }
});

test("source writes exclude private money/contact fields and keep local details", () => {
  const incoming = {
    ...snapshot.units[0],
    status: "AVAILABLE",
    minimumPrice: 1,
    minimumCurrency: "USD",
    details: {
      ...snapshot.units[0].details,
      customerEmail: "do-not-import@example.test",
    },
  };
  const existing = {
    status: "SOLD",
    minimumPrice: 50000,
    minimumCurrency: "GEL",
    details: { localFlag: "keep" },
  };
  const data = unitWriteData(incoming, existing, true);
  assert.equal(data.status, "SOLD");
  assert.equal(data.details.localFlag, "keep");
  for (const key of ["minimumPrice", "minimumCurrency", "projectId"])
    assert.equal(Object.hasOwn(data, key), false);
  assert.equal(Object.hasOwn(data.details, "customerEmail"), false);
  assert.equal(unitWriteData(incoming, existing, false).status, "AVAILABLE");
});

test("refresh only writes its project, retains local units and settings, and backs up before changing inventory", async (t) => {
  const source = fixture();
  const old = storedProject(source, source.units.slice(0, 2));
  old.published = false;
  old.showPrices = false;
  old.metadata.localSetting = "keep";
  old.units[0].price = 123;
  old.units.push({
    ...structuredClone(old.units[0]),
    id: "aura-only-apartment",
    details: { localOnly: true },
  });
  const foreign = {
    id: "unrelated-project",
    slug: "unrelated",
    units: [
      {
        id: "foreign-unit",
        projectId: "unrelated-project",
        status: "AVAILABLE",
      },
    ],
  };
  const db = memoryDatabase([old, foreign]);
  const { url } = await backupDirectory(t);
  const result = await importSnapshot(db, source, url);
  assert.equal(result.added, 1);
  assert.equal(result.retainedLocal, 1);
  assert.equal(result.totalUnits, 4);
  assert.deepEqual(db.state.projects[1], foreign);
  assert.equal(db.state.projects[0].published, false);
  assert.equal(db.state.projects[0].showPrices, false);
  assert.equal(db.state.projects[0].metadata.localSetting, "keep");
  const backup = JSON.parse(await readFile(result.backup, "utf8"));
  assert.deepEqual(backup.project, old);
  assert.equal((await stat(result.backup)).mode & 0o777, 0o600);
  assert.equal(JSON.stringify(backup).includes("unrelated-project"), false);
});

test("active Aura sales/reservations preserve unit status and minimum prices", async (t) => {
  const source = fixture();
  source.units[0].status = "AVAILABLE";
  source.units[1].status = "AVAILABLE";
  const old = storedProject(source);
  old.units[0].status = "SOLD";
  old.units[1].status = "RESERVED";
  old.units[0].minimumPrice = 72000;
  old.units[0].minimumCurrency = "USD";
  old.units[0].details.localReview = "keep";
  const db = memoryDatabase([old], {
    sales: [{ unitId: old.units[0].id, reversedAt: null }],
    reservations: [{ unitId: old.units[1].id, releasedAt: null }],
  });
  const { url } = await backupDirectory(t);
  const result = await importSnapshot(db, source, url);
  assert.deepEqual(
    result.protectedStatusIds,
    source.units.slice(0, 2).map((u) => u.id),
  );
  const saved = db.state.projects[0].units;
  assert.equal(saved[0].status, "SOLD");
  assert.equal(saved[1].status, "RESERVED");
  assert.equal(saved[0].minimumPrice, 72000);
  assert.equal(saved[0].minimumCurrency, "USD");
  assert.equal(saved[0].details.localReview, "keep");
});

test("stale source apartment is deleted only when no Aura references exist", async (t) => {
  const source = fixture();
  const old = storedProject(source, [...source.units, snapshot.units[3]]);
  const db = memoryDatabase([old]);
  const { url } = await backupDirectory(t);
  const result = await importSnapshot(db, source, url);
  assert.equal(result.removed, 1);
  assert.deepEqual(
    db.state.projects[0].units.map((u) => u.id),
    source.units.map((u) => u.id),
  );
});

for (const kind of ["sales", "reservations", "leads"]) {
  test(`stale ${kind} reference blocks deletion and rolls back the refresh`, async (t) => {
    const source = fixture();
    const old = storedProject(source, [...source.units, snapshot.units[3]]);
    const id = snapshot.units[3].id;
    const references = {
      sales: [{ unitId: id, reversedAt: "2026-10-01" }],
      reservations: [{ unitId: id, releasedAt: "2026-10-01" }],
      leads: [{ inquiryUnitId: id }],
    };
    const db = memoryDatabase([old], { [kind]: references[kind] });
    const before = structuredClone(db.state);
    const { directory, url } = await backupDirectory(t);
    await assert.rejects(
      importSnapshot(db, source, url),
      /removed source apartments have Aura sale\/reservation\/inquiry references/,
    );
    assert.deepEqual(db.state, before);
    assert.deepEqual(await readdir(directory), []);
  });
}

test("incoming unit identity cannot overwrite a different project's inventory", async (t) => {
  const source = fixture();
  const foreign = {
    id: "unrelated-project",
    slug: "unrelated",
    units: [{ ...source.units[0], projectId: "unrelated-project" }],
  };
  const db = memoryDatabase([foreign]);
  const { url } = await backupDirectory(t);
  await assert.rejects(
    importSnapshot(db, source, url),
    /unit ID belongs to another project/,
  );
  assert.deepEqual(db.state.projects, [foreign]);
});

test("local apartment whose floor is absent aborts instead of becoming orphaned", async (t) => {
  const source = fixture();
  const old = storedProject(source);
  old.units.push({
    ...old.units[0],
    id: "local-apartment",
    floorId: "removed-floor",
    details: {},
  });
  const db = memoryDatabase([old]);
  const { url } = await backupDirectory(t);
  await assert.rejects(
    importSnapshot(db, source, url),
    /retained Aura apartment .* needs a building\/floor removed/,
  );
  assert.deepEqual(db.state.projects, [old]);
});
