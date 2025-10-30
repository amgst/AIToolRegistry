import { storage } from "./storage";
import { load } from "cheerio";

type ScrapedTool = {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: string;
  pricing: string;
  websiteUrl: string;
  features: string[];
  tags: string[];
  badge: string | null;
  rating: number | null;
  sourceDetailUrl: string;
};

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function scrapeAitoolnet(listUrl = "https://www.aitoolnet.com/", limit = 25): Promise<ScrapedTool[]> {
  const listResp = await fetch(listUrl);
  if (!listResp.ok) {
    throw new Error(`Failed to fetch list: ${listResp.status}`);
  }
  const listHtml = await listResp.text();
  const $list = load(listHtml);

  const candidateHrefs = new Set<string>();
  $list("a[href]").each((_i, el) => {
    const href = $list(el).attr("href") || "";
    const text = $list(el).text().trim();
    if (!href) return;
    const full = href.startsWith("http") ? href : new URL(href, listUrl).toString();
    const u = new URL(full);
    if (!u.hostname.includes("aitoolnet.com")) return;
    if (u.pathname === "/" || u.pathname.length < 3) return;
    if (text.length >= 2) {
      candidateHrefs.add(u.toString());
    }
  });

  const candidates = Array.from(candidateHrefs).slice(0, Math.max(1, Math.min(50, limit)));

  const concurrency = 5;
  const results: ScrapedTool[] = [];
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

        let websiteUrl: string | null = null;
        $("a[href]").each((_j, a) => {
          const href = $(a).attr("href") || "";
          if (!href) return;
          const full = href.startsWith("http") ? href : new URL(href, current).toString();
          try {
            const u = new URL(full);
            if (!u.hostname.includes("aitoolnet.com") && (u.protocol === "http:" || u.protocol === "https:")) {
              websiteUrl = u.toString();
              return false; // break
            }
          } catch {}
        });

        if (!title) continue;
        const name = title;
        const slug = slugify(name);
        const shortDescription = description || name;
        const finalDescription = description || name;

        if (!websiteUrl) {
          // skip entries without an external website; DB requires websiteUrl
          continue;
        }

        results.push({
          name,
          slug,
          shortDescription,
          description: finalDescription,
          category: "Content AI",
          pricing: "Unknown",
          websiteUrl,
          features: [],
          tags: [],
          badge: null,
          rating: null,
          sourceDetailUrl: current,
        });
      } catch {
        // ignore individual page errors
      }
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, candidates.length) }, () => worker());
  await Promise.all(workers);

  return results;
}

async function seedFromAitoolnet(limit = 25) {
  console.log(`Seeding from aitoolnet with limit=${limit}...`);
  const items = await scrapeAitoolnet("https://www.aitoolnet.com/", limit);
  let inserted = 0;
  let skipped = 0;

  for (const item of items) {
    try {
      const existing = await storage.getToolBySlug(item.slug);
      if (existing) {
        skipped++;
        continue;
      }

      await storage.createTool({
        name: item.name,
        slug: item.slug,
        description: item.description,
        shortDescription: item.shortDescription,
        category: item.category,
        pricing: item.pricing,
        websiteUrl: item.websiteUrl,
        logoUrl: null,
        features: item.features,
        tags: item.tags,
        badge: item.badge,
        rating: item.rating ?? null,
      });
      inserted++;
    } catch (e) {
      // If insert fails (e.g., unique constraint), treat as skipped
      skipped++;
      console.warn(`Skip (${item.slug}): ${String((e as Error).message ?? e)}`);
    }
  }

  console.log(`Seed complete. inserted=${inserted}, skipped=${skipped}`);
}

