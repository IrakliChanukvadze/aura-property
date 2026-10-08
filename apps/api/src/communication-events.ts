import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import type { CommunicationEvent, Prisma } from "@prisma/client";
import { z } from "zod";
import { authenticate } from "./auth.js";
import { db, requireAdmin } from "./db.js";

const providerSchema = z.enum([
  "whatsapp",
  "gmail",
  "meta",
  "telegram",
  "calling",
]);
const identifier = z
  .string()
  .trim()
  .min(1)
  .max(200)
  .refine((value) => !/[\u0000-\u001f\u007f]/.test(value));
const payloadSchema = z
  .object({
    kind: z.enum(["message", "call"]),
    direction: z.enum(["inbound", "outbound"]),
    occurredAt: z.string().datetime({ offset: true }),
    contact: z
      .object({
        externalId: identifier,
        name: z.string().trim().max(200).optional(),
        phone: z.string().trim().max(50).optional(),
        email: z.string().email().max(254).optional(),
      })
      .strict(),
    text: z.string().max(10000).optional(),
  })
  .strict()
  .refine(
    (payload) => Buffer.byteLength(JSON.stringify(payload), "utf8") <= 16000,
    "Normalized payload must not exceed 16 KB",
  );
const receiptSchema = z
  .object({
    provider: providerSchema,
    accountId: identifier,
    externalEventId: identifier,
    payload: payloadSchema,
  })
  .strict();
export type VerifiedCommunicationInput = z.input<typeof receiptSchema>;
export type CommunicationPayload = z.infer<typeof payloadSchema>;
export const communicationPolicy = {
  maxAttempts: 5,
  leaseMs: 60000,
  baseRetryMs: 30000,
  maxRetryMs: 900000,
} as const;
type DiagnosticEvent = Pick<
  CommunicationEvent,
  | "id"
  | "provider"
  | "state"
  | "attempts"
  | "nextAttemptAt"
  | "lastErrorCode"
  | "receivedAt"
  | "processedAt"
>;
const publicMetadata = (event: DiagnosticEvent) => ({
  id: event.id,
  provider: event.provider,
  state: event.state,
  attempts: event.attempts,
  nextAttemptAt: event.nextAttemptAt,
  lastErrorCode: event.lastErrorCode,
  receivedAt: event.receivedAt,
  processedAt: event.processedAt,
});

/** INTERNAL ONLY: the future adapter must authenticate/verify a provider event first.
 * No route invokes this function. Never supply raw provider bodies, headers or keys.
 */
export async function receiveVerifiedCommunicationEvent(
  input: VerifiedCommunicationInput,
) {
  const event = receiptSchema.parse(input);
  try {
    const created = await db.communicationEvent.create({
      data: { ...event, payload: event.payload as Prisma.InputJsonValue },
    });
    return { id: created.id, duplicate: false };
  } catch (error) {
    if ((error as { code?: string }).code !== "P2002") throw error;
    const existing = await db.communicationEvent.findUniqueOrThrow({
      where: {
        provider_accountId_externalEventId: {
          provider: event.provider,
          accountId: event.accountId,
          externalEventId: event.externalEventId,
        },
      },
    });
    // First verified receipt is authoritative; retries never replace stored content.
    return { id: existing.id, duplicate: true };
  }
}
export type CommunicationClaim = { id: string; leaseToken: string };
/** Multiple workers can claim concurrently. Expired work is recoverable after restart. */
export async function claimCommunicationEvent(
  now = new Date(),
): Promise<CommunicationClaim | null> {
  return db.$transaction(async (tx) => {
    // A worker dying on its final attempt must still reach a terminal state.
    await tx.communicationEvent.updateMany({
      where: {
        state: "PROCESSING",
        attempts: { gte: communicationPolicy.maxAttempts },
        leaseExpiresAt: { lte: now },
      },
      data: {
        state: "FAILED",
        lastErrorCode: "LEASE_EXPIRED",
        leaseToken: null,
        leaseExpiresAt: null,
      },
    });
    const rows = await tx.$queryRaw<{ id: string }[]>`
      SELECT "id" FROM "CommunicationEvent"
      WHERE "attempts" < ${communicationPolicy.maxAttempts}
      AND (("state" = 'RECEIVED' AND "nextAttemptAt" <= ${now})
        OR ("state" = 'PROCESSING' AND "leaseExpiresAt" <= ${now}))
      ORDER BY "nextAttemptAt", "receivedAt", "id"
      FOR UPDATE SKIP LOCKED LIMIT 1`;
    if (!rows.length) return null;
    const leaseToken = randomUUID();
    await tx.communicationEvent.update({
      where: { id: rows[0].id },
      data: {
        state: "PROCESSING",
        attempts: { increment: 1 },
        leaseToken,
        leaseExpiresAt: new Date(now.getTime() + communicationPolicy.leaseMs),
      },
    });
    return { id: rows[0].id, leaseToken };
  });
}
/** Callback side effects MUST use the supplied transaction, never network or another DB client.
 * Atomic callback+state commit prevents duplicate committed database side effects.
 * This does not promise exactly-once external delivery; that requires an outbox.
 */
