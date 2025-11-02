# ✅ Next Steps After Connecting Neon

Great! Neon is connected. Now let's set up your database tables.

## Step 1: Verify Connection

Check that `POSTGRES_URL` is set:
1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. You should see `POSTGRES_URL` with a value starting with `postgresql://` or `postgres://`

## Step 2: Create Database Tables

You need to run migrations to create the tables. Two options:

### Option A: Via Vercel Dashboard (Recommended)

1. Go to your Vercel project → **Deployments** tab
2. Click on the latest deployment
3. Click **Functions** tab
4. Open the terminal (or use Vercel CLI locally)

Run:
```bash
npx drizzle-kit push
```

This will create all the tables in your Neon database.

### Option B: Locally (If you have Neon connection string)

1. Get your `POSTGRES_URL` from Vercel Environment Variables
2. Set it locally:
   ```bash
   # Windows PowerShell
   $env:POSTGRES_URL="your-connection-string-here"
   
   # Or create .env file with:
   POSTGRES_URL=your-connection-string-here
   ```
3. Update `drizzle.config.ts` to use PostgreSQL (if needed)
4. Run: `npx drizzle-kit push`

## Step 3: Verify Tables Created

Check your Neon dashboard:
1. Go to https://console.neon.tech
2. Select your project
3. Go to **Tables** section
4. You should see `ai_tools` table

## Step 4: Test Your App

1. Visit your deployed site: `https://your-app.vercel.app`
2. Check `/api/health` endpoint - should show PostgreSQL connected
3. Visit `/admin` - you can now add tools!

## Step 5: Import Initial Data (Optional)

You can:
- Use the Admin panel scraping feature
- Or manually add tools via the Admin form

## Troubleshooting

**Error: "relation does not exist"**
→ Tables not created yet. Run `npx drizzle-kit push`

**Error: "Connection failed"**
→ Check `POSTGRES_URL` is set correctly in Vercel

**No data showing**
→ Tables might be empty. Add your first tool via Admin panel!

