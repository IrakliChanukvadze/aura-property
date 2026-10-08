CREATE TABLE "CommunicationEvent" (
 "id" TEXT NOT NULL,
 "provider" TEXT NOT NULL,
 "accountId" TEXT NOT NULL,
 "externalEventId" TEXT NOT NULL,
 "payload" JSONB NOT NULL,
 "state" TEXT NOT NULL DEFAULT 'RECEIVED',
 "attempts" INTEGER NOT NULL DEFAULT 0,
 "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "leaseToken" TEXT,
 "leaseExpiresAt" TIMESTAMP(3),
 "lastErrorCode" TEXT,
 "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 "processedAt" TIMESTAMP(3),
 "updatedAt" TIMESTAMP(3) NOT NULL,
 CONSTRAINT "CommunicationEvent_pkey" PRIMARY KEY ("id"),
 CONSTRAINT "CommunicationEvent_state_check" CHECK ("state" IN ('RECEIVED','PROCESSING','PROCESSED','FAILED','IGNORED')),
 CONSTRAINT "CommunicationEvent_provider_check" CHECK ("provider" IN ('whatsapp','gmail','meta','telegram','calling')),
 CONSTRAINT "CommunicationEvent_attempts_check" CHECK ("attempts" >= 0)
);
CREATE UNIQUE INDEX "CommunicationEvent_provider_accountId_externalEventId_key" ON "CommunicationEvent"("provider","accountId","externalEventId");
CREATE INDEX "CommunicationEvent_state_nextAttemptAt_idx" ON "CommunicationEvent"("state","nextAttemptAt");
CREATE INDEX "CommunicationEvent_state_leaseExpiresAt_idx" ON "CommunicationEvent"("state","leaseExpiresAt");
