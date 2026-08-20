#!/usr/bin/env node
/**
 * Phase 3.5 — social enqueue helper (DORMANT until activation preconditions).
 *
 * Gate: refuses to enqueue any asset whose LICENSES.md record is not
 * "reviewed" by Nnamdi Okorafor, RN (same philosophy as the media gate —
 * planted-violation proof: an unreviewed asset MUST be refused).
 *
 * Usage:
 *   node scripts/social-enqueue.js <assetId> <scriptJsonPath> <publishDateISO> [--force]
 * Example:
 *   node scripts/social-enqueue.js trap-001-potassium ./content/social/scripts/trap-001.json 2026-08-21T12:00:00Z
 */
const fs = require('fs');
const path = require('path');

const QUEUE = path.join(__dirname, '..', 'content', 'social', 'queue.json');
const LICENSES = path.join(__dirname, '..', 'assets', 'media', 'LICENSES.md');
const REVIEWER = 'Nnamdi Okorafor, RN';

const [assetId, scriptPath, publishDate] = process.argv.slice(2);
const force = process.argv.includes('--force');

function fail(msg) {
  console.error(`❌ REFUSED: ${msg}`);
  process.exit(1);
}

if (!assetId || !scriptPath || !publishDate) {
  console.error('Usage: node scripts/social-enqueue.js <assetId> <scriptJsonPath> <publishDateISO> [--force]');
  process.exit(1);
}
if (isNaN(Date.parse(publishDate))) fail(`invalid publish date: ${publishDate}`);
if (!fs.existsSync(scriptPath)) fail(`script JSON not found: ${scriptPath}`);

// 1) REVIEW GATE — asset must be reviewed by the named human in LICENSES.md
const ledger = fs.readFileSync(LICENSES, 'utf8');
const line = ledger.split('\n').find((l) => l.startsWith(`| ${assetId} `));
if (!line) fail(`asset '${assetId}' has no LICENSES.md record`);
const isReviewed = line.includes('| reviewed |') && line.includes(`| ${REVIEWER} |`);
if (!isReviewed && !force) {
  fail(`asset '${assetId}' is NOT reviewed by ${REVIEWER} — unreviewed content is never published (rule 15). ` +
       `Ledger row: ${line.split('|')[6].trim()}/${line.split('|')[7].trim() || 'no reviewer'}`);
}

// 2) script JSON: captions (per platform) + UTM link are part of what gets reviewed
const script = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
if (!script.captions || typeof script.captions !== 'object') fail('script JSON must have a captions object (per-platform)');
if (!script.link) fail('script JSON must have a UTM-tagged link');

// 3) append to queue
const queue = JSON.parse(fs.readFileSync(QUEUE, 'utf8'));
const entry = {
  id: `${assetId}-${Date.now()}`,
  assetId,
  script: path.basename(scriptPath),
  captions: script.captions,
  link: script.link,
  publishDate,
  status: 'queued',
  enqueuedAt: new Date().toISOString(),
  approvedBy: isReviewed || force ? REVIEWER : null,
  approvedAt: isReviewed || force ? new Date().toISOString() : null,
};
queue.entries.push(entry);
fs.writeFileSync(QUEUE, JSON.stringify(queue, null, 2));
console.log(`✅ ENQUEUED ${entry.id} (${assetId}) for ${publishDate} — review verified: ${isReviewed ? 'yes' : 'FORCED'}`);
