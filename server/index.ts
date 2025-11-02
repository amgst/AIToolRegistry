import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import cron from "node-cron";
import { setupVite, serveStatic, log } from "./vite";
import { sourcesStorage } from "./scrapers/sources-storage";

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

    // Schedule auto-import jobs for all enabled sources with schedules
    const scheduledJobs = new Map<string, cron.ScheduledTask>();

    function scheduleSource(source: { id: string; schedule?: string; enabled: boolean }) {
      // Remove existing job if any
      const existing = scheduledJobs.get(source.id);
      if (existing) {
        existing.stop();
        scheduledJobs.delete(source.id);
      }

      // Only schedule if enabled and has a schedule
      if (!source.enabled || !source.schedule) {
        return;
      }

      // Validate cron expression
      if (!cron.validate(source.schedule)) {
        log(`Invalid cron schedule for source ${source.id}: ${source.schedule}`);
        return;
      }

      const task = cron.schedule(
        source.schedule,
        async () => {
          try {
            log(`Auto-import job triggered for source ${source.id}`);
            const resp = await fetch(`http://localhost:${port}/api/scrapers/ingest/${source.id}`, {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ dryRun: false }),
            });
            const json = await resp.json().catch(() => ({}));
            log(`auto-import (${source.id}) => ${resp.status} :: ${JSON.stringify(json)}`);
          } catch (e) {
            console.error(`Auto-import job failed for source ${source.id}:`, e);
          }
        },
        { timezone: "UTC" }
      );

      scheduledJobs.set(source.id, task);
      log(`Scheduled auto-import for source ${source.id} with schedule: ${source.schedule}`);
    }

    // Schedule all initial sources
    sourcesStorage.getAllSources().forEach(scheduleSource);

    // TODO: Add API endpoint to re-schedule jobs when sources are updated
    // For now, restarting the server will pick up new schedules
  });
})();
