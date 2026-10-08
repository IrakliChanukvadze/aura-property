import type { FastifyInstance } from "fastify";
import ExcelJS from "exceljs";
import { randomBytes } from "node:crypto";
import { db, ApiError, requireAdmin } from "./db.js";
import { authenticate } from "./auth.js";
import { phone } from "./domain.js";
import { assignTeam, chooseAgent } from "./routing.js";
const columns = [
  "name",
  "phone",
  "email",
  "nationality",
  "language",
  "projectIds",
];
const previews = new Map<
  string,
  { userId: string; rows: any[]; expires: number }
>();
export async function importRoutes(app: FastifyInstance) {
  app.get(
    "/api/leads/import/template",
    { preHandler: authenticate },
    async (req, reply) => {
      const book = new ExcelJS.Workbook();
      const sheet = book.addWorksheet("Leads");
      sheet.addRow(columns);
      sheet.addRow(["Example buyer", "+995555123456", "", "Unknown", "en", ""]);
      reply
        .header(
          "content-type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        .header(
          "content-disposition",
          'attachment; filename="aura-leads.xlsx"',
        );
      return reply.send(Buffer.from(await book.xlsx.writeBuffer()));
    },
  );
  app.post(
    "/api/leads/import/preview",
    { preHandler: authenticate, bodyLimit: 5242880 },
    async (req) => {
      const b = req.body as any;
      if (typeof b?.file !== "string")
        throw new ApiError(
          400,
          "FILE_REQUIRED",
          "Send XLSX file as base64 in file",
        );
      const book = new ExcelJS.Workbook();
      try {
        await book.xlsx.load(Buffer.from(b.file, "base64") as any);
      } catch {
        throw new ApiError(
          400,
          "INVALID_FILE",
          "Upload a valid .xlsx workbook using the provided template",
        );
      }
      const sheet = book.worksheets[0];
      if (!sheet || sheet.rowCount > 1001)
        throw new ApiError(400, "LIMIT", "Maximum 1000 rows");
      const headers = sheet.getRow(1).values as any[];
      if (columns.some((c, i) => headers[i + 1] !== c))
        throw new ApiError(
          400,
          "TEMPLATE",
          "Use the provided fixed-column template",
        );
      const data: any[] = [];
      for (let row = 2; row <= sheet.rowCount; row++) {
        const values = sheet.getRow(row).values as any[];
        if (values.every((v) => !v)) continue;
        data.push(
          Object.fromEntries(
            columns.map((c, i) => [
              c,
              typeof values[i + 1] === "object"
                ? ""
                : String(values[i + 1] ?? ""),
            ]),
          ),
        );
      }
      const seen = new Set<string>(),
        valid: any[] = [],
        rows: any[] = [];
      for (let i = 0; i < data.length; i++) {
        const r = data[i];
        let error = "";
        let p = "";
        try {
          p = phone(String(r.phone));
          if (!String(r.name).trim() || !String(r.nationality).trim())
            error = "Name and nationality required";
          else if (
            seen.has(p) ||
            (await db.customer.findUnique({ where: { phone: p } }))
          )
            error = "Duplicate phone";
          else if (r.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r.email))
            error = "Invalid email";
          else if (r.language && !["ka", "ru", "he", "en"].includes(r.language))
            error = "Invalid language";
          const ids = String(r.projectIds)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
          if (
            ids.length !==
            (await db.project.count({ where: { id: { in: ids } } }))
          )
            error = "Unknown project ID";
          r.projectIds = ids;
        } catch {
          error = "Invalid phone";
        }
        if (!error) seen.add(p);
        const value = { ...r, phone: p };
        rows.push({ row: i + 2, ...value, valid: !error, error });
        if (!error) valid.push(value);
      }
      const id = randomBytes(24).toString("hex");
      previews.set(id, {
        userId: req.actor.id,
        rows: valid,
        expires: Date.now() + 900000,
      });
      return {
        data: {
          previewId: id,
          rows,
          valid: valid.length,
          skipped: rows.length - valid.length,
        },
      };
    },
  );
  app.post(
    "/api/leads/import/confirm",
    { preHandler: authenticate },
    async (req) => {
      const b = req.body as any;
      const preview = previews.get(b?.previewId);
      if (
        !preview ||
        preview.userId !== req.actor.id ||
        preview.expires < Date.now()
      )
        throw new ApiError(400, "PREVIEW_EXPIRED", "Create preview again");
      previews.delete(b.previewId);
      let imported = 0,
        skipped = 0;
      for (const r of preview.rows) {
        try {
          await db.$transaction(async (tx) => {
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(481529)`;
            if (await tx.customer.findUnique({ where: { phone: r.phone } })) {
              skipped++;
              return;
            }
            const c = await tx.customer.create({
              data: {
                name: String(r.name),
                phone: r.phone,
                email: r.email || null,
                nationality: r.nationality,
                language: r.language || "en",
              },
            });
            let routing: any = {
              teamId: req.actor.teamId,
              agentId: req.actor.id,
            };
            if (req.actor.role === "SUPER_ADMIN")
              routing = await assignTeam(tx);
            if (b.autoAssign && req.actor.role !== "AGENT" && routing.teamId)
              routing.agentId = await chooseAgent(tx, routing.teamId);
            await tx.lead.create({
              data: {
                customerId: c.id,
                ...routing,
                source: "EXCEL",
                contactLanguage: r.language || "en",
                projectIds: r.projectIds,
              },
            });
            imported++;
          });
        } catch {
          skipped++;
        }
      }
      return { data: { imported, skipped } };
    },
  );
  app.get(
    "/api/leads/export",
    { preHandler: authenticate },
    async (req, reply) => {
      requireAdmin(req.actor);
      const rows = await db.lead.findMany({ include: { customer: true } });
      const book = new ExcelJS.Workbook();
      const sheet = book.addWorksheet("Leads");
      sheet.addRow([
        "id",
        "name",
        "phone",
        "email",
        "nationality",
        "stage",
        "source",
        "teamId",
        "agentId",
        "createdAt",
      ]);
      for (const l of rows)
        sheet.addRow([
          l.id,
          l.customer.name,
          l.customer.phone,
          l.customer.email,
          l.customer.nationality,
          l.stage,
          l.source,
          l.teamId,
          l.agentId,
          l.createdAt.toISOString(),
        ]);
      reply
        .header(
          "content-type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        .header(
          "content-disposition",
          'attachment; filename="aura-export.xlsx"',
        );
      return reply.send(Buffer.from(await book.xlsx.writeBuffer()));
    },
  );
}
