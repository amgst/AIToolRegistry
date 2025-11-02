// Vercel Cron Job handler for scheduled scraping
// Vercel cron jobs call this endpoint automatically
export default async function handler(req: any, res: any) {
  if (req.method && req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { sourcesStorage } = await import("../../server/scrapers/sources-storage");
    const sources = sourcesStorage.getAllSources().filter(s => s.enabled && s.schedule);
    
    const host = req.headers.host || "localhost:5000";
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const baseUrl = `${protocol}://${host}`;
    
    const results = [];
    
    for (const source of sources) {
      try {
        const resp = await fetch(`${baseUrl}/api/scrapers/ingest/${source.id}`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ dryRun: false }),
        });
        const json = await resp.json().catch(() => ({}));
        results.push({ sourceId: source.id, status: resp.status, result: json });
        console.log(`Cron job: ${source.id} => ${resp.status} :: ${JSON.stringify(json)}`);
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        results.push({ sourceId: source.id, error: errorMsg });
        console.error(`Cron job failed for ${source.id}:`, e);
      }
    }
    
    return res.json({ 
      success: true, 
      processed: sources.length,
      results 
    });
  } catch (error) {
    console.error("Cron job handler error:", error);
    return res.status(500).json({ 
      error: "Failed to process cron job",
      details: error instanceof Error ? error.message : String(error)
    });
  }
}

