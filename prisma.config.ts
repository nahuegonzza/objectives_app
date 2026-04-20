import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL,
  },
});

// Validate SSL is configured
if (process.env.DATABASE_URL && !/[?&]sslmode=/.test(process.env.DATABASE_URL)) {
  console.warn('[Prisma Config] Warning: DATABASE_URL may not have sslmode=require configured');
}
