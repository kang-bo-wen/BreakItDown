-- CreateTable
CREATE TABLE "TemplateSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "identificationResult" JSONB NOT NULL,
    "treeData" JSONB NOT NULL,
    "nodePositions" JSONB,
    "agentReports" JSONB NOT NULL,
    "productionAnalysis" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "TemplateSession_templateKey_key" ON "TemplateSession"("templateKey");

-- CreateIndex
CREATE INDEX "TemplateSession_templateKey_idx" ON "TemplateSession"("templateKey");

-- CreateIndex
CREATE INDEX "TemplateSession_category_idx" ON "TemplateSession"("category");
