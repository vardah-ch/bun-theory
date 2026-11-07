import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// One client per server process. In dev, hot reloads would otherwise open a
// new connection pool on every edit.
const globalForDb = globalThis as unknown as { prisma?: PrismaClient };

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env (see README).");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
}

export const db = globalForDb.prisma ?? create();
if (process.env.NODE_ENV !== "production") globalForDb.prisma = db;
