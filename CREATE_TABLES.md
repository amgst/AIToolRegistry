# How to Create Tables in Neon

## Easiest Method: Run Locally

### Step 1: Get Your Connection String

1. Go to Vercel Dashboard → Your Project
2. Click **Settings** → **Environment Variables**
3. Find `POSTGRES_URL`
4. Click the **eye icon** to reveal the value
5. Copy the connection string (starts with `postgresql://`)

### Step 2: Run Migration Locally

Open your terminal in the project folder and run:

**Windows PowerShell:**
```powershell
$env:POSTGRES_URL="paste-your-connection-string-here"
npx drizzle-kit push
```

**Or create a `.env` file in your project root:**
```
POSTGRES_URL=your-connection-string-here
```

Then run:
```bash
npx drizzle-kit push
```

That's it! Tables will be created in Neon.

## Alternative: Use Auto-Creation Endpoint

I've added an endpoint that creates tables automatically. Visit:
```
https://your-app.vercel.app/api/health/create-tables
```

This will create tables on first use (one-time setup).

## Verify Tables Created

1. Go to https://console.neon.tech
2. Select your project
3. Click on **Tables** (or use SQL Editor)
4. You should see `ai_tools` table

## Troubleshooting

**"dialect does not match" error?**
→ Make sure `POSTGRES_URL` is set in your environment

**"Connection refused"?**
→ Check your connection string is correct

**Still can't create tables?**
→ The auto-creation endpoint will work - just deploy and visit it once!

