import { load } from "cheerio";
import type { InsertAiTool } from "@shared/schema";
import { BaseScraper, type ScrapeResult, type ScraperConfig } from "./base-scraper";

export class FutureToolsScraper extends BaseScraper {
  name = "futuretools";

  async scrape(config: ScraperConfig): Promise<ScrapeResult> {
    const url = config.url || "https://www.futuretools.io/";
    const limit = config.limit || this.defaultLimit;
    const concurrency = config.concurrency || this.defaultConcurrency;
    const errors: string[] = [];
    const results: Partial<InsertAiTool>[] = [];

    try {
      const listResp = await this.fetchWithRetry(url);
      const listHtml = await listResp.text();
      const $list = load(listHtml);

      // Find tool cards - adjust selectors based on actual site structure
      const candidateHrefs = new Set<string>();
      
      // Common patterns for futuretools.io tool listings
      $list("a[href]").each((_i, el) => {
        const href = $list(el).attr("href") || "";
        const text = $list(el).text().trim();
        if (!href || !text) return;

        const full = this.normalizeUrl(href, url);
        if (!full) return;

        try {
          const u = new URL(full);
          // Only process futuretools.io internal links that look like tool pages
          if (!u.hostname.includes("futuretools.io")) return;
          if (u.pathname === "/" || u.pathname.includes("tag") || u.pathname.includes("category")) return;
          
          // Tool pages are typically single slugs or under /tools/
          const segments = u.pathname.split("/").filter(Boolean);
          if (segments.length >= 1 && segments.length <= 2 && text.length >= 3) {
            candidateHrefs.add(full);
          }
        } catch {
          // Skip invalid URLs
        }
      });

      // Allow up to 500 candidates for large imports
      const candidates = Array.from(candidateHrefs).slice(0, Math.max(1, Math.min(500, limit)));

      await this.fetchConcurrently(
        candidates,
        async (detailUrl) => {
          try {
            const resp = await this.fetchWithRetry(detailUrl);
            if (!resp.ok) return;

            const html = await resp.text();
            const $ = load(html);

            const title = this.extractMetaTag($, "og:title") || 
                         $("h1").first().text().trim() || 
                         $("title").first().text().trim() || 
                         null;

            const description = this.extractMetaTag($, "description") || 
                              this.extractMetaTag($, "og:description") || 
                              $("meta[name='description']").attr("content") || 
                              null;

            // Find the website URL - look for buttons/links
            let websiteUrl: string | null = null;
            const possibleSelectors = [
              'a[href*="http"]:contains("Visit")',
              'a[href*="http"]:contains("Website")',
              'a[href*="http"]:contains("Try")',
              'a.btn[href*="http"]',
              'a[href^="http"]',
            ];

            for (const selector of possibleSelectors) {
              try {
                const link = $(selector).first();
                const href = link.attr("href");
                if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
                  try {
                    const u = new URL(href);
                    if (!u.hostname.includes("futuretools.io")) {
                      websiteUrl = href;
                      break;
                    }
                  } catch {
                    // Skip invalid URLs
                  }
                }
              } catch {
                // Try next selector
              }
            }

            // Fallback: find any external link
            if (!websiteUrl) {
              $("a[href^='http']").each((_j, a) => {
                const href = $(a).attr("href");
                if (!href) return;
                try {
                  const u = new URL(href);
                  if (!u.hostname.includes("futuretools.io") && 
                      (u.protocol === "http:" || u.protocol === "https:")) {
                    websiteUrl = href;
                    return false; // break
                  }
                } catch {
                  // Skip
                }
              });
            }

            if (!title || !websiteUrl) return;

            const name = title.replace(/\s*[-|]\s*FutureTools?\s*$/i, "");
            const slug = this.slugify(name);
            if (!slug) return;

            // Try to extract category
            let category = "Content AI";
            const categoryEl = $('[class*="category"], [class*="tag"]').first();
            if (categoryEl.length) {
              const catText = categoryEl.text().trim();
              if (catText) category = catText;
            }

            // Try to extract pricing
            let pricing = "Unknown";
            const pricingText = $('[class*="pricing"], [class*="price"]').first().text().trim().toLowerCase();
            if (pricingText.includes("free")) pricing = "Free";
            else if (pricingText.includes("paid") || pricingText.includes("$")) pricing = "Paid";
            else if (pricingText.includes("freemium")) pricing = "Freemium";

            results.push({
              name,
              slug,
              shortDescription: description || name,
              description: description || name,
              category,
              pricing,
              websiteUrl,
              features: [],
              tags: [],
            });
          } catch (error) {
            errors.push(`Error scraping ${detailUrl}: ${String(error)}`);
          }
        },
        concurrency
      );

      return {
        success: true,
        items: results,
        errors: errors.length > 0 ? errors : undefined,
        metadata: {
          url,
          totalFound: candidates.length,
          processed: results.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        items: [],
        errors: [String(error)],
      };
    }
  }
}

