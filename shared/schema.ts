import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Database schema - features and tags are stored as JSON strings in SQLite
export const aiTools = sqliteTable("ai_tools", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  shortDescription: text("short_description").notNull(),
  category: text("category").notNull(),
  pricing: text("pricing").notNull(),
  websiteUrl: text("website_url").notNull(),
  logoUrl: text("logo_url"),
  features: text("features").notNull().default("[]"), // JSON array stored as text
  tags: text("tags").notNull().default("[]"), // JSON array stored as text
  badge: text("badge"),
  rating: integer("rating"),
  // Extended fields
  sourceDetailUrl: text("source_detail_url"), // Where this tool was scraped from
  developer: text("developer"), // Company/developer name
  documentationUrl: text("documentation_url"), // Link to documentation
  socialLinks: text("social_links").default("{}"), // JSON object: { twitter, linkedin, github, etc. }
  useCases: text("use_cases").default("[]"), // JSON array of use cases
  launchDate: text("launch_date"), // ISO date string
  lastUpdated: text("last_updated"), // ISO date string - when record was last updated
  screenshots: text("screenshots").default("[]"), // JSON array of image URLs
  pricingDetails: text("pricing_details").default("{}"), // JSON object with structured pricing info
});

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
      period: z.string().optional(), // "month", "year", "one-time", etc.
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
