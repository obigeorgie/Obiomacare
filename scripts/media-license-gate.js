#!/usr/bin/env node
/**
 * Media License Gate — CI Check
 *
 * Scans all built HTML for /media/ references.
 * Cross-checks each referenced asset against LICENSES.md.
 * Fails the build if any referenced asset has reviewStatus != "reviewed".
 *
 * Run: node scripts/media-license-gate.js
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob') || { sync: (p) => require('child_process').execSync(`find ${p.replace(/\*\*/g,'*').replace(/\*/g,'*')} -type f 2>/dev/null || true`).toString().trim().split('\n').filter(Boolean) };

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const LICENSES_PATH = path.join(__dirname, '..', 'assets', 'media', 'LICENSES.md');

function findMediaRefs(dir) {
  const refs = new Set();
  const htmlFiles = glob.sync(path.join(dir, '**', '*.html'));

  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    // Match /media/images/filename.webp
    const matches = content.matchAll(/\/media\/images\/([^"'\s>]+)/g);
    for (const match of matches) {
      refs.add(match[1]);
    }
  }

  return Array.from(refs);
}

function parseLicenses(licensesPath) {
  const content = fs.readFileSync(licensesPath, 'utf-8');
  const assets = {};

  // Parse markdown table rows for asset entries
  const lines = content.split('\n');
  for (const line of lines) {
    // Match table rows: | filename | ... | reviewStatus | ... |
    const match = line.match(/^\| ([^|]+\.webp) \|.*\| (pending|reviewed|rejected|published) \|/);
    if (match) {
      const filename = match[1].trim();
      const status = match[2].trim();
      assets[filename] = status;
    }
  }

  return assets;
}

function main() {
  console.log('🔍 Media License Gate — scanning for unreviewed assets...\n');

  // 1. Find all /media/ references in public/
  const refs = findMediaRefs(PUBLIC_DIR);
  if (refs.length === 0) {
    console.log('✅ No /media/ references found in public/.\n');
    process.exit(0);
  }

  console.log(`Found ${refs.length} referenced asset(s):`);
  for (const r of refs) {
    console.log(`  • ${r}`);
  }
  console.log();

  // 2. Parse LICENSES.md
  if (!fs.existsSync(LICENSES_PATH)) {
    console.error(`❌ LICENSES.md not found at ${LICENSES_PATH}`);
    process.exit(1);
  }

  const licenses = parseLicenses(LICENSES_PATH);

  // 3. Cross-check each reference
  let failures = 0;
  for (const ref of refs) {
    const status = licenses[ref];
    if (!status) {
      console.error(`❌ ${ref}: NOT IN LICENSES.md`);
      failures++;
    } else if (status !== 'reviewed') {
      console.error(`❌ ${ref}: reviewStatus = "${status}" (must be "reviewed")`);
      failures++;
    } else {
      console.log(`✅ ${ref}: reviewStatus = "reviewed"`);
    }
  }

  console.log();
  if (failures > 0) {
    console.error(`❌ MEDIA LICENSE GATE FAILED: ${failures} unreviewed asset(s) referenced in production HTML.`);
    console.error(`   Fix: remove embeds or get human review (set reviewStatus="reviewed" with reviewer name + date).`);
    process.exit(1);
  }

  console.log('✅ MEDIA LICENSE GATE PASSED: all referenced assets are reviewed.\n');
  process.exit(0);
}

main();