async function seedSample() {
  console.log("Seeding curated sample dataset...");
  const samples: ScrapedTool[] = [
    {
      name: "ChatGPT",
      slug: slugify("ChatGPT"),
      description: "Conversational AI assistant for text and code.",
      shortDescription: "AI chatbot and coding assistant",
      category: "Assistant AI",
      pricing: "Freemium",
      websiteUrl: "https://chat.openai.com/",
      features: ["Chat", "Code help", "Plugins"],
      tags: ["chat", "assistant", "productivity"],
      badge: null,
      rating: 5,
      sourceDetailUrl: "https://openai.com",
    },
    {
      name: "Midjourney",
      slug: slugify("Midjourney"),
      description: "AI image generation via Discord bot.",
      shortDescription: "Text-to-image generation",
      category: "Image AI",
      pricing: "Paid",
      websiteUrl: "https://www.midjourney.com/",
      features: ["Image generation", "Styles"],
      tags: ["image", "art", "creative"],
      badge: null,
      rating: 5,
      sourceDetailUrl: "https://www.midjourney.com",
    },
    {
      name: "Claude",
      slug: slugify("Claude"),
      description: "Helpful AI assistant by Anthropic.",
      shortDescription: "Reliable AI assistant",
      category: "Assistant AI",
      pricing: "Freemium",
      websiteUrl: "https://claude.ai/",
      features: ["Chat", "File analysis"],
      tags: ["assistant", "chat"],
      badge: null,
      rating: 5,
      sourceDetailUrl: "https://www.anthropic.com",
    },
    {
      name: "Copilot",
      slug: slugify("GitHub Copilot"),
      description: "AI coding assistant in your editor.",
      shortDescription: "Suggests code in real time",
      category: "Developer AI",
      pricing: "Paid",
      websiteUrl: "https://github.com/features/copilot",
      features: ["Autocomplete", "Chat"],
      tags: ["code", "developer"],
      badge: null,
      rating: 5,
      sourceDetailUrl: "https://github.com/features/copilot",
    },
    {
      name: "Perplexity",
      slug: slugify("Perplexity"),
      description: "AI search engine with cited answers.",
      shortDescription: "Ask, get cited answers",
      category: "Search AI",
      pricing: "Freemium",
      websiteUrl: "https://www.perplexity.ai/",
      features: ["Search", "Citations"],
      tags: ["search", "assistant"],
      badge: null,
      rating: 5,
      sourceDetailUrl: "https://www.perplexity.ai",
    },
    {
      name: "Notion AI",
      slug: slugify("Notion AI"),
      description: "AI writing and organization built into Notion.",
      shortDescription: "Write, summarize, brainstorm",
      category: "Productivity AI",
      pricing: "Paid",
      websiteUrl: "https://www.notion.so/product/ai",
      features: ["Writing", "Brainstorm", "Summarize"],
      tags: ["productivity", "docs"],
      badge: null,
      rating: 4,
      sourceDetailUrl: "https://www.notion.so",
    },
    {
      name: "Runway",
      slug: slugify("Runway"),
      description: "AI video editing and generation tools.",
      shortDescription: "Text-to-video and editing",
      category: "Video AI",
      pricing: "Freemium",
      websiteUrl: "https://runwayml.com/",
      features: ["Video generation", "Editing"],
      tags: ["video", "creative"],
      badge: null,
      rating: 4,
      sourceDetailUrl: "https://runwayml.com",
    },
    {
      name: "Jasper",
      slug: slugify("Jasper"),
      description: "AI writing assistant for marketing content.",
      shortDescription: "Write blogs and ads",
      category: "Writing AI",
      pricing: "Paid",
      websiteUrl: "https://www.jasper.ai/",
      features: ["Templates", "Brand voice"],
      tags: ["writing", "marketing"],
      badge: null,
      rating: 4,
      sourceDetailUrl: "https://www.jasper.ai",
    },
    {
      name: "Synthesia",
      slug: slugify("Synthesia"),
      description: "Create AI videos with avatars and voice.",
      shortDescription: "AI avatar videos",
      category: "Video AI",
      pricing: "Paid",
      websiteUrl: "https://www.synthesia.io/",
      features: ["Avatars", "Voice"],
      tags: ["video", "avatar"],
      badge: null,
      rating: 4,
      sourceDetailUrl: "https://www.synthesia.io",
    },
    {
      name: "DALL·E",
      slug: slugify("DALL-E"),
      description: "AI image generation by OpenAI.",
      shortDescription: "Text-to-image",
      category: "Image AI",
      pricing: "Paid",
      websiteUrl: "https://openai.com/dall-e-2",
      features: ["Image generation"],
      tags: ["image", "art"],
      badge: null,
      rating: 4,
      sourceDetailUrl: "https://openai.com/dall-e-2",
    },
  ];

  let inserted = 0;
  let skipped = 0;

  for (const s of samples) {
    try {
      const existing = await storage.getToolBySlug(s.slug);
      if (existing) {
        skipped++;
        continue;
      }

      await storage.createTool({
        name: s.name,
        slug: s.slug,
        description: s.description,
        shortDescription: s.shortDescription,
        category: s.category,
        pricing: s.pricing,
        websiteUrl: s.websiteUrl,
        logoUrl: null,
        features: s.features,
        tags: s.tags,
        badge: s.badge,
        rating: s.rating ?? null,
      });
      inserted++;
    } catch (e) {
      skipped++;
      console.warn(`Skip (${s.slug}): ${String((e as Error).message ?? e)}`);
    }
  }

  console.log(`Sample seed complete. inserted=${inserted}, skipped=${skipped}`);
}

async function main() {
  const args = new Map<string, string>();
  for (const arg of process.argv.slice(2)) {
    const [k, v] = arg.includes("=") ? arg.split("=") : [arg, "true"];
    args.set(k.replace(/^--/, ""), v);
  }

  const limit = Number(args.get("limit") ?? "25");
  await seedFromAitoolnet(isNaN(limit) ? 25 : Math.max(1, Math.min(100, limit)));
  await seedSample();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});