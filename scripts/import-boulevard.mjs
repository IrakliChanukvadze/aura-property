import { PrismaClient } from "@prisma/client";
import { readFile, writeFile, mkdir } from "node:fs/promises";
const db = new PrismaClient();
const snapshot = JSON.parse(
  await readFile(
    new URL(
      "../packages/database/prisma/imports/tbilisi-boulevard.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const { project, units } = snapshot;
if (units.length !== 286 || project.buildings.length !== 4)
  throw new Error("Unexpected import size");
const local = new URL("../.local/imports/", import.meta.url);
await mkdir(local, { recursive: true });
const before = await db.project.findMany({ include: { units: true } });
await writeFile(
  new URL(`aura-inventory-before-${Date.now()}.json`, local),
  JSON.stringify(before, null, 2),
);
try {
  await db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(481529)`;
      const replacing = before
        .filter((p) => p.id !== project.id)
        .map((p) => p.id);
      const replacingUnits = (
        await tx.unit.findMany({
          where: { projectId: { in: replacing } },
          select: { id: true },
        })
      ).map((u) => u.id);
      if (
        (await tx.sale.count({ where: { unitId: { in: replacingUnits } } })) ||
        (await tx.reservation.count({
          where: { unitId: { in: replacingUnits } },
        }))
      )
        throw new Error(
          "Existing sale/reservation protects old inventory: replacement aborted",
        );
      await tx.project.upsert({
        where: { id: project.id },
        create: project,
        update: project,
      });
      for (const unit of units)
        await tx.unit.upsert({
          where: { id: unit.id },
          create: { ...unit, projectId: project.id },
          update: { ...unit, projectId: project.id },
        });
      await tx.unit.deleteMany({ where: { projectId: { in: replacing } } });
      await tx.project.deleteMany({ where: { id: { in: replacing } } });
    },
    { timeout: 60000 },
  );
  const saved = await db.project.findUniqueOrThrow({
    where: { id: project.id },
    include: { units: true },
  });
  if (saved.units.length !== units.length)
    throw new Error("Imported count mismatch");
  console.log(
    JSON.stringify({
      project: saved.slug,
      projects: await db.project.count(),
      units: saved.units.length,
      statuses: saved.units.reduce(
        (a, u) => ((a[u.status] = (a[u.status] || 0) + 1), a),
        {},
      ),
    }),
  );
} finally {
  await db.$disconnect();
}
