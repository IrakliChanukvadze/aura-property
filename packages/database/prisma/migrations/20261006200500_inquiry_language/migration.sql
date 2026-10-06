ALTER TABLE "Lead" ADD COLUMN "contactLanguage" TEXT NOT NULL DEFAULT 'en', ADD COLUMN "inquiryLocale" TEXT;
UPDATE "Lead" l SET "contactLanguage" = c."language" FROM "Customer" c WHERE l."customerId" = c."id";
