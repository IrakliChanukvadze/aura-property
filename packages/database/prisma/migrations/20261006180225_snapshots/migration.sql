-- AlterTable
ALTER TABLE "Leave" ADD COLUMN     "workingDates" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "actingRate" DECIMAL(8,4) NOT NULL DEFAULT 0,
ADD COLUMN     "agentRate" DECIMAL(8,4) NOT NULL DEFAULT 1,
ADD COLUMN     "leadRate" DECIMAL(8,4) NOT NULL DEFAULT 0.5;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastAssignedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CommissionRate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentRate" DECIMAL(8,4) NOT NULL,
    "leadRate" DECIMAL(8,4) NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionRate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommissionRate_userId_effectiveAt_idx" ON "CommissionRate"("userId", "effectiveAt");
