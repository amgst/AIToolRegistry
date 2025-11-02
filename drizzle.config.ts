import { defineConfig } from "drizzle-kit";
import path from "path";

// Support both SQLite (local) and PostgreSQL (Neon on Vercel)
const usePostgres = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: usePostgres ? "postgresql" : "sqlite",
  dbCredentials: usePostgres 
    ? {
        url: process.env.POSTGRES_URL || process.env.DATABASE_URL || "",
      }
    : {
        url: process.env.DATABASE_PATH || path.join(process.cwd(), "database.sqlite"),
      },
});
