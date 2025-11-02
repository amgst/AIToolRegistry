# PostgreSQL Migration Guide for Vercel

## ✅ The Solution: Vercel Postgres

**You don't need a separate service!** Vercel provides **Vercel Postgres** - a managed PostgreSQL database that works perfectly with serverless functions.

## Step 1: Create Vercel Postgres Database

1. Go to your Vercel project dashboard: https://vercel.com/dashboard
2. Click on your project
3. Go to **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Choose a name (e.g., "aitool-registry-db")
7. Select a region (closest to your users)
8. Click **Create**

**Vercel will automatically:**
- Create the PostgreSQL database
- Set the `POSTGRES_URL` environment variable
- Provide connection pooling
- Handle all database management

## Step 2: Update Code to Use PostgreSQL

The code changes below will make your app work with PostgreSQL while still supporting SQLite for local development.

## Step 3: Run Migrations

After setting up the database, you'll need to create the tables.

## Benefits of Vercel Postgres

- ✅ **Built into Vercel** - No separate account needed
- ✅ **Free tier available** - Hobby plan includes 256MB storage
- ✅ **Auto-scaling** - Handles traffic spikes
- ✅ **Connection pooling** - Optimized for serverless
- ✅ **Automatic backups** - Data is safe
- ✅ **Works with serverless** - Perfect for Vercel functions

## Pricing

- **Hobby**: Free - 256 MB storage, shared CPU
- **Pro**: $20/month - 8 GB storage, dedicated resources

For most apps, the free tier is enough to start!

