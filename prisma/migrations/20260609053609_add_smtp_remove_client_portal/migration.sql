/*
  Warnings:

  - You are about to drop the column `portalUserId` on the `Client` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT,
    "gstin" TEXT,
    "pan" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "stateCode" TEXT,
    "pincode" TEXT,
    "contactPerson" TEXT,
    "clientType" TEXT NOT NULL DEFAULT 'INDIVIDUAL',
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Client_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "Firm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Client" ("address", "city", "clientType", "contactPerson", "createdAt", "displayName", "email", "firmId", "gstin", "id", "isActive", "name", "notes", "pan", "phone", "pincode", "state", "stateCode", "updatedAt") SELECT "address", "city", "clientType", "contactPerson", "createdAt", "displayName", "email", "firmId", "gstin", "id", "isActive", "name", "notes", "pan", "phone", "pincode", "state", "stateCode", "updatedAt" FROM "Client";
DROP TABLE "Client";
ALTER TABLE "new_Client" RENAME TO "Client";
CREATE INDEX "Client_firmId_idx" ON "Client"("firmId");
CREATE TABLE "new_Firm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "gstin" TEXT,
    "pan" TEXT,
    "state" TEXT NOT NULL,
    "stateCode" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "invoicePrefix" TEXT NOT NULL DEFAULT 'INV',
    "invoiceCounter" INTEGER NOT NULL DEFAULT 0,
    "gstRate" REAL NOT NULL DEFAULT 18,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "smtpPass" TEXT,
    "smtpFrom" TEXT,
    "dailySummaryTo" TEXT,
    "dailySummaryOn" BOOLEAN NOT NULL DEFAULT true,
    "summaryTime" TEXT NOT NULL DEFAULT '08:00',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Firm" ("address", "city", "createdAt", "email", "gstRate", "gstin", "id", "invoiceCounter", "invoicePrefix", "name", "pan", "phone", "pincode", "state", "stateCode", "updatedAt", "website") SELECT "address", "city", "createdAt", "email", "gstRate", "gstin", "id", "invoiceCounter", "invoicePrefix", "name", "pan", "phone", "pincode", "state", "stateCode", "updatedAt", "website" FROM "Firm";
DROP TABLE "Firm";
ALTER TABLE "new_Firm" RENAME TO "Firm";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
