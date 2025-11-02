// Health check endpoint to diagnose database and data issues
import type { Request, Response } from "express";
import { db } from "../server/db";
import { aiTools } from "@shared/schema";

export default async function handler(req: Request, res: Response) {
  try {
    // Try to query the database
    const tools = await db.select().from(aiTools).limit(1);
    
    // Check database type
    const dbType = process.env.DATABASE_URL ? "PostgreSQL" : 
                   process.env.POSTGRES_URL ? "PostgreSQL" : 
                   "SQLite";
    
    return res.json({
      status: "ok",
      database: {
        type: dbType,
        connected: true,
        toolCount: tools.length > 0 ? "some" : "none",
      },
      issues: [
        dbType === "SQLite" ? "⚠️ SQLite doesn't work on Vercel - need PostgreSQL" : null,
        tools.length === 0 ? "⚠️ No tools in database - need to seed data" : null,
      ].filter(Boolean),
      recommendations: [
        dbType === "SQLite" ? "Migrate to Vercel Postgres" : null,
        tools.length === 0 ? "Run seed script or use admin panel to import tools" : null,
      ].filter(Boolean),
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error instanceof Error ? error.message : String(error),
      database: {
        type: process.env.DATABASE_URL ? "PostgreSQL" : "SQLite",
        connected: false,
      },
      issues: [
        "❌ Database connection failed",
        "SQLite file may not exist or be accessible on Vercel",
        "PostgreSQL connection string may be missing",
      ],
    });
  }
}

