/** First-launch transfer only. No users, CRM data, financial records or secrets. */
import { PrismaClient, Prisma } from "@prisma/client";
import { z } from "zod";
import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, realpath } from "node:fs/promises";
import { dirname, resolve, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseEnv } from "node:util";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";

const root = fileURLToPath(new URL("../", import.meta.url));
const locales = ["en", "ka", "ru", "he"];
const id = z
  .string()
  .min(1)
  .max(150)
  .regex(/^[a-zA-Z0-9_-]+$/);
const point = z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]);
const polygon = z.array(point).refine((p) => p.length === 0 || p.length >= 3);
const image = z
  .string()
  .max(2000)
  .refine(
    (s) =>
      !s ||
      /^\/images\/[a-zA-Z0-9_./-]+$/.test(s) ||
      /^\/api\/public\/media\/[a-zA-Z0-9_-]+$/.test(s),
    "Images must be local /images assets or referenced public Media",
  );
const decimal = z.string().regex(/^\d+(\.\d{1,2})?$/);
const copy = (fields) =>
  z.record(
    z.enum(locales),
    z
      .object(
        Object.fromEntries(
          fields.map((k) => [k, z.string().max(10000).optional()]),
        ),
      )
      .extend({
        reviewed: z.boolean().optional(),
        fallbackLocale: z.enum(locales).optional(),
      })
      .strict(),
  );
const pick = (value, keys) =>
  Object.fromEntries(
    keys.filter((k) => Object.hasOwn(value ?? {}, k)).map((k) => [k, value[k]]),
  );
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
class ContentTransferError extends Error {}
const assert = (ok, message) => {
  if (!ok) throw new ContentTransferError(message);
};
const floorSchema = z
  .object({ id, number: z.number().int(), image, polygon })
  .strict();
const buildingSchema = z
  .object({
    id,
    name: z.string().min(1),
    coverImage: image,
    sourceBlockId: id.optional(),
    floors: z.array(floorSchema).min(1),
  })
  .strict();
