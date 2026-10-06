import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, requireAdmin, content } from "./db.js";
import { authenticate } from "./auth.js";
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
    const settings = await db.agencySettings.upsert({
      where: { id: "agency" },
      create: { id: "agency", siteContent: values },
      update: { siteContent: values },
    });
    await db.audit.create({
      data: { actorId: req.actor.id, action: "WEBSITE_CONTENT", data: values },
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
