import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAiToolSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/tools", async (req, res) => {
    try {
      const { search, category } = req.query;
      
      let tools;
      if (search && typeof search === "string") {
        tools = await storage.searchTools(search);
      } else if (category && typeof category === "string" && category !== "all") {
        tools = await storage.getToolsByCategory(category);
      } else {
        tools = await storage.getAllTools();
      }
      
      res.json(tools);
    } catch (error) {
      console.error("Error fetching tools:", error);
      res.status(500).json({ error: "Failed to fetch tools" });
    }
  });

  app.get("/api/tools/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const tool = await storage.getToolBySlug(slug);
      
      if (!tool) {
        return res.status(404).json({ error: "Tool not found" });
      }
      
      res.json(tool);
    } catch (error) {
      console.error("Error fetching tool:", error);
      res.status(500).json({ error: "Failed to fetch tool" });
    }
  });

  app.post("/api/tools", async (req, res) => {
    try {
      const validatedData = insertAiToolSchema.parse(req.body);
      const tool = await storage.createTool(validatedData);
      res.status(201).json(tool);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error creating tool:", error);
      res.status(500).json({ error: "Failed to create tool" });
    }
  });

  app.patch("/api/tools/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const partialSchema = insertAiToolSchema.partial();
      const validatedData = partialSchema.parse(req.body);
      
      const tool = await storage.updateTool(id, validatedData);
      
      if (!tool) {
        return res.status(404).json({ error: "Tool not found" });
      }
      
      res.json(tool);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      console.error("Error updating tool:", error);
      res.status(500).json({ error: "Failed to update tool" });
    }
  });

  app.delete("/api/tools/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteTool(id);
      
      if (!success) {
        return res.status(404).json({ error: "Tool not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting tool:", error);
      res.status(500).json({ error: "Failed to delete tool" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
