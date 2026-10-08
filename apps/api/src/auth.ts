import type { FastifyInstance } from "fastify";
import { agencySettings } from "./settings.js";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import {
  db,
  ApiError,
  requireAdmin,
  teamAuthority,
  type Actor,
  acting,
} from "./db.js";
import { hashPassword, verifyPassword, digest } from "./domain.js";
import { chooseAgent, reassign } from "./routing.js";
import { sendEmail, isDevelopment } from "./adapters.js";
declare module "fastify" {
  interface FastifyRequest {
    actor: Actor;
  }
}
export async function authenticate(req: any) {
  const token = req.cookies.aura_session;
  if (!token) throw new ApiError(401, "UNAUTHENTICATED", "Login required");
  const session = await db.session.findUnique({
    where: { id: digest(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date() || !session.user.active)
    throw new ApiError(401, "UNAUTHENTICATED", "Session expired");
  req.actor = session.user;
  if (
    session.user.role === "EDITOR" &&
    /^\/api\/(leads|sales|reservations|comments|reminders|commissions|leaderboards|dashboard)(\/|$)/.test(
      req.url.split("?")[0],
    )
  )
    throw new ApiError(403, "FORBIDDEN", "Editor role has no CRM access");
}
const usedTokenMessage =
  "This link has already been used. Sign in with your password, or use Forgot password to reset it.";
const safe = (u: any) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  teamId: u.teamId,
  contentEdit: u.contentEdit,
  locale: u.locale,
  active: u.active,
});
export async function authRoutes(app: FastifyInstance) {
  app.post(
    "/api/auth/login",
    { config: { rateLimit: { max: 10, timeWindow: "15 minutes" } } },
    async (req, reply) => {
      const b = z
        .object({ email: z.string().email(), password: z.string() })
        .parse(req.body);
      const u = await db.user.findUnique({
        where: { email: b.email.toLowerCase() },
      });
      if (
        !u?.active ||
        !u.passwordHash ||
        !verifyPassword(b.password, u.passwordHash)
      )
        throw new ApiError(401, "INVALID_LOGIN", "Invalid credentials");
      const token = randomBytes(32).toString("hex");
      await db.session.create({
        data: {
          id: digest(token),
          userId: u.id,
          expiresAt: new Date(Date.now() + 86400000),
        },
      });
      reply.setCookie("aura_session", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 86400,
      });
      return { data: { ...safe(u), actingLead: await acting(u) } };
    },
  );
  app.get("/api/auth/me", { preHandler: authenticate }, async (req) => ({
    data: { ...safe(req.actor), actingLead: await acting(req.actor) },
  }));
  app.post("/api/auth/logout", async (req, reply) => {
    const token = (req.cookies as any).aura_session;
    if (token) await db.session.deleteMany({ where: { id: digest(token) } });
    reply.clearCookie("aura_session", { path: "/" });
    return { data: true };
  });
  app.post("/api/auth/password", { preHandler: authenticate }, async (req) => {
    const b = z
      .object({ currentPassword: z.string(), newPassword: z.string().min(12) })
      .parse(req.body);
    const u = await db.user.findUniqueOrThrow({ where: { id: req.actor.id } });
    if (!u.passwordHash || !verifyPassword(b.currentPassword, u.passwordHash))
      throw new ApiError(400, "INVALID_PASSWORD", "Current password incorrect");
    await db.$transaction([
      db.user.update({
        where: { id: u.id },
        data: { passwordHash: hashPassword(b.newPassword) },
      }),
      db.session.deleteMany({ where: { userId: u.id } }),
    ]);
    return { data: true };
  });
  app.post(
    "/api/auth/recover",
    { config: { rateLimit: { max: 5, timeWindow: "1 hour" } } },
    async (req) => {
      const b = z.object({ email: z.string().email() }).parse(req.body);
      const u = await db.user.findUnique({
        where: { email: b.email.toLowerCase() },
      });
      if (u?.active) {
        const token = randomBytes(32).toString("hex");
        await db.token.create({
          data: {
            hash: digest(token),
            userId: u.id,
            kind: "RECOVERY",
            expiresAt: new Date(Date.now() + 3600000),
          },
        });
        await sendEmail(
          u.email,
          "Reset your Aura password",
          `${process.env.ADMIN_URL ?? "http://localhost:5173"}/accept-invitation?token=${token}`,
        );
      }
      return { data: { message: "If eligible, a recovery email was sent" } };
    },
  );
  app.post("/api/auth/accept-invitation", async (req) => {
    const b = z
      .object({
        token: z.string(),
        password: z.string().min(12),
        locale: z.enum(["en", "ka", "ru", "he"]).optional(),
      })
      .parse(req.body);
    await db.$transaction(async (tx) => {
      const t = await tx.token.findUnique({ where: { hash: digest(b.token) } });
      if (!t)
        throw new ApiError(
          400,
          "INVALID_TOKEN",
          "This link is invalid. Open the complete link from your email, or use Forgot password to request a new one.",
        );
      if (t.usedAt) throw new ApiError(400, "INVALID_TOKEN", usedTokenMessage);
      if (t.expiresAt < new Date())
        throw new ApiError(
          400,
          "INVALID_TOKEN",
          "This link has expired. Use Forgot password to request a new link.",
        );
      const u = await tx.user.findUnique({ where: { id: t.userId } });
      if (!u?.active)
        throw new ApiError(400, "INVALID_TOKEN", "Account unavailable");
      const claimed = await tx.token.updateMany({
        where: { id: t.id, usedAt: null },
        data: { usedAt: new Date() },
      });
      if (!claimed.count)
        throw new ApiError(400, "INVALID_TOKEN", usedTokenMessage);
      await tx.user.update({
        where: { id: u.id },
        data: {
          passwordHash: hashPassword(b.password),
          ...(b.locale ? { locale: b.locale } : {}),
        },
      });
      await tx.session.deleteMany({ where: { userId: u.id } });
    });
    return { data: true };
  });
  app.get("/api/users", { preHandler: authenticate }, async (req) => {
    const u = req.actor;
    const list = await db.user.findMany({
      where:
        u.role === "SUPER_ADMIN"
          ? {}
          : u.role === "TEAM_LEAD" || (await acting(u))
            ? { teamId: u.teamId, active: true }
            : { id: u.id, active: true },
    });
    return {
      data: list.map((u) =>
        req.actor.role === "SUPER_ADMIN"
          ? {
              ...safe(u),
              agentRate: u.agentRate,
              leadRate: u.leadRate,
              publicProfile: u.publicProfile,
              publicData: u.publicData,
              joinedAt: u.joinedAt,
            }
          : safe(u),
      ),
    };
  });
  app.post("/api/users", { preHandler: authenticate }, async (req) => {
    await teamAuthority(req.actor);
    const b = z
      .object({
        name: z.string().min(2),
        email: z.string().email(),
        role: z.enum(["AGENT", "TEAM_LEAD", "EDITOR"]).default("AGENT"),
        teamId: z.string().optional(),
        contentEdit: z.boolean().optional(),
        locale: z.enum(["ka", "ru", "he", "en"]).default("en"),
      })
      .parse(req.body);
    if (
      req.actor.role !== "SUPER_ADMIN" &&
      (b.role !== "AGENT" || b.contentEdit)
    )
      throw new ApiError(403, "FORBIDDEN", "Team leads may create agents only");
    const selectedTeam =
      req.actor.role === "SUPER_ADMIN" ? b.teamId : req.actor.teamId;
    if (b.role === "AGENT" && !selectedTeam)
      throw new ApiError(400, "TEAM_REQUIRED", "Choose a team for the agent");
    if (
      selectedTeam &&
      !(await db.team.findFirst({ where: { id: selectedTeam, active: true } }))
    )
      throw new ApiError(400, "INVALID_TEAM", "Choose an active team");
    if (b.role === "TEAM_LEAD" && selectedTeam)
      throw new ApiError(
        400,
        "TEAM_LEAD_SETUP",
        "Create the team lead without a team, then create their team",
      );
    const defaults = await agencySettings();
    const u = await db.user.create({
      data: {
        ...b,
        contentEdit: b.contentEdit ?? b.role === "EDITOR",
        agentRate: defaults.defaultAgentRate,
        leadRate: defaults.defaultLeadRate,
        email: b.email.toLowerCase(),
        teamId: req.actor.role === "SUPER_ADMIN" ? b.teamId : req.actor.teamId,
      },
    });
    const token = randomBytes(32).toString("hex");
    await db.token.create({
      data: {
        hash: digest(token),
        userId: u.id,
        kind: "INVITATION",
        expiresAt: new Date(Date.now() + 172800000),
      },
    });
    const delivery = await sendEmail(
      u.email,
      "Your Aura invitation",
      `${process.env.ADMIN_URL ?? "http://localhost:5173"}/accept-invitation?token=${token}`,
    );
    return {
      data: {
        ...safe(u),
        ...(isDevelopment ? { developmentInvitation: delivery } : {}),
      },
    };
  });
  app.patch("/api/users/:id", { preHandler: authenticate }, async (req) => {
    const id = (req.params as any).id;
    const b = z
      .object({
        name: z.string().min(2).optional(),
        locale: z.enum(["ka", "ru", "he", "en"]).optional(),
        teamId: z.string().nullable().optional(),
        role: z.enum(["AGENT", "TEAM_LEAD", "EDITOR"]).optional(),
        contentEdit: z.boolean().optional(),
        agentRate: z.number().min(0).max(100).optional(),
        leadRate: z.number().min(0).max(100).optional(),
        publicProfile: z.boolean().optional(),
        publicData: z.record(z.unknown()).optional(),
        active: z.boolean().optional(),
        redistribution: z.enum(["TEAM_LEAD", "AUTOMATIC"]).optional(),
        moveLeadIds: z.array(z.string()).optional(),
      })
      .strict()
      .parse(req.body);
    if (req.actor.role !== "SUPER_ADMIN") {
      if (
        id !== req.actor.id ||
        Object.keys(b).some((k) => !["name", "locale"].includes(k))
      )
        throw new ApiError(403, "FORBIDDEN", "Profile settings only");
    }
    const u = await db.$transaction(async (tx) => {
      const previous = await tx.user.findUniqueOrThrow({ where: { id } });
      if (
        previous.role === "SUPER_ADMIN" &&
        (b.role !== undefined || b.active === false)
      )
        throw new ApiError(
          400,
          "OWNER_PROTECTED",
          "The sole owner role and access cannot be removed",
        );
      if (b.role === "TEAM_LEAD" && (b.teamId ?? previous.teamId)) {
        const team = await tx.team.findUnique({
          where: { id: (b.teamId ?? previous.teamId)! },
        });
        if (team && team.leadId !== id)
          throw new ApiError(
            400,
            "TEAM_LEAD_EXISTS",
            "This team already has a permanent lead",
          );
      }

      const { redistribution, moveLeadIds, ...update } = b;
      const activeLeads = await tx.lead.findMany({
        where: { agentId: id, stage: { notIn: ["LOST", "WON"] } },
      });
      if (b.teamId !== undefined && b.teamId !== previous.teamId) {
        if (previous.role !== "AGENT")
          throw new ApiError(
            400,
            "AGENT_TRANSFER_ONLY",
            "Team transfer applies to agents",
          );
        if (
          b.teamId &&
          !(await tx.team.findUnique({ where: { id: b.teamId } }))
        )
          throw new ApiError(400, "INVALID_TEAM", "Unknown team");
        for (const lead of activeLeads) {
          if (moveLeadIds?.includes(lead.id)) {
            await tx.lead.update({
              where: { id: lead.id },
              data: { teamId: b.teamId },
            });
            await tx.notification.deleteMany({ where: { leadId: lead.id } });
            await tx.audit.create({
              data: {
                actorId: req.actor.id,
                action: "LEAD_TEAM_TRANSFER",
                data: { leadId: lead.id, from: previous.teamId, to: b.teamId },
              },
            });
          } else {
            const oldTeam = lead.teamId
              ? await tx.team.findUnique({ where: { id: lead.teamId } })
              : null;
            if (oldTeam?.leadId)
              await reassign(tx, lead, oldTeam.leadId, req.actor.id);
            else
              await tx.lead.update({
                where: { id: lead.id },
                data: { agentId: null },
              });
          }
        }
      }
      if (b.active === false && activeLeads.length && !redistribution)
        throw new ApiError(
          400,
          "REDISTRIBUTION_REQUIRED",
          "Choose team lead inbox or automatic distribution for active leads",
        );
      if (b.agentRate !== undefined || b.leadRate !== undefined) {
        if (!(await tx.commissionRate.count({ where: { userId: id } })))
          await tx.commissionRate.create({
            data: {
              userId: id,
              agentRate: previous.agentRate,
              leadRate: previous.leadRate,
              effectiveAt: previous.joinedAt,
            },
          });
        await tx.commissionRate.create({
          data: {
            userId: id,
            agentRate: b.agentRate ?? previous.agentRate,
            leadRate: b.leadRate ?? previous.leadRate,
            effectiveAt: new Date(),
          },
        });
      }
      const updated = await tx.user.update({
        where: { id },
        data: update as any,
      });
      if (b.active === false) {
        await tx.session.deleteMany({ where: { userId: id } });
        for (const lead of activeLeads) {
          const team = lead.teamId
            ? await tx.team.findUnique({ where: { id: lead.teamId } })
            : null;
          const target =
            redistribution === "AUTOMATIC" && team
              ? await chooseAgent(tx, team.id)
              : team?.leadId;
          const targetUser = target
            ? await tx.user.findUnique({ where: { id: target } })
            : null;
          if (targetUser?.active && targetUser.id !== id)
            await reassign(tx, lead, targetUser.id, req.actor.id);
          else {
            await tx.lead.update({
              where: { id: lead.id },
              data: { agentId: null },
            });
            await tx.reminder.updateMany({
              where: { leadId: lead.id, state: "PENDING" },
              data: { state: "CANCELLED" },
            });
          }
        }
      }
      await tx.audit.create({
        data: {
          actorId: req.actor.id,
          action: "USER_UPDATE",
          data: { id, ...b } as any,
        },
      });
      return updated;
    });
    return {
      data:
        req.actor.role === "SUPER_ADMIN"
          ? {
              ...safe(u),
              agentRate: u.agentRate,
              leadRate: u.leadRate,
              publicProfile: u.publicProfile,
              publicData: u.publicData,
            }
          : safe(u),
    };
  });
  app.get("/api/teams", { preHandler: authenticate }, async (req) => ({
    data: await db.team.findMany({
      where:
        req.actor.role === "SUPER_ADMIN"
          ? {}
          : { id: req.actor.teamId ?? "none" },
    }),
  }));
  const teamFields = z.object({
    name: z.string().trim().min(2),
    leadId: z
      .string()
      .trim()
      .transform((v) => v || null)
      .nullable()
      .optional(),
    active: z.boolean().optional(),
  });
  async function validateLeader(
    tx: any,
    leadId: string | null | undefined,
    teamId?: string,
  ) {
    if (!leadId) return null;
    const user = await tx.user.findUnique({ where: { id: leadId } });
    if (!user?.active || user.role !== "TEAM_LEAD")
      throw new ApiError(400, "INVALID_LEAD", "Choose an active team lead");
    if (
      (user.teamId && user.teamId !== teamId) ||
      (await tx.team.findFirst({
        where: { leadId, ...(teamId ? { id: { not: teamId } } : {}) },
      }))
    )
      throw new ApiError(
        409,
        "TEAM_LEAD_ASSIGNED",
        "This team lead already belongs to another team. Choose an unassigned lead or create the team without a lead.",
      );
    return user;
  }
  app.post("/api/teams", { preHandler: authenticate }, async (req) => {
    requireAdmin(req.actor);
    const b = teamFields.parse(req.body);
    return {
      data: await db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(481529)`;
        const user = await validateLeader(tx, b.leadId);
        const team = await tx.team.create({
          data: { ...b, leadId: b.leadId ?? null },
        });
        if (user)
          await tx.user.update({
            where: { id: user.id },
            data: { teamId: team.id },
          });
        await tx.audit.create({
          data: {
            actorId: req.actor.id,
            action: "TEAM_CREATED",
            data: { teamId: team.id, ...b },
          },
        });
        return team;
      }),
    };
  });
  app.patch("/api/teams/:id", { preHandler: authenticate }, async (req) => {
    requireAdmin(req.actor);
    const b = teamFields.partial().parse(req.body);
    const id = (req.params as any).id;
    return {
      data: await db.$transaction(async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(481529)`;
        const previous = await tx.team.findUnique({ where: { id } });
        if (!previous) throw new ApiError(404, "NOT_FOUND", "Team not found");
        const user = await validateLeader(tx, b.leadId, id);
        if (
          b.leadId !== undefined &&
          previous.leadId &&
          previous.leadId !== b.leadId
        )
          throw new ApiError(
            400,
            "TEAM_LEAD_REPLACEMENT",
            "Replacing an existing permanent lead requires a staff transfer plan. Assign a lead to a team that has no lead.",
          );
        const team = await tx.team.update({ where: { id }, data: b });
        if (user)
          await tx.user.update({
            where: { id: user.id },
            data: { teamId: id },
          });
        await tx.audit.create({
          data: {
            actorId: req.actor.id,
            action: "TEAM_UPDATED",
            data: { teamId: id, ...b },
          },
        });
        return team;
      }),
    };
  });
}
