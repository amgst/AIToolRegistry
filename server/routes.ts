import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertAiToolSchema } from "@shared/schema";
import { z } from "zod";
// Removed node-fetch import; using global fetch available in Node 18+
import { load } from "cheerio";

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
      // Graceful fallback: return an empty list instead of 500
      res.status(200).json([]);
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
      // Accept minimal payload: only name is mandatory. Fill sensible defaults.
      const body = (req.body ?? {}) as Record<string, unknown>;
      const name = String(body.name ?? "").trim();
      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      // Simple slugify from name if slug missing/blank
      const rawSlug = String(body.slug ?? "").trim();
      const slug = rawSlug
        ? rawSlug
        : name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "");

      const descRaw = String(body.description ?? "").trim();
      const shortDescRaw = String(body.shortDescription ?? "").trim();
      const description = descRaw || shortDescRaw || name;
      const shortDescription = shortDescRaw || descRaw || name;
      const category = String(body.category ?? "").trim() || "Content AI";
      const pricing = String(body.pricing ?? "").trim() || "Unknown";
      const websiteUrl = String(body.websiteUrl ?? ""); // allow blank string

      const features = Array.isArray(body.features)
        ? (body.features as string[])
        : [];
      const tags = Array.isArray(body.tags) ? (body.tags as string[]) : [];

      // Optional fields: include only when provided
      const badge = body.badge != null ? String(body.badge) : undefined;
      const rating = body.rating != null ? Number(body.rating) : undefined;
      const logoUrl = body.logoUrl != null ? String(body.logoUrl) : undefined;

      const input = {
        name,
        slug,
        description,
        shortDescription,
        category,
        pricing,
        websiteUrl,
        features,
        tags,
        ...(badge ? { badge } : {}),
        ...(rating !== undefined ? { rating } : {}),
        ...(logoUrl ? { logoUrl } : {}),
      };

      const validatedData = insertAiToolSchema.parse(input);
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

  app.post("/api/scrape", async (req, res) => {
    try {
      const { url } = req.body as { url?: string };
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "Missing 'url' in request body" });
      }

      const resp = await fetch(url);
      if (!resp.ok) {
        return res.status(502).json({ error: `Failed to fetch target: ${resp.status}` });
      }
      const html = await resp.text();
      const $ = load(html);

      // Example extraction: title, meta description, links
      const title = $("title").first().text().trim() || null;
      const description = $('meta[name="description"]').attr("content") || null;
      const ogTitle = $('meta[property="og:title"]').attr("content") || null;
      const ogDesc = $('meta[property="og:description"]').attr("content") || null;
      const links = Array.from($("a[href]")).slice(0, 50).map((el) => {
        const href = $(el).attr("href") || "";
        const text = $(el).text().trim();
        return { href, text };
      });

      res.json({
        title,
        description: description || ogDesc,
        ogTitle,
        links,
      });
    } catch (error) {
      console.error("Error scraping:", error);
      res.status(500).json({ error: "Failed to scrape" });
    }
  });

  app.post("/api/scrape/aitoolnet", async (req, res) => {
    try {
      const { url, limit = 10, debug = false } = req.body as { url?: string; limit?: number; debug?: boolean };
      const listUrl = url && typeof url === "string" ? url : "https://www.aitoolnet.com/";

      const listResp = await fetch(listUrl);
      if (!listResp.ok) {
        return res.status(502).json({ error: `Failed to fetch list: ${listResp.status}` });
      }
      const listHtml = await listResp.text();
      const $list = load(listHtml);

      // Heuristics to prefer tool detail slugs and skip site/navigation pages.
      function isLikelyDetailPath(pathname: string): boolean {
        const p = pathname.toLowerCase();
        const segments = p.split("/").filter(Boolean);
        // Many detail pages are single-segment slugs like "/murf-ai".
        const isSingleSlug = segments.length === 1;
        const reserved = new Set([
          "about","blog","popular","monthly","privacy","terms","contact","submit","ranking","categories","gpts","home","index","top","latest"
        ]);
        if (segments.length === 0) return false;
        if (reserved.has(segments[0])) return false;
        // Allow single slug detail pages and also nested under "/ai-tools/..."
        if (isSingleSlug) return true;
        if (segments[0] === "ai-tools" && segments.length >= 2) return true;
        return false;
      }

      // Heuristic: collect internal links that look like tool detail pages
      const candidateHrefs = new Set<string>();
      $list("a[href]").each((_i, el) => {
        const href = $list(el).attr("href") || "";
        const text = $list(el).text().trim();
        if (!href) return;
        const full = href.startsWith("http") ? href : new URL(href, listUrl).toString();
        const u = new URL(full);
        // Only aitoolnet domain, avoid anchors and params-only
        if (!u.hostname.includes("aitoolnet.com")) return;
        if (u.pathname === "/" || u.pathname.length < 3) return;
        // Whitelist likely detail slugs and skip obvious non-detail pages
        if (!isLikelyDetailPath(u.pathname)) return;
        // Prefer pages with some text (likely cards) and unique paths
        if (text.length >= 2) {
          candidateHrefs.add(u.toString());
        }
      });

      const candidates = Array.from(candidateHrefs).slice(0, Math.max(1, Math.min(50, limit)));
      console.log("[scrape:aitoolnet] candidates", candidates.length, candidates.slice(0, 10));
      if (debug) {
        return res.json({ candidates });
      }

      // Fetch detail pages with limited concurrency
      const concurrency = 5;
      const results: any[] = [];
      let index = 0;
      async function worker() {
        while (index < candidates.length) {
          const current = candidates[index++];
          try {
            const resp = await fetch(current);
            if (!resp.ok) continue;
            const html = await resp.text();
            const $ = load(html);
            const title = $('meta[property="og:title"]').attr("content") || $("title").first().text().trim() || null;
            const description = $('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content") || null;

            // Resolve canonical URL and validate it's a tool-like path
            const canonicalHref = $('link[rel="canonical"]').attr("href") || $('meta[property="og:url"]').attr("content") || current;
            const canonicalFull = new URL(canonicalHref, current).toString();
            const cu = new URL(canonicalFull);
            if (!cu.hostname.includes("aitoolnet.com") || !isLikelyDetailPath(cu.pathname)) {
              console.log("[scrape:aitoolnet] skip non-detail canonical", cu.toString());
              continue;
            }

            // Collect explicit external Website/Visit anchors. Tool detail pages typically have exactly one.
            const websiteAnchors: string[] = [];
            $("a[href]").each((_j, a) => {
              const href = $(a).attr("href") || "";
              if (!href) return;
              const full = href.startsWith("http") ? href : new URL(href, current).toString();
              try {
                const u = new URL(full);
                // Prefer anchors that look like explicit "Website"/"Visit" actions
                const text = $(a).text().trim().toLowerCase();
                const looksLikeWebsiteBtn = /(website|visit|official|open|try|go to|view)/.test(text);
                if (!u.hostname.includes("aitoolnet.com") && (u.protocol === "http:" || u.protocol === "https:") && looksLikeWebsiteBtn) {
                  websiteAnchors.push(u.toString());
                }
              } catch {}
            });

            // Require at least one explicit Website anchor; pick the first
            if (websiteAnchors.length < 1) {
              console.log("[scrape:aitoolnet] no website anchor", current);
              continue;
            }
            const websiteUrl = websiteAnchors[0];

            // Build a normalized object compatible with InsertAiTool (partial)
            const h1Text = $("h1").first().text().trim();
            const name = (h1Text || title || null)?.replace(/\s*-\s*Aitoolnet\s*$/i, "") || null;
            const slug = name ? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") : null;
            const shortDescription = description || null;

            if (name && slug) {
              results.push({
                name,
                slug,
                shortDescription: shortDescription || name,
                description: description || name,
                category: "Content AI", // default; can refine later
                pricing: "Unknown",
                websiteUrl: websiteUrl,
                features: [],
                tags: [],
                badge: null,
                rating: null,
                sourceDetailUrl: canonicalFull,
              });
            }
          } catch (e) {
            // ignore individual page errors
          }
        }
      }

      const workers = Array.from({ length: Math.min(concurrency, candidates.length) }, () => worker());
      await Promise.all(workers);

      res.json({ count: results.length, items: results });
    } catch (error) {
      console.error("Error scraping aitoolnet:", error);
      res.status(500).json({ error: "Failed to scrape aitoolnet" });
    }
  });

  // Ingest endpoint: scrape and insert new tools, skipping duplicates by slug
  app.post("/api/ingest/aitoolnet", async (req, res) => {
    try {
      const { url, limit = 25, dryRun = false } = req.body as { url?: string; limit?: number; dryRun?: boolean };
      const baseHost = req.get("host") || `localhost:${process.env.PORT || 5000}`;
      const scrapeResp = await fetch(`http://${baseHost}/api/scrape/aitoolnet`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url, limit }),
      });
      if (!scrapeResp.ok) {
        return res.status(502).json({ error: `Scrape failed: ${scrapeResp.status}` });
      }
      const data = (await scrapeResp.json()) as { count: number; items: any[] };
      let inserted = 0;
      let skipped = 0;
      const errors: string[] = [];
      const processed: string[] = [];

      for (const item of data.items) {
        try {
          const slug = String(item.slug || "").trim();
          if (!slug || !item.name || !item.websiteUrl) {
            skipped++;
            continue;
          }
          const existing = await storage.getToolBySlug(slug);
          if (existing) {
            skipped++;
            continue;
          }

          if (!dryRun) {
            await storage.createTool({
              name: item.name,
              slug,
              description: item.description || item.shortDescription || item.name,
              shortDescription: item.shortDescription || item.description || item.name,
              category: item.category || "Content AI",
              pricing: item.pricing || "Unknown",
              websiteUrl: item.websiteUrl,
              logoUrl: item.logoUrl || null,
              features: Array.isArray(item.features) ? item.features : [],
              tags: Array.isArray(item.tags) ? item.tags : [],
              badge: item.badge ?? null,
              rating: item.rating ?? null,
            });
          }
          inserted++;
          processed.push(slug);
        } catch (e) {
          skipped++;
          errors.push(String((e as Error).message || e));
        }
      }

      res.json({ scraped: data.count, inserted, skipped, dryRun, processed, errors });
    } catch (error) {
      console.error("Error ingesting aitoolnet:", error);
      res.status(500).json({ error: "Failed to ingest aitoolnet" });
    }
  });
  const httpServer = createServer(app);

  return httpServer;
}
