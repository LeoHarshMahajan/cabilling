const { PrismaClient } = require("../app/generated/prisma/client.js");
const { PrismaBetterSQLite3 } = require("@prisma/adapter-better-sqlite3");
const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");

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
  const sqlite = new Database(path.join(__dirname, "dev.db"));
  const adapter = new PrismaBetterSQLite3(sqlite);
  const db = new PrismaClient({ adapter });

  const firm = await db.firm.upsert({
    where: { id: "firm-1" },
    update: {},
    create: {
      id: "firm-1",
      name: "Sharma & Associates",
      gstin: "27AABCS1234A1Z5",
      pan: "AABCS1234A",
      state: "Maharashtra",
      stateCode: "27",
      address: "123, CA Street, Andheri West",
      city: "Mumbai",
      pincode: "400053",
      phone: "9876543210",
      email: "info@sharmaassociates.com",
      invoicePrefix: "SA",
      invoiceCounter: 0,
      gstRate: 18,
    },
  });

  const adminPwd = await bcrypt.hash("admin123", 10);
  const caPwd = await bcrypt.hash("ca123", 10);

  await db.user.upsert({
    where: { email: "admin@ca.com" },
    update: {},
    create: { name: "Rajesh Sharma", email: "admin@ca.com", password: adminPwd, role: "ADMIN", firmId: firm.id },
  });

  await db.user.upsert({
    where: { email: "ca@ca.com" },
    update: {},
    create: { name: "Priya Patel", email: "ca@ca.com", password: caPwd, role: "CA", firmId: firm.id },
  });

  for (const svc of CA_SERVICES) {
    await db.service.create({ data: { firmId: firm.id, ...svc } });
  }

  const clients = [
    { name: "Mehta Traders Pvt Ltd", gstin: "27AAACM1234A1Z1", pan: "AAACM1234A", clientType: "COMPANY", state: "Maharashtra", stateCode: "27", city: "Mumbai" },
    { name: "Suresh Kumar", pan: "AAAPS5678B", clientType: "INDIVIDUAL", state: "Maharashtra", stateCode: "27", city: "Pune" },
    { name: "Gujarat Exports LLP", gstin: "24AABCG5678B1Z2", pan: "AABCG5678B", clientType: "LLP", state: "Gujarat", stateCode: "24", city: "Ahmedabad" },
    { name: "Delhi Tech Solutions", gstin: "07AABCD9012C1Z3", pan: "AABCD9012C", clientType: "COMPANY", state: "Delhi", stateCode: "07", city: "New Delhi" },
  ];

  for (const c of clients) {
    await db.client.create({ data: { ...c, firmId: firm.id } });
  }

  console.log("✅ Seed complete");
  console.log("   Admin: admin@ca.com / admin123");
  console.log("   CA:    ca@ca.com / ca123");
  await db.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
