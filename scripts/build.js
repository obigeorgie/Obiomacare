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

// Copy root content/ files into landing/content/ so vercel.json rewrites work
// Rewrite: /content/(.*) -> /landing/content/$1
const rootContentFiles = fs.readdirSync('content', { withFileTypes: true });
let copied = 0;
for (const entry of rootContentFiles) {
  const srcPath = path.join('content', entry.name);
  const destPath = path.join('landing', 'content', entry.name);
  if (entry.isDirectory()) {
    copyDir(srcPath, destPath);
    copied++;
  } else {
    fs.mkdirSync(path.dirname(destPath), { recursive: true });
    fs.copyFileSync(srcPath, destPath);
    copied++;
  }
}

console.log(`✅ Build complete: ${copied} files from content/ merged into landing/content/`);
