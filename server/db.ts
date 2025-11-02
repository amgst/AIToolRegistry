import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@shared/schema";
import path from "path";
import fs from "fs";

// Use SQLite - much simpler! No setup needed, just a file.
const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "database.sqlite");

// Ensure the database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create SQLite database connection
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL"); // Better performance

export const db = drizzle(sqlite, { schema });
