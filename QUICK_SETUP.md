# 🚀 Quick Setup Guide - Neon PostgreSQL on Vercel

## Step-by-Step

### 1. Connect Neon Database in Vercel

1. Open your Vercel project dashboard
2. Go to **Storage** tab (left sidebar)
3. Click **Create Database** button
4. In the **Marketplace Database Providers** modal:
   - **Select Neon** (Serverless Postgres - has green 'N' logo)
   - Click **Continue**
5. **If you don't have Neon account:**
   - Click to create one (free)
   - Sign up with GitHub/Google (fastest)
6. **Create database:**
   - Choose a name (e.g., "aitool-db")
   - Select region closest to you
   - Click **Connect**

**Vercel automatically sets `POSTGRES_URL` environment variable!**

### 2. Deploy Your Code

Push your code to GitHub - Vercel will auto-deploy. The code is already updated to use PostgreSQL when `POSTGRES_URL` is detected.

### 3. Create Tables (One-time)

After deployment, create the database tables:

**Option A: Via Vercel Dashboard**
- Go to your project → **Functions** tab
- Open terminal
- Run: `npx drizzle-kit push`

**Option B: Via Admin Panel**
- Visit `/admin` on your deployed site
- Add your first tool via the form
- Tables will be created automatically

### 4. Seed Data (Optional)

You can import tools via the Admin panel's scraping feature!

## ✅ Done!

Your app now has:
- ✅ PostgreSQL database (Neon)
- ✅ Persistent data storage
- ✅ Works on Vercel serverless
- ✅ Free tier to start

## Troubleshooting

**No data showing?**
- Check that `POSTGRES_URL` is set in Vercel dashboard
- Visit `/api/health` to check database connection
- Make sure tables are created (run `npx drizzle-kit push`)

**Connection errors?**
- Verify `POSTGRES_URL` in Environment Variables
- Check Neon dashboard - database should be "Active"
- Look at Vercel function logs for errors

