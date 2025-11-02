import type { InsertAiTool } from "@shared/schema";
import { BaseScraper, type ScrapeResult } from "./base-scraper";
import { AitoolnetScraper } from "./aitoolnet-scraper";
import { FutureToolsScraper } from "./futuretools-scraper";
import { GenericScraper } from "./generic-scraper";

export interface ScrapingSource {
  id: string;
  name: string;
  type: string;
  url: string;
  enabled: boolean;
  schedule?: string; // Cron expression
  limit?: number;
  concurrency?: number;
}

export class ScraperManager {
  private scrapers: Map<string, BaseScraper> = new Map();

  constructor() {
    // Register available scrapers
    this.registerScraper(new AitoolnetScraper());
    this.registerScraper(new FutureToolsScraper());
    this.registerScraper(new GenericScraper());
  }

  registerScraper(scraper: BaseScraper): void {
    this.scrapers.set(scraper.name, scraper);
  }

  getScraper(name: string): BaseScraper | undefined {
    return this.scrapers.get(name);
  }

  getAvailableScrapers(): string[] {
    return Array.from(this.scrapers.keys());
  }

  async scrape(source: ScrapingSource): Promise<ScrapeResult> {
    const scraper = this.getScraper(source.type);
    if (!scraper) {
      return {
        success: false,
        items: [],
        errors: [`Unknown scraper type: ${source.type}`],
      };
    }

    return await scraper.scrape({
      url: source.url,
      limit: source.limit,
      concurrency: source.concurrency,
    });
  }

  async scrapeMultiple(sources: ScrapingSource[]): Promise<Map<string, ScrapeResult>> {
    const results = new Map<string, ScrapeResult>();
    
    // Process enabled sources concurrently
    const enabledSources = sources.filter(s => s.enabled);
    await Promise.all(
      enabledSources.map(async (source) => {
        try {
          const result = await this.scrape(source);
          results.set(source.id, result);
        } catch (error) {
          results.set(source.id, {
            success: false,
            items: [],
            errors: [String(error)],
          });
        }
      })
    );

    return results;
  }
}

export const scraperManager = new ScraperManager();

