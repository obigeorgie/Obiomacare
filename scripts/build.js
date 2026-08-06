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

// Copy root content/ to dist/content/ (new NCLEX guides)
const rootContentFiles = fs.readdirSync('content', { withFileTypes: true });
for (const entry of rootContentFiles) {
  const srcPath = path.join('content', entry.name);
  const destPath = path.join('dist', 'content', entry.name);
  if (entry.isDirectory()) {
    copyDir(srcPath, destPath);
  } else {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(srcPath, destPath);
  }
}

// Copy api/ to dist/api for serverless functions
fs.mkdirSync('dist/api', { recursive: true });
const apiFiles = fs.readdirSync('api');
for (const file of apiFiles) {
  fs.copyFileSync(path.join('api', file), path.join('dist/api', file));
}

console.log('✅ Build complete: landing/ + content/ → dist/');
