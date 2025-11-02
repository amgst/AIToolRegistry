import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";
import fs from "fs";

// Use SQLite - much simpler! No setup needed, just a file.
// NOTE: SQLite doesn't work on Vercel! Use PostgreSQL instead.
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "database.sqlite");

// Check if we're on Vercel and should use PostgreSQL
const isVercel = process.env.VERCEL || process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (isVercel && !process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
  console.warn("⚠️ WARNING: Running on Vercel but no PostgreSQL connection string found!");
  console.warn("⚠️ SQLite will not work on Vercel. Please set DATABASE_URL or POSTGRES_URL environment variable.");
  console.warn("⚠️ See DEPLOYMENT.md for migration instructions.");
}

// Ensure the database directory exists (only for local SQLite)
if (!isVercel) {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

let db: ReturnType<typeof drizzle>;
let sqlite: Database.Database | null = null;

try {
  if (isVercel && (process.env.DATABASE_URL || process.env.POSTGRES_URL)) {
    // PostgreSQL mode - will be handled by migration
    // For now, throw error to make migration obvious
    throw new Error(
      "PostgreSQL connection string detected but database code still uses SQLite. " +
      "Please migrate server/db.ts to use PostgreSQL. See DEPLOYMENT.md"
    );
  } else {
    // SQLite mode (local development)
    sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL"); // Better performance
    db = drizzle(sqlite, { schema });
  }
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  console.error("❌ Database initialization failed:", errorMessage);
  
  // On Vercel, provide helpful error message
  if (isVercel) {
    throw new Error(
      `Database initialization failed on Vercel. ` +
      `SQLite is not supported. Please migrate to PostgreSQL. ` +
      `Error: ${errorMessage}`
    );
  }
  
  throw error;
}

export { db };
