#!/usr/bin/env node
/**
 * Firestore archive export (READ-ONLY): dump full docs of named collections
 * to /data/archive/<collection>.json (JSONL-ish array). No writes to Firestore.
 * Usage: node scripts/firestore-export.js leads automation_logs analytics_events
 */
const { Firestore } = require('@google-cloud/firestore');
const path = require('path');
const fs = require('fs');

const SA = path.join(__dirname, '..', 'firebase-service-account.json');
const OUT_DIR = '/data/archive';

function resolveConfig() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return { keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS };
  if (fs.existsSync(SA)) return { projectId: JSON.parse(fs.readFileSync(SA, 'utf-8')).project_id, keyFilename: SA };
  throw new Error('No Firebase credentials');
}

function serialize(value) {
  // Firestore Timestamps/DocumentReferences → plain JSON
  if (value && typeof value.toDate === 'function') return value.toDate().toISOString();
  if (value && value.constructor && value.constructor.name === 'DocumentReference') return value.path;
  if (Array.isArray(value)) return value.map(serialize);
  if (value && typeof value === 'object') {
    const out = {};
    for (const k of Object.keys(value)) out[k] = serialize(value[k]);
    return out;
  }
  return value;
}

async function main() {
  const cols = process.argv.slice(2);
  if (!cols.length) { console.error('usage: node scripts/firestore-export.js <collection>…'); process.exit(1); }
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const db = new Firestore(resolveConfig());
  for (const name of cols) {
    const snap = await db.collection(name).limit(5000).get();
    const docs = [];
    snap.forEach(doc => docs.push({ id: doc.id, ...serialize(doc.data() || {}) }));
    docs.sort((a, b) => (a.timestamp || a.createdAt || a.id || '').toString().localeCompare((b.timestamp || b.createdAt || b.id || '').toString()));
    const file = path.join(OUT_DIR, `${name}.json`);
    fs.writeFileSync(file, JSON.stringify(docs, null, 2));
    fs.chmodSync(file, 0o600);
    console.log(`${name}: ${docs.length} docs → ${file}`);
  }
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
