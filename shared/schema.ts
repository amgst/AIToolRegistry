import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { pgTable, varchar, integer as pgInteger, text as pgText, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Support both SQLite and PostgreSQL
// Check lazily to avoid issues during module load
function getUsePostgres() {
  return !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);
}

// SQLite schema
const aiToolsSQLite = sqliteTable("ai_tools", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  shortDescription: text("short_description").notNull(),
  category: text("category").notNull(),
  pricing: text("pricing").notNull(),
  websiteUrl: text("website_url").notNull(),
  logoUrl: text("logo_url"),
  features: text("features").notNull().default("[]"),
  tags: text("tags").notNull().default("[]"),
  badge: text("badge"),
  rating: integer("rating"),
  sourceDetailUrl: text("source_detail_url"),
  developer: text("developer"),
  documentationUrl: text("documentation_url"),
  socialLinks: text("social_links").default("{}"),
  useCases: text("use_cases").default("[]"),
  launchDate: text("launch_date"),
  lastUpdated: text("last_updated"),
  screenshots: text("screenshots").default("[]"),
  pricingDetails: text("pricing_details").default("{}"),
});

// PostgreSQL schema
// Using text() for JSON fields for better drizzle-kit compatibility
// We'll store JSON as text, same as SQLite, but PostgreSQL can still query it efficiently
const aiToolsPostgres = pgTable("ai_tools", {
  id: varchar("id", { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  description: pgText("description").notNull(),
  shortDescription: varchar("short_description", { length: 500 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  pricing: varchar("pricing", { length: 50 }).notNull(),
  websiteUrl: varchar("website_url", { length: 500 }).notNull(),
  logoUrl: varchar("logo_url", { length: 500 }),
  features: pgText("features").notNull().default("[]"),
  tags: pgText("tags").notNull().default("[]"),
  badge: varchar("badge", { length: 50 }),
  rating: pgInteger("rating"),
  sourceDetailUrl: varchar("source_detail_url", { length: 500 }),
  developer: varchar("developer", { length: 255 }),
  documentationUrl: varchar("documentation_url", { length: 500 }),
  socialLinks: pgText("social_links").default("{}"),
  useCases: pgText("use_cases").default("[]"),
  launchDate: varchar("launch_date", { length: 50 }),
  lastUpdated: varchar("last_updated", { length: 50 }),
  screenshots: pgText("screenshots").default("[]"),
  pricingDetails: pgText("pricing_details").default("{}"),
});

// Export the appropriate table based on database type
// Use a getter function to check at runtime, not module load time
export const aiTools = (() => {
  // Check at runtime when table is actually used
  return getUsePostgres() ? aiToolsPostgres : aiToolsSQLite;
})();

// Custom schema for API - features, tags, and new JSON fields are arrays/objects
const apiToolSchema = createInsertSchema(aiTools, {
  features: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  socialLinks: z.record(z.string(), z.string()).default({}).optional(),
  useCases: z.array(z.string()).default([]),
  screenshots: z.array(z.string()).default([]),
  pricingDetails: z.object({
    pricingModel: z.enum(["free", "freemium", "subscription", "one-time", "usage-based", "paid", "unknown"]).optional(),
    freeTrial: z.union([z.boolean(), z.string()]).optional(),
    freeTier: z.object({
      description: z.string().optional(),
      limits: z.array(z.string()).optional(),
      features: z.array(z.string()).optional(),
    }).optional(),
    plans: z.array(z.object({
      name: z.string(),
      price: z.string(),
      period: z.string().optional(),
      currency: z.string().optional(),
      features: z.array(z.string()).optional(),
      popular: z.boolean().optional(),
    })).optional(),
    notes: z.string().optional(),
  }).default({}).optional(),
  sourceDetailUrl: z.string().url().optional().or(z.literal("")),
  documentationUrl: z.string().url().optional().or(z.literal("")),
  developer: z.string().optional(),
  launchDate: z.string().optional(),
  lastUpdated: z.string().optional(),
}).omit({ id: true });

export const insertAiToolSchema = apiToolSchema;

// TypeScript types - JSON fields are arrays/objects
export type InsertAiTool = z.infer<typeof apiToolSchema>;
export type PricingDetails = {
  pricingModel?: "free" | "freemium" | "subscription" | "one-time" | "usage-based" | "paid" | "unknown";
  freeTrial?: boolean | string;
  freeTier?: {
    description?: string;
    limits?: string[];
    features?: string[];
  };
  plans?: Array<{
    name: string;
    price: string;
    period?: string;
    currency?: string;
    features?: string[];
    popular?: boolean;
  }>;
  notes?: string;
};

export type AiTool = Omit<typeof aiTools.$inferSelect, "features" | "tags" | "socialLinks" | "useCases" | "screenshots" | "pricingDetails"> & {
  features: string[];
  tags: string[];
  socialLinks: Record<string, string>;
  useCases: string[];
  screenshots: string[];
  pricingDetails: PricingDetails;
};
