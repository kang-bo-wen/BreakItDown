-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DeconstructionSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "rootObjectName" TEXT NOT NULL,
    "rootObjectIcon" TEXT,
    "rootObjectImage" TEXT,
    "treeData" JSONB NOT NULL,
    "identificationResult" JSONB,
    "promptSettings" JSONB,
    "breakdownMode" TEXT,
    "knowledgeCache" JSONB,
    "nodePositions" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastAccessedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DeconstructionSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProductionAnalysisProgress" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "currentStep" TEXT NOT NULL DEFAULT 'product-planning',
    "productPlan" JSONB,
    "competitorAnalysis" JSONB,
    "suppliers" JSONB,
    "selectedSupplier" JSONB,
    "customizationQuestions" JSONB,
    "customizationAnswers" JSONB,
    "processes" JSONB,
    "selectedProcess" JSONB,
    "analysisResult" JSONB,
    "finalReport" JSONB,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProductionAnalysisProgress_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "DeconstructionSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "DeconstructionSession_userId_updatedAt_idx" ON "DeconstructionSession"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "DeconstructionSession_userId_lastAccessedAt_idx" ON "DeconstructionSession"("userId", "lastAccessedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProductionAnalysisProgress_sessionId_partId_key" ON "ProductionAnalysisProgress"("sessionId", "partId");
