// Database connection - supports both SQLite (local) and PostgreSQL (Vercel)
// Don't import schema at top level - import dynamically to avoid module load issues

// Check if we should use PostgreSQL (Vercel Postgres)
const usePostgres = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);

let dbInstance: any;
let dbInitialized = false;
let dbError: Error | null = null;

async function initializeDatabase() {
  if (dbInitialized) {
    if (dbError) throw dbError;
    return dbInstance;
  }
  
  dbInitialized = true;
  
  try {
    if (usePostgres) {
      // PostgreSQL mode (Vercel Postgres)
      const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
      
      if (!connectionString) {
        throw new Error("POSTGRES_URL or DATABASE_URL environment variable is required for PostgreSQL");
      }
      
      // Use Neon serverless driver for Vercel (works with connection pooling)
      const { neon } = await import("@neondatabase/serverless");
      const { drizzle: drizzlePostgres } = await import("drizzle-orm/neon-http");
      
      const sql = neon(connectionString);
      
      // Dynamically import schema to avoid module load issues
      const schemaModule = await import("@shared/schema");
      dbInstance = drizzlePostgres(sql, { schema: schemaModule });
      
      console.log("✅ Connected to PostgreSQL (Vercel Postgres)");
    } else {
      // SQLite mode (local development)
      const Database = (await import("better-sqlite3")).default;
      const { drizzle: drizzleSQLite } = await import("drizzle-orm/better-sqlite3");
      const path = await import("path");
      const fs = await import("fs");
      
      const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), "database.sqlite");
      const dbDir = path.dirname(dbPath);
      
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      
      const sqlite = new Database(dbPath);
      sqlite.pragma("journal_mode = WAL");
      
      // Dynamically import schema to avoid module load issues
      const schemaModule = await import("@shared/schema");
      dbInstance = drizzleSQLite(sqlite, { schema: schemaModule });
      
      console.log("✅ Connected to SQLite (local development)");
    }
    
    return dbInstance;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Database initialization failed:", errorMessage);
    dbError = error instanceof Error ? error : new Error(String(error));
    throw dbError;
  }
}

// Initialize database eagerly - this will be called when module loads
// In serverless, this won't crash because we catch errors gracefully
let cachedDb: any = null;

// Get the database instance - use this in storage methods
export async function getDb() {
  if (!cachedDb) {
    cachedDb = await initializeDatabase();
  }
  return cachedDb;
}

// For backwards compatibility, export db as a getter
// Storage methods should use: const db = await getDb();
export const db = {
  async select() {
    const dbInstance = await getDb();
    return dbInstance.select();
  },
  async insert(table: any) {
    const dbInstance = await getDb();
    return dbInstance.insert(table);
  },
  async update(table: any) {
    const dbInstance = await getDb();
    return dbInstance.update(table);
  },
  async delete(table: any) {
    const dbInstance = await getDb();
    return dbInstance.delete(table);
  }
};
