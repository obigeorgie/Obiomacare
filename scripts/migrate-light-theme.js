#!/usr/bin/env node
/**
 * Light Theme Migration Script
 * Systematically converts dark-theme HTML files to light theme
 */

const fs = require('fs');
const path = require('path');

const LANDING_DIR = path.join(__dirname, '..', 'landing');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

// Dark → Light color mappings
const COLOR_MAPPINGS = {
  // Backgrounds
  '#0a1628': 'var(--color-bg-secondary)',
  '#0f1d32': 'var(--color-bg-secondary)',
  '#162544': 'var(--color-bg-tertiary)',
  '#1e3560': 'var(--color-bg-tertiary)',
  '#0a162880': 'var(--color-bg-secondary)',
  '#0f1d3280': 'var(--color-bg-secondary)',
  'rgba(10, 22, 40': 'rgba(248, 250, 252',
  'rgba(15, 29, 50': 'rgba(248, 250, 252',
  'rgba(10,22,40': 'rgba(248,250,252',
  'rgba(15,29,50': 'rgba(248,250,252',
  
  // Text colors (dark bg text → light bg text)
  '#e2e8f0': 'var(--color-text-primary)',
  '#e2e8f0cc': 'var(--color-text-secondary)',
  '#e2e8f080': 'var(--color-text-muted)',
  '#94a3b8': 'var(--color-text-secondary)',
  '#64748b': 'var(--color-text-muted)',
  '#ffffff': 'var(--color-text-primary)',
  'rgb(226, 232, 240)': 'var(--color-text-primary)',
  'rgb(148, 163, 184)': 'var(--color-text-secondary)',
  'rgb(100, 116, 139)': 'var(--color-text-muted)',
  
  // Borders
  'rgba(255, 255, 255, 0.1)': 'var(--color-border)',
  'rgba(255,255,255,0.1)': 'var(--color-border)',
  'rgba(255, 255, 255, 0.05)': 'var(--color-border-light)',
  'rgba(255,255,255,0.05)': 'var(--color-border-light)',
  'rgba(255, 255, 255, 0.15)': 'var(--color-border-dark)',
  'rgba(255,255,255,0.15)': 'var(--color-border-dark)',
};

// Shadow mappings
const SHADOW_MAPPINGS = [
  { from: 'rgba(0, 0, 0, 0.3)', to: 'rgba(0, 0, 0, 0.1)' },
  { from: 'rgba(0,0,0,0.3)', to: 'rgba(0,0,0,0.1)' },
  { from: 'rgba(0, 0, 0, 0.4)', to: 'rgba(0, 0, 0, 0.1)' },
  { from: 'rgba(0,0,0,0.4)', to: 'rgba(0,0,0,0.1)' },
  { from: 'rgba(0, 0, 0, 0.5)', to: 'rgba(0, 0, 0, 0.1)' },
  { from: 'rgba(0,0,0,0.5)', to: 'rgba(0,0,0,0.1)' },
  { from: 'rgba(0, 0, 0, 0.6)', to: 'rgba(0, 0, 0, 0.1)' },
  { from: 'rgba(0,0,0,0.6)', to: 'rgba(0,0,0,0.1)' },
];

function convertFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;

  // Apply color mappings
  for (const [dark, light] of Object.entries(COLOR_MAPPINGS)) {
    if (content.includes(dark)) {
      content = content.split(dark).join(light);
      modified = true;
    }
  }

  // Apply shadow mappings
  for (const { from, to } of SHADOW_MAPPINGS) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      modified = true;
    }
  }

  // Fix specific gradient patterns
  content = content.replace(
    /linear-gradient\(135deg,\s*#0a1628\s+0%,\s*#0f1d32\s+100%\)/g,
    'linear-gradient(135deg, var(--color-bg) 0%, var(--color-bg-secondary) 100%)'
  );
  content = content.replace(
    /linear-gradient\(135deg,\s*#0f1d32\s+0%,\s*#162544\s+100%\)/g,
    'linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%)'
  );
  content = content.replace(
    /linear-gradient\(135deg,\s*var\(--navy-800\)\s+0%,\s*var\(--navy-700\)\s+100%\)/g,
    'linear-gradient(135deg, var(--color-bg-secondary) 0%, var(--color-bg-tertiary) 100%)'
  );
  content = content.replace(
    /linear-gradient\(180deg,\s*#0a1628\s+0%,\s*#0f1d32\s+100%\)/g,
    'linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-secondary) 100%)'
  );

  // Fix body background
  content = content.replace(
    /body\s*\{[^}]*background:\s*#0a1628[^}]*\}/g,
    'body { background: var(--color-bg); color: var(--color-text-primary); }'
  );
  content = content.replace(
    /body\s*\{[^}]*background:\s*var\(--color-navy-900\)[^}]*\}/g,
    'body { background: var(--color-bg); color: var(--color-text-primary); }'
  );

  // Fix nav background
  content = content.replace(
    /nav\s*\{[^}]*background:\s*rgba\(10,\s*22,\s*40,\s*0\.9\)[^}]*\}/g,
    'nav { background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(12px); border-bottom: 1px solid var(--color-border); }'
  );

  // Fix footer
  content = content.replace(
    /footer\s*\{[^}]*background:\s*rgba\(10,\s*22,\s*40,\s*0\.8\)[^}]*\}/g,
    'footer { background: var(--color-bg-secondary); color: var(--color-text-secondary); border-top: 1px solid var(--color-border); }'
  );

  // Fix card backgrounds
  content = content.replace(
    /background:\s*rgba\(255,\s*255,\s*255,\s*0\.05\)/g,
    'background: var(--color-bg-elevated)'
  );
  content = content.replace(
    /background:\s*rgba\(255,255,255,0\.05\)/g,
    'background: var(--color-bg-elevated)'
  );

  if (modified || content !== fs.readFileSync(filePath, 'utf-8')) {
    fs.writeFileSync(filePath, content, 'utf-8');
    return true;
  }
  return false;
}

// Find all HTML files
function findHtmlFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !item.includes('node_modules')) {
      findHtmlFiles(fullPath, files);
    } else if (item.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

// Main
const files = findHtmlFiles(LANDING_DIR);
console.log(`🎨 Light Theme Migration`);
console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Found ${files.length} HTML files in landing/\n`);

let converted = 0;
let skipped = 0;

for (const file of files) {
  const relative = path.relative(LANDING_DIR, file);
  const wasModified = convertFile(file);
  if (wasModified) {
    console.log(`  ✅ ${relative}`);
    converted++;
  } else {
    console.log(`  ⏭️  ${relative} (no dark patterns found)`);
    skipped++;
  }
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`Done: ${converted} converted, ${skipped} skipped`);
console.log(`Now run: cd /root/.openclaw/workspace/obioma-care && node scripts/build.js`);
