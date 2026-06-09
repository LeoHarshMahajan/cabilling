// @ts-ignore
import { PrismaClient } from "../app/generated/prisma/client";
// @ts-ignore
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import bcrypt from "bcryptjs";
import { parseDbUrl } from "../lib/db";

const CA_SERVICES = [
  { name: "Income Tax Return Filing (ITR-1)", sacCode: "998231", defaultAmount: 2000 },
  { name: "Income Tax Return Filing (ITR-2/3)", sacCode: "998231", defaultAmount: 4000 },
  { name: "Income Tax Return Filing (ITR-4)", sacCode: "998231", defaultAmount: 3000 },
  { name: "GST Registration", sacCode: "998233", defaultAmount: 2500 },
  { name: "GST Return Filing (GSTR-1)", sacCode: "998233", defaultAmount: 1500 },
  { name: "GST Return Filing (GSTR-3B)", sacCode: "998233", defaultAmount: 1500 },
  { name: "GST Annual Return (GSTR-9)", sacCode: "998233", defaultAmount: 5000 },
  { name: "Tax Audit (Form 3CA/3CB)", sacCode: "998232", defaultAmount: 15000 },
  { name: "Statutory Audit", sacCode: "998232", defaultAmount: 25000 },
  { name: "Internal Audit", sacCode: "998232", defaultAmount: 20000 },
  { name: "Company Incorporation", sacCode: "998214", defaultAmount: 10000 },
  { name: "ROC Filing (Annual Return)", sacCode: "998214", defaultAmount: 5000 },
  { name: "LLP Incorporation", sacCode: "998214", defaultAmount: 8000 },
  { name: "Bookkeeping & Accounting", sacCode: "998231", defaultAmount: 3000 },
  { name: "Payroll Processing", sacCode: "998231", defaultAmount: 2000 },
  { name: "TDS Return Filing", sacCode: "998233", defaultAmount: 2000 },
  { name: "MSME Registration", sacCode: "998214", defaultAmount: 1500 },
  { name: "PF/ESI Compliance", sacCode: "998233", defaultAmount: 2500 },
  { name: "Financial Statement Preparation", sacCode: "998231", defaultAmount: 5000 },
  { name: "Management Consultancy", sacCode: "998399", defaultAmount: 10000 },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL environment variable is not set");
  const adapter = new PrismaMariaDb(parseDbUrl(url) as any);
  const db = new PrismaClient({ adapter });

  const firm = await db.firm.upsert({
    where: { id: "firm-1" },
    update: {},
    create: {
      id: "firm-1",
      name: "Mittal Gupta & Associates",
      gstin: "27AABCM1234A1Z5",
      pan: "AABCM1234A",
      state: "Maharashtra",
      stateCode: "27",
      address: "123, CA Street, Andheri West",
      city: "Mumbai",
      pincode: "400053",
      phone: "9876543210",
      email: "info@mgadvisors.in",
      invoicePrefix: "MGA",
      invoiceCounter: 0,
      gstRate: 18,
    },
  });

  const adminPwd = await bcrypt.hash("ub4arNsFg5J9XB", 12);

  await db.user.upsert({
    where: { email: "nehagupta@mgadvisors.in" },
    update: {},
    create: {
      name: "Neha Gupta",
      email: "nehagupta@mgadvisors.in",
      password: adminPwd,
      role: "ADMIN",
      firmId: firm.id,
    },
  });

  for (const svc of CA_SERVICES) {
    await db.service.upsert({
      where: { id: `svc-${svc.sacCode}-${svc.name.slice(0, 10)}` },
      update: {},
      create: { id: `svc-${svc.sacCode}-${svc.name.slice(0, 10)}`, firmId: firm.id, ...svc },
    });
  }

  console.log("✅ Seed complete");
  console.log("   Admin: nehagupta@mgadvisors.in / ub4arNsFg5J9XB");

  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
