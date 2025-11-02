# Import Improvements: Duplicate Detection & Multi-Website Support

## ✅ What's Been Improved

### 1. **Better Duplicate Detection**

**Before:** Only checked by slug
- Tools with same name = duplicate ✓
- Tools with different names but same website = NOT detected ✗

**After:** Checks by BOTH slug AND website URL
- Tools with same slug = duplicate ✓
- Tools with same website URL (different slugs) = duplicate ✓
- **Much better at avoiding duplicates!**

**How it works:**
- Normalizes URLs (removes www, protocol, trailing slashes)
- Compares both slug and website URL
- Shows clear reason why item was skipped

**Example:**
- Tool A: "ChatGPT" from openai.com
- Tool B: "ChatGPT Plus" also from openai.com
- **Result:** Tool B detected as duplicate (same website) ✓

---

### 2. **Generic Scraper - Import from ANY Website**

**New Feature:** Generic scraper that works with any website!

**How to use:**
1. Go to Admin page
2. Click "Add Source" button
3. Select "Generic (Any Website)" as scraper type
4. Enter any website URL
5. Set limit (1-500)
6. Click "Create Source"
7. Click "Import" to scrape

**What it does:**
- Automatically detects tool listings on any website
- Extracts tool names, descriptions, website URLs
- Uses heuristics to find the actual tool websites
- Works with most AI tool directory websites

**Supported Websites:**
- ✅ Any website with tool listings
- ✅ AIToolNet (use "aitoolnet" type for best results)
- ✅ FutureTools (use "futuretools" type for best results)
- ✅ Custom websites
- ✅ Personal tool lists

---

### 3. **UI Improvements**

**New "Add Source" Button:**
- Easy form to create new scraping sources
- Dropdown to select scraper type
- Supports Generic, AIToolNet, FutureTools

**Better Duplicate Reporting:**
- Shows exact reason: "Duplicate slug" vs "Duplicate website URL"
- Lists up to 5 skipped items with reasons
- Clear feedback on what happened

---

## 🚀 How to Import from Other Websites

### Method 1: Generic Scraper (Recommended)

1. **Create a new source:**
   - Click "Add Source" in Admin
   - Name: "My Custom Website"
   - Type: "Generic (Any Website)"
   - URL: `https://example.com/ai-tools`
   - Limit: 100-500
   - Click "Create Source"

2. **Import:**
   - Click "Test" first to preview
   - Then click "Import"
   - Done! Tools imported

### Method 2: API (For Developers)

```bash
POST /api/scrapers/sources
Content-Type: application/json

{
  "name": "My Custom Website",
  "type": "generic",
  "url": "https://example.com/ai-tools",
  "limit": 200,
  "enabled": true
}
```

Then import:
```bash
POST /api/scrapers/ingest/{sourceId}
Content-Type: application/json

{
  "dryRun": false,
  "updateExisting": false
}
```

---

## 📊 Duplicate Detection Examples

### Scenario 1: Same Tool, Different Sources
- **Source 1:** Scrapes "ChatGPT" from aitoolnet.com
- **Source 2:** Scrapes "ChatGPT" from futuretools.io
- **Result:** ✅ Second import skipped (duplicate slug detected)

### Scenario 2: Same Website, Different Names
- **Source 1:** "OpenAI ChatGPT" → openai.com
- **Source 2:** "ChatGPT Plus" → openai.com  
- **Result:** ✅ Second import skipped (duplicate website URL detected)

### Scenario 3: Different Tools
- **Source 1:** "ChatGPT" → openai.com
- **Source 2:** "Claude" → anthropic.com
- **Result:** ✅ Both imported (not duplicates)

---

## 🎯 Best Practices

### For Avoiding Duplicates:
1. ✅ Use "Update" button if you want to refresh existing tools
2. ✅ Check skipped items to see why they were skipped
3. ✅ Generic scraper automatically avoids duplicates
4. ✅ System checks both slug and URL, so duplicates are rare

### For Importing from Other Websites:
1. ✅ Test first with "Test" button (dry run)
2. ✅ Start with small limit (50-100) to test
3. ✅ Use Generic scraper for unknown websites
4. ✅ Use specific scrapers (aitoolnet/futuretools) for known sites
5. ✅ Increase limit once you confirm it works

### For Bulk Imports (1000+ tools):
1. ✅ Create multiple sources (20-40 sources)
2. ✅ Each source with limit 200-500
3. ✅ Use "Scrape All Enabled" button
4. ✅ Duplicates automatically skipped
5. ✅ Result: Thousands of unique tools

---

## 🔍 Technical Details

### Duplicate Detection Logic:
```typescript
1. Check by slug (exact match)
   ↓ If not found
2. Check by normalized website URL
   ↓ If found
3. Mark as duplicate with reason
```

### URL Normalization:
- Removes: `https://`, `http://`, `www.`
- Removes trailing slashes
- Lowercase comparison
- Example: `https://www.OpenAI.com/` = `openai.com`

### Generic Scraper Heuristics:
- Finds links on listing page
- Skips navigation/utility pages
- Looks for external website links
- Extracts meta tags (title, description, OG tags)
- Tries to find actual tool website URLs

---

## 🆘 Troubleshooting

### "No tools found"
- Website might not have listings on that page
- Try different URL (category page, search page)
- Check if website blocks scraping (check robots.txt)

### "Many duplicates"
- Normal if importing from same source twice
- Use "Update" button to refresh existing tools
- Try different sources/websites

### "Generic scraper not working well"
- Some websites have unique structures
- Try specific scraper types if available
- Or manually add tools via Admin form

---

## 📝 Summary

✅ **Better duplicate detection** - Checks slug AND website URL
✅ **Generic scraper** - Works with any website
✅ **Easy UI** - Add sources with one click
✅ **Clear feedback** - Shows exactly why items were skipped
✅ **Flexible** - Import from unlimited sources
✅ **Automatic** - Duplicates handled automatically

**You can now import from ANY website and the system will intelligently avoid duplicates!** 🎉

