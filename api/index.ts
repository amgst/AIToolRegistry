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
      const { db } = await import("../server/db");
      const { aiTools } = await import("@shared/schema");
      const tools = await db.select().from(aiTools).limit(1);
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

