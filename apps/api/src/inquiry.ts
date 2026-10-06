import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { db, ApiError, event } from "./db.js";
import { phone, digest } from "./domain.js";
import { makeOtp, sendOtp, isDevelopment } from "./adapters.js";
import { assignTeam } from "./routing.js";
const body = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string(),
  email: z.string().email().optional().or(z.literal("")),
  nationality: z.string().default("Unknown"),
  locale: z.enum(["ka", "ru", "he", "en"]).default("en"),
  projectId: z.string().optional(),
  unitId: z.string().optional(),
  message: z.string().max(3000).optional(),
  apartmentSizes: z.array(z.number().positive()).max(20).optional(),
  minFloor: z.number().int().optional(),
  maxFloor: z.number().int().optional(),
  consent: z.literal(true),
  requestId: z.string().optional(),
  otpCode: z.string().optional(),
});
export async function inquiryRoutes(app: FastifyInstance) {
  app.post(
    "/api/public/inquiries",
    { config: { rateLimit: { max: 10, timeWindow: "10 minutes" } } },
    async (req) => {
      const b = body.parse(req.body);
      const normalized = phone(b.phone);
      if (
        b.minFloor !== undefined &&
        b.maxFloor !== undefined &&
        b.minFloor > b.maxFloor
      )
        throw new ApiError(
          400,
          "INVALID_RANGE",
          "Minimum floor exceeds maximum",
        );
      if (
        b.unitId &&
        (b.apartmentSizes?.length ||
          b.minFloor !== undefined ||
          b.maxFloor !== undefined)
      )
        throw new ApiError(
          400,
          "UNIT_PREFERENCES",
          "Exact apartment inquiries do not include general preferences",
        );
      if (b.projectId) {
        const p = await db.project.findFirst({
          where: { id: b.projectId, published: true },
          include: { units: true },
        });
        if (
          p &&
          b.apartmentSizes?.some(
            (size) => !p.units.some((u) => Number(u.area) === size),
          )
        )
          throw new ApiError(
            400,
            "INVALID_SIZE",
            "Select apartment areas offered by this project",
          );
        if (!p)
          throw new ApiError(400, "INVALID_PROJECT", "Project unavailable");
        if (p.units.length && p.units.every((u) => u.status === "SOLD"))
          throw new ApiError(400, "SOLD_OUT", "Explore another project");
        if (
          b.unitId &&
          !p.units.some((u) => u.id === b.unitId && u.status === "AVAILABLE")
        )
          throw new ApiError(400, "UNAVAILABLE_UNIT", "Apartment unavailable");
      } else if (b.unitId)
        throw new ApiError(
          400,
          "INVALID_PROJECT",
          "Project required for apartment inquiry",
        );
      const existing = await db.customer.findUnique({
        where: { phone: normalized },
      });
      if (existing) {
        if (!b.requestId || !b.otpCode) {
          const code = makeOtp();
          const pending = await db.inquiryPending.create({
            data: {
              phone: normalized,
              payload: b,
              otpHash: digest(code),
              expiresAt: new Date(Date.now() + 600000),
            },
          });
          const delivery = await sendOtp(normalized, code);
          return {
            data: {
              requiresOtp: true,
              requestId: pending.id,
              ...(isDevelopment ? { developmentOtp: delivery } : {}),
            },
          };
        }
        const pending = await db.inquiryPending.findUnique({
          where: { id: b.requestId },
        });
        if (
          !pending ||
          pending.phone !== normalized ||
          pending.expiresAt < new Date() ||
          pending.attempts >= 5
        )
          throw new ApiError(400, "INVALID_OTP", "Verification expired");
        await db.inquiryPending.update({
          where: { id: pending.id },
          data: { attempts: { increment: 1 } },
        });
        if (digest(b.otpCode) !== pending.otpHash)
          throw new ApiError(400, "INVALID_OTP", "Incorrect code");
      }
      const lead = await db.$transaction(
        async (tx) => {
          await tx.$executeRaw`SELECT pg_advisory_xact_lock(481529)`;
          const found = await tx.customer.findUnique({
            where: { phone: normalized },
          });
          if (found && !existing) return { needsVerification: true };
          const customer =
            found ??
            (await tx.customer.create({
              data: {
                name: b.name,
                phone: normalized,
                email: b.email || null,
                nationality: b.nationality,
                language: b.locale,
              },
            }));
          let routing: any = await assignTeam(tx);
          if (existing) {
            const previous = await tx.lead.findFirst({
              where: { customerId: customer.id },
              orderBy: { createdAt: "desc" },
            });
            if (previous) {
              routing = { teamId: previous.teamId, agentId: previous.agentId };
              const u = previous.agentId
                ? await tx.user.findUnique({ where: { id: previous.agentId } })
                : null;
              if (u?.teamId) routing.teamId = u.teamId;
              const onLeave = u
                ? await tx.leave.findFirst({
                    where: {
                      userId: u.id,
                      status: "APPROVED",
                      startsAt: { lte: new Date() },
                      endsAt: { gte: new Date() },
                      OR: [
                        { returnAt: null },
                        { returnAt: { gt: new Date() } },
                      ],
                    },
                  })
                : null;
              if (
                !u?.active ||
                !["AGENT", "TEAM_LEAD", "SUPER_ADMIN"].includes(u.role) ||
                onLeave
              ) {
                const t = routing.teamId
                  ? await tx.team.findUnique({ where: { id: routing.teamId } })
                  : null;
                routing.agentId = t?.leadId ?? null;
              }
            }
            const claimed = await tx.inquiryPending.deleteMany({
              where: { id: b.requestId, phone: normalized },
            });
            if (!claimed.count)
              throw new ApiError(
                400,
                "INVALID_OTP",
                "Verification already used",
              );
          }
          const result = await tx.lead.create({
            data: {
              customerId: customer.id,
              ...routing,
              source: "WEBSITE",
              contactLanguage: b.locale,
              inquiryLocale: b.locale,
              inquiryProjectId: b.projectId,
              inquiryUnitId: b.unitId,
              projectIds: b.projectId ? [b.projectId] : [],
            },
          });
          await event(
            tx,
            result.id,
            null,
            existing ? "DUPLICATE_INQUIRY" : "INQUIRY",
            {
              message: b.message ?? "",
              locale: b.locale,
              submittedName: b.name,
              submittedEmail: b.email ?? "",
              originalProject: b.projectId ?? null,
              originalUnit: b.unitId ?? null,
              apartmentSizes: b.apartmentSizes ?? [],
              minFloor: b.minFloor ?? null,
              maxFloor: b.maxFloor ?? null,
            },
          );
          return result;
        },
        { isolationLevel: "ReadCommitted" },
      );
      if ("needsVerification" in lead) {
        const code = makeOtp();
        const pending = await db.inquiryPending.create({
          data: {
            phone: normalized,
            payload: b,
            otpHash: digest(code),
            expiresAt: new Date(Date.now() + 600000),
          },
        });
        const delivery = await sendOtp(normalized, code);
        return {
          data: {
            requiresOtp: true,
            requestId: pending.id,
            ...(isDevelopment ? { developmentOtp: delivery } : {}),
          },
        };
      }
      return { data: { id: lead.id, accepted: true, requiresOtp: false } };
    },
  );
  app.post(
    "/api/public/inquiries/:id/verify-request",
    { config: { rateLimit: { max: 3, timeWindow: "10 minutes" } } },
    async (req) => {
      const b = z.object({ phone: z.string() }).parse(req.body);
      const normalized = phone(b.phone);
      const l = await db.lead.findFirst({
        where: {
          id: (req.params as any).id,
          source: "WEBSITE",
          customer: { phone: normalized },
        },
        include: { customer: true },
      });
      if (!l) throw new ApiError(404, "NOT_FOUND", "Inquiry not found");
      const code = makeOtp();
      const p = await db.inquiryPending.create({
        data: {
          phone: normalized,
          payload: { verificationLeadId: l.id },
          otpHash: digest(code),
          expiresAt: new Date(Date.now() + 600000),
        },
      });
      const delivery = await sendOtp(normalized, code);
      return {
        data: {
          requestId: p.id,
          ...(isDevelopment ? { developmentOtp: delivery } : {}),
        },
      };
    },
  );
  app.post("/api/public/inquiries/verify", async (req) => {
    const b = z
      .object({ requestId: z.string(), otpCode: z.string() })
      .parse(req.body);
    const verified = await db.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${b.requestId}))`;
      const p = await tx.inquiryPending.findUnique({
        where: { id: b.requestId },
      });
      if (
        !p ||
        p.expiresAt < new Date() ||
        p.attempts >= 5 ||
        !(p.payload as any).verificationLeadId
      )
        throw new ApiError(400, "INVALID_OTP", "Verification expired");
      await tx.inquiryPending.update({
        where: { id: p.id },
        data: { attempts: { increment: 1 } },
      });
      if (digest(b.otpCode) !== p.otpHash) return false;
      await tx.inquiryPending.delete({ where: { id: p.id } });
      await event(
        tx,
        (p.payload as any).verificationLeadId,
        null,
        "PHONE_VERIFIED",
        {},
      );
      return true;
    });
    if (!verified) throw new ApiError(400, "INVALID_OTP", "Incorrect code");
    return { data: { verified: true } };
  });
}
