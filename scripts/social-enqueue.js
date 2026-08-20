#!/usr/bin/env node
/**
 * Phase 3.5 — social enqueue helper (DORMANT until activation preconditions).
 *
 * Gate: the review unit is the SCRIPT JSON (script + per-platform captions +
 * CTA link) — a reviewed image is NOT a reviewed post. The gate verifies the
 * script's own reviewStatus === "reviewed" by Nnamdi Okorafor, RN. Refuses
 * otherwise (planted-violation proof: reviewed-image + unreviewed-script MUST
 * refuse).
 *
 * Usage:
 *   node scripts/social-enqueue.js <assetId> <scriptJsonPath> <publishDateISO> [--force]
 */
const fs = require('fs');
const path = require('path');

const QUEUE = path.join(__dirname, '..', 'content', 'social', 'queue.json');
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

// 1) SCRIPT REVIEW GATE — the script (captions + link) is what gets reviewed.
const script = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
if (!script.captions || typeof script.captions !== 'object') fail('script JSON must have a captions object (per-platform)');
if (!script.link) fail('script JSON must have a UTM-tagged link');

const isReviewed =
  script.reviewStatus === 'reviewed' &&
  script.reviewer === REVIEWER &&
  !!script.reviewedAt;
if (!isReviewed && !force) {
  const status = script.reviewStatus || 'missing';
  const reviewer = script.reviewer || 'no reviewer';
  fail(`script '${path.basename(scriptPath)}' is NOT reviewed by ${REVIEWER} ` +
       `(reviewStatus=${status}, reviewer=${reviewer}) — a reviewed image is not a reviewed post. ` +
       `Unreviewed content is never published (rule 15).`);
}

// 2) append to queue
const queue = JSON.parse(fs.readFileSync(QUEUE, 'utf8'));
const entry = {
  id: `${path.basename(scriptPath, '.json')}-${Date.now()}`,
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
console.log(`✅ ENQUEUED ${entry.id} (script ${entry.script}) for ${publishDate} — script review verified: ${isReviewed ? 'yes' : 'FORCED'}`);
