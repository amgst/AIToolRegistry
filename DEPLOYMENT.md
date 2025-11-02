# Vercel Deployment Guide

## ⚠️ Current Status: **NOT READY** - Requires Database Migration

**Progress:**
- ✅ Vercel configuration files created
- ✅ Express serverless function setup
- ✅ Cron job handler created
- ❌ **Database migration required** (SQLite → PostgreSQL)
- ❌ **Sources storage persistence required**

This app is **not yet ready** for Vercel deployment due to the following issues:

## Issues to Fix

### 1. **SQLite Database** ❌
- **Problem**: Uses file-based SQLite which doesn't work on Vercel's serverless functions
- **Solution**: Switch to PostgreSQL (Vercel Postgres recommended)

### 2. **In-Memory Storage** ❌  
- **Problem**: `sourcesStorage` is in-memory and will be lost on each serverless invocation
- **Solution**: Migrate scraping sources to database

### 3. **Cron Jobs** ⚠️
- **Problem**: Uses `node-cron` which won't work in serverless
- **Solution**: Use Vercel Cron Jobs (configuration started in `vercel.json`)

## Steps to Deploy

### Step 1: Set up Vercel Postgres Database

1. Go to your Vercel project dashboard
2. Navigate to **Storage** → **Create Database** → **Postgres**
3. Copy the connection string

### Step 2: Update Database Connection

Update `server/db.ts` to use PostgreSQL instead of SQLite:

```typescript
// Replace SQLite with PostgreSQL
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("POSTGRES_URL or DATABASE_URL environment variable is required");
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

### Step 3: Update Schema for PostgreSQL

Update `shared/schema.ts`:
- Change `sqliteTable` to `pgTable`
- Change `text()` to `text()` or `varchar()`
- Update types for JSON fields (use `jsonb` in PostgreSQL)

### Step 4: Migrate Sources Storage to Database

Create a new table in `shared/schema.ts` for scraping sources:

```typescript
export const scrapingSources = pgTable("scraping_sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(),
  url: text("url").notNull(),
  enabled: boolean("enabled").notNull().default(true),
  schedule: text("schedule"),
  limit: integer("limit"),
  concurrency: integer("concurrency"),
});
```

Then update `server/scrapers/sources-storage.ts` to use the database.

### Step 5: Update Package.json Build Script

Ensure the build script is correct:

```json
{
  "scripts": {
    "build": "vite build && esbuild api/index.ts --platform=node --packages=external --bundle --format=esm --outdir=api"
  }
}
```

### Step 6: Environment Variables

Set these in Vercel dashboard:
- `POSTGRES_URL` or `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV=production`
- Any other required environment variables

### Step 7: Install Vercel Dependencies (Optional)

For TypeScript types, you may want:
```bash
npm install --save-dev @vercel/node
```

### Step 8: Deploy

1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel` (or push to GitHub and connect repo)
3. Vercel will automatically detect `vercel.json` and deploy

**Or deploy via GitHub:**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Vercel will auto-detect the configuration

## Files Created for Vercel

- ✅ `vercel.json` - Vercel configuration
- ✅ `api/index.ts` - Serverless function entry point
- ⚠️ Database migration still needed
- ⚠️ Schema updates still needed

## Notes

- The current `api/index.ts` is a starting point but needs testing
- Cron jobs configuration in `vercel.json` needs to match your sources' schedules
- Make sure to test locally before deploying

