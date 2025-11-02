import type { ScrapingSource } from "./scraper-manager";

// In-memory storage for scraping sources
// TODO: Migrate to database for persistence
class SourcesStorage {
  private sources: Map<string, ScrapingSource> = new Map();
  private nextId = 1;

  constructor() {
    // Initialize with default sources
    this.sources.set("default-aitoolnet-1", {
      id: "default-aitoolnet-1",
      name: "AIToolNet - Text to Speech",
      type: "aitoolnet",
      url: "https://www.aitoolnet.com/text-to-speech",
      enabled: true,
      schedule: "0 3 * * *", // Daily at 3 AM UTC
      limit: 25,
      concurrency: 5,
    });

    this.sources.set("default-aitoolnet-2", {
      id: "default-aitoolnet-2",
      name: "AIToolNet - Copywriting",
      type: "aitoolnet",
      url: "https://www.aitoolnet.com/copywriting",
      enabled: true,
      schedule: "0 3 * * *",
      limit: 25,
      concurrency: 5,
    });

    this.sources.set("default-aitoolnet-3", {
      id: "default-aitoolnet-3",
      name: "AIToolNet - Image Generator",
      type: "aitoolnet",
      url: "https://www.aitoolnet.com/image-generator",
      enabled: true,
      schedule: "0 3 * * *",
      limit: 25,
      concurrency: 5,
    });
  }

  getAllSources(): ScrapingSource[] {
    return Array.from(this.sources.values());
  }

  getSource(id: string): ScrapingSource | undefined {
    return this.sources.get(id);
  }

  createSource(source: Omit<ScrapingSource, "id">): ScrapingSource {
    const id = `source-${this.nextId++}`;
    const newSource: ScrapingSource = { ...source, id };
    this.sources.set(id, newSource);
    return newSource;
  }

  updateSource(id: string, updates: Partial<ScrapingSource>): ScrapingSource | null {
    const source = this.sources.get(id);
    if (!source) return null;

    const updated = { ...source, ...updates, id }; // Ensure ID doesn't change
    this.sources.set(id, updated);
    return updated;
  }

  deleteSource(id: string): boolean {
    return this.sources.delete(id);
  }

  getEnabledSources(): ScrapingSource[] {
    return Array.from(this.sources.values()).filter(s => s.enabled);
  }

  getSourcesByType(type: string): ScrapingSource[] {
    return Array.from(this.sources.values()).filter(s => s.type === type);
  }
}

export const sourcesStorage = new SourcesStorage();

