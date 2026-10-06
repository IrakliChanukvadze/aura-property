-- CreateTable
CREATE TABLE "AgencySettings" (
    "id" TEXT NOT NULL DEFAULT 'agency',
    "defaultAgentRate" DECIMAL(8,4) NOT NULL DEFAULT 1,
    "defaultLeadRate" DECIMAL(8,4) NOT NULL DEFAULT 0.5,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencySettings_pkey" PRIMARY KEY ("id")
);
