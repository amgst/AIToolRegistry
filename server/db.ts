import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import { Pool as PgPool } from 'pg';
import ws from "ws";
import * as schema from "@shared/schema";

// Configure Neon to use the ws implementation
neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL or NEON_DATABASE_URL must be set. Did you forget to add your Neon connection string?",
  );
}

// Detect local Postgres and use node-postgres instead of Neon websockets
let isLocal = false;
try {
  const host = new URL(databaseUrl).hostname || "";
  isLocal = /^(localhost|127\.0\.0\.1)$/i.test(host);
} catch {
  // If URL parsing fails, assume non-local (Neon) and proceed
}

export const db = (() => {
  if (isLocal) {
    const pgPool = new PgPool({ connectionString: databaseUrl });
    return drizzlePg(pgPool, { schema });
  }

  const neonPool = new NeonPool({ connectionString: databaseUrl });
  return drizzleNeon({ client: neonPool, schema });
})();
