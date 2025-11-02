import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";
import fs from "fs";

// Use SQLite - much simpler! No setup needed, just a file.
// NOTE: SQLite doesn't work on Vercel! Use PostgreSQL instead.
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "database.sqlite");

// Check if we're on Vercel
const isVercel = !!process.env.VERCEL;

// Lazy database initialization to prevent crashes during module load
let db: ReturnType<typeof drizzle> | null = null;
let sqlite: Database.Database | null = null;
let dbInitialized = false;
let dbError: Error | null = null;

function initializeDatabase() {
  if (dbInitialized) {
    if (dbError) throw dbError;
    return db!;
  }
  
  dbInitialized = true;
  
  try {
    if (isVercel) {
      // On Vercel, SQLite won't work - provide clear error
      if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
        throw new Error(
          "SQLite doesn't work on Vercel. " +
          "Please set DATABASE_URL or POSTGRES_URL environment variable and migrate to PostgreSQL. " +
          "See DEPLOYMENT.md for instructions."
        );
      } else {
        throw new Error(
          "PostgreSQL connection string detected but database code still uses SQLite. " +
          "Please migrate server/db.ts to use PostgreSQL. See DEPLOYMENT.md"
        );
      }
    }
    
    // SQLite mode (local development only)
    // Ensure the database directory exists
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL"); // Better performance
    db = drizzle(sqlite, { schema });
    
    return db;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Database initialization failed:", errorMessage);
    dbError = error instanceof Error ? error : new Error(String(error));
    
    // On Vercel, don't throw immediately - let it fail gracefully when accessed
    if (isVercel) {
      console.error("⚠️ Database unavailable on Vercel. Functions will return empty results.");
      return null;
    }
    
    throw dbError;
  }
}

// Create a proxy that initializes on first access
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const actualDb = initializeDatabase();
    if (!actualDb) {
      // Return a mock db object that throws helpful errors
      throw new Error(
        "Database unavailable on Vercel. " +
        "SQLite doesn't work on serverless platforms. " +
        "Please migrate to PostgreSQL (Vercel Postgres). " +
        "See DEPLOYMENT.md for migration instructions."
      );
    }
    const value = actualDb[prop as keyof typeof actualDb];
    if (typeof value === 'function') {
      return value.bind(actualDb);
    }
    return value;
  }
});
