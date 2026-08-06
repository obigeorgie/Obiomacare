const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
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

// Copy landing/ to dist/
copyDir('landing', 'dist');

// Copy api/ to dist/api for serverless functions
fs.mkdirSync('dist/api', { recursive: true });
const apiFiles = fs.readdirSync('api');
for (const file of apiFiles) {
  fs.copyFileSync(path.join('api', file), path.join('dist/api', file));
}

console.log('✅ Build complete: landing/ → dist/');
