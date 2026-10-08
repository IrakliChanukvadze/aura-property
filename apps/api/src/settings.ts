import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db, requireAdmin, content } from "./db.js";
import { authenticate } from "./auth.js";
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Store only overrides. Removing a key lets the website's localized default apply.
function mergeSiteContent(existing: unknown, patch: Record<string, unknown>) {
  const merged = new Map(Object.entries(isObject(existing) ? existing : {}));
  for (const [key, value] of Object.entries(patch)) {
    if (value === "") merged.delete(key);
    else if (isObject(value))
      merged.set(key, mergeSiteContent(merged.get(key), value));
    else if (value !== undefined) merged.set(key, value);
  }
  return Object.fromEntries(merged) as Prisma.InputJsonObject;
}

export async function agencySettings(tx: any = db) {
  return (
    (await tx.agencySettings.findUnique({ where: { id: "agency" } })) ?? {
      defaultAgentRate: 1,
      defaultLeadRate: 0.5,
    }
  );
}
export async function settingsRoutes(app: FastifyInstance) {
  app.get("/api/public/site", async () => ({
    data: (await agencySettings()).siteContent || {},
  }));
  app.get("/api/site", { preHandler: authenticate }, async (req) => {
    content(req.actor);
    return { data: (await agencySettings()).siteContent || {} };
  });
  app.patch("/api/site", { preHandler: authenticate }, async (req) => {
    content(req.actor);
    const values = z
      .object({
        phone: z.string().max(100).optional(),
        whatsapp: z.string().max(100).optional(),
        email: z.string().email().optional().or(z.literal("")),
        heroImage: z.string().max(2000).optional(),
        aboutImage: z.string().max(2000).optional(),
        heroVariant: z.enum(["cityscape", "collage"]).optional(),
        translations: z
          .record(
            z.enum(["en", "ka", "ru", "he"]),
            z.record(z.string().max(10000)),
          )
          .optional(),
      })
      .strict()
      .parse(req.body);
    const settings = await db.$transaction(async (tx) => {
      // Lock before reading, including the first save when no settings row exists.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('agency-site-content'))`;
      const existing = await agencySettings(tx);
      const siteContent = mergeSiteContent(existing.siteContent, values);
      const saved = await tx.agencySettings.upsert({
        where: { id: "agency" },
        create: { id: "agency", siteContent },
        update: { siteContent },
      });
      await tx.audit.create({
        data: {
          actorId: req.actor.id,
          action: "WEBSITE_CONTENT",
          data: values,
        },
      });
      return saved;
    });
    return { data: settings.siteContent };
  });

  app.get("/api/settings", { preHandler: authenticate }, async (req) => {
    requireAdmin(req.actor);
    return { data: await agencySettings() };
  });
  app.patch("/api/settings", { preHandler: authenticate }, async (req) => {
    requireAdmin(req.actor);
    const values = z
      .object({
        defaultAgentRate: z.number().min(0).max(100),
        defaultLeadRate: z.number().min(0).max(100),
      })
      .strict()
      .parse(req.body);
    const result = await db.$transaction(async (tx) => {
      const settings = await tx.agencySettings.upsert({
        where: { id: "agency" },
        create: { id: "agency", ...values },
        update: values,
      });
      await tx.audit.create({
        data: {
          actorId: req.actor.id,
          action: "COMMISSION_DEFAULTS",
          data: values,
        },
      });
      return settings;
    });
    return { data: result };
  });
}
