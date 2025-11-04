# Import Tools from Aitoolnet.com

## Vercel Serverless Function

The import can be triggered via a Vercel serverless function endpoint.

### Endpoint
```
POST https://your-domain.vercel.app/api/import-aitoolnet
```

### How to Run

#### Option 1: Using curl
```bash
curl -X POST https://your-domain.vercel.app/api/import-aitoolnet \
  -H "Content-Type: application/json"
```

#### Option 2: Using a REST client (Postman, Insomnia, etc.)
- Method: `POST`
- URL: `https://your-domain.vercel.app/api/import-aitoolnet`
- Headers: `Content-Type: application/json`

#### Option 3: From browser console (after deployment)
```javascript
fetch('https://your-domain.vercel.app/api/import-aitoolnet', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => r.json())
.then(console.log)
```

### Authentication (Optional)

If you set `IMPORT_TOKEN` environment variable in Vercel, you need to include it in the request:

```bash
curl -X POST https://your-domain.vercel.app/api/import-aitoolnet \
  -H "Authorization: Bearer YOUR_IMPORT_TOKEN" \
  -H "Content-Type: application/json"
```

### Response

The endpoint returns a JSON response with:
- `success`: boolean
- `summary`: Object with:
  - `scraped`: Number of tools scraped
  - `inserted`: Number of tools successfully imported
  - `skipped`: Number of tools skipped (already exist or missing required fields)
  - `errors`: Number of errors encountered
  - `totalTimeMs`: Total time in milliseconds
  - `totalTimeMinutes`: Total time in minutes
- `totalToolsInDatabase`: Total tools in database after import
- `errors`: Array of error messages (if any)

### Example Response
```json
{
  "success": true,
  "summary": {
    "scraped": 450,
    "inserted": 380,
    "skipped": 70,
    "errors": 0,
    "totalTimeMs": 125000,
    "totalTimeMinutes": "2.08"
  },
  "totalToolsInDatabase": 380,
  "errors": null
}
```

### Notes

- The import will scrape up to **500 tools** from Aitoolnet.com
- The function has a **5-minute timeout** (300 seconds)
- Duplicate tools (by slug or website URL) are automatically skipped
- The import runs on Vercel's serverless infrastructure

### Environment Variables Required

Make sure these are set in your Vercel project:
- `FIREBASE_SERVICE_ACCOUNT`: Firebase service account JSON (stringified)
- `FIREBASE_PROJECT_ID`: Firebase project ID (optional, defaults to "ai-directory-6e37e")
- `IMPORT_TOKEN`: (Optional) Token for authenticating import requests