export async function processCommunicationEvent(
  claim: CommunicationClaim,
  handler: (
    tx: Prisma.TransactionClient,
    payload: CommunicationPayload,
    event: { id: string; provider: string; accountId: string },
  ) => Promise<"processed" | "ignored">,
  now = new Date(),
): Promise<"processed" | "ignored" | "retry_scheduled" | "failed" | "stale"> {
  let failureCode = "HANDLER_FAILED";
  try {
    return await db.$transaction(
      async (tx) => {
        const locked = await tx.$queryRaw<
          CommunicationEvent[]
        >`SELECT * FROM "CommunicationEvent" WHERE "id" = ${claim.id} FOR UPDATE`;
        const event = locked[0];
        if (
          !event ||
          event.state !== "PROCESSING" ||
          event.leaseToken !== claim.leaseToken ||
          !event.leaseExpiresAt ||
          event.leaseExpiresAt <= now
        )
          return "stale" as const;
        const payload = payloadSchema.safeParse(event.payload);
        if (!payload.success) {
          failureCode = "INVALID_PAYLOAD";
          throw new Error("Invalid normalized event");
        }
        const outcome = await handler(tx, payload.data, {
          id: event.id,
          provider: event.provider,
          accountId: event.accountId,
        });
        if (!["processed", "ignored"].includes(outcome))
          throw new Error("Invalid handler result");
        await tx.communicationEvent.update({
          where: { id: event.id },
          data: {
            state: outcome === "ignored" ? "IGNORED" : "PROCESSED",
            processedAt: now,
            lastErrorCode: null,
            leaseToken: null,
            leaseExpiresAt: null,
          },
        });
        return outcome;
      },
      { timeout: 10000 },
    );
  } catch {
    // Never persist exception text; it may include credentials or customer content.
    return db.$transaction(async (tx) => {
      const locked = await tx.$queryRaw<
        CommunicationEvent[]
      >`SELECT * FROM "CommunicationEvent" WHERE "id" = ${claim.id} FOR UPDATE`;
      const event = locked[0];
      if (
        !event ||
        event.state !== "PROCESSING" ||
        event.leaseToken !== claim.leaseToken
      )
        return "stale" as const;
      const terminal =
        failureCode === "INVALID_PAYLOAD" ||
        event.attempts >= communicationPolicy.maxAttempts;
      const delay = Math.min(
        communicationPolicy.maxRetryMs,
        communicationPolicy.baseRetryMs * 2 ** Math.max(0, event.attempts - 1),
      );
      await tx.communicationEvent.update({
        where: { id: event.id },
        data: {
          state: terminal ? "FAILED" : "RECEIVED",
          lastErrorCode: failureCode,
          nextAttemptAt: new Date(now.getTime() + delay),
          leaseToken: null,
          leaseExpiresAt: null,
        },
      });
      return terminal ? ("failed" as const) : ("retry_scheduled" as const);
    });
  }
}
/** Operational metadata only; no customer content, account IDs or provider event IDs. */
export async function communicationEventRoutes(app: FastifyInstance) {
  app.get(
    "/api/communication-events",
    { preHandler: authenticate },
    async (req, reply) => {
      requireAdmin(req.actor);
      reply.header("cache-control", "no-store");
      const [counts, recent] = await Promise.all([
        db.communicationEvent.groupBy({
          by: ["state"],
          _count: { _all: true },
        }),
        db.communicationEvent.findMany({
          orderBy: { receivedAt: "desc" },
          take: 20,
          select: {
            id: true,
            provider: true,
            state: true,
            attempts: true,
            nextAttemptAt: true,
            lastErrorCode: true,
            receivedAt: true,
            processedAt: true,
          },
        }),
      ]);
      return {
        data: {
          enabled: false,
          workerEnabled: false,
          counts: Object.fromEntries(
            counts.map((row) => [row.state, row._count._all]),
          ),
          recent: recent.map(publicMetadata),
          policy: communicationPolicy,
        },
      };
    },
  );
}
