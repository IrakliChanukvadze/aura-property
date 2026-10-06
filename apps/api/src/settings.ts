import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, requireAdmin } from "./db.js";
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
