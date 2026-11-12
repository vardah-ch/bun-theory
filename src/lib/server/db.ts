import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// One client per server process. In dev, hot reloads would otherwise open a
// new connection pool on every edit.
const globalForDb = globalThis as unknown as { prisma?: PrismaClient };

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env (see README).");
  const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  if (process.env.NODE_ENV !== "production") globalForDb.prisma = client;
  return client;
}

let client: PrismaClient | undefined = globalForDb.prisma;

/**
 * Created on first use, not on import. Without a database configured, a
 * missing DATABASE_URL then fails only the request that needs the database
 * (inside its own error handling), and pages that can fall back to the
 * bundled menu still render.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_, prop) {
    client ??= create();
    const value = Reflect.get(client, prop, client);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
