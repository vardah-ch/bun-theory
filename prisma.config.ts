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
    url: process.env.DATABASE_URL,
  },
});
