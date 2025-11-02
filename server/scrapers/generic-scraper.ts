import { load } from "cheerio";
import type { InsertAiTool } from "@shared/schema";
import { BaseScraper, type ScrapeResult, type ScraperConfig } from "./base-scraper";

/**
 * Generic scraper that can work with any website
 * Uses heuristics and common patterns to extract tool information
 */
export class GenericScraper extends BaseScraper {
  name = "generic";

  async scrape(config: ScraperConfig): Promise<ScrapeResult> {
    const url = config.url || "";
    const limit = config.limit || this.defaultLimit;
    const concurrency = config.concurrency || this.defaultConcurrency;
    const errors: string[] = [];
    const results: Partial<InsertAiTool>[] = [];

    if (!url) {
      return {
        success: false,
        items: [],
        errors: ["URL is required"],
      };
    }

    try {
      // Fetch the listing page
      const listResp = await this.fetchWithRetry(url);
      const listHtml = await listResp.text();
      const $list = load(listHtml);

      // Find candidate tool detail page URLs
      const candidateHrefs = new Set<string>();
      
      // Heuristic: look for links that might lead to tool detail pages
      $list("a[href]").each((_i, el) => {
        const href = $list(el).attr("href") || "";
        const text = $list(el).text().trim();
        if (!href || !text || text.length < 3) return;

        const full = this.normalizeUrl(href, url);
        if (!full) return;

        try {
          const u = new URL(full);
          // Skip obvious non-tool pages
          const skipPatterns = [
            "about", "contact", "privacy", "terms", "blog", "login", "signup",
            "help", "support", "faq", "pricing", "features", "home", "index",
            "category", "tag", "search", "api", "docs", "documentation"
          ];
          
          const pathLower = u.pathname.toLowerCase();
          if (skipPatterns.some(pattern => pathLower.includes(pattern))) return;
          
          // Skip root, external links (optional), or very short paths
          if (u.pathname === "/" || u.pathname.length < 2) return;
          
          // Prefer links with meaningful text (likely tool names)
          if (text.length >= 3 && text.length < 100) {
            candidateHrefs.add(full);
          }
        } catch {
          // Skip invalid URLs
        }
      });

      const candidates = Array.from(candidateHrefs).slice(0, Math.max(1, Math.min(500, limit)));

      // Scrape detail pages concurrently
      await this.fetchConcurrently(
        candidates,
        async (detailUrl) => {
          try {
            const resp = await this.fetchWithRetry(detailUrl);
            if (!resp.ok) return;

            const html = await resp.text();
            const $ = load(html);

            // Extract basic information using common patterns
            const title = this.extractMetaTag($, "og:title") || 
                         $("title").first().text().trim() || 
                         $("h1").first().text().trim() || null;
            
            const description = this.extractMetaTag($, "description") || 
                              this.extractMetaTag($, "og:description") || 
                              $('meta[name="description"]').attr("content") ||
                              null;

            // Try to find the website URL (external link, usually in header/footer or CTA buttons)
            const websiteAnchors: string[] = [];
            
            // Look for external links that might be the tool's website
            $("a[href]").each((_j, a) => {
              const href = $(a).attr("href") || "";
              if (!href) return;

              const full = this.normalizeUrl(href, detailUrl);
              if (!full) return;

              try {
                const currentUrl = new URL(detailUrl);
                const linkUrl = new URL(full);
                
                // Skip same domain links
                if (linkUrl.hostname === currentUrl.hostname) return;
                
                const text = $(a).text().trim().toLowerCase();
                const hrefLower = href.toLowerCase();
                
                // Look for explicit website/visit buttons
                const websiteKeywords = [
                  "website", "visit", "official", "open", "try", "go to", "view",
                  "get started", "sign up", "launch", "demo", "homepage"
                ];
                
                const looksLikeWebsiteLink = 
                  websiteKeywords.some(keyword => text.includes(keyword)) ||
                  (linkUrl.protocol === "https:" && text.length > 0 && text.length < 50);
                
                if (looksLikeWebsiteLink && !hrefLower.includes(currentUrl.hostname)) {
                  websiteAnchors.push(full);
                }
              } catch {
                // Skip invalid URLs
              }
            });

            // If no website found, try to extract from meta tags or use detail URL as fallback
            const websiteUrl = websiteAnchors[0] || 
                             this.extractMetaTag($, "og:url") || 
                             $('link[rel="canonical"]').attr("href") ||
                             detailUrl; // Fallback to detail page if no website found

            if (!title) return;

            const name = title.replace(/\s*-\s*[^-]+$/, "").trim(); // Remove site name suffix
            const slug = this.slugify(name);
            if (!slug) return;

            // Extract additional metadata if available
            const imageUrl = this.extractMetaTag($, "og:image") || 
                           $('meta[property="og:image"]').attr("content") || 
                           null;

            results.push({
              name,
              slug,
              shortDescription: description || name,
              description: description || name,
              category: "Content AI", // Default category
              pricing: "Unknown",
              websiteUrl,
              logoUrl: imageUrl || undefined,
              features: [],
              tags: [],
              sourceDetailUrl: detailUrl,
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

