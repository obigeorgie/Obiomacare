/**
 * HTML structure gate — build must FAIL if any page has ≠1 doctype/body/html tag.
 *
 * Prevents concatenated-document regressions (e.g., 2026-08-21 P0: landing/
 * index.html shipped with 4 <body>/</html> copies, ~3.3× weight, 4 beacon
 * injections).
 *
 * Usage: node scripts/html-structure-gate.js [publicDir]
 */
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = process.env.OBIOMA_PUBLIC_DIR || path.join(__dirname, '..', 'public');

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
  const files = findHtmlFiles(PUBLIC_DIR);
  const failures = [];
  let checked = 0;

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    const doctype = (html.match(/<!DOCTYPE/gi) || []).length;
    const bodyOpen = (html.match(/<body[\s>]/gi) || []).length;
    const bodyClose = (html.match(/<\/body>/gi) || []).length;
    const htmlOpen = (html.match(/<html[\s>]/gi) || []).length;
    const htmlClose = (html.match(/<\/html>/gi) || []).length;
    checked++;

    if (doctype !== 1 || bodyOpen !== 1 || bodyClose !== 1 || htmlOpen !== 1 || htmlClose !== 1) {
      failures.push({
        file: path.relative(PUBLIC_DIR, file),
        doctype, bodyOpen, bodyClose, htmlOpen, htmlClose,
      });
    }
  }

  if (failures.length) {
    console.error(`❌ HTML STRUCTURE GATE FAILED: ${failures.length} page(s) have ≠1 document structure.`);
    for (const f of failures) {
      console.error(`   ${f.file}: doctype=${f.doctype} <body>=${f.bodyOpen} </body>=${f.bodyClose} <html>=${f.htmlOpen} </html>=${f.htmlClose}`);
    }
    process.exit(1);
  }
  console.log(`✅ HTML STRUCTURE GATE PASSED: ${checked} pages, all exactly 1 doctype/body/html.`);
}

main();
