// Copy server and shared directories to api/ for Vercel deployment
// Vercel only compiles TypeScript in api/ directory
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function fixImports(content, fileRelativePath) {
  // Fix @shared imports to use relative paths from api/server/ location
  // Files in api/server/ need to go up one level to reach api/shared/
  // Calculate depth: api/server/routes.ts -> depth 1 (just "server" folder)
  // For api/server/scrapers/file.ts -> depth 2 (server + scrapers)
  const depth = fileRelativePath ? fileRelativePath.split(path.sep).filter(Boolean).length : 0;
  const levelsUp = depth > 0 ? depth : 1;
  const sharedPath = '../'.repeat(levelsUp) + 'shared';
  
  // Replace @shared imports with relative imports
  content = content.replace(/from ["']@shared\//g, `from "${sharedPath}/`);
  content = content.replace(/from ["']@shared["']/g, `from "${sharedPath}"`);
  
  // Fix relative imports to add .js extensions for ESM compatibility
  // This handles imports like: from "./storage", from "./scrapers/scraper-manager", etc.
  // Pattern: matches "./something" or "../something" but not "./something.js" or "../something/index"
  content = content.replace(
    /from ["'](\.\.?\/[^"']+?)["']/g,
    (match, importPath) => {
      // Don't modify if it already ends with .js, .ts, .json, or has a query string
      // Also don't modify if it ends with /index (index.js will be resolved automatically)
      if (importPath.endsWith('.js') || 
          importPath.endsWith('.ts') || 
          importPath.endsWith('.json') ||
          importPath.includes('?') ||
          importPath.endsWith('/index') ||
          importPath.endsWith('/index.js')) {
        return match;
      }
      // Add .js extension for ESM
      return match.replace(importPath, importPath + '.js');
    }
  );
  
  return content;
}

function copyDir(src, dest, relativePath = '') {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    const newRelativePath = path.join(relativePath, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath, newRelativePath);
    } else {
      // For TypeScript/JavaScript files, fix imports
      if (entry.name.endsWith('.ts') || entry.name.endsWith('.js')) {
        const content = fs.readFileSync(srcPath, 'utf-8');
        const fixedContent = fixImports(content, relativePath);
        fs.writeFileSync(destPath, fixedContent, 'utf-8');
      } else {
        // For other files, just copy
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

try {
  console.log('Copying server/ to api/server/...');
  copyDir(path.join(rootDir, 'server'), path.join(rootDir, 'api', 'server'));
  console.log('✓ Copied server/ to api/server/');
  
  console.log('Copying shared/ to api/shared/...');
  copyDir(path.join(rootDir, 'shared'), path.join(rootDir, 'api', 'shared'));
  console.log('✓ Copied shared/ to api/shared/');
} catch (error) {
  console.error('❌ Error copying files:', error);
  process.exit(1);
}

