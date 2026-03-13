-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TemplateSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateKey" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "dimensions" TEXT NOT NULL DEFAULT '["mechanical"]',
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
INSERT INTO "new_TemplateSession" ("agentReports", "category", "createdAt", "displayName", "id", "identificationResult", "isActive", "keywords", "nodePositions", "priority", "productionAnalysis", "templateKey", "treeData", "updatedAt") SELECT "agentReports", "category", "createdAt", "displayName", "id", "identificationResult", "isActive", "keywords", "nodePositions", "priority", "productionAnalysis", "templateKey", "treeData", "updatedAt" FROM "TemplateSession";
DROP TABLE "TemplateSession";
ALTER TABLE "new_TemplateSession" RENAME TO "TemplateSession";
CREATE UNIQUE INDEX "TemplateSession_templateKey_key" ON "TemplateSession"("templateKey");
CREATE INDEX "TemplateSession_templateKey_idx" ON "TemplateSession"("templateKey");
CREATE INDEX "TemplateSession_category_idx" ON "TemplateSession"("category");
CREATE INDEX "TemplateSession_dimensions_idx" ON "TemplateSession"("dimensions");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
