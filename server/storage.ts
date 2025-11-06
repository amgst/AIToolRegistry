import type { AiTool, InsertAiTool } from "@shared/schema";

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

function normalizeWebsiteUrl(url: string): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    let normalized = u.hostname.replace(/^www\./, "");
    normalized += u.pathname.replace(/\/+$/, "") || "";
    normalized += u.search || "";
    return normalized.toLowerCase();
  } catch {
    return url.toLowerCase().trim();
  }
}

const COLLECTION_NAME = "ai_tools";

export class DatabaseStorage implements IStorage {
  async getAllTools(): Promise<AiTool[]> {
    try {
      const { getDb } = await import("./db.js");
      const db = await getDb();
      console.log(`📊 Fetching tools from Firestore collection: ${COLLECTION_NAME}`);
      const snapshot = await db.collection(COLLECTION_NAME).get();
      const tools: AiTool[] = [];
      snapshot.forEach((doc) => {
        tools.push(this.parseTool({ id: doc.id, ...doc.data() }));
      });
      console.log(`✅ Loaded ${tools.length} tools from Firestore`);
      return tools;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error("❌ Firestore error in getAllTools:", {
        message: errorMessage,
        stack: errorStack,
        collection: COLLECTION_NAME,
      });
      throw error; // Re-throw instead of silently returning empty array
    }
  }
  
  private parseTool(doc: any): AiTool {
    return {
      id: doc.id,
      slug: doc.slug || "",
      name: doc.name || "",
      description: doc.description || "",
      shortDescription: doc.shortDescription || doc.short_description || "",
      category: doc.category || "",
      pricing: doc.pricing || "Unknown",
      websiteUrl: doc.websiteUrl || doc.website_url || "",
      logoUrl: doc.logoUrl || doc.logo_url || undefined,
      features: Array.isArray(doc.features) ? doc.features : [],
      tags: Array.isArray(doc.tags) ? doc.tags : [],
      badge: doc.badge || undefined,
      rating: doc.rating || undefined,
      sourceDetailUrl: doc.sourceDetailUrl || doc.source_detail_url || undefined,
      developer: doc.developer || undefined,
      documentationUrl: doc.documentationUrl || doc.documentation_url || undefined,
      socialLinks: typeof doc.socialLinks === "object" && doc.socialLinks !== null ? doc.socialLinks : (typeof doc.social_links === "object" && doc.social_links !== null ? doc.social_links : {}),
      useCases: Array.isArray(doc.useCases) ? doc.useCases : (Array.isArray(doc.use_cases) ? doc.use_cases : []),
      screenshots: Array.isArray(doc.screenshots) ? doc.screenshots : [],
      pricingDetails: typeof doc.pricingDetails === "object" && doc.pricingDetails !== null ? doc.pricingDetails : (typeof doc.pricing_details === "object" && doc.pricing_details !== null ? doc.pricing_details : {}),
      launchDate: doc.launchDate || doc.launch_date || undefined,
      lastUpdated: doc.lastUpdated || doc.last_updated || new Date().toISOString(),
    };
  }

  async getToolById(id: string): Promise<AiTool | undefined> {
    try {
      const { getDb } = await import("./db.js");
      const db = await getDb();
      const doc = await db.collection(COLLECTION_NAME).doc(id).get();
      if (!doc.exists) return undefined;
      return this.parseTool({ id: doc.id, ...doc.data() });
    } catch { return undefined; }
  }

  async getToolBySlug(slug: string): Promise<AiTool | undefined> {
    try {
      const { getDb } = await import("./db.js");
      const db = await getDb();
      const snapshot = await db.collection(COLLECTION_NAME).where("slug", "==", slug).limit(1).get();
      if (snapshot.empty) return undefined;
      return this.parseTool({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
    } catch { return undefined; }
  }

  async getToolByWebsiteUrl(websiteUrl: string): Promise<AiTool | undefined> {
    const normalized = normalizeWebsiteUrl(websiteUrl);
    const allTools = await this.getAllTools();
    return allTools.find(tool => normalizeWebsiteUrl(tool.websiteUrl) === normalized);
  }

  async findDuplicateTool(slug: string, websiteUrl: string): Promise<AiTool | undefined> {
    const bySlug = await this.getToolBySlug(slug);
    if (bySlug) return bySlug;
    if (websiteUrl) {
      const byUrl = await this.getToolByWebsiteUrl(websiteUrl);
      if (byUrl) return byUrl;
    }
    return undefined;
  }

  async searchTools(query: string): Promise<AiTool[]> {
    try {
      const lowerQuery = query.toLowerCase();
      const allTools = await this.getAllTools();
      return allTools.filter(tool => 
        tool.name.toLowerCase().includes(lowerQuery) ||
        tool.shortDescription?.toLowerCase().includes(lowerQuery) ||
        tool.description?.toLowerCase().includes(lowerQuery) ||
        tool.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      );
    } catch { return []; }
  }

  async getToolsByCategory(category: string): Promise<AiTool[]> {
    try {
      const allTools = await this.getAllTools();
      const lowerCategory = category.toLowerCase();
      return allTools.filter(tool => tool.category.toLowerCase().includes(lowerCategory));
    } catch { return []; }
  }

  async createTool(insertTool: InsertAiTool): Promise<AiTool> {
    const { getDb } = await import("./db.js");
    const db = await getDb();
    const id = crypto.randomUUID();
    const toolData: any = {
      id, slug: insertTool.slug, name: insertTool.name, description: insertTool.description,
      shortDescription: insertTool.shortDescription, category: insertTool.category, pricing: insertTool.pricing,
      websiteUrl: insertTool.websiteUrl, logoUrl: insertTool.logoUrl || null, features: insertTool.features || [],
      tags: insertTool.tags || [], badge: insertTool.badge || null, rating: insertTool.rating || null,
      sourceDetailUrl: insertTool.sourceDetailUrl || null, developer: insertTool.developer || null,
      documentationUrl: insertTool.documentationUrl || null, socialLinks: insertTool.socialLinks || {},
      useCases: insertTool.useCases || [], screenshots: insertTool.screenshots || [],
      pricingDetails: insertTool.pricingDetails || {}, launchDate: insertTool.launchDate || null,
      lastUpdated: new Date().toISOString(),
    };
    const cleanData: any = {};
    for (const [key, value] of Object.entries(toolData)) {
      if (value !== undefined) cleanData[key] = value;
    }
    await db.collection(COLLECTION_NAME).doc(id).set(cleanData);
    return this.parseTool({ id, ...cleanData });
  }

  async updateTool(id: string, updateData: Partial<InsertAiTool>): Promise<AiTool | undefined> {
    try {
      const { getDb } = await import("./db.js");
      const db = await getDb();
      const updateFields: any = { ...updateData, lastUpdated: new Date().toISOString() };
      const cleanUpdate: any = {};
      for (const [key, value] of Object.entries(updateFields)) {
        if (value !== undefined) cleanUpdate[key] = value;
      }
      await db.collection(COLLECTION_NAME).doc(id).update(cleanUpdate);
      return await this.getToolById(id);
    } catch { return undefined; }
  }

  async deleteTool(id: string): Promise<boolean> {
    try {
      const { getDb } = await import("./db.js");
      const db = await getDb();
      await db.collection(COLLECTION_NAME).doc(id).delete();
      return true;
    } catch { return false; }
  }
}

export const storage = new DatabaseStorage();
