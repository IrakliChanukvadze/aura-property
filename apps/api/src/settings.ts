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

const teamTranslation = z
  .object({
    name: z.string().trim().max(200).optional(),
    title: z.string().trim().max(300).optional(),
    bio: z.string().trim().max(6000).optional(),
  })
  .strict();

// Website profiles are editorial content, not CRM users or invitation targets.
export const siteTeamMember = z
  .object({
    id: z
      .string()
      .min(1)
      .max(100)
      .regex(/^[a-zA-Z0-9_-]+$/),
    name: z.string().trim().min(1).max(200),
    title: z.string().trim().max(300),
    bio: z.string().trim().max(6000),
    photo: z.string().trim().max(2000),
    visible: z.boolean(),
    translations: z
      .record(z.enum(["en", "ka", "ru", "he"]), teamTranslation)
      .optional(),
  })
  .strict();
const siteTeamMembers = z
  .array(siteTeamMember)
  .max(50)
  .refine(
    (members) =>
      new Set(members.map((member) => member.id)).size === members.length,
    { message: "Team profile IDs must be unique" },
  );

export function visibleSiteTeamMembers(siteContent: unknown) {
  const stored = isObject(siteContent) ? siteContent.teamMembers : undefined;
  return (Array.isArray(stored) ? stored : []).flatMap((value) => {
    const parsed = siteTeamMember.safeParse(value);
    return parsed.success && parsed.data.visible ? [parsed.data] : [];
  });
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
  app.get("/api/public/site", async () => {
    const stored = (await agencySettings()).siteContent;
    // Only /public/team publishes visible profiles; hidden drafts stay private.
    const { teamMembers: _teamMembers, ...publicContent } = isObject(stored)
      ? stored
      : {};
    return { data: publicContent };
  });
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
        teamMembers: siteTeamMembers.optional(),
        translations: z
          .record(
            z.enum(["en", "ka", "ru", "he"]),
            z.record(z.string().max(10000)),
          )
          .optional(),
      })
      .strict()
      .parse(req.body);
    if (values.teamMembers !== undefined) requireAdmin(req.actor);
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
