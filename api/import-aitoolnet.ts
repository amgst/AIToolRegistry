// Vercel serverless function to import tools from Aitoolnet.com
// Note: server/ and shared/ are copied to api/server/ and api/shared/ during build
import { storage } from "./server/storage.js";
import { scraperManager } from "./server/scrapers/scraper-manager.js";
import { sourcesStorage } from "./server/scrapers/sources-storage.js";
import type { InsertAiTool } from "./shared/schema.js";

async function performImport() {
  const limit = 500; // Import 500 tools
  const startTime = Date.now();

  try {
    console.log(`🚀 Starting import from Aitoolnet.com (limit: ${limit})...`);

    // Check if aitoolnet source exists, if not create it
    let aitoolnetSource = sourcesStorage.getAllSources().find(s => s.type === "aitoolnet");
    
    if (!aitoolnetSource) {
      aitoolnetSource = {
        id: "aitoolnet-default",
        name: "Aitoolnet.com",
        type: "aitoolnet",
        url: "https://www.aitoolnet.com/",
        enabled: true,
        limit: limit,
        concurrency: 10,
      };
      sourcesStorage.saveSource(aitoolnetSource);
    } else {
      // Update limit
      aitoolnetSource.limit = limit;
      aitoolnetSource.concurrency = 10;
      sourcesStorage.saveSource(aitoolnetSource);
    }

    console.log(`🔍 Scraping tools from Aitoolnet.com...`);
    const scrapeResult = await scraperManager.scrape(aitoolnetSource);

    if (!scrapeResult.success) {
      throw new Error(`Scraping failed: ${scrapeResult.errors?.join(', ') || 'Unknown error'}`);
    }

    console.log(`📦 Found ${scrapeResult.items.length} tools to process`);

    let totalInserted = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const errors: string[] = [];

    // Process and import tools
    for (let i = 0; i < scrapeResult.items.length; i++) {
      const item = scrapeResult.items[i];

      try {
        // Validate required fields
        if (!item.name || !item.websiteUrl) {
          totalSkipped++;
          continue;
        }

        // Generate slug if not provided
        const slug = item.slug || item.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");

        if (!slug) {
          totalSkipped++;
          continue;
        }

        // Check if tool already exists
        const existing = await storage.findDuplicateTool(slug, item.websiteUrl);
        if (existing) {
          totalSkipped++;
          continue;
        }

        // Prepare tool data
        const insertTool: InsertAiTool = {
          name: item.name,
          slug,
          description: item.description || item.shortDescription || item.name,
          shortDescription: item.shortDescription || item.description || item.name,
          category: item.category || "Content AI",
          pricing: item.pricing || "Unknown",
          websiteUrl: item.websiteUrl,
          logoUrl: item.logoUrl || undefined,
          features: Array.isArray(item.features) ? item.features : [],
          tags: Array.isArray(item.tags) ? item.tags : [],
          useCases: Array.isArray(item.useCases) ? item.useCases : [],
          screenshots: Array.isArray(item.screenshots) ? item.screenshots : [],
          badge: item.badge || undefined,
          rating: item.rating || undefined,
          sourceDetailUrl: item.sourceDetailUrl || undefined,
        };

        // Insert into Firestore
        await storage.createTool(insertTool);
        totalInserted++;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`${item.name || 'unnamed'}: ${errorMsg}`);
        totalErrors++;
      }
    }

    const totalTime = Date.now() - startTime;
    const totalTools = await storage.getAllTools().then(tools => tools.length).catch(() => 0);

    const result = {
      success: true,
      summary: {
        scraped: scrapeResult.items.length,
        inserted: totalInserted,
        skipped: totalSkipped,
        errors: totalErrors,
        totalTimeMs: totalTime,
        totalTimeMinutes: (totalTime / 1000 / 60).toFixed(2),
      },
      totalToolsInDatabase: totalTools,
      errors: errors.length > 0 && errors.length <= 20 ? errors : (errors.length > 20 ? errors.slice(0, 10) : undefined),
    };

    console.log(`✅ Import complete: ${totalInserted} inserted, ${totalSkipped} skipped, ${totalErrors} errors`);

    return result;

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error(`❌ Fatal error during import: ${errorMsg}`, errorStack);
    throw error; // Re-throw to be caught by handler
  }
}

export default async function handler(req: any, res: any) {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed. Use POST.' });
    }

    // Optional: Add basic authentication check
    const authToken = req.headers?.authorization?.replace('Bearer ', '');
    const expectedToken = process.env.IMPORT_TOKEN;
    if (expectedToken && authToken !== expectedToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await performImport();
    return res.status(200).json(result);

  } catch (handlerError) {
    const errorMsg = handlerError instanceof Error ? handlerError.message : String(handlerError);
    const errorStack = handlerError instanceof Error ? handlerError.stack : undefined;
    console.error(`❌ Handler error: ${errorMsg}`, errorStack);
    return res.status(500).json({
      error: "Import failed",
      message: errorMsg,
      ...(process.env.NODE_ENV === 'development' && errorStack ? { stack: errorStack } : {}),
    });
  }
}
