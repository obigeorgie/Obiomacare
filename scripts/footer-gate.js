#!/usr/bin/env node
/**
 * Footer gate (2026-08-18, P1) — every production HTML page must have
 * EXACTLY ONE <footer>...</footer> containing the canonical markers
 * (site-footer + footer-grid + footer-bottom). A missing or duplicated
 * footer (or an orphaned stray </footer>) FAILS the build.
 * This is the check that would have caught the homepage footer breakage.
 */
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');

function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const failures = [];
for (const file of walk(PUBLIC)) {
  const body = fs.readFileSync(file, 'utf8');
  const opens = (body.match(/<footer[\s>]/g) || []).length;
  const closes = (body.match(/<\/footer>/g) || []).length;
  const problems = [];
  if (opens !== 1) problems.push(`<footer> count=${opens}`);
  if (closes !== 1) problems.push(`</footer> count=${closes}`);
  if (!body.includes('class="site-footer"')) problems.push('missing site-footer class');
  if (!body.includes('footer-grid')) problems.push('missing footer-grid');
  if (!body.includes('footer-bottom')) problems.push('missing footer-bottom');
  if (problems.length) failures.push(`${path.relative(PUBLIC, file)}: ${problems.join(', ')}`);
}

if (failures.length) {
  console.error(`\n❌ FOOTER GATE FAILED (${failures.length} pages):`);
  for (const f of failures.slice(0, 20)) console.error('  ' + f);
  process.exit(1);
}
console.log(`✅ FOOTER GATE PASSED: all pages have exactly one canonical footer.`);
