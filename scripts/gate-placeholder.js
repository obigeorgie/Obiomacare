#!/usr/bin/env node
/**
 * Standing Gate 1: Placeholder Check
 * Fails if any built HTML contains unsubstantiated placeholder text.
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const FORBIDDEN_PATTERNS = [
  /\[To Be Filled In\]/i,
  /\[Date\]/i,
  /\[Credentials/i,
  /\[Reviewer Name/i,
  /\[Your Name\]/i,
  /\[Insert /i,
  /\[TODO\]/i,
  /\[FIXME\]/i,
];

let failures = 0;
let filesChecked = 0;

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let fileFailures = 0;

  lines.forEach((line, idx) => {
    FORBIDDEN_PATTERNS.forEach(pattern => {
      if (pattern.test(line)) {
        console.error(`❌ FAIL: ${path.relative(PUBLIC_DIR, filePath)}:${idx + 1} matches ${pattern}`);
        fileFailures++;
      }
    });
  });

  filesChecked++;
  return fileFailures;
}

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let totalFailures = 0;
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      totalFailures += scanDir(fullPath);
    } else if (entry.name.endsWith('.html') || entry.name.endsWith('.js')) {
      totalFailures += scanFile(fullPath);
    }
  }
  return totalFailures;
}

console.log('🔍 Standing Gate 1: Placeholder Check');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

if (!fs.existsSync(PUBLIC_DIR)) {
  console.error('❌ FAIL: public/ directory does not exist. Run build first.');
  process.exit(1);
}

const totalFailures = scanDir(PUBLIC_DIR);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (totalFailures === 0) {
  console.log(`✅ PASS: ${filesChecked} files scanned, 0 placeholders found.`);
  process.exit(0);
} else {
  console.log(`❌ FAIL: ${totalFailures} placeholder(s) found across ${filesChecked} files.`);
  process.exit(1);
}
