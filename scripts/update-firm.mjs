import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client.ts";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adapter = new PrismaBetterSqlite3({ url: `file:${path.join(__dirname, "../prisma/dev.db")}` });
const db = new PrismaClient({ adapter });

const firm = await db.firm.update({
  where: { id: "firm-1" },
  data: { name: "Mittal Gupta & Associates", invoicePrefix: "MGA" },
});
console.log("✅ Firm updated:", firm.name);
await db.$disconnect();
