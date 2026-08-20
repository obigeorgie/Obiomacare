#!/usr/bin/env node
/**
 * Phase 3.5 — publishing queue processor (DORMANT until activation).
 *
 * Invoked by the daily Hermes cron at activation. Behaviors:
 *  - KILL SWITCH: content/social/KILL file present OR queue.json.killSwitch=true
 *    -> halt instantly + dequeue every pending entry (marked 'halted').
 *  - Re-verifies review status AT PUBLISH TIME (not just enqueue): asset must
 *    be "reviewed" by Nnamdi Okorafor, RN in LICENSES.md or the post is SKIPPED.
 *  - Rate limit: max 1 post/day/platform (state in content/social/state.json).
 *  - Failure posture: any API error/token expiry/rejection -> post skipped,
 *    logged; auth-related failures flagged for the Monday digest. Never retry-storm.
 *  - Platform tokens (owner-installed, rule #12): TIKTOK_ACCESS_TOKEN,
 *    INSTAGRAM_ACCESS_TOKEN, YOUTUBE_ACCESS_TOKEN. Absent -> dormant dry-run.
 *
 * Usage: node scripts/social-queue.js [--dry-run]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const QUEUE = path.join(ROOT, 'content', 'social', 'queue.json');
const STATE = path.join(ROOT, 'content', 'social', 'state.json');
const KILL = path.join(ROOT, 'content', 'social', 'KILL');
const LOG = path.join(ROOT, 'content', 'social', 'log.json');
const LICENSES = path.join(ROOT, 'assets', 'media', 'LICENSES.md');
const REVIEWER = 'Nnamdi Okorafor, RN';
const DRY = process.argv.includes('--dry-run');

function load(p, fallback) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; } }
function save(p, v) { fs.writeFileSync(p, JSON.stringify(v, null, 2)); }
function log(entry) {
  const l = load(LOG, []);
  l.push(entry);
  save(LOG, l.slice(-200));
}

// ---- KILL SWITCH ----
if (fs.existsSync(KILL) || load(QUEUE, {}).killSwitch === true) {
  const q = load(QUEUE, { entries: [] });
  const pending = q.entries.filter((e) => e.status === 'queued');
  for (const e of q.entries) {
    if (e.status === 'queued') { e.status = 'halted'; e.haltedAt = new Date().toISOString(); }
  }
  save(QUEUE, q);
  log({ at: new Date().toISOString(), action: 'KILL', halted: pending.length, dryRun: DRY });
  console.log(`🛑 KILL SWITCH: halted + dequeued ${pending.length} pending entries.`);
  process.exit(0);
}

const q = load(QUEUE, { entries: [], rateLimitPerPlatformPerDay: 1 });
const state = load(STATE, { lastPostByPlatform: {} });
const ledger = fs.readFileSync(LICENSES, 'utf8');
const now = Date.now();
const due = q.entries.filter((e) => e.status === 'queued' && Date.parse(e.publishDate) <= now);

console.log(`Queue processor (${DRY ? 'DRY-RUN' : 'LIVE'}) — ${due.length} due of ${q.entries.length} entries`);

for (const e of due) {
  // ---- REVIEW RE-VERIFY AT PUBLISH TIME ----
  const line = ledger.split('\n').find((l) => l.startsWith(`| ${e.assetId} `));
  const reviewed = line && line.includes('| reviewed |') && line.includes(`| ${REVIEWER} |`);
  if (!reviewed) {
    e.status = 'skipped';
    e.skipReason = `NOT reviewed at publish time by ${REVIEWER}`;
    log({ at: new Date().toISOString(), id: e.id, assetId: e.assetId, action: 'SKIP', reason: e.skipReason, dryRun: DRY });
    console.log(`⏭  SKIP ${e.id}: ${e.skipReason}`);
    continue;
  }

  // ---- RATE LIMIT: max 1 post/day/platform ----
  const today = new Date().toISOString().slice(0, 10);
  const platforms = Object.keys(e.captions || {});
  const blocked = platforms.filter((p) => state.lastPostByPlatform[p] === today);
  if (blocked.length) {
    e.status = 'skipped';
    e.skipReason = `rate limit: already posted to ${blocked.join(', ')} today`;
    log({ at: new Date().toISOString(), id: e.id, action: 'SKIP', reason: e.skipReason, dryRun: DRY });
    console.log(`⏭  SKIP ${e.id}: ${e.skipReason}`);
    continue;
  }

  // ---- PUBLISH (or dry-run) ----
  const results = {};
  for (const platform of platforms) {
    const token = process.env[`${platform.toUpperCase()}_ACCESS_TOKEN`];
    if (!token && !DRY) {
      results[platform] = { status: 'skipped', reason: `no ${platform} token (owner-installed per rule #12)` };
      log({ at: new Date().toISOString(), id: e.id, platform, action: 'SKIP_AUTH', reason: results[platform].reason, dryRun: DRY });
      continue;
    }
    if (DRY) {
      results[platform] = { status: 'dry-run-ok', caption: (e.captions[platform] || '').slice(0, 60) };
    } else {
      // REAL platform dispatch goes here at activation (TikTok Content Posting API,
      // IG/FB Graph API, YouTube Data API). Single attempt — never retry-storm.
      results[platform] = { status: 'error', reason: 'platform dispatch not activated' };
      log({ at: new Date().toISOString(), id: e.id, platform, action: 'ERROR', reason: results[platform].reason, dryRun: DRY });
    }
    state.lastPostByPlatform[platform] = today;
  }
  save(STATE, state);

  const allOk = Object.values(results).every((r) => r.status === 'dry-run-ok' || r.status === 'posted');
  e.status = DRY ? 'dry-run-ok' : (allOk ? 'posted' : 'partial');
  e.results = results;
  e.postedAt = new Date().toISOString();
  log({ at: new Date().toISOString(), id: e.id, assetId: e.assetId, action: e.status, results, dryRun: DRY });
  console.log(`✅ ${e.id}: ${JSON.stringify(results)}`);
}

save(QUEUE, q);
console.log('Queue processor complete.');
