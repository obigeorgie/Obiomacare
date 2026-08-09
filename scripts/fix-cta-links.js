#!/usr/bin/env node
/**
 * Fix CTA buttons in content pages to link to #pricing instead of /
 */
const fs = require('fs');
const path = require('path');

const contentDir = 'content';
const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.html'));

let fixed = 0;
for (const file of files) {
  const filepath = path.join(contentDir, file);
  let content = fs.readFileSync(filepath, 'utf8');
  
  const original = content;
  
  // Fix various CTA button patterns
  content = content.replace(
    /<a href="\/" class="btn">Get Complete Mastery — \$67<\/a>/g,
    '<a href="/#pricing" class="btn">Get Complete Mastery — $67</a>'
  );
  
  content = content.replace(
    /<a href="\/" class="btn">Get the Complete System →<\/a>/g,
    '<a href="/#pricing" class="btn">Get the Complete System →</a>'
  );
  
  content = content.replace(
    /<a href="\/" class="btn">Start Training →<\/a>/g,
    '<a href="/#pricing" class="btn">Start Training →</a>'
  );
  
  content = content.replace(
    /<a href="\/" class="btn">Get It Now →<\/a>/g,
    '<a href="/#pricing" class="btn">Get It Now →</a>'
  );
  
  content = content.replace(
    /<a href="\/" class="btn">Start Prioritization Training →<\/a>/g,
    '<a href="/#pricing" class="btn">Start Prioritization Training →</a>'
  );
  
  content = content.replace(
    /<a href="\/" class="btn">Start Case Study Training →<\/a>/g,
    '<a href="/#pricing" class="btn">Start Case Study Training →</a>'
  );
  
  content = content.replace(
    /<a href="\/" style="font-size: 1\.1rem;">Get the Complete System for \$67 →<\/a>/g,
    '<a href="/#pricing" style="font-size: 1.1rem;">Get the Complete System for $67 →</a>'
  );
  
  if (content !== original) {
    fs.writeFileSync(filepath, content);
    console.log(`  ✅ Fixed: ${file}`);
    fixed++;
  }
}

console.log(`\n✅ Done: ${fixed} files updated`);
