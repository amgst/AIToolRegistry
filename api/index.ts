// Vercel serverless function entry point for Express app
// This exports the Express app as a serverless function handler
import express, { type Express } from "express";
import { registerRoutes } from "../server/routes";
import path from "path";
import fs from "fs";

const app: Express = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const requestPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (requestPath.startsWith("/api")) {
      let logLine = `${req.method} ${requestPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      console.log(logLine);
    }
  });

  next();
});

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
});

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(process.cwd(), "dist/public");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.use("*", (_req, res) => {
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }
}

// Auto-create tables endpoint (one-time setup)
app.get("/api/health/create-tables", async (req, res) => {
  try {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    
    if (!connectionString) {
      return res.status(400).json({
        success: false,
        error: "POSTGRES_URL not set. Make sure Neon is connected in Vercel.",
      });
    }
    
    // Use Neon serverless client directly
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(connectionString);
    
    // Check if table exists using a regular SQL query
    const checkQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'ai_tools'
      ) as exists;
    `;
    
    const checkResult = await sql(checkQuery);
    const tableExists = checkResult?.[0]?.exists || false;
    
    if (tableExists) {
      return res.json({
        success: true,
        message: "Tables already exist!",
        action: "none",
      });
    }
    
    // Table doesn't exist - create it using raw SQL
    // Using TEXT for JSON fields (same as SQLite) for compatibility
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS ai_tools (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        slug VARCHAR(255) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        short_description VARCHAR(500) NOT NULL,
        category VARCHAR(100) NOT NULL,
        pricing VARCHAR(50) NOT NULL,
        website_url VARCHAR(500) NOT NULL,
        logo_url VARCHAR(500),
        features TEXT NOT NULL DEFAULT '[]',
        tags TEXT NOT NULL DEFAULT '[]',
        badge VARCHAR(50),
        rating INTEGER,
        source_detail_url VARCHAR(500),
        developer VARCHAR(255),
        documentation_url VARCHAR(500),
        social_links TEXT DEFAULT '{}',
        use_cases TEXT DEFAULT '[]',
        launch_date VARCHAR(50),
        last_updated VARCHAR(50),
        screenshots TEXT DEFAULT '[]',
        pricing_details TEXT DEFAULT '{}'
      );
    `;
    
    await sql(createTableQuery);
    
    return res.json({
      success: true,
      message: "Tables created successfully! 🎉",
      action: "created",
      nextStep: "Visit /admin to add your first tool",
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error creating tables:", error);
    
    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: error instanceof Error ? error.stack : String(error),
      hint: "If this persists, try running 'npx drizzle-kit push' locally with POSTGRES_URL set",
    });
  }
});

// Health check endpoint for debugging
app.get("/api/health", async (req, res) => {
  try {
    const isVercel = !!process.env.VERCEL;
    const dbType = process.env.DATABASE_URL || process.env.POSTGRES_URL 
      ? "PostgreSQL" 
      : "SQLite";
    
    let dbConnected = false;
    let hasData = false;
    let errorMessage = null;
    
    try {
      const { getDb } = await import("../server/db");
      const { aiTools } = await import("@shared/schema");
      const dbInstance = await getDb();
      const tools = await dbInstance.select().from(aiTools).limit(1);
      dbConnected = true;
      hasData = tools.length > 0;
    } catch (dbError) {
      dbConnected = false;
      errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
    }
    
    const issues: string[] = [];
    if (!dbConnected) {
      issues.push("❌ Database connection failed");
      if (isVercel && dbType === "SQLite") {
        issues.push("SQLite doesn't work on Vercel - need PostgreSQL");
      }
      if (errorMessage) {
        issues.push(`Error: ${errorMessage}`);
      }
    }
    if (dbConnected && !hasData) {
      issues.push("⚠️ No tools in database - need to seed data");
    }
    if (isVercel && dbType === "SQLite") {
      issues.push("⚠️ SQLite doesn't work on Vercel - need PostgreSQL");
    }
    
    return res.json({
      status: dbConnected ? "ok" : "error",
      platform: isVercel ? "Vercel" : "Local",
      database: {
        type: dbType,
        connected: dbConnected,
        hasData: hasData,
        error: errorMessage,
      },
      issues: issues.length > 0 ? issues : undefined,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
        isVercel: isVercel,
      },
      recommendations: [
        !dbConnected && isVercel && dbType === "SQLite" 
          ? "Migrate to Vercel Postgres - see DEPLOYMENT.md" 
          : null,
        dbConnected && !hasData 
          ? "Run seed script or use admin panel to import tools" 
          : null,
      ].filter(Boolean),
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      error: error instanceof Error ? error.message : String(error),
      database: {
        connected: false,
      },
      issues: [
        "❌ Database connection failed",
        "SQLite file may not exist or be accessible on Vercel",
        "PostgreSQL connection string may be missing",
      ],
    });
  }
});

// Initialize routes (registerRoutes returns a server, but we don't need it in serverless)
let isInitialized = false;
let initPromise: Promise<void> | null = null;

async function initialize() {
  if (isInitialized) return;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    await registerRoutes(app);
    isInitialized = true;
  })();
  
  await initPromise;
}

// Initialize on import
initialize().catch(console.error);

// Vercel serverless function handler - exports Express app
export default app;

