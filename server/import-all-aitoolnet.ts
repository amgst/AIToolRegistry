// Import all tools from Aitoolnet.com to Firestore
import { storage } from "./storage.js";
import { scraperManager } from "./scrapers/scraper-manager.js";
import { sourcesStorage } from "./scrapers/sources-storage.js";
import type { InsertAiTool } from "@shared/schema.js";

async function importAllFromAitoolnet() {
  console.log("🚀 Starting import from Aitoolnet.com...\n");
  console.log("📊 Will import up to 500 tools\n");

  // Check if aitoolnet source exists, if not create it
  let aitoolnetSource = sourcesStorage.getAllSources().find(s => s.type === "aitoolnet");
  
  if (!aitoolnetSource) {
    console.log("📝 Creating aitoolnet source...");
    aitoolnetSource = {
      id: "aitoolnet-default",
      name: "Aitoolnet.com",
      type: "aitoolnet",
      url: "https://www.aitoolnet.com/",
      enabled: true,
      limit: 500, // Import 500 tools
      concurrency: 10, // Reasonable concurrency to avoid overwhelming the server
    };
    sourcesStorage.saveSource(aitoolnetSource);
    console.log("✅ Source created\n");
  } else {
    // Update limit to 500
    aitoolnetSource.limit = 500;
    aitoolnetSource.concurrency = 10;
    sourcesStorage.saveSource(aitoolnetSource);
    console.log("✅ Using existing source with updated limits\n");
  }

  console.log(`⚙️  Configuration:`);
  console.log(`   - URL: ${aitoolnetSource.url}`);
  console.log(`   - Limit: ${aitoolnetSource.limit} tools`);
  console.log(`   - Concurrency: ${aitoolnetSource.concurrency}\n`);

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  const errors: string[] = [];

  try {
    console.log("🔍 Scraping tools from Aitoolnet.com...");
    console.log("⏳ This may take a while (10-30 minutes depending on network speed)...\n");

    const startTime = Date.now();
    const scrapeResult = await scraperManager.scrape(aitoolnetSource);
    const scrapeTime = Date.now() - startTime;

    if (!scrapeResult.success) {
      console.error("❌ Scraping failed:");
      scrapeResult.errors?.forEach(err => console.error(`   - ${err}`));
      process.exit(1);
    }

    console.log(`✅ Scraping complete in ${(scrapeTime / 1000).toFixed(1)}s`);
    console.log(`📦 Found ${scrapeResult.items.length} tools to process\n`);

    if (scrapeResult.items.length === 0) {
      console.log("⚠️  No tools found. Nothing to import.");
      return;
    }

    // Process and import tools
    console.log("💾 Importing tools to Firestore...\n");
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < scrapeResult.items.length; i += batchSize) {
      batches.push(scrapeResult.items.slice(i, i + batchSize));
    }

    console.log(`📊 Processing ${batches.length} batches of up to ${batchSize} tools each...\n`);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchStartTime = Date.now();

      console.log(`\n🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} tools)...`);

      for (let i = 0; i < batch.length; i++) {
        const item = batch[i];
        const toolIndex = batchIndex * batchSize + i + 1;
        const progress = `[${toolIndex}/${scrapeResult.items.length}]`;

        try {
          // Validate required fields
          if (!item.name || !item.websiteUrl) {
            console.log(`${progress} ⏭️  Skipped "${item.name || 'unnamed'}" (missing required fields)`);
            totalSkipped++;
            continue;
          }

          // Generate slug if not provided
          const slug = item.slug || item.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

          if (!slug) {
            console.log(`${progress} ⏭️  Skipped "${item.name}" (could not generate slug)`);
            totalSkipped++;
            continue;
          }

          // Check if tool already exists
          const existing = await storage.findDuplicateTool(slug, item.websiteUrl);
          if (existing) {
            if (toolIndex % 100 === 0) {
              console.log(`${progress} ⏭️  Skipped "${item.name}" (already exists)`);
            }
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

          // Show progress every 50 tools or on first/last of batch
          if (toolIndex % 50 === 0 || i === 0 || i === batch.length - 1) {
            console.log(`${progress} ✅ Imported "${item.name}"`);
          }

        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          errors.push(`${item.name || 'unnamed'}: ${errorMsg}`);
          totalErrors++;
          
          if (toolIndex % 100 === 0 || totalErrors <= 10) {
            console.error(`${progress} ❌ Error importing "${item.name}": ${errorMsg}`);
          }
        }
      }

      const batchTime = Date.now() - batchStartTime;
      console.log(`   ⏱️  Batch completed in ${(batchTime / 1000).toFixed(1)}s`);
    }

    const totalTime = Date.now() - startTime;

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("📈 Import Summary:");
    console.log("=".repeat(60));
    console.log(`   ✅ Successfully imported: ${totalInserted}`);
    console.log(`   ⏭️  Skipped (already exist): ${totalSkipped}`);
    console.log(`   ❌ Errors: ${totalErrors}`);
    console.log(`   📊 Total processed: ${scrapeResult.items.length}`);
    console.log(`   ⏱️  Total time: ${(totalTime / 1000 / 60).toFixed(1)} minutes`);
    console.log("=".repeat(60));

    if (errors.length > 0 && errors.length <= 20) {
      console.log("\n⚠️  Errors encountered:");
      errors.forEach(err => console.log(`   - ${err}`));
    } else if (errors.length > 20) {
      console.log(`\n⚠️  ${errors.length} errors encountered (showing first 10):`);
      errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));
    }

    if (totalInserted > 0) {
      console.log(`\n✅ Successfully imported ${totalInserted} new tools!`);
      console.log(`📊 Total tools in database now: ${(await storage.getAllTools()).length}`);
    }

    if (totalErrors > 0) {
      console.log(`\n⚠️  ${totalErrors} tools failed to import. Check errors above.`);
      process.exit(1);
    } else {
      console.log("\n🎉 Import completed successfully!");
    }

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`\n❌ Fatal error during import: ${errorMsg}`);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run import
console.log("🔥 Firestore Import Script - Aitoolnet.com");
console.log("=" .repeat(60));
importAllFromAitoolnet().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
