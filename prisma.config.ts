import { defineConfig } from "prisma/config";

// The Prisma CLI doesn't read .env by itself; Node 24 can.
try {
  process.loadEnvFile(".env");
} catch {
  // No .env file: rely on the real environment (CI, hosting).
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // Migrations need a direct (unpooled) connection; Neon on Vercel provides
    // one as DATABASE_URL_UNPOOLED. The running site uses the pooled DATABASE_URL.
    url: process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL,
  },
});
