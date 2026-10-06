import { randomBytes } from "node:crypto";
import { z } from "zod";
import { db } from "./db.js";
import { digest } from "./domain.js";
import { sendEmail, isDevelopment } from "./adapters.js";
try {
  if (process.argv.includes("--dry-run")) {
    console.log(
      (await db.user.count({ where: { role: "SUPER_ADMIN" } }))
        ? "Owner already exists; initialization would be refused."
        : "No owner exists. Configure OWNER_EMAIL and email delivery before initialization.",
    );
  } else {
    const email = z
      .string()
      .email()
      .parse(process.env.OWNER_EMAIL)
      .toLowerCase();
    const adminUrl = z.string().url().parse(process.env.ADMIN_URL);
    const delivery = await db.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(481531)`;
        if (await tx.user.count({ where: { role: "SUPER_ADMIN" } }))
          throw new Error(
            "Owner already exists; refusing to create another SuperAdmin.",
          );
        const user = await tx.user.create({
          data: {
            email,
            name: process.env.OWNER_NAME || "Agency owner",
            role: "SUPER_ADMIN",
            contentEdit: true,
          },
        });
        const token = randomBytes(32).toString("hex");
        await tx.token.create({
          data: {
            hash: digest(token),
            userId: user.id,
            kind: "INVITATION",
            expiresAt: new Date(Date.now() + 172800000),
          },
        });
        return sendEmail(
          email,
          "Set up your Aura owner account",
          `${adminUrl}/accept-invitation?token=${token}`,
        );
      },
      { timeout: 15000 },
    );
    console.log(
      isDevelopment
        ? delivery
        : "Owner invitation sent. Set your own password using the invitation.",
    );
  }
} finally {
  await db.$disconnect();
}
