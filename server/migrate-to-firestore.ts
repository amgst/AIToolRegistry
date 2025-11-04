// Migration script: SQLite/Drizzle -> Firebase Firestore
import Database from "better-sqlite3";
import path from "path";
import { storage } from "./storage.js";
import type { InsertAiTool } from "@shared/schema.js";

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), "database.sqlite");

function parseJsonField(value: string | null): any {
  if (!value) return null;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      // If parsing fails, return the original value or empty array/object
      if (value.startsWith("[")) return [];
      if (value.startsWith("{")) return {};
      return value;
    }
  }
  return value;
}

async function migrate() {
  console.log("🔄 Starting migration from SQLite to Firestore...\n");

  // Check if SQLite database exists
  try {
    const db = new Database(DB_PATH, { readonly: true });
    console.log(`✅ Connected to SQLite database: ${DB_PATH}\n`);

    // Fetch all tools from SQLite
    const tools = db.prepare("SELECT * FROM ai_tools").all() as any[];

    if (tools.length === 0) {
      console.log("⚠️  No tools found in SQLite database. Nothing to migrate.");
      db.close();
      return;
    }

    console.log(`📊 Found ${tools.length} tools to migrate\n`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    // Process each tool
    for (let i = 0; i < tools.length; i++) {
      const tool = tools[i];
      const progress = `[${i + 1}/${tools.length}]`;

      try {
        // Parse JSON fields
        const features = parseJsonField(tool.features) || [];
        const tags = parseJsonField(tool.tags) || [];
        const socialLinks = parseJsonField(tool.social_links) || {};
        const useCases = parseJsonField(tool.use_cases) || [];
        const screenshots = parseJsonField(tool.screenshots) || [];
        const pricingDetails = parseJsonField(tool.pricing_details) || {};

        // Check if tool already exists in Firestore
        const existing = await storage.findDuplicateTool(tool.slug, tool.website_url);
        if (existing) {
          console.log(`${progress} ⏭️  Skipped "${tool.name}" (already exists in Firestore)`);
          skipped++;
          continue;
        }

        // Prepare data for Firestore
        const insertTool: InsertAiTool = {
          name: tool.name,
          slug: tool.slug,
          description: tool.description,
          shortDescription: tool.short_description || tool.description || tool.name,
          category: tool.category,
          pricing: tool.pricing,
          websiteUrl: tool.website_url,
          logoUrl: tool.logo_url || undefined,
          features: Array.isArray(features) ? features : [],
          tags: Array.isArray(tags) ? tags : [],
          badge: tool.badge || undefined,
          rating: tool.rating || undefined,
          sourceDetailUrl: tool.source_detail_url || undefined,
          developer: tool.developer || undefined,
          documentationUrl: tool.documentation_url || undefined,
          socialLinks: typeof socialLinks === "object" && socialLinks !== null ? socialLinks : {},
          useCases: Array.isArray(useCases) ? useCases : [],
          screenshots: Array.isArray(screenshots) ? screenshots : [],
          pricingDetails: typeof pricingDetails === "object" && pricingDetails !== null ? pricingDetails : {},
          launchDate: tool.launch_date || undefined,
        };

        // Create tool in Firestore
        await storage.createTool(insertTool);
        console.log(`${progress} ✅ Migrated "${tool.name}"`);
        migrated++;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error(`${progress} ❌ Error migrating "${tool.name}": ${errorMsg}`);
        errors++;
      }
    }

    db.close();

    console.log("\n" + "=".repeat(50));
    console.log("📈 Migration Summary:");
    console.log(`   ✅ Migrated: ${migrated}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📊 Total: ${tools.length}`);
    console.log("=".repeat(50));

    if (errors > 0) {
      console.log("\n⚠️  Some tools failed to migrate. Check the errors above.");
      process.exit(1);
    } else {
      console.log("\n✅ Migration completed successfully!");
    }

  } catch (error) {
    if (error instanceof Error && error.message.includes("no such file")) {
      console.error(`❌ SQLite database not found at: ${DB_PATH}`);
      console.error("   Make sure the database.sqlite file exists in the project root.");
    } else {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`❌ Failed to migrate: ${errorMsg}`);
    }
    process.exit(1);
  }
}

// Run migration
migrate().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
