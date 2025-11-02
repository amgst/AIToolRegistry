import { aiTools, type AiTool, type InsertAiTool } from "@shared/schema";
// Don't import db directly - use getDb() dynamically to avoid eager initialization
import { eq, ilike, or, sql } from "drizzle-orm";

export interface IStorage {
  getAllTools(): Promise<AiTool[]>;
  getToolById(id: string): Promise<AiTool | undefined>;
  getToolBySlug(slug: string): Promise<AiTool | undefined>;
  getToolByWebsiteUrl(websiteUrl: string): Promise<AiTool | undefined>;
  findDuplicateTool(slug: string, websiteUrl: string): Promise<AiTool | undefined>;
  searchTools(query: string): Promise<AiTool[]>;
  getToolsByCategory(category: string): Promise<AiTool[]>;
  createTool(tool: InsertAiTool): Promise<AiTool>;
  updateTool(id: string, tool: Partial<InsertAiTool>): Promise<AiTool | undefined>;
  deleteTool(id: string): Promise<boolean>;
}

// Normalize URL for comparison (remove protocol, www, trailing slashes, etc.)
function normalizeWebsiteUrl(url: string): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    let normalized = u.hostname.replace(/^www\./, "");
    normalized += u.pathname.replace(/\/+$/, "") || "";
    normalized += u.search || "";
    return normalized.toLowerCase();
  } catch {
    // If URL is invalid, just lowercase and strip whitespace
    return url.toLowerCase().trim();
  }
}

