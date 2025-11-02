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
    const { db } = await import("../server/db");
    const { aiTools } = await import("@shared/schema");
    const tools = await db.select().from(aiTools).limit(1);
    
    const dbType = process.env.DATABASE_URL || process.env.POSTGRES_URL 
      ? "PostgreSQL" 
      : "SQLite";
    
    return res.json({
      status: "ok",
      database: {
        type: dbType,
        connected: true,
        hasData: tools.length > 0,
      },
      issues: [
        dbType === "SQLite" ? "⚠️ SQLite doesn't work on Vercel - need PostgreSQL" : null,
        tools.length === 0 ? "⚠️ No tools in database - need to seed data" : null,
      ].filter(Boolean),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasPostgresUrl: !!process.env.POSTGRES_URL,
      },
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

