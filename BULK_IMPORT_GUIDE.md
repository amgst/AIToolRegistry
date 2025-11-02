# Guide: How to Add 1000+ Tools to Your Registry

## Overview

This guide explains different strategies to bulk import 1000+ AI tools into your registry.

## Strategy Comparison

| Strategy | Pros | Cons | Best For |
|----------|------|------|----------|
| **Multiple Sources** | Organized, scalable, can run automatically | Need to find many URLs | Long-term, automated |
| **High Limit Per Source** | Quick, simple | Limited by what's on one page | Quick bulk import |
| **Bulk API Script** | Automated, fast | Requires coding | Developers |
| **CSV Import** | Very fast, manual control | Need to prepare data | One-time bulk upload |

---

## Strategy 1: Multiple Scraping Sources (RECOMMENDED)

### How It Works
- Create 20-40 scraping sources from different categories/pages
- Each source can scrape up to **500 tools** (new limit)
- Run all sources at once or individually

### Steps:

1. **Find Category URLs**
   - Visit aitoolnet.com and find category pages
   - Example categories:
     - `/text-to-speech`
     - `/copywriting`
     - `/image-generator`
     - `/video-editing`
     - `/code-assistant`
     - `/chatbot`
     - etc.

2. **Create Sources via Admin UI**
   - Go to Admin page
   - Use API or create sources manually
   - Set limit to 500 for each

3. **Import All Sources**
   - Click "Scrape All Enabled" button
   - OR import each source individually

### Example URLs to Create:
```
https://www.aitoolnet.com/text-to-speech
https://www.aitoolnet.com/copywriting
https://www.aitoolnet.com/image-generator
https://www.aitoolnet.com/video-editing
https://www.aitoolnet.com/code-assistant
https://www.aitoolnet.com/chatbot
https://www.aitoolnet.com/voice-cloning
https://www.aitoolnet.com/transcription
... (20+ more categories)
```

### Result:
- 20 sources × 500 tools = **10,000 potential tools**
- After deduplication, you'll get unique tools

---

## Strategy 2: Increase Limit + Multiple Runs

### How It Works
- Set limit to 500 for existing sources
- Run multiple times with different URLs

### Steps:

1. **Edit Source Limit**
   - Click "Edit" next to "Limit: 25 tools"
   - Change to 500
   - Click "Done"

2. **Import with Higher Limit**
   - Enter custom limit in the input box (up to 500)
   - Click "Import" or "Update"

3. **Repeat for Different URLs**
   - Update source URL to different category
   - Import again

### Result:
- Each import can get up to 500 tools
- 2-3 imports can easily reach 1000+ tools

---

## Strategy 3: Automated Bulk Import Script

### How It Works
Use the provided `bulk-import-example.js` script to:
- Automatically create multiple sources
- Import from all sources
- Track progress

### Steps:

1. **Install Dependencies** (if needed)
   ```bash
   # Node.js fetch should work out of the box in Node 18+
   ```

2. **Run the Script**
   ```bash
   node bulk-import-example.js
   ```

3. **Customize Categories**
   - Edit the `categories` array in the script
   - Add/remove categories as needed

### Result:
- Automated import from 20+ categories
- Can complete in 10-20 minutes
- Easy to re-run

---

## Strategy 4: CSV/JSON Bulk Import (FUTURE FEATURE)

### This Would Allow:
- Prepare a CSV/JSON file with 1000 tools
- Import all at once via Admin UI
- Fastest method for bulk upload

### Current Status:
Not yet implemented, but could be added as a feature.

---

## Best Practices

### 1. Rate Limiting
- Wait 2-3 seconds between large imports
- Use lower concurrency (3-5) to avoid overwhelming servers
- Don't run too many sources simultaneously

### 2. Deduplication
- The system automatically skips duplicates by slug
- You can use "Update" button to refresh existing tools
- Check "Skipped" count to see how many were duplicates

### 3. Error Handling
- Some sources may fail - that's okay
- Check error messages in results
- Retry failed sources individually

### 4. Progress Tracking
- Monitor "Scraped" vs "Inserted" counts
- Use "Test" button first to preview results
- Check Admin page for total tool count

---

## Example Workflow: Getting 1000 Tools

### Option A: Quick Method (30 minutes)
1. Edit 3 existing sources: Set limit to 500 each
2. Change URLs to different categories
3. Import all 3 sources
4. Result: ~1000-1500 tools (with some overlap)

### Option B: Comprehensive Method (1-2 hours)
1. Create 25 new sources with different category URLs
2. Set each limit to 200-500
3. Run "Scrape All Enabled"
4. Result: 2000-5000+ tools (after deduplication = 1000+ unique)

### Option C: Automated Method (Setup once, runs automatically)
1. Set up bulk-import script with 30 categories
2. Run script
3. Check results
4. Result: 3000-5000+ tools imported

---

## Troubleshooting

### "Only 7 tools imported"
- The page you're scraping may only have 7 tools
- Solution: Change URL to a category page with more tools
- Or use multiple sources

### "Many duplicates skipped"
- This is normal! The system prevents duplicates
- Use "Update" button to refresh existing tools
- Or check different sources/URLs

### "Rate limiting errors"
- Too many requests too fast
- Solution: Reduce concurrency, add delays between imports
- Wait a few minutes and retry

### "Source not found"
- Source ID might be wrong
- Refresh the page to reload sources
- Check source exists in Admin UI

---

## Tips for Success

1. **Start Small**: Test with 1-2 sources first
2. **Use Categories**: Category pages usually have more tools than homepage
3. **Check Results**: Review what was imported before scaling up
4. **Be Patient**: Large imports take time
5. **Monitor Progress**: Watch the console/server logs

---

## Next Steps

1. Choose a strategy above
2. Set up your sources
3. Start importing
4. Monitor progress
5. Adjust as needed

Good luck with your bulk import! 🚀

