import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { ZodError } from "zod";
import { ApiError, db } from "./db.js";
import { authRoutes } from "./auth.js";
import { contentRoutes } from "./content.js";
import { inquiryRoutes } from "./inquiry.js";
import { crmRoutes } from "./crm.js";
import { reportingRoutes } from "./reporting.js";
import { leaveRoutes } from "./leave.js";
import { importRoutes } from "./imports.js";
import { mediaRoutes } from "./media.js";
import { settingsRoutes } from "./settings.js";
import { runJobs } from "./jobs.js";
export async function buildApp() {
  const app = Fastify({ logger: true, bodyLimit: 5242880 });
  await app.register(cookie);
  await app.register(cors, {
    origin: (
      process.env.ALLOWED_ORIGINS ??
      "http://localhost:3000,http://localhost:5173"
    ).split(","),
    credentials: true,
  });
  await app.register(rateLimit, { max: 200, timeWindow: "1 minute" });
  app.addHook("onRequest", async (req, reply) => {
    reply.header("x-content-type-options", "nosniff");
    reply.header("x-robots-tag", "noindex, nofollow");
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.cookies.aura_session
    ) {
      const origin = req.headers.origin;
      const allowed = (
        process.env.ALLOWED_ORIGINS ??
        "http://localhost:3000,http://localhost:5173"
      ).split(",");
      if (!origin || !allowed.includes(origin))
        throw new ApiError(403, "CSRF", "Allowed origin required");
    }
  });
  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ApiError)
      return reply
        .status(err.status)
        .send({ error: { code: err.code, message: err.message } });
    if (err instanceof ZodError)
      return reply.status(400).send({
        error: {
          code: "VALIDATION",
          message: err.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join(";"),
        },
      });
    if ((err as any).code === "P2002")
      return reply.status(409).send({
        error: {
          code: "CONFLICT",
          message: "Record conflicts with existing data",
        },
      });
    if (
      typeof (err as any).statusCode === "number" &&
      (err as any).statusCode >= 400 &&
      (err as any).statusCode < 500
    ) {
      const status = (err as any).statusCode;
      return reply
        .status(status)
        .send({
          error: {
            code: status === 429 ? "RATE_LIMIT" : "BAD_REQUEST",
            message:
              status === 429
                ? "Too many requests. Please try again later."
                : "Request could not be accepted",
          },
        });
    }
    req.log.error(err);
    return reply.status(500).send({
      error: { code: "INTERNAL", message: "Request could not be completed" },
    });
  });
  app.get("/api/health", async () => {
    await db.$queryRaw`SELECT 1`;
    return { data: { status: "ok" } };
  });
  await authRoutes(app);
  await settingsRoutes(app);
  await contentRoutes(app);
  await inquiryRoutes(app);
  await crmRoutes(app);
  await reportingRoutes(app);
  await leaveRoutes(app);
  await importRoutes(app);
  await mediaRoutes(app);
  return app;
}
if (process.env.NODE_ENV !== "test") {
  const app = await buildApp();
  await app.listen({
    port: Number(process.env.PORT ?? 4000),
    host: process.env.HOST ?? "127.0.0.1",
  });
  const timer = setInterval(
    () => runJobs().catch((e) => app.log.error(e)),
    15000,
  );
  timer.unref();
  const stop = async () => {
    clearInterval(timer);
    await app.close();
    await db.$disconnect();
    process.exit(0);
  };
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
}
