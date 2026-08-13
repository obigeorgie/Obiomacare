#!/usr/bin/env node
/**
 * Emoji to Lucide Icon Replacement Script
 * Replaces all emoji icons in HTML files with Lucide SVG icons
 * 
 * Usage: node scripts/replace-emojis.js [file-or-directory]
 * If no argument, processes all HTML files in landing/, content/, public/
 */

const fs = require('fs');
const path = require('path');
const { emojiToIcon, variants } = require('../design-tokens/emoji-map');

const LUCIDE_CDN = 'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js';

function getIconMarkup(emoji, context) {
  const mapping = emojiToIcon[emoji] || emojiToIcon[variants[emoji]];
  if (!mapping) {
    console.warn(`  ⚠️ No mapping for emoji: ${emoji}`);
    return null;
  }

  if (mapping.text) {
    return `<span class="emoji-replaced" aria-label="${mapping.aria}">${mapping.text}</span>`;
  }

  const sizeClass = context.isSmall ? 'icon-sm' : (context.isLarge ? 'icon-lg' : 'icon-md');
  return `<i data-lucide="${mapping.icon}" class="${mapping.class} ${sizeClass}" aria-label="${mapping.aria}"></i>`;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let modified = false;
  let replacementCount = 0;

  const allEmojis = Object.keys(emojiToIcon).concat(Object.keys(variants));
  allEmojis.sort((a, b) => b.length - a.length);
  
  const emojiPattern = new RegExp(
    allEmojis.map(e => e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'),
    'g'
  );

  // ─── Pass 1: Replace emojis in HTML (NOT in CSS content: declarations) ───
  const lines = content.split('\n');
  const processedLines = [];
  let inStyleTag = false;
  let inCSSContent = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Track if we're inside a <style> block
    if (line.includes('<style')) inStyleTag = true;
    if (line.includes('</style>')) {
      inStyleTag = false;
      processedLines.push(line);
      continue;
    }

    if (inStyleTag) {
      // In CSS: skip emojis in content: declarations
      // But replace checkmarks/x marks with Unicode equivalents
      if (line.includes('content:')) {
        line = line.replace(/content:\s*['"]([^'"]*)['"]/g, (match, inner) => {
          let newInner = inner;
          let cssModified = false;
          
          // Replace checkmarks
          if (newInner.includes('✅') || newInner.includes('✓')) {
            newInner = newInner.replace(/[✅✓]/g, '\\2713');
            cssModified = true;
          }
          // Replace x marks
          if (newInner.includes('❌') || newInner.includes('✗')) {
            newInner = newInner.replace(/[❌✗]/g, '\\2717');
            cssModified = true;
          }
          
          if (cssModified) {
            replacementCount++;
            modified = true;
            return `content: "${newInner}"`;
          }
          return match;
        });
      }
      processedLines.push(line);
      continue;
    }

    // In HTML body: replace emojis with Lucide icons
    let lineModified = false;
    const newLine = line.replace(emojiPattern, (match) => {
      const context = { isSmall: false, isLarge: false };
      const markup = getIconMarkup(match, context);
      if (markup) {
        lineModified = true;
        replacementCount++;
        return markup;
      }
      return match;
    });
    
    if (lineModified) modified = true;
    processedLines.push(newLine);
  }

  content = processedLines.join('\n');

  // ─── Pass 2: Add Lucide JS if any replacements were made ───
  if (modified && !content.includes('lucide.min.js') && !content.includes('lucide.createIcons')) {
    const lucideScript = `
    <!-- Lucide Icons — loaded once, hydrates all [data-lucide] elements -->
    <script src="${LUCIDE_CDN}"></script>
    <script>document.addEventListener('DOMContentLoaded', function(){ if(window.lucide) lucide.createIcons(); });</script>`;
    
    if (content.includes('</body>')) {
      content = content.replace('</body>', `${lucideScript}\n</body>`);
    } else if (content.includes('</head>')) {
      content = content.replace('</head>', `${lucideScript}\n</head>`);
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ Replaced ${replacementCount} emojis in ${path.basename(filePath)}`);
    return replacementCount;
  }

  return 0;
}

function findHtmlFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules' && item !== 'video-temp' && item !== 'video' && item !== 'downloads') {
      files.push(...findHtmlFiles(fullPath));
    } else if (stat.isFile() && item.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

// ─── Main ───
console.log('🔧 Emoji to Lucide Icon Replacement');
console.log('=====================================\n');

const target = process.argv[2];
let files = [];

if (target) {
  const stat = fs.statSync(target);
  if (stat.isDirectory()) {
    files = findHtmlFiles(target);
  } else {
    files = [target];
  }
} else {
  ['landing', 'content', 'public'].forEach(dir => {
    if (fs.existsSync(dir)) {
      files.push(...findHtmlFiles(dir));
    }
  });
}

console.log(`Found ${files.length} HTML files\n`);

let totalReplacements = 0;
let filesModified = 0;

for (const file of files) {
  const count = processFile(file);
  if (count > 0) {
    totalReplacements += count;
    filesModified++;
  }
}

console.log(`\n=====================================`);
console.log(`✅ Done: ${totalReplacements} emojis replaced across ${filesModified} files`);
console.log(`📦 Lucide CDN: ${LUCIDE_CDN}`);
