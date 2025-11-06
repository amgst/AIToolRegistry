# CSV Import Format Guide

## Required Fields

- **`name`** (required) - The name of the AI tool

## Optional Fields

All other fields are optional. Field names are **case-insensitive** and accept variations with/without spaces:

| Field Name | Accepted Variations |
|------------|---------------------|
| `name` | name (required) |
| `slug` | slug (auto-generated from name if not provided) |
| `description` | description |
| `short description` | short description, shortdescription |
| `category` | category (defaults to "Content AI") |
| `pricing` | pricing (defaults to "Unknown") |
| `website url` | website url, websiteurl |
| `logo url` | logo url, logourl |
| `features` | features (comma or semicolon separated) |
| `tags` | tags (comma or semicolon separated) |
| `badge` | badge (e.g., "Featured", "New", "Trending") |
| `rating` | rating (number 1-5) |
| `developer` | developer |
| `documentation url` | documentation url, documentationurl |
| `source detail url` | source detail url, sourcedetailurl |
| `use cases` | use cases, usecases (comma or semicolon separated) |
| `screenshots` | screenshots (comma or semicolon separated URLs) |

## CSV Format Rules

### 1. **Header Row**
- First row must contain column names
- Column names are case-insensitive
- Use commas to separate columns

### 2. **Quoting Values**
- Use double quotes (`"`) for values containing commas, quotes, or newlines
- To include a quote inside a quoted value, use double quotes (`""`)
- Example: `"This tool, with commas, is great"`
- Example: `"He said ""Hello"" to me"`

### 3. **Array Fields** (features, tags, use cases, screenshots)
- Separate multiple values with **commas** or **semicolons**
- Can be quoted or unquoted
- Examples:
  - `"Feature1,Feature2,Feature3"`
  - `Feature1;Feature2;Feature3`
  - `tag1,tag2,tag3`

### 4. **Empty Values**
- Leave empty for optional fields
- Empty values will use defaults or be skipped

### 5. **Special Characters**
- URLs can be unquoted if they don't contain commas
- Text with commas must be quoted
- Newlines in values must be quoted

## Example CSV

```csv
name,slug,description,short description,category,pricing,website url,logo url,features,tags,badge,rating,developer,documentation url,source detail url,use cases,screenshots
ChatGPT,chatgpt,"AI-powered conversational assistant for text and code","AI chatbot and coding assistant",Content AI,Freemium,https://chat.openai.com/,https://openai.com/favicon.ico,"Chat,Code help,Plugins","chat,assistant,productivity",Featured,5,OpenAI,https://platform.openai.com/docs,https://openai.com/chatgpt,"Conversational AI,Code assistance,Content generation","https://example.com/screenshot1.png,https://example.com/screenshot2.png"
Midjourney,midjourney,"AI image generation via Discord bot","Text-to-image generation",Image AI,Paid,https://www.midjourney.com/,https://www.midjourney.com/favicon.ico,"Image generation,Styles","image,art,creative",Featured,5,Midjourney Inc,https://docs.midjourney.com/,https://www.midjourney.com/,"Image creation,Art generation,Design","https://example.com/mj1.png,https://example.com/mj2.png"
```

## Minimal Example (Only Required Field)

```csv
name
My AI Tool
Another Tool
```

## Common Category Values

- Content AI
- Image AI
- Video AI
- Code AI
- Marketing AI
- Data AI
- Voice AI

## Common Pricing Values

- Free
- Freemium
- Paid
- Subscription
- Unknown

## Common Badge Values

- Featured
- New
- Trending

## Tips

1. **Download the template** from the Admin panel to see the exact format
2. **Use Dry Run** first to preview what will be imported
3. **Slug is auto-generated** from name if not provided (converts to lowercase, replaces spaces with hyphens)
4. **Duplicate detection** - Tools are matched by slug or website URL
5. **Updates vs Creates** - If a tool with the same slug or website URL exists, it will be updated instead of creating a duplicate

## Error Handling

- Rows with missing `name` will be skipped
- Invalid data will be logged in the errors array
- The import will continue processing other rows even if some fail
- Check the import results for detailed error messages

