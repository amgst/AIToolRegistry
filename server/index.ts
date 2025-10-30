import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import cron from "node-cron";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);

  // reusePort is not supported on Windows; enable it only on non-Windows platforms
  const listenOptions: any = {
    port,
    host: "0.0.0.0",
    // Only set reusePort when supported
    ...(process.platform !== "win32" ? { reusePort: true } : {}),
  };

  server.listen(listenOptions, () => {
    // Log the full preview URL for tooling to detect easily
    log(`serving on http://localhost:${port}/`);

    // Schedule a daily auto-import job at 03:00 UTC
    const sources = [
      "https://www.aitoolnet.com/text-to-speech",
      "https://www.aitoolnet.com/copywriting",
      "https://www.aitoolnet.com/image-generator",
    ];

    cron.schedule(
      "0 3 * * *",
      async () => {
        try {
          for (const src of sources) {
            const resp = await fetch(`http://localhost:${port}/api/ingest/aitoolnet`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ url: src, limit: 25 }),
            });
            const json = await resp.json().catch(() => ({}));
            log(`auto-import (${src}) => ${resp.status} :: ${JSON.stringify(json)}`);
          }
        } catch (e) {
          console.error("Auto-import job failed:", e);
        }
      },
      { timezone: "UTC" }
    );
  });
})();
