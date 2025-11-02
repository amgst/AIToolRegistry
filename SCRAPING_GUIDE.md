# Web Scraping Guide for AI Tool Registry

This guide explains how to use the automatic web scraping system to import AI tools from other websites into your registry.

## Overview

The scraping system is modular and extensible. It includes:
- **Base Scraper**: Common functionality for all scrapers (retry logic, rate limiting, etc.)
- **Scraper Manager**: Manages multiple scrapers and coordinates scraping operations
- **Sources Storage**: Configuration for scraping sources (URLs, schedules, etc.)
- **API Endpoints**: RESTful APIs to manage and trigger scraping

## Available Scrapers

Currently implemented scrapers:
1. **aitoolnet** - Scrapes AI tools from aitoolnet.com
2. **futuretools** - Scrapes AI tools from futuretools.io

## API Endpoints

### 1. List Available Scrapers
```bash
GET /api/scrapers
```

Response:
```json
{
  "available": ["aitoolnet", "futuretools"]
}
```

### 2. List All Scraping Sources
```bash
GET /api/scrapers/sources
```

Response:
```json
[
  {
    "id": "default-aitoolnet-1",
    "name": "AIToolNet - Text to Speech",
    "type": "aitoolnet",
    "url": "https://www.aitoolnet.com/text-to-speech",
    "enabled": true,
    "schedule": "0 3 * * *",
    "limit": 25,
    "concurrency": 5
  }
]
```

### 3. Create a New Scraping Source
```bash
POST /api/scrapers/sources
Content-Type: application/json

{
  "name": "My Custom Source",
  "type": "aitoolnet",
  "url": "https://www.aitoolnet.com/category",
  "enabled": true,
  "schedule": "0 3 * * *",
  "limit": 25,
  "concurrency": 5
}
```

**Fields:**
- `name` (required): Human-readable name for the source
- `type` (required): Scraper type (e.g., "aitoolnet", "futuretools")
- `url` (required): Starting URL to scrape
- `enabled` (optional): Whether the source is enabled (default: true)
- `schedule` (optional): Cron expression for automatic scraping (e.g., "0 3 * * *" = daily at 3 AM UTC)
- `limit` (optional): Maximum number of tools to scrape (default: 25)
- `concurrency` (optional): Number of concurrent requests (default: 5)

### 4. Update a Scraping Source
```bash
PATCH /api/scrapers/sources/:id
Content-Type: application/json

{
  "enabled": false,
  "limit": 50
}
```

### 5. Delete a Scraping Source
```bash
DELETE /api/scrapers/sources/:id
```

### 6. Test Scrape (No Database Insert)
```bash
POST /api/scrapers/scrape/:sourceId
```

This endpoint scrapes the source and returns the results without inserting into the database.

### 7. Scrape and Ingest (Insert into Database)
```bash
POST /api/scrapers/ingest/:sourceId
Content-Type: application/json

{
  "dryRun": false
}
```

This endpoint:
1. Scrapes tools from the source
2. Checks for duplicates (by slug)
3. Inserts new tools into the database
4. Returns statistics

**Response:**
```json
{
  "scraped": 25,
  "inserted": 20,
  "skipped": 5,
  "dryRun": false,
  "processed": ["tool-slug-1", "tool-slug-2"],
  "errors": [],
  "metadata": {
    "url": "https://...",
    "totalFound": 30,
    "processed": 25
  }
}
```

### 8. Scrape All Enabled Sources
```bash
POST /api/scrapers/scrape-all
Content-Type: application/json

{
  "enabledOnly": true
}
```

This endpoint scrapes all sources (optionally only enabled ones) concurrently.

## Cron Schedules

The system automatically runs scheduled scrapes based on the `schedule` field in each source.

**Common Cron Patterns:**
- `"0 3 * * *"` - Daily at 3:00 AM UTC
- `"0 */6 * * *"` - Every 6 hours
- `"0 0 * * 0"` - Weekly on Sunday at midnight
- `"0 0 1 * *"` - Monthly on the 1st at midnight

**Cron Format:**
```
* * * * *
│ │ │ │ │
│ │ │ │ └─── Day of week (0-7, where 0 and 7 = Sunday)
│ │ │ └───── Month (1-12)
│ │ └─────── Day of month (1-31)
│ └───────── Hour (0-23)
└─────────── Minute (0-59)
```

