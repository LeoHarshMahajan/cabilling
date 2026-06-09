import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";
import path from "path";

// Use DATABASE_FILE env var in production so the DB lives outside the app directory.
// Falls back to prisma/dev.db for local development.
const dbPath = process.env.DATABASE_FILE ?? path.join(process.cwd(), "prisma/dev.db");
const dbUrl = `file:${dbPath}`;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  // Enable WAL mode so concurrent readers don't block on writes
  const raw = new Database(dbPath);
  raw.pragma("journal_mode = WAL");
  raw.pragma("busy_timeout = 5000");
  raw.close();

  const adapter = new PrismaBetterSqlite3({ url: dbUrl });
  return new PrismaClient({ adapter } as any);
}

export const db = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
