// Example script to create multiple sources and import tools
// Run with: node bulk-import-example.js

const BASE_URL = 'http://localhost:5000';

// List of categories/URLs to scrape
const categories = [
  'text-to-speech',
  'copywriting',
  'image-generator',
  'video-editing',
  'code-assistant',
  'chatbot',
  'voice-cloning',
  'transcription',
  'summarization',
  'translation',
  'content-generation',
  'design-tools',
  'presentation-tools',
  'email-tools',
  'seo-tools',
  'social-media',
  'analytics',
  'data-analysis',
  'productivity',
  'education'
];

async function createSource(name, category) {
  const response = await fetch(`${BASE_URL}/api/scrapers/sources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `AIToolNet - ${name}`,
      type: 'aitoolnet',
      url: `https://www.aitoolnet.com/${category}`,
      enabled: true,
      limit: 500,
      concurrency: 5
    })
  });
  return response.json();
}

async function importFromSource(sourceId) {
  const response = await fetch(`${BASE_URL}/api/scrapers/ingest/${sourceId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dryRun: false, updateExisting: false })
  });
  return response.json();
}

async function main() {
  console.log('Creating sources and importing...');
  
  for (const category of categories) {
    try {
      const name = category.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      console.log(`Creating source: ${name}...`);
      const source = await createSource(name, category);
      
      console.log(`Importing from ${name}...`);
      const result = await importFromSource(source.id);
      console.log(`✓ ${name}: ${result.inserted} inserted, ${result.skipped} skipped`);
      
      // Wait a bit between imports to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Error with ${category}:`, error.message);
    }
  }
  
  console.log('Done!');
}

main();

