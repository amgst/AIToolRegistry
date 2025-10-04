import { aiTools, type AiTool, type InsertAiTool } from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or } from "drizzle-orm";

export interface IStorage {
  getAllTools(): Promise<AiTool[]>;
  getToolById(id: string): Promise<AiTool | undefined>;
  getToolBySlug(slug: string): Promise<AiTool | undefined>;
  searchTools(query: string): Promise<AiTool[]>;
  getToolsByCategory(category: string): Promise<AiTool[]>;
  createTool(tool: InsertAiTool): Promise<AiTool>;
  updateTool(id: string, tool: Partial<InsertAiTool>): Promise<AiTool | undefined>;
  deleteTool(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getAllTools(): Promise<AiTool[]> {
    return await db.select().from(aiTools);
  }

  async getToolById(id: string): Promise<AiTool | undefined> {
    const [tool] = await db.select().from(aiTools).where(eq(aiTools.id, id));
    return tool || undefined;
  }

  async getToolBySlug(slug: string): Promise<AiTool | undefined> {
    const [tool] = await db.select().from(aiTools).where(eq(aiTools.slug, slug));
    return tool || undefined;
  }

  async searchTools(query: string): Promise<AiTool[]> {
    return await db
      .select()
      .from(aiTools)
      .where(
        or(
          ilike(aiTools.name, `%${query}%`),
          ilike(aiTools.shortDescription, `%${query}%`),
          ilike(aiTools.description, `%${query}%`)
        )
      );
  }

  async getToolsByCategory(category: string): Promise<AiTool[]> {
    return await db
      .select()
      .from(aiTools)
      .where(ilike(aiTools.category, `%${category}%`));
  }

  async createTool(insertTool: InsertAiTool): Promise<AiTool> {
    const [tool] = await db
      .insert(aiTools)
      .values(insertTool)
      .returning();
    return tool;
  }

  async updateTool(id: string, updateData: Partial<InsertAiTool>): Promise<AiTool | undefined> {
    const [tool] = await db
      .update(aiTools)
      .set(updateData)
      .where(eq(aiTools.id, id))
      .returning();
    return tool || undefined;
  }

  async deleteTool(id: string): Promise<boolean> {
    const result = await db
      .delete(aiTools)
      .where(eq(aiTools.id, id))
      .returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
