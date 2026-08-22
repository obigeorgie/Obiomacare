/**
 * Page-weight gate — per-page HISTORICAL baseline (not self-referential).
 *
 * Reads scripts/page-weight-baseline.json (committed deliberately, e.g. after
 * a reviewed build) and FAILS the build if any page exceeds
 * baseline × TOLERANCE. The 2026-08-21 P0 (4 concatenated copies → ~3.3×
 * weight) would have been caught instantly.
 *
 * Baseline updates are deliberate: rebuild after a reviewed change, verify,
 * then regenerate the baseline in a separate chore commit.
 *
 * Usage: node scripts/page-weight-gate.js [publicDir] [tolerance=1.35]
 */
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = process.env.OBIOMA_PUBLIC_DIR || path.join(__dirname, '..', 'public');
const BASELINE = path.join(__dirname, 'page-weight-baseline.json');
const TOLERANCE = parseFloat(process.argv[3] || process.env.PAGE_WEIGHT_TOLERANCE || '1.35');

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

function main() {
  if (!fs.existsSync(BASELINE)) {
    console.error(`❌ PAGE WEIGHT GATE: baseline ${BASELINE} missing. Seed it with: node scripts/page-weight-baseline-seed.js`);
    process.exit(1);
  }
  const baseline = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  const files = findHtmlFiles(PUBLIC_DIR);
  const failures = [];
  let checked = 0, covered = 0;

  for (const file of files) {
    const rel = '/' + path.relative(PUBLIC_DIR, file);
    const size = fs.statSync(file).size;
    checked++;
    const max = baseline[rel];
    if (max === undefined) {
      // New page: flag as warning (baseline needs a deliberate seed), not a fail.
      console.warn(`   ⚠ ${rel}: not in baseline (new page) — seed baseline after review`);
      continue;
    }
    covered++;
    const limit = Math.ceil(max * TOLERANCE);
    if (size > limit) {
      failures.push({ rel, size, max, limit, ratio: (size / max).toFixed(2) });
    }
  }

  if (failures.length) {
    console.error(`❌ PAGE WEIGHT GATE FAILED: ${failures.length} page(s) exceed historical baseline × ${TOLERANCE}.`);
    for (const f of failures) {
      console.error(`   ${f.rel}: ${f.size}B vs baseline ${f.max}B (limit ${f.limit}B, ratio ${f.ratio}×)`);
    }
    console.error(`   A large ratio usually means concatenation/duplication — check the page structure.`);
    process.exit(1);
  }
  console.log(`✅ PAGE WEIGHT GATE PASSED: ${covered}/${checked} pages within baseline × ${TOLERANCE}.`);
}

main();
