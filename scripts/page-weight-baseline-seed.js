/**
 * Baseline seeder for the page-weight gate. Regenerate deliberately after a
 * reviewed + verified build:
 *   node scripts/page-weight-baseline-seed.js   (writes scripts/page-weight-baseline.json)
 *
 * Usage: node scripts/page-weight-baseline-seed.js [publicDir]
 */
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = process.env.OBIOMA_PUBLIC_DIR || path.join(__dirname, '..', 'public');
const OUT = path.join(__dirname, 'page-weight-baseline.json');

function findHtmlFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.endsWith('.html')) out.push(full);
    }
  }
  return out;
}

const baseline = {};
for (const file of findHtmlFiles(PUBLIC_DIR)) {
  const rel = '/' + path.relative(PUBLIC_DIR, file);
  baseline[rel] = fs.statSync(file).size;
}
fs.writeFileSync(OUT, JSON.stringify(baseline, null, 2) + '\n');
console.log(`✅ Baseline written: ${Object.keys(baseline).length} pages → ${OUT}`);