const projectSchema = z
  .object({
    id: z.literal("pini-boulevard-copy"),
    slug: z.literal("tbilisi-boulevard"),
    city: z.string(),
    coverImage: image,
    constructionStatus: z.enum(["ONGOING", "COMPLETED"]),
    showPrices: z.boolean(),
    published: z.literal(true),
    translations: copy(["title", "description"]),
    buildings: z.array(buildingSchema).min(1),
    metadata: z
      .object({
        sourceComplexId: id.optional(),
        missingHebrewTranslation: z.boolean().optional(),
        blocks: z
          .array(
            z
              .object({
                id,
                name: z.string(),
                polygon,
                buildingIds: z.array(id).min(1),
              })
              .strict(),
          )
          .min(1),
      })
      .strict(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();
const unitSchema = z
  .object({
    id,
    projectId: z.literal("pini-boulevard-copy"),
    buildingId: id,
    floorId: id,
    number: z.string().min(1),
    area: decimal,
    bedrooms: z.number().int().nonnegative(),
    polygon,
    status: z.enum(["AVAILABLE", "RESERVED", "SOLD"]),
    price: decimal,
    priceCurrency: z.enum(["USD", "GEL"]),
    priceMode: z.enum(["TOTAL", "PER_M2"]),
    showPrice: z.boolean(),
    details: z
      .object({
        photos: z.array(image).optional(),
        areaKnown: z.boolean().optional(),
        roomsKnown: z.boolean().optional(),
        priceKnown: z.boolean().optional(),
        balcony: z
          .union([z.number(), z.string(), z.boolean(), z.null()])
          .optional(),
        orientation: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
      })
      .strict(),
  })
  .strict();
const teamSchema = z
  .object({
    id,
    name: z.string(),
    title: z.string(),
    bio: z.string(),
    photo: image,
    visible: z.literal(true),
    translations: z
      .record(
        z.enum(locales),
        z
          .object({
            name: z.string().optional(),
            title: z.string().optional(),
            bio: z.string().optional(),
          })
          .strict(),
      )
      .optional(),
  })
  .strict();
const siteFields = [
  "heroEyebrow",
  "hero",
  "heroBody",
  "agencyTitle",
  "agencyBody",
  "aboutTitle",
  "aboutIntro",
  "service1",
  "service1Body",
  "service2",
  "service2Body",
  "service3",
  "service3Body",
  "contactTitle",
  "contactPage",
  "contactBody",
  "privacyNotice",
];
const siteSchema = z
  .object({
    phone: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().optional(),
    heroImage: image.optional(),
    aboutImage: image.optional(),
    heroVariant: z.enum(["cityscape", "collage"]).optional(),
    teamMembers: z.array(teamSchema).optional(),
    translations: z
      .record(
        z.enum(locales),
        z
          .object(
            Object.fromEntries(
              siteFields.map((k) => [k, z.string().optional()]),
            ),
          )
          .strict(),
      )
      .optional(),
  })
  .strict();
const postSchema = z
  .object({
    id,
    slug: z.string().regex(/^[a-z0-9-]+$/),
    coverImage: image.nullable(),
    translations: copy(["title", "body"]),
    published: z.literal(true),
    publishedAt: z.string().datetime().nullable(),
    updatedAt: z.string().datetime(),
  })
  .strict();
const assetSchema = z
  .object({
    url: image,
    size: z.number().int().positive(),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
const mediaSchema = z
  .object({
    id,
    purpose: z.enum(["PROJECT", "BLOG", "PROFILE"]),
    name: z.string(),
    mime: z.enum(["image/png", "image/jpeg", "image/webp"]),
    size: z.number().int().positive().max(10000000),
    path: z.string().regex(/^[a-zA-Z0-9_-]+\.(png|jpg|webp)$/),
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
const snapshotSchema = z
  .object({
    format: z.literal("aura-public-content-v1"),
    exportedAt: z.string().datetime(),
    sourceFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    project: projectSchema,
    units: z.array(unitSchema).min(1),
    siteContent: siteSchema,
    posts: z.array(postSchema),
    assets: z.array(assetSchema),
    media: z.array(mediaSchema),
  })
  .strict();
const contentTables = ["Project", "Unit", "Post", "AgencySettings", "Media"];
// Every current model is checked, including excluded records. Run before owner:init.
const allTables = Prisma.dmmf.datamodel.models.map((m) => m.name);
export function databaseIdentity(url) {
  const parsed = new URL(url);
  assert(
    ["postgres:", "postgresql:"].includes(parsed.protocol),
    "PostgreSQL URL required",
  );
  return {
    name: decodeURIComponent(parsed.pathname.slice(1)),
    fingerprint: hash(
      JSON.stringify([
        parsed.hostname.toLowerCase(),
        parsed.port || "5432",
        parsed.pathname,
        parsed.searchParams.get("schema") || "public",
      ]),
    ),
  };
}
export function sanitizeContent(project, units, site = {}, posts = []) {
  return JSON.parse(
    JSON.stringify({
      project: {
        ...pick(project, [
          "id",
          "slug",
          "city",
          "coverImage",
          "constructionStatus",
          "showPrices",
          "published",
          "translations",
          "createdAt",
          "updatedAt",
        ]),
        translations: Object.fromEntries(
          Object.entries(project.translations).map(([l, t]) => [
            l,
            pick(t, ["title", "description", "reviewed", "fallbackLocale"]),
          ]),
        ),
        buildings: project.buildings.map((b) => ({
          ...pick(b, ["id", "name", "coverImage", "sourceBlockId"]),
          floors: b.floors.map((f) =>
            pick(f, ["id", "number", "image", "polygon"]),
          ),
        })),
        metadata: {
          ...pick(project.metadata, [
            "sourceComplexId",
            "missingHebrewTranslation",
          ]),
          blocks: project.metadata.blocks.map((b) =>
            pick(b, ["id", "name", "polygon", "buildingIds"]),
          ),
        },
      },
      units: units.map((u) => ({
        ...pick(u, [
          "id",
          "projectId",
          "buildingId",
          "floorId",
          "number",
          "bedrooms",
          "polygon",
          "status",
          "priceCurrency",
          "priceMode",
          "showPrice",
        ]),
        area: String(u.area),
        price: String(u.price),
        details: pick(u.details, [
          "photos",
          "areaKnown",
          "roomsKnown",
          "priceKnown",
          "balcony",
          "orientation",
          "description",
        ]),
      })),
      siteContent: {
        ...pick(site, [
          "phone",
          "whatsapp",
          "email",
          "heroImage",
          "aboutImage",
          "heroVariant",
        ]),
        ...(site.translations
          ? {
              translations: Object.fromEntries(
                Object.entries(site.translations)
                  .filter(([l]) => locales.includes(l))
                  .map(([l, t]) => [l, pick(t, siteFields)]),
              ),
            }
          : {}),
        ...(site.teamMembers
          ? {
              teamMembers: site.teamMembers
                .filter((m) => m.visible === true)
                .map((m) => ({
                  ...pick(m, [
                    "id",
                    "name",
                    "title",
                    "bio",
                    "photo",
                    "visible",
                  ]),
                  ...(m.translations
                    ? {
                        translations: Object.fromEntries(
                          Object.entries(m.translations)
                            .filter(([l]) => locales.includes(l))
                            .map(([l, t]) => [
                              l,
                              pick(t, ["name", "title", "bio"]),
                            ]),
                        ),
                      }
                    : {}),
                })),
            }
          : {}),
      },
      posts: posts.map((p) => ({
        ...pick(p, [
          "id",
          "slug",
          "coverImage",
          "published",
          "publishedAt",
          "updatedAt",
        ]),
        translations: Object.fromEntries(
          Object.entries(p.translations).map(([l, t]) => [
            l,
            pick(t, ["title", "body", "reviewed", "fallbackLocale"]),
          ]),
        ),
      })),
    }),
  );
}
function unique(values, label) {
  assert(new Set(values).size === values.length, `Duplicate ${label}`);
}
export function referencedImages(content) {
  const images = [
    content.project.coverImage,
    ...content.project.buildings.flatMap((b) => [
      b.coverImage,
      ...b.floors.map((f) => f.image),
    ]),
    ...content.units.flatMap((u) => u.details.photos ?? []),
    ...content.posts.map((p) => p.coverImage),
    content.siteContent.heroImage,
    content.siteContent.aboutImage,
    ...(content.siteContent.teamMembers ?? []).map((m) => m.photo),
  ];
  // Embedded article/site rich text can also reference uploaded media.
  const embedded =
    JSON.stringify(content).match(/\/api\/public\/media\/[a-zA-Z0-9_-]+/g) ??
    [];
  return [...new Set([...images, ...embedded].filter(Boolean))].sort();
}
export function validateSnapshot(raw) {
  const s = snapshotSchema.parse(raw);
  unique(
    s.units.map((u) => u.id),
    "unit IDs",
  );
  unique(
    s.project.buildings.map((b) => b.id),
    "building IDs",
  );
  const floors = new Map(
    s.project.buildings.flatMap((b) => b.floors.map((f) => [f.id, b.id])),
  );
  unique(
    s.project.buildings.flatMap((b) => b.floors.map((f) => f.id)),
    "floor IDs",
  );
  for (const u of s.units)
    assert(
      floors.get(u.floorId) === u.buildingId,
      "Apartment floor/building mismatch",
    );
  const buildings = new Set(s.project.buildings.map((b) => b.id));
  const blockBuildings = s.project.metadata.blocks.flatMap(
    (b) => b.buildingIds,
  );
  unique(blockBuildings, "block/building associations");
  assert(
    blockBuildings.length === buildings.size &&
      blockBuildings.every((i) => buildings.has(i)),
    "Invalid block/building associations",
  );
  unique(
    (s.siteContent.teamMembers ?? []).map((m) => m.id),
    "team profile IDs",
  );
  unique(
    s.posts.map((p) => p.id),
    "article IDs",
  );
  unique(
    s.posts.map((p) => p.slug),
    "article slugs",
  );
  for (const p of s.posts) {
    assert(
      p.slug !== "buying-in-georgia" && !/^(demo|test|qa)(-|$)/.test(p.slug),
      "Seed/demo articles cannot be migrated",
    );
    assert(
      locales.every(
        (l) =>
          p.translations[l]?.reviewed === true &&
          p.translations[l]?.title &&
          p.translations[l]?.body,
      ),
      "Articles require all four reviewed languages",
    );
  }
  unique(
    s.assets.map((a) => a.url),
    "asset URLs",
  );
  unique(
    s.media.map((m) => m.id),
    "media IDs",
  );
  const expected = referencedImages(s);
  const supplied = [
    ...s.assets.map((a) => a.url),
    ...s.media.map((m) => `/api/public/media/${m.id}`),
  ].sort();
  assert(
    JSON.stringify(expected) === JSON.stringify(supplied),
    "Asset manifest must match only referenced images",
  );
  assert(
    s.assets.every((a) => a.url.startsWith("/images/")),
    "Static assets must be /images paths",
  );
  return s;
}
async function safeFile(base, name) {
  const actualBase = await realpath(base);
  const path = await realpath(resolve(base, name));
  assert(
    path.startsWith(actualBase + sep),
    "Asset resolves outside its allowed directory",
  );
  return readFile(path);
}
export async function checkStaticAssets(snapshot, publicDirectory) {
  for (const a of snapshot.assets) {
    const bytes = await safeFile(publicDirectory, a.url.slice(1));
    assert(
      bytes.length === a.size && hash(bytes) === a.sha256,
      "Static image hash mismatch",
    );
  }
}
export function report(snapshot) {
  const { project: p, units, siteContent, posts, assets, media } = snapshot;
  return {
    project: p.slug,
    buildings: p.buildings.length,
    floors: p.buildings.reduce((n, b) => n + b.floors.length, 0),
    units: units.length,
    statuses: Object.fromEntries(
      ["AVAILABLE", "RESERVED", "SOLD"].map((status) => [
        status,
        units.filter((u) => u.status === status).length,
      ]),
    ),
    teamProfiles: siteContent.teamMembers?.length ?? 0,
    articles: posts.length,
    staticAssets: assets.length,
    staticBytes: assets.reduce((n, a) => n + a.size, 0),
    uploadedMedia: media.length,
    uploadedBytes: media.reduce((n, a) => n + a.size, 0),
    warnings: {
      unreviewedProjectLocales: locales.filter(
        (l) => p.translations[l]?.reviewed !== true,
      ),
      availableWithoutPrice: units.filter(
        (u) => u.status === "AVAILABLE" && u.details.priceKnown === false,
      ).length,
      availableWithoutPolygon: units.filter(
        (u) => u.status === "AVAILABLE" && u.polygon.length < 3,
      ).length,
    },
    excluded: [
      "users",
      "teams",
      "sessions",
      "tokens",
      "customers",
      "leads",
      "sales",
      "reservations",
      "commissions",
      "exchange rates",
      "audit",
      "unreferenced media",
      "minimum prices",
      "draft/seed articles",
    ],
  };
}
export async function exportContent(
  db,
  sourceUrl,
  {
    postSlugs = [],
    publicDirectory = resolve(root, "apps/web/public"),
    uploadDirectory = resolve(root, "apps/api/.data/uploads"),
  } = {},
) {
  const data = await db.$transaction(
    async (tx) => {
      await tx.$executeRaw`SET TRANSACTION READ ONLY`;
      const p = await tx.project.findUnique({
        where: { slug: "tbilisi-boulevard" },
        include: { units: true },
      });
      assert(p?.published, "Approved published Tbilisi Boulevard not found");
      const settings = await tx.agencySettings.findUnique({
        where: { id: "agency" },
      });
      const posts = await tx.post.findMany({
        where: { slug: { in: postSlugs }, published: true },
      });
      assert(
        posts.length === new Set(postSlugs).size,
        "One or more explicitly selected articles are missing or unpublished",
      );
      const content = sanitizeContent(
        p,
        p.units,
        settings?.siteContent ?? {},
        posts,
      );
      const ids = referencedImages(content)
        .filter((u) => u.startsWith("/api/public/media/"))
        .map((u) => u.split("/").pop());
      const media = await tx.media.findMany({ where: { id: { in: ids } } });
      assert(
        media.length === ids.length &&
          media.every((m) => !m.leadId && m.purpose !== "AGREEMENT"),
        "Referenced media is missing or belongs to a customer agreement",
      );
      return { content, media };
    },
    { isolationLevel: "RepeatableRead" },
  );
  const assets = [];
  const media = [];
  for (const url of referencedImages(data.content).filter((u) =>
    u.startsWith("/images/"),
  )) {
    const bytes = await safeFile(publicDirectory, url.slice(1));
    assets.push({ url, size: bytes.length, sha256: hash(bytes) });
  }
  for (const m of data.media) {
    const bytes = await safeFile(uploadDirectory, m.path);
    assert(bytes.length === m.size, "Uploaded file size differs from database");
    media.push({
      ...pick(m, ["id", "purpose", "name", "mime", "size", "path"]),
      sha256: hash(bytes),
    });
  }
  return validateSnapshot({
    format: "aura-public-content-v1",
    exportedAt: new Date().toISOString(),
    sourceFingerprint: databaseIdentity(sourceUrl).fingerprint,
    ...data.content,
    assets,
    media,
  });
}
export async function emptyDestination(tx) {
  const counts = {};
  for (const table of allTables)
    counts[table] = await tx[table[0].toLowerCase() + table.slice(1)].count();
  assert(
    Object.values(counts).every((n) => n === 0),
    "Destination is not empty; refuse overwrite. Import before owner:init; never use the local business database.",
  );
  return counts;
}
export async function importContent(
  db,
  raw,
  destinationUrl,
  {
    apply = false,
    confirmDatabase = "",
    verifyMedia = async (media) =>
      assert(
        media.length === 0,
        "Referenced uploads must first be copied to private R2 and hash-verified",
      ),
  } = {},
) {
  const s = validateSnapshot(raw);
  const destination = databaseIdentity(destinationUrl);
  assert(
    destination.fingerprint !== s.sourceFingerprint,
    "Source and destination must be different databases",
  );
  if (apply)
    assert(
      confirmDatabase === destination.name && confirmDatabase.length > 0,
      "Explicit destination database name confirmation required",
    );
  await verifyMedia(s.media);
  return db.$transaction(
    async (tx) => {
      // Block concurrent bootstrap/content writes while validating initial emptiness.
      if (apply)
        await tx.$executeRawUnsafe(
          `LOCK TABLE ${allTables.map((t) => `"${t}"`).join(", ")} IN ACCESS EXCLUSIVE MODE`,
        );
      await emptyDestination(tx);
      if (!apply) return { dryRun: true, destinationEmpty: true, ...report(s) };
      await tx.project.create({ data: s.project });
      await tx.unit.createMany({ data: s.units });
      if (s.posts.length) await tx.post.createMany({ data: s.posts });
      await tx.agencySettings.create({
        data: { id: "agency", siteContent: s.siteContent },
      });
      if (s.media.length)
        await tx.media.createMany({
          data: s.media.map(({ sha256, ...m }) => ({
            ...m,
            ownerId: "public-content-migration",
          })),
        });
      assert(
        (await tx.project.count()) === 1 &&
          (await tx.unit.count()) === s.units.length &&
          (await tx.post.count()) === s.posts.length &&
          (await tx.media.count()) === s.media.length,
        "Imported count mismatch",
      );
      for (const table of allTables.filter((t) => !contentTables.includes(t)))
        assert(
          (await tx[table[0].toLowerCase() + table.slice(1)].count()) === 0,
          "Unexpected non-content record",
        );
      return { applied: true, ...report(s) };
    },
    { isolationLevel: "Serializable", timeout: 120000, maxWait: 10000 },
  );
}
async function verifyR2(media, env) {
  if (!media.length) return;
  assert(
    [
      "R2_ACCOUNT_ID",
      "R2_ACCESS_KEY_ID",
      "R2_SECRET_ACCESS_KEY",
      "R2_BUCKET",
    ].every((k) => env[k]),
    "R2 configuration required to verify referenced media",
  );
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
  for (const m of media) {
    const item = await client.send(
      new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: m.path }),
      { abortSignal: AbortSignal.timeout(15000) },
    );
    assert(
      item.ContentLength === m.size && item.ContentType === m.mime,
      "R2 object metadata mismatch",
    );
    const bytes = await item.Body.transformToByteArray();
    assert(hash(bytes) === m.sha256, "R2 object checksum mismatch");
  }
  client.destroy();
}
async function main() {
  const [command, ...args] = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    assert(args[i].startsWith("--"), "Expected a named option");
    const key = args[i].slice(2);
    assert(!Object.hasOwn(options, key), "Duplicate option");
    options[key] = ["apply"].includes(key) ? true : args[++i];
  }
  assert(
    ["export", "import"].includes(command),
    "Usage: public-content.mjs export --source-env .env [--out .local/public-content.json] | import --destination-env PATH --input PATH [--apply --confirm-empty-database NAME]",
  );
  const allowed =
    command === "export"
      ? ["source-env", "out", "post-slugs", "public-dir", "upload-dir"]
      : [
          "destination-env",
          "input",
          "apply",
          "confirm-empty-database",
          "public-dir",
        ];
  assert(
    Object.keys(options).every((k) => allowed.includes(k)),
    "Unknown option",
  );
  const envFile =
    options[command === "export" ? "source-env" : "destination-env"];
  assert(typeof envFile === "string", "Explicit environment file required");
  const env = parseEnv(await readFile(envFile, "utf8"));
  assert(env.DATABASE_URL, "Database configuration missing");
  const db = new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
  });
  try {
    if (command === "export") {
      const snapshot = await exportContent(db, env.DATABASE_URL, {
        postSlugs: options["post-slugs"]?.split(",").filter(Boolean),
        publicDirectory: options["public-dir"],
        uploadDirectory: options["upload-dir"],
      });
      if (options.out) {
        const out = resolve(options.out);
        assert(
          relative(root, out).startsWith(".local" + sep),
          "Export output must be under the gitignored .local directory",
        );
        await mkdir(dirname(out), { recursive: true, mode: 0o700 });
        await writeFile(out, JSON.stringify(snapshot, null, 2) + "\n", {
          flag: "wx",
          mode: 0o600,
        });
      }
      console.log(
        JSON.stringify(
          {
            dryRun: !options.out,
            snapshotWritten: Boolean(options.out),
            ...report(snapshot),
          },
          null,
          2,
        ),
      );
    } else {
      assert(typeof options.input === "string", "Input snapshot required");
      const snapshot = validateSnapshot(
        JSON.parse(await readFile(options.input, "utf8")),
      );
      await checkStaticAssets(
        snapshot,
        options["public-dir"] ?? resolve(root, "apps/web/public"),
      );
      console.log(
        JSON.stringify(
          await importContent(db, snapshot, env.DATABASE_URL, {
            apply: options.apply === true,
            confirmDatabase: options["confirm-empty-database"],
            verifyMedia: (media) => verifyR2(media, env),
          }),
          null,
          2,
        ),
      );
    }
  } finally {
    await db.$disconnect();
  }
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
)
  main().catch((error) => {
    console.error(
      error instanceof ContentTransferError
        ? `Public content transfer stopped: ${error.message}`
        : "Public content transfer stopped safely. Check the explicit database, approved snapshot schema, local image hashes and referenced R2 objects. No credentials are logged.",
    );
    process.exitCode = 1;
  });
