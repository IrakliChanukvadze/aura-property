import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, content, requireAdmin, ApiError } from "./db.js";
import { authenticate } from "./auth.js";
const locales = ["ka", "ru", "he", "en"];
function explorerReady(buildings: any) {
  return (
    Array.isArray(buildings) &&
    buildings.length > 0 &&
    buildings.every(
      (b: any) =>
        typeof b.id === "string" &&
        b.coverImage &&
        Array.isArray(b.floors) &&
        b.floors.length > 0 &&
        b.floors.every(
          (f: any) =>
            f.id &&
            f.image &&
            Array.isArray(f.polygon) &&
            f.polygon.length >= 3 &&
            f.polygon.every(
              (p: any) =>
                Array.isArray(p) &&
                p.length === 2 &&
                p.every(
                  (n: any) => typeof n === "number" && n >= 0 && n <= 100,
                ),
            ),
        ),
    )
  );
}
function reviewed(t: any, bodyKey: string) {
  return locales.every(
    (l) =>
      typeof t?.[l]?.title === "string" &&
      t[l].title.trim() &&
      typeof t[l][bodyKey] === "string" &&
      t[l][bodyKey].trim() &&
      t[l].reviewed === true,
  );
}
export function publicProject(p: any, usdGel?: number) {
  const units = p.units ?? [];
  const publishedUnits = units.map(
    ({ minimumPrice, minimumCurrency, ...u }: any) => ({
      ...u,
      showPrice: u.showPrice && p.showPrices !== false,
      price: u.showPrice && p.showPrices !== false ? Number(u.price) : null,
      area: Number(u.area),
    }),
  );
  const buildings = (p.buildings as any[]).map((b) => ({
    ...b,
    floors: (b.floors ?? []).map((f: any) => ({
      ...f,
      units: publishedUnits.filter(
        (u: any) => u.buildingId === b.id && u.floorId === f.id,
      ),
    })),
  }));
  const priced = publishedUnits.filter(
    (u: any) => u.status === "AVAILABLE" && u.showPrice,
  );
  const currencies = new Set(priced.map((u: any) => u.priceCurrency));
  const startCurrency =
    currencies.size === 1 ? priced[0]?.priceCurrency : "USD";
  const normalized = priced.map(
    (u: any) =>
      (u.price * (u.priceMode === "PER_M2" ? u.area : 1)) /
      (currencies.size > 1 && u.priceCurrency === "GEL" ? (usdGel ?? NaN) : 1),
  );
  return {
    ...p,
    units: undefined,
    buildings,
    soldOut: units.length > 0 && units.every((u: any) => u.status === "SOLD"),
    allReserved:
      units.some((u: any) => u.status === "RESERVED") &&
      !units.some((u: any) => u.status === "AVAILABLE"),
    startingPrice:
      normalized.length && normalized.every(Number.isFinite)
        ? Math.min(...normalized)
        : null,
    startingPriceCurrency: startCurrency ?? "USD",
  };
}
const polygon = z.array(
  z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]),
);
// Drafts may be incomplete, but never store structures the explorer cannot read.
const floorBody = z
  .object({
    id: z.string().min(1),
    number: z.number().int().optional(),
    image: z.string().optional(),
    polygon: polygon.optional(),
  })
  .passthrough();
const buildingBody = z
  .object({
    id: z.string().min(1),
    coverImage: z.string().optional(),
    floors: z.array(floorBody).default([]),
  })
  .passthrough();