## Adding a New Scraper

To add support for a new website:

1. **Create a new scraper class** in `server/scrapers/`:

```typescript
import { BaseScraper, type ScrapeResult, type ScraperConfig } from "./base-scraper";
import { load } from "cheerio";

export class MySiteScraper extends BaseScraper {
  name = "mysite";

  async scrape(config: ScraperConfig): Promise<ScrapeResult> {
    const url = config.url || "https://example.com";
    const limit = config.limit || this.defaultLimit;
    const concurrency = config.concurrency || this.defaultConcurrency;
    const errors: string[] = [];
    const results: Partial<InsertAiTool>[] = [];

    try {
      // 1. Fetch the listing page
      const listResp = await this.fetchWithRetry(url);
      const listHtml = await listResp.text();
      const $list = load(listHtml);

      // 2. Find tool detail page URLs
      const candidateHrefs = new Set<string>();
      // ... your logic to find tool pages ...

      // 3. Scrape detail pages concurrently
      await this.fetchConcurrently(
        candidates,
        async (detailUrl) => {
          try {
            const resp = await this.fetchWithRetry(detailUrl);
            const html = await resp.text();
            const $ = load(html);

            // 4. Extract tool information
            const name = $("h1").first().text().trim();
            const description = $('meta[name="description"]').attr("content");
            // ... extract more fields ...

            // 5. Build tool object
            results.push({
              name,
              slug: this.slugify(name),
              description,
              // ... other fields ...
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
```

2. **Register the scraper** in `server/scrapers/scraper-manager.ts`:

```typescript
import { MySiteScraper } from "./mysite-scraper";

constructor() {
  // ... existing scrapers ...
  this.registerScraper(new MySiteScraper());
}
```

## Features

### Automatic Retry Logic
The base scraper includes automatic retry with exponential backoff for failed requests.

### Rate Limiting
- Configurable concurrency limit
- Automatic handling of HTTP 429 (rate limit) responses
- Timeout protection (30 seconds default)

### Error Handling
- Individual page errors don't stop the entire scrape
- Comprehensive error reporting
- Graceful degradation

### Duplicate Prevention
Tools are automatically skipped if they already exist (matched by slug).

## Best Practices

1. **Start with Dry Runs**: Test scraping with `dryRun: true` before inserting data
2. **Respect Rate Limits**: Use appropriate `concurrency` values (3-5 is usually safe)
3. **Monitor Errors**: Check the `errors` array in responses
4. **Schedule Wisely**: Don't scrape too frequently to avoid overwhelming target sites
5. **Respect robots.txt**: Always check and respect the target site's robots.txt file

## Examples

### Example 1: Add a New Source via API
```bash
curl -X POST http://localhost:5000/api/scrapers/sources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "FutureTools - Video Tools",
    "type": "futuretools",
    "url": "https://www.futuretools.io/video",
    "enabled": true,
    "schedule": "0 4 * * *",
    "limit": 30
  }'
```

### Example 2: Trigger Manual Scrape
```bash
curl -X POST http://localhost:5000/api/scrapers/ingest/default-aitoolnet-1 \
  -H "Content-Type: application/json" \
  -d '{"dryRun": false}'
```

### Example 3: Test Scrape Without Inserting
```bash
curl -X POST http://localhost:5000/api/scrapers/scrape/default-aitoolnet-1
```

## Troubleshooting

**Issue: Scraper returns empty results**
- Check if the target website structure has changed
- Verify the URL is correct
- Check browser console to see the actual HTML structure
- Review scraper logic in the specific scraper file

**Issue: Too many errors/timeouts**
- Reduce `concurrency` value
- Increase timeout in base scraper if needed
- Check network connectivity

**Issue: Duplicate tools being inserted**
- Check slug generation logic
- Verify existing tools in database
- Review duplicate detection code

## Future Enhancements

- Database-backed source storage (currently in-memory)
- Web UI for managing sources
- Scraping history and analytics
- Support for more websites
- Automatic category detection
- Logo/image extraction
- Feature and tag extraction from descriptions