export class DatabaseStorage implements IStorage {
  async getAllTools(): Promise<AiTool[]> {
    try {
      const { getDb } = await import("./db");
      const dbInstance = await getDb();
      const tools = await dbInstance.select().from(aiTools);
      // Convert JSON strings back to arrays
      return tools.map(this.parseTool);
    } catch (error) {
      // If database is unavailable (e.g., on Vercel without PostgreSQL), return empty array
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Vercel") || errorMessage.includes("Database unavailable")) {
        console.warn("Database unavailable, returning empty array:", errorMessage);
        return [];
      }
      throw error;
    }
  }
  
  private parseTool(tool: any): AiTool {
    return {
      ...tool,
      features: Array.isArray(tool.features) ? tool.features : JSON.parse(tool.features || "[]"),
      tags: Array.isArray(tool.tags) ? tool.tags : JSON.parse(tool.tags || "[]"),
      socialLinks: typeof tool.socialLinks === "object" && tool.socialLinks !== null
        ? tool.socialLinks
        : JSON.parse(tool.socialLinks || "{}"),
      useCases: Array.isArray(tool.useCases) ? tool.useCases : JSON.parse(tool.useCases || "[]"),
      screenshots: Array.isArray(tool.screenshots) ? tool.screenshots : JSON.parse(tool.screenshots || "[]"),
      pricingDetails: typeof tool.pricingDetails === "object" && tool.pricingDetails !== null
        ? tool.pricingDetails
        : JSON.parse(tool.pricingDetails || "{}"),
    };
  }

  async getToolById(id: string): Promise<AiTool | undefined> {
    try {
      const { getDb } = await import("./db");
      const dbInstance = await getDb();
      const [tool] = await dbInstance.select().from(aiTools).where(eq(aiTools.id, id));
      return tool ? this.parseTool(tool) : undefined;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Vercel") || errorMessage.includes("Database unavailable")) {
        return undefined;
      }
      throw error;
    }
  }

  async getToolBySlug(slug: string): Promise<AiTool | undefined> {
    try {
      const { getDb } = await import("./db");
      const dbInstance = await getDb();
      const [tool] = await dbInstance.select().from(aiTools).where(eq(aiTools.slug, slug));
      return tool ? this.parseTool(tool) : undefined;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Vercel") || errorMessage.includes("Database unavailable")) {
        return undefined;
      }
      throw error;
    }
  }

  async getToolByWebsiteUrl(websiteUrl: string): Promise<AiTool | undefined> {
    const normalized = normalizeWebsiteUrl(websiteUrl);
    const allTools = await this.getAllTools();
    return allTools.find(tool => normalizeWebsiteUrl(tool.websiteUrl) === normalized);
  }

  // Check for duplicates by both slug and website URL
  async findDuplicateTool(slug: string, websiteUrl: string): Promise<AiTool | undefined> {
    // First check by slug (most reliable)
    const bySlug = await this.getToolBySlug(slug);
    if (bySlug) return bySlug;
    
    // Then check by website URL (catches tools with different slugs but same website)
    if (websiteUrl) {
      const byUrl = await this.getToolByWebsiteUrl(websiteUrl);
      if (byUrl) return byUrl;
    }
    
    return undefined;
  }

  async searchTools(query: string): Promise<AiTool[]> {
    try {
      const { getDb } = await import("./db");
      const dbInstance = await getDb();
      const lowerQuery = query.toLowerCase();
      const tools = await dbInstance
        .select()
        .from(aiTools)
        .where(
          or(
            sql`LOWER(${aiTools.name}) LIKE ${`%${lowerQuery}%`}`,
            sql`LOWER(${aiTools.shortDescription}) LIKE ${`%${lowerQuery}%`}`,
            sql`LOWER(${aiTools.description}) LIKE ${`%${lowerQuery}%`}`
          )
        );
      return tools.map(this.parseTool);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Vercel") || errorMessage.includes("Database unavailable")) {
        return [];
      }
      throw error;
    }
  }

  async getToolsByCategory(category: string): Promise<AiTool[]> {
    try {
      const { getDb } = await import("./db");
      const dbInstance = await getDb();
      const lowerCategory = category.toLowerCase();
      const tools = await dbInstance
        .select()
        .from(aiTools)
        .where(sql`LOWER(${aiTools.category}) LIKE ${`%${lowerCategory}%`}`);
      return tools.map(this.parseTool);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Vercel") || errorMessage.includes("Database unavailable")) {
        return [];
      }
      throw error;
    }
  }

  async createTool(insertTool: InsertAiTool): Promise<AiTool> {
    const { getDb } = await import("./db");
    const dbInstance = await getDb();
    const usePostgres = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);
    
    // For SQLite: Convert arrays/objects to JSON strings
    // For PostgreSQL: Keep as arrays/objects (jsonb handles them natively)
    const values: any = { ...insertTool };
    
    if (!usePostgres) {
      // SQLite mode - stringify JSON fields
      values.features = Array.isArray(insertTool.features) 
        ? JSON.stringify(insertTool.features) 
        : insertTool.features;
      values.tags = Array.isArray(insertTool.tags) 
        ? JSON.stringify(insertTool.tags) 
        : insertTool.tags;
      
      if (insertTool.socialLinks !== undefined) {
        values.socialLinks = typeof insertTool.socialLinks === "object"
          ? JSON.stringify(insertTool.socialLinks)
          : insertTool.socialLinks;
      }
      if (insertTool.useCases !== undefined) {
        values.useCases = Array.isArray(insertTool.useCases)
          ? JSON.stringify(insertTool.useCases)
          : insertTool.useCases;
      }
      if (insertTool.screenshots !== undefined) {
        values.screenshots = Array.isArray(insertTool.screenshots)
          ? JSON.stringify(insertTool.screenshots)
          : insertTool.screenshots;
      }
      if (insertTool.pricingDetails !== undefined) {
        values.pricingDetails = typeof insertTool.pricingDetails === "object"
          ? JSON.stringify(insertTool.pricingDetails)
          : insertTool.pricingDetails;
      }
    }
    // For PostgreSQL, arrays/objects are kept as-is (jsonb handles them)
    
    // Set lastUpdated timestamp
    values.lastUpdated = new Date().toISOString();
    
    const [tool] = await dbInstance
      .insert(aiTools)
      .values(values)
      .returning();
    return this.parseTool(tool);
  }

  async updateTool(id: string, updateData: Partial<InsertAiTool>): Promise<AiTool | undefined> {
    const { getDb } = await import("./db");
    const dbInstance = await getDb();
    const usePostgres = !!(process.env.POSTGRES_URL || process.env.DATABASE_URL);
    
    // For SQLite: Convert arrays/objects to JSON strings
    // For PostgreSQL: Keep as arrays/objects
    const values: any = { ...updateData };
    
    if (!usePostgres) {
      // SQLite mode - stringify JSON fields
      if (Array.isArray(updateData.features)) {
        values.features = JSON.stringify(updateData.features);
      }
      if (Array.isArray(updateData.tags)) {
        values.tags = JSON.stringify(updateData.tags);
      }
      if (updateData.socialLinks !== undefined) {
        values.socialLinks = typeof updateData.socialLinks === "object"
          ? JSON.stringify(updateData.socialLinks)
          : updateData.socialLinks;
      }
      if (updateData.useCases !== undefined) {
        values.useCases = Array.isArray(updateData.useCases)
          ? JSON.stringify(updateData.useCases)
          : updateData.useCases;
      }
      if (updateData.screenshots !== undefined) {
        values.screenshots = Array.isArray(updateData.screenshots)
          ? JSON.stringify(updateData.screenshots)
          : updateData.screenshots;
      }
      if (updateData.pricingDetails !== undefined) {
        values.pricingDetails = typeof updateData.pricingDetails === "object"
          ? JSON.stringify(updateData.pricingDetails)
          : updateData.pricingDetails;
      }
    }
    // For PostgreSQL, arrays/objects are kept as-is
    
    // Update lastUpdated timestamp
    values.lastUpdated = new Date().toISOString();
    
    const [tool] = await dbInstance
      .update(aiTools)
      .set(values)
      .where(eq(aiTools.id, id))
      .returning();
    return tool ? this.parseTool(tool) : undefined;
  }

  async deleteTool(id: string): Promise<boolean> {
    try {
      const { getDb } = await import("./db");
      const dbInstance = await getDb();
      const result = await dbInstance
        .delete(aiTools)
        .where(eq(aiTools.id, id))
        .returning();
      return result.length > 0;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("Vercel") || errorMessage.includes("Database unavailable")) {
        return false;
      }
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