const projectBody = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  city: z.string().min(1),
  coverImage: z.string().min(1),
  showPrices: z.boolean().default(true),
  constructionStatus: z.enum(["ONGOING", "COMPLETED"]).default("ONGOING"),
  translations: z.record(z.unknown()),
  buildings: z.array(buildingBody).default([]),
  published: z.boolean().default(false),
});
export async function contentRoutes(app: FastifyInstance) {
  app.get("/api/public/projects", async () => {
    const rate = await db.fxRate.findFirst({ orderBy: { date: "desc" } });
    return {
      data: (
        await db.project.findMany({
          where: { published: true },
          include: { units: true },
          orderBy: { createdAt: "asc" },
        })
      ).map((p) => publicProject(p, rate ? Number(rate.usdGel) : undefined)),
    };
  });
  app.get("/api/public/projects/:slug", async (req) => {
    const p = await db.project.findFirst({
      where: { slug: (req.params as any).slug, published: true },
      include: { units: true },
    });
    if (!p) throw new ApiError(404, "NOT_FOUND", "Project not found");
    const rate = await db.fxRate.findFirst({ orderBy: { date: "desc" } });
    return { data: publicProject(p, rate ? Number(rate.usdGel) : undefined) };
  });
  app.get("/api/public/posts", async () => ({
    data: await db.post.findMany({
      where: { published: true },
      orderBy: { publishedAt: "desc" },
    }),
  }));
  app.get("/api/public/posts/:slug", async (req) => {
    const p = await db.post.findFirst({
      where: { slug: (req.params as any).slug, published: true },
    });
    if (!p) throw new ApiError(404, "NOT_FOUND", "Article not found");
    return { data: p };
  });
  app.get("/api/public/exchange-rate", async () => {
    const rate = await db.fxRate.findFirst({ orderBy: { date: "desc" } });
    return {
      data: rate
        ? { usdGel: Number(rate.usdGel), date: rate.date, source: rate.source }
        : null,
    };
  });
  app.get("/api/public/team", async () => ({
    data: await db.user.findMany({
      where: { active: true, publicProfile: true },
      select: { id: true, name: true, publicData: true },
    }),
  }));
  app.get("/api/projects", { preHandler: authenticate }, async (req) => {
    const editable = req.actor.role === "SUPER_ADMIN" || req.actor.contentEdit;
    return {
      data: await db.project.findMany({
        where: editable ? {} : { published: true },
        include: { units: true },
      }),
    };
  });
  app.post("/api/projects", { preHandler: authenticate }, async (req) => {
    content(req.actor);
    const b = projectBody.parse(req.body);
    if (b.published && !reviewed(b.translations, "description"))
      throw new ApiError(
        400,
        "TRANSLATIONS_REQUIRED",
        "Review all four translations before publishing",
      );
    if (b.published)
      throw new ApiError(
        400,
        "DRAFT_FIRST",
        "Create as draft, prepare inventory and explorer, then publish",
      );
    return { data: await db.project.create({ data: b as any }) };
  });
  app.patch("/api/projects/:id", { preHandler: authenticate }, async (req) => {
    content(req.actor);
    const b = projectBody.partial().parse(req.body);
    const existing = await db.project.findUniqueOrThrow({
      where: { id: (req.params as any).id },
    });
    if (
      (b.published ?? existing.published) &&
      !reviewed(b.translations ?? existing.translations, "description")
    )
      throw new ApiError(
        400,
        "TRANSLATIONS_REQUIRED",
        "Review all four translations",
      );
    if (
      (b.published ?? existing.published) &&
      (!explorerReady(b.buildings ?? existing.buildings) ||
        !(await db.unit.count({ where: { projectId: existing.id } })))
    )
      throw new ApiError(
        400,
        "EXPLORER_REQUIRED",
        "Published project needs building/floor images, normalized polygons and apartment inventory",
      );
    return {
      data: await db.project.update({
        where: { id: existing.id },
        data: b as any,
      }),
    };
  });
  app.post(
    "/api/projects/:id/units",
    { preHandler: authenticate },
    async (req) => {
      content(req.actor);
      const b = z
        .object({
          buildingId: z.string(),
          floorId: z.string(),
          number: z.string().min(1),
          area: z.number().positive(),
          bedrooms: z.number().int().nonnegative(),
          polygon: z
            .array(
              z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]),
            )
            .min(3),
          price: z.number().positive(),
          priceCurrency: z.enum(["USD", "GEL"]).default("USD"),
          priceMode: z.enum(["TOTAL", "PER_M2"]).default("TOTAL"),
          showPrice: z.boolean().default(true),
        })
        .parse(req.body);
      const project = await db.project.findUnique({
        where: { id: (req.params as any).id },
      });
      if (!project) throw new ApiError(404, "NOT_FOUND", "Project not found");
      const buildings = project.buildings as any[];
      if (
        !buildings.some(
          (building) =>
            building.id === b.buildingId &&
            building.floors?.some((floor: any) => floor.id === b.floorId),
        )
      )
        throw new ApiError(
          400,
          "INVALID_FLOOR",
          "Choose a floor belonging to this project and building",
        );
      return {
        data: await db.unit.create({
          data: { ...b, projectId: project.id },
        }),
      };
    },
  );
  app.patch("/api/units/:id", { preHandler: authenticate }, async (req) => {
    content(req.actor);
    const b = z
      .object({
        number: z.string().optional(),
        area: z.number().positive().optional(),
        bedrooms: z.number().int().nonnegative().optional(),
        polygon: z
          .array(
            z.tuple([z.number().min(0).max(100), z.number().min(0).max(100)]),
          )
          .min(3)
          .optional(),
        price: z.number().positive().optional(),
        priceCurrency: z.enum(["USD", "GEL"]).optional(),
        priceMode: z.enum(["TOTAL", "PER_M2"]).optional(),
        showPrice: z.boolean().optional(),
        minimumPrice: z.number().positive().nullable().optional(),
        minimumCurrency: z.enum(["USD", "GEL"]).nullable().optional(),
      })
      .strict()
      .parse(req.body);
    if ("minimumPrice" in b || "minimumCurrency" in b) requireAdmin(req.actor);
    return {
      data: await db.unit.update({
        where: { id: (req.params as any).id },
        data: b,
      }),
    };
  });
  app.get("/api/posts", { preHandler: authenticate }, async (req) => {
    content(req.actor);
    return { data: await db.post.findMany({ orderBy: { updatedAt: "desc" } }) };
  });
  const postBody = z.object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    coverImage: z.string().nullable().optional(),
    translations: z.record(z.unknown()),
    published: z.boolean().default(false),
    publishedAt: z.string().datetime().optional(),
  });
  app.post("/api/posts", { preHandler: authenticate }, async (req) => {
    content(req.actor);
    const b = postBody.parse(req.body);
    if (b.published && !reviewed(b.translations, "body"))
      throw new ApiError(
        400,
        "TRANSLATIONS_REQUIRED",
        "Review all four translations",
      );
    return {
      data: await db.post.create({
        data: {
          ...b,
          translations: b.translations as any,
          publishedAt: b.published
            ? new Date(b.publishedAt ?? Date.now())
            : null,
        },
      }),
    };
  });
  app.patch("/api/posts/:id", { preHandler: authenticate }, async (req) => {
    content(req.actor);
    const b = postBody.partial().parse(req.body);
    const p = await db.post.findUniqueOrThrow({
      where: { id: (req.params as any).id },
    });
    if (
      (b.published ?? p.published) &&
      !reviewed(b.translations ?? p.translations, "body")
    )
      throw new ApiError(
        400,
        "TRANSLATIONS_REQUIRED",
        "Review all four translations",
      );
    return {
      data: await db.post.update({
        where: { id: p.id },
        data: {
          ...b,
          translations: b.translations as any,
          publishedAt: b.published
            ? new Date(b.publishedAt ?? p.publishedAt ?? Date.now())
            : b.publishedAt
              ? new Date(b.publishedAt)
              : undefined,
        },
      }),
    };
  });
  app.post("/api/translate", { preHandler: authenticate }, async (req) => {
    content(req.actor);
    const b = z
      .object({
        text: z.string().min(1).max(100000),
        source: z.enum(["ka", "ru", "he", "en"]),
        target: z.enum(["ka", "ru", "he", "en"]),
      })
      .parse(req.body);
    if (!process.env.TRANSLATION_WEBHOOK_URL)
      throw new ApiError(
        503,
        "PROVIDER_REQUIRED",
        "Configure translation provider",
      );
    try {
      const res = await fetch(process.env.TRANSLATION_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.TRANSLATION_WEBHOOK_TOKEN ?? ""}`,
        },
        body: JSON.stringify(b),
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error("Provider rejected request");
      const result = (await res.json()) as any;
      const text = result?.text || result?.translation;
      if (typeof text !== "string" || !text.trim())
        throw new Error("Provider returned no translated text");
      return { data: { text } };
    } catch {
      throw new ApiError(
        502,
        "TRANSLATION_FAILED",
        "Translation provider unavailable or returned an invalid response",
      );
    }
  });

  app.post("/api/fx", { preHandler: authenticate }, async (req) => {
    requireAdmin(req.actor);
    const b = z
      .object({
        date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        usdGel: z.number().positive(),
        source: z.string().min(3),
      })
      .parse(req.body);
    return {
      data: await db.fxRate.upsert({
        where: { date: b.date },
        create: b,
        update: b,
      }),
    };
  });
}
