const fs = require('fs');
const path = require('path');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
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

// Copy root content/ to public/content/ — Vercel serves public/ at root
fs.mkdirSync('public/content', { recursive: true });
const rootContentFiles = fs.readdirSync('content', { withFileTypes: true });
let copied = 0;
for (const entry of rootContentFiles) {
  const srcPath = path.join('content', entry.name);
  const destPath = path.join('public', 'content', entry.name);
  if (entry.isDirectory()) {
    copyDir(srcPath, destPath);
    copied++;
  } else {
    fs.copyFileSync(srcPath, destPath);
    copied++;
  }
}

// Also copy landing/ assets to public/ so they're available at root
const landingFiles = ['index.html', '404.html', 'free-nclex-checklist.html', 'neuro-cheat-sheet.html', 
  'privacy.html', 'terms.html', 'success.html', 'sitemap.xml', 'ab-dashboard.html', 'favicon.ico', 'favicon.svg', 'robots.txt',
  'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'obioma-logo.svg', 'obioma-seo.png'];
for (const file of landingFiles) {
  const src = path.join('landing', file);
  const dest = path.join('public', file);
  if (fs.existsSync(src)) {
    if (fs.statSync(src).isDirectory()) {
      copyDir(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

// Copy subdirectories
copyDir('landing/assets', 'public/assets');
copyDir('landing/images', 'public/images');
copyDir('landing/downloads', 'public/downloads');
copyDir('landing/free-framework', 'public/free-framework');
copyDir('landing/compare', 'public/compare');
copyDir('landing/products', 'public/products');
copyDir('landing/quiz', 'public/quiz');


console.log(`✅ Build complete: ${copied} content files + landing assets → public/`);
