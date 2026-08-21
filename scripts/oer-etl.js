#!/usr/bin/env node
/**
 * OER Content Engine — ETL (2026-08-20).
 *
 * Validates + dedups + stages OER-derived item batches. Extraction (scenario/
 * distractor/rationale mapping) happens at ingest by the operator reading the
 * source chapter; this script is the machine that guarantees schema,
 * provenance, and the batch gate.
 *
 * Usage:
 *   node scripts/oer-etl.js <itemsJsonPath> <batchMetaJsonPath> [--dry-run]
 *
 * itemsJsonPath: array of items per the OER schema (reviewStatus MUST be
 *   "pending"; reviewer/reviewedAt MUST be null — the pipeline never sets them).
 * batchMetaJsonPath: { source, chapter, license, licenseEvidence, attribution }
 *
 * Behavior:
 *  - validates every field; rejects the batch on any schema violation
 *  - dedup: stem similarity vs the existing 68-item bank + pending store
 *    (near-duplicates rejected, recorded)
 *  - writes workers-site/data/oer-bank-pending.json (pending items never serve)
 *  - appends ONE LICENSES.md ledger row per batch
 *  - prints the batch summary + the 10% review sample (min 5, deterministic)
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PENDING = path.join(ROOT, 'workers-site', 'data', 'oer-bank-pending.json');
const BANK_JS = path.join(ROOT, 'workers-site', 'api-readiness.js');
const LEDGER = path.join(ROOT, 'assets', 'media', 'LICENSES.md');
const REVIEWER = 'Nnamdi Okorafor, RN';
const DRY = process.argv.includes('--dry-run');

const [itemsPath, metaPath] = process.argv.slice(2);
if (!itemsPath || !metaPath) {
  console.error('Usage: node scripts/oer-etl.js <itemsJsonPath> <batchMetaJsonPath> [--dry-run]');
  process.exit(1);
}

function fail(msg) { console.error(`❌ BATCH REJECTED: ${msg}`); process.exit(1); }

const items = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
if (!Array.isArray(items)) fail('items must be an array');
if (items.length === 0) fail('no items');
if (items.length > 50) fail(`batch too large: ${items.length} > 50`);

// 1) SCHEMA VALIDATION (two-field review fix binding)
const V = new Set(['us-gov-pd', 'public-domain', 'openrn-cc-by', 'openstax-cc-by', 'libretexts-verified', 'oercommons-verified']);
items.forEach((it, i) => {
  if (!it.id || typeof it.id !== 'string') fail(`item ${i}: id required`);
  if (!it.category) fail(`item ${i} (${it.id}): category required`);
  if (!it.stem || it.stem.length < 20) fail(`item ${i} (${it.id}): stem required (>=20 chars)`);
  if (!Array.isArray(it.options) || it.options.length !== 4) fail(`item ${i} (${it.id}): exactly 4 options`);
  if (!Number.isInteger(it.correctIndex) || it.correctIndex < 0 || it.correctIndex > 3) fail(`item ${i} (${it.id}): correctIndex 0-3`);
  if (!it.rationale || it.rationale.length < 20) fail(`item ${i} (${it.id}): rationale required`);
  if (!it.sourceCitation || !it.sourceCitation.includes(meta.source || '')) fail(`item ${i} (${it.id}): sourceCitation must include the source`);
  if (!V.has(it.sourceVerification)) fail(`item ${i} (${it.id}): sourceVerification invalid (${it.sourceVerification})`);
  if (it.reviewStatus !== 'pending') fail(`item ${i} (${it.id}): reviewStatus MUST be pending at ingest`);
  if (it.reviewer !== null && it.reviewer !== undefined) fail(`item ${i} (${it.id}): pipeline never sets reviewer`);
  if (it.reviewedAt !== null && it.reviewedAt !== undefined) fail(`item ${i} (${it.id}): pipeline never sets reviewedAt`);
  if (typeof it.difficulty !== 'number' || it.difficulty < 0 || it.difficulty > 1) fail(`item ${i} (${it.id}): difficulty 0-1`);
  if (it.difficultyLabel !== 'author-estimated') fail(`item ${i} (${it.id}): difficultyLabel must be author-estimated until calibration`);
});

// 2) DEDUP vs existing bank + pending store
const bankSrc = fs.readFileSync(BANK_JS, 'utf8');
const existingStems = [...bankSrc.matchAll(/stem: '((?:\\.|[^'\\])*)'/g)].map((m) => m[1].toLowerCase().replace(/\s+/g, ' ').trim());
const pendingStore = JSON.parse(fs.readFileSync(PENDING, 'utf8'));
const pendingStems = pendingStore.items.map((i) => i.stem.toLowerCase().replace(/\s+/g, ' ').trim());

function norm(s) { return s.toLowerCase().replace(/\s+/g, ' ').trim(); }
function sim(a, b) {
  // word-set Jaccard on normalized tokens — verbatim stems ~1.0,
  // clinically similar but distinct stems stay well below the threshold
  const tokens = (s) => new Set(s.split(' ').filter((w) => w.length > 1));
  const ta = tokens(a), tb = tokens(b);
  if (!ta.size || !tb.size) return 0;
  let inter = 0; for (const t of ta) if (tb.has(t)) inter++;
  return inter / (ta.size + tb.size - inter);
}
const rejected = [];
const accepted = [];
for (const it of items) {
  const n = norm(it.stem);
  const dup = existingStems.concat(pendingStems).find((s) => sim(n, s) > 0.75);
  if (dup) { rejected.push({ id: it.id, reason: `near-duplicate of: ${dup.slice(0, 90)}…` }); continue; }
  accepted.push({ ...it, reviewStatus: 'pending', reviewer: null, reviewedAt: null, batchReviewId: null });
}
if (accepted.length === 0) fail('all items rejected as duplicates');

// 3) STAGE
const batch = {
  batchId: meta.batchId || `oer-${Date.now()}`,
  source: meta.source,
  chapter: meta.chapter,
  license: meta.license,
  licenseEvidence: meta.licenseEvidence,
  attribution: meta.attribution,
  createdAt: new Date().toISOString(),
  itemCount: accepted.length,
  reviewStatus: 'pending',
  reviewer: null,
  reviewedAt: null,
};
pendingStore.batches.push(batch);
for (const it of accepted) pendingStore.items.push({ ...it, batchId: batch.batchId });
if (!DRY) {
  fs.writeFileSync(PENDING, JSON.stringify(pendingStore, null, 2));
  // LEDGER row (one per batch)
  const ledger = fs.readFileSync(LEDGER, 'utf8');
  const row = `| OER batch ${batch.batchId} | ${meta.source} · ${meta.chapter} | ${meta.license} | ${meta.licenseEvidence} | ${accepted.length} | ${meta.attribution} | pending |  |  |`;
  fs.writeFileSync(LEDGER, ledger.trimEnd() + '\n' + row + '\n');
}

// 4) SAMPLE (10%, min 5, deterministic seed from batchId)
function rng(seedStr) { let h = 2166136261; for (const c of seedStr) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return () => (h = Math.imul(h ^ (h >>> 15), 2246822507), ((h >>> 13) ^ h) >>> 0) / 4294967296; }
const n = Math.max(5, Math.ceil(accepted.length * 0.10));
const r = rng(batch.batchId);
const idx = [...accepted.keys()].sort(() => r() - 0.5).slice(0, n).sort((a, b) => a - b);
const sample = idx.map((i) => accepted[i]);

console.log(`✅ BATCH STAGED: ${batch.batchId} — ${accepted.length} items (${rejected.length} dup-rejected)`);
if (rejected.length) console.log(`  rejected: ${rejected.map((x) => x.id).join(', ')}`);
console.log(`\nREVIEW SAMPLE (${sample.length} of ${accepted.length} — 10% min 5):`);
sample.forEach((it, k) => {
  console.log(`\n[${k + 1}] ${it.id} | ${it.category}`);
  console.log(`  STEM: ${it.stem}`);
  it.options.forEach((o, i) => console.log(`  ${i === it.correctIndex ? '✓' : ' '} ${String.fromCharCode(65 + i)}. ${o}`));
  console.log(`  RATIONALE: ${it.rationale}`);
  console.log(`  SOURCE: ${it.sourceCitation}`);
});
console.log(`\nPending store: ${pendingStore.items.length} items · ${pendingStore.batches.length} batches`);
