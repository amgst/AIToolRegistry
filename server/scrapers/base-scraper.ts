import { load, type CheerioAPI } from "cheerio";
import type { InsertAiTool } from "@shared/schema";

export interface ScrapeResult {
  success: boolean;
  items: Partial<InsertAiTool>[];
  errors?: string[];
  metadata?: {
    url: string;
    totalFound: number;
    processed: number;
  };
}

export interface ScraperConfig {
  url: string;
  limit?: number;
  concurrency?: number;
  timeout?: number;
}

export abstract class BaseScraper {
  protected defaultConcurrency = 5;
  protected defaultLimit = 25;
  protected maxLimit = 50000; // Maximum tools per scrape (increased for full imports)
  protected defaultTimeout = 30000; // 30 seconds

  abstract name: string;
  abstract scrape(config: ScraperConfig): Promise<ScrapeResult>;

  protected slugify(input: string): string {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  protected async fetchWithRetry(
    url: string,
    retries = 3,
    delay = 1000
  ): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.defaultTimeout);
        
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
          },
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return response;
        }
        
        if (response.status === 429) {
          // Rate limited - wait longer
          await new Promise((resolve) => setTimeout(resolve, delay * (i + 2)));
          continue;
        }
        
        throw new Error(`HTTP ${response.status}`);
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
      }
    }
    throw new Error("Max retries exceeded");
  }

  protected async fetchConcurrently<T>(
    items: T[],
    worker: (item: T, index: number) => Promise<void>,
    concurrency: number
  ): Promise<void> {
    let index = 0;
    const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (index < items.length) {
        const currentIndex = index++;
        await worker(items[currentIndex], currentIndex);
      }
    });
    await Promise.all(workers);
  }

  protected extractText(element: CheerioAPI, selector: string): string | null {
    const found = element(selector).first();
    return found.length ? found.text().trim() || null : null;
  }

  protected extractAttr(element: CheerioAPI, selector: string, attr: string): string | null {
    const found = element(selector).first();
    return found.length ? found.attr(attr) || null : null;
  }

  protected normalizeUrl(url: string, baseUrl: string): string {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    try {
      return new URL(url, baseUrl).toString();
    } catch {
      return "";
    }
  }

  protected extractMetaTag($: CheerioAPI, property: string): string | null {
    const meta = $(`meta[property="${property}"], meta[name="${property}"]`).first();
    return meta.attr("content")?.trim() || null;
  }
}

