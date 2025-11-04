import { load } from "cheerio";
import type { InsertAiTool } from "@shared/schema";
import { BaseScraper, type ScrapeResult, type ScraperConfig } from "./base-scraper";

export class AitoolnetScraper extends BaseScraper {
  name = "aitoolnet";

  async scrape(config: ScraperConfig): Promise<ScrapeResult> {
    const url = config.url || "https://www.aitoolnet.com/";
    const limit = config.limit || this.defaultLimit;
    const concurrency = config.concurrency || this.defaultConcurrency;
    const errors: string[] = [];
    const results: Partial<InsertAiTool>[] = [];

    try {
      const candidateHrefs = new Set<string>();
      
      const isLikelyDetailPath = (pathname: string): boolean => {
        const p = pathname.toLowerCase();
        const segments = p.split("/").filter(Boolean);
        const isSingleSlug = segments.length === 1;
        const reserved = new Set([
          "about", "blog", "popular", "monthly", "privacy", "terms",
          "contact", "submit", "ranking", "categories", "gpts", "home",
          "index", "top", "latest"
        ]);
        if (segments.length === 0) return false;
        if (reserved.has(segments[0])) return false;
        if (isSingleSlug) return true;
        if (segments[0] === "ai-tools" && segments.length >= 2) return true;
        return false;
      };
      
      // For large imports (limit >= 100), also scrape from additional pages
      // This helps discover more tools from different sections of the site
      const pagesToScrape = limit >= 100 
        ? [
            url,
            "https://www.aitoolnet.com/popular",
            "https://www.aitoolnet.com/latest",
            "https://www.aitoolnet.com/ranking",
            // Add some common category pages for more tool discovery
            "https://www.aitoolnet.com/text-to-speech",
            "https://www.aitoolnet.com/copywriting",
            "https://www.aitoolnet.com/image-generator",
            "https://www.aitoolnet.com/video-generator",
            "https://www.aitoolnet.com/code-assistant",
            "https://www.aitoolnet.com/writing-assistant",
            "https://www.aitoolnet.com/chatbot",
            "https://www.aitoolnet.com/productivity",
          ]
        : [url];

      // Fetch multiple pages to discover more tools
      for (const pageUrl of pagesToScrape) {
        try {
          const listResp = await this.fetchWithRetry(pageUrl);
          const listHtml = await listResp.text();
          const $list = load(listHtml);

          // Find candidate detail page URLs from this page
          $list("a[href]").each((_i, el) => {
            const href = $list(el).attr("href") || "";
            const text = $list(el).text().trim();
            if (!href) return;

            const full = this.normalizeUrl(href, pageUrl);
        if (!full) return;

            try {
              const u = new URL(full);
              if (!u.hostname.includes("aitoolnet.com")) return;
              if (u.pathname === "/" || u.pathname.length < 3) return;
              if (!isLikelyDetailPath(u.pathname)) return;
              if (text.length >= 2) {
                candidateHrefs.add(full);
              }
            } catch {
              // Skip invalid URLs
            }
          });
        } catch (pageError) {
          errors.push(`Error fetching ${pageUrl}: ${String(pageError)}`);
        }
      }

      // For large imports (limit >= 100), allow more candidates to be discovered
      // Cap at the requested limit, but allow discovery from multiple pages
      const candidates = limit >= 100
        ? Array.from(candidateHrefs).slice(0, limit)
        : Array.from(candidateHrefs).slice(0, Math.max(1, Math.min(500, limit)));

      // Scrape detail pages concurrently
      await this.fetchConcurrently(
        candidates,
        async (detailUrl) => {
          try {
            const resp = await this.fetchWithRetry(detailUrl);
            if (!resp.ok) return;

            const html = await resp.text();
            const $ = load(html);

            const title = this.extractMetaTag($, "og:title") || 
                         $("title").first().text().trim().replace(/\s*-\s*Aitoolnet\s*$/i, "") || 
                         null;
            
            const description = this.extractMetaTag($, "description") || 
                              this.extractMetaTag($, "og:description") || 
                              null;

            const canonicalHref = $('link[rel="canonical"]').attr("href") || 
                                 this.extractMetaTag($, "og:url") || 
                                 detailUrl;
            const canonicalFull = this.normalizeUrl(canonicalHref, detailUrl);
            
            try {
              const cu = new URL(canonicalFull);
              if (!cu.hostname.includes("aitoolnet.com") || 
                  !isLikelyDetailPath(cu.pathname)) {
                return;
              }
            } catch {
              return;
            }

            // Find website URL
            const websiteAnchors: string[] = [];
            $("a[href]").each((_j, a) => {
              const href = $(a).attr("href") || "";
              if (!href) return;

              const full = this.normalizeUrl(href, detailUrl);
              if (!full) return;

              try {
                const u = new URL(full);
                const text = $(a).text().trim().toLowerCase();
                const looksLikeWebsiteBtn = /(website|visit|official|open|try|go to|view)/.test(text);
                
                if (!u.hostname.includes("aitoolnet.com") && 
                    (u.protocol === "http:" || u.protocol === "https:") && 
                    looksLikeWebsiteBtn) {
                  websiteAnchors.push(full);
                }
              } catch {
                // Skip invalid URLs
              }
            });

            if (websiteAnchors.length < 1) {
              return;
            }

            const name = (title || $("h1").first().text().trim())?.replace(/\s*-\s*Aitoolnet\s*$/i, "") || null;
            if (!name) return;

            const slug = this.slugify(name);
            if (!slug) return;

            results.push({
              name,
              slug,
              shortDescription: description || name,
              description: description || name,
              category: "Content AI",
              pricing: "Unknown",
              websiteUrl: websiteAnchors[0],
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

