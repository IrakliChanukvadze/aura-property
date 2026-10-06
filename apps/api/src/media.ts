import { r2Configured, r2Put, r2Get } from "./storage.js";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { db, content, accessible, ApiError } from "./db.js";
import { authenticate } from "./auth.js";
import { isDevelopment } from "./adapters.js";
const formats: Record<string, { ext: string; test: (b: Buffer) => boolean }> = {
  "image/jpeg": {
    ext: "jpg",
    test: (b) => b[0] === 255 && b[1] === 216 && b[2] === 255,
  },
  "image/png": {
    ext: "png",
    test: (b) =>
      b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  },
  "image/webp": {
    ext: "webp",
    test: (b) =>
      b.subarray(0, 4).toString() === "RIFF" &&
      b.subarray(8, 12).toString() === "WEBP",
  },
  "application/pdf": {
    ext: "pdf",
    test: (b) => b.subarray(0, 5).toString() === "%PDF-",
  },
};
export async function mediaRoutes(app: FastifyInstance) {
  app.post(
    "/api/uploads",
    { preHandler: authenticate, bodyLimit: 15000000 },
    async (req) => {
      const b = z
        .object({
          name: z.string().min(1).max(200),
          mime: z.enum([
            "image/jpeg",
            "image/png",
            "image/webp",
            "application/pdf",
          ]),
          file: z.string(),
          purpose: z.enum(["PROJECT", "BLOG", "PROFILE", "AGREEMENT"]),
          leadId: z.string().optional(),
        })
        .parse(req.body);
      if (b.purpose === "AGREEMENT") {
        if (!b.leadId)
          throw new ApiError(
            400,
            "LEAD_REQUIRED",
            "Agreement must link to lead",
          );
        await accessible(req.actor, b.leadId);
      } else content(req.actor);
      if (b.purpose !== "AGREEMENT" && b.mime === "application/pdf")
        throw new ApiError(400, "FORMAT", "Marketing covers must be images");
      const bytes = Buffer.from(b.file, "base64");
      if (
        !bytes.length ||
        bytes.length > 10000000 ||
        !formats[b.mime].test(bytes)
      )
        throw new ApiError(
          400,
          "INVALID_FILE",
          "Invalid file signature or larger than 10 MB",
        );
      const key = `${randomUUID()}.${formats[b.mime].ext}`;
      let path: string;
      if (r2Configured()) {
        await r2Put(key, bytes, b.mime);
        path = key;
      } else if (process.env.STORAGE_WEBHOOK_URL) {
        const result = await fetch(process.env.STORAGE_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${process.env.STORAGE_WEBHOOK_TOKEN ?? ""}`,
          },
          body: JSON.stringify({
            key,
            mime: b.mime,
            file: b.file,
            private: true,
          }),
        });
        if (!result.ok)
          throw new ApiError(
            502,
            "STORAGE_FAILED",
            "Storage provider unavailable",
          );
        path = key;
      } else {
        if (!isDevelopment)
          throw new ApiError(
            503,
            "STORAGE_REQUIRED",
            "Private storage provider required",
          );
        const dir = resolve(process.env.UPLOAD_DIR ?? ".data/uploads");
        await mkdir(dir, { recursive: true });
        await writeFile(resolve(dir, key), bytes, { flag: "wx" });
        path = key;
      }
      const item = await db.media.create({
        data: {
          ownerId: req.actor.id,
          leadId: b.leadId,
          purpose: b.purpose,
          name: b.name,
          mime: b.mime,
          size: bytes.length,
          path,
        },
      });
      return {
        data: {
          id: item.id,
          url:
            b.purpose === "AGREEMENT"
              ? `/api/uploads/${item.id}`
              : `/api/public/media/${item.id}`,
          name: item.name,
          mime: item.mime,
        },
      };
    },
  );
  const deliver = async (item: any, reply: any) => {
    reply
      .header("content-type", item.mime)
      .header(
        "content-disposition",
        `inline; filename="${item.name.replace(/[^a-zA-Z0-9._-]/g, "_")}"`,
      )
      .header("cache-control", "private, no-store");
    if (r2Configured()) return reply.send(await r2Get(item.path));
    if (process.env.STORAGE_WEBHOOK_URL) {
      const res = await fetch(
        `${process.env.STORAGE_WEBHOOK_URL}?key=${encodeURIComponent(item.path)}`,
        {
          headers: {
            authorization: `Bearer ${process.env.STORAGE_WEBHOOK_TOKEN ?? ""}`,
          },
        },
      );
      if (!res.ok)
        throw new ApiError(502, "STORAGE_FAILED", "Storage unavailable");
      return reply.send(Buffer.from(await res.arrayBuffer()));
    }
    if (!isDevelopment)
      throw new ApiError(503, "STORAGE_REQUIRED", "Storage unavailable");
    return reply.send(
      await readFile(
        resolve(process.env.UPLOAD_DIR ?? ".data/uploads", item.path),
      ),
    );
  };
  app.get(
    "/api/uploads/:id",
    { preHandler: authenticate },
    async (req, reply) => {
      const item = await db.media.findUnique({
        where: { id: (req.params as any).id },
      });
      if (!item) throw new ApiError(404, "NOT_FOUND", "File not found");
      if (item.leadId) await accessible(req.actor, item.leadId);
      else content(req.actor);
      return deliver(item, reply);
    },
  );
  app.get("/api/public/media/:id", async (req, reply) => {
    const item = await db.media.findUnique({
      where: { id: (req.params as any).id },
    });
    if (!item || item.purpose === "AGREEMENT")
      throw new ApiError(404, "NOT_FOUND", "File not found");
    const url = `/api/public/media/${item.id}`;
    const projects = await db.project.findMany({ where: { published: true } });
    const posts = await db.post.findMany({ where: { published: true } });
    const profiles = await db.user.findMany({
      where: { active: true, publicProfile: true },
    });
    if (
      ![...projects, ...posts, ...profiles].some((x) =>
        JSON.stringify(x).includes(url),
      )
    )
      throw new ApiError(404, "NOT_FOUND", "File is not published");
    return deliver(item, reply);
  });
  app.get(
    "/api/leads/:id/documents",
    { preHandler: authenticate },
    async (req) => {
      await accessible(req.actor, (req.params as any).id);
      return {
        data: (
          await db.media.findMany({ where: { leadId: (req.params as any).id } })
        ).map((i) => ({
          id: i.id,
          name: i.name,
          mime: i.mime,
          url: `/api/uploads/${i.id}`,
        })),
      };
    },
  );
}
