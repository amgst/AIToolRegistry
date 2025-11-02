// Copy server and shared directories to api/ for Vercel deployment
// Vercel only compiles TypeScript in api/ directory
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log('Copying server/ to api/server/...');
  copyDir(path.join(rootDir, 'server'), path.join(rootDir, 'api', 'server'));
  console.log('✅ Copied server/ to api/server/');
  
  console.log('Copying shared/ to api/shared/...');
  copyDir(path.join(rootDir, 'shared'), path.join(rootDir, 'api', 'shared'));
  console.log('✅ Copied shared/ to api/shared/');
} catch (error) {
  console.error('❌ Error copying files:', error);
  process.exit(1);
}

