#!/usr/bin/env node
/**
 * Firestore Reconciliation — Inventory (READ-ONLY).
 * No writes, no deletes, no schema changes. Run:
 *   node scripts/firestore-inventory.js
 *
 * Credentials (owner-installed, never in chat):
 *   firebase-service-account.json in repo root, OR
 *   GOOGLE_APPLICATION_CREDENTIALS env, OR
 *   FIREBASE_PROJECT_ID + GOOGLE_APPLICATION_CREDENTIALS
 */
const { Firestore } = require('@google-cloud/firestore');
const path = require('path');
const fs = require('fs');

const SA = path.join(__dirname, '..', 'firebase-service-account.json');
const MAX_COUNT_DOCS = 2000; // hard cap for counting; inventory-scale project

function resolveConfig() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return { keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS };
  }
  if (fs.existsSync(SA)) {
    const raw = JSON.parse(fs.readFileSync(SA, 'utf-8'));
    return { projectId: raw.project_id, keyFilename: SA };
  }
  throw new Error('No Firebase credentials: set GOOGLE_APPLICATION_CREDENTIALS or place firebase-service-account.json in repo root');
}

async function main() {
  const db = new Firestore(resolveConfig());
  const collections = await db.listCollections();
  const report = [];

  for (const coll of collections) {
    const name = coll.id;
    let count = 0;
    let lastModified = null;
    const sampleDocs = [];

    try {
      const snapshot = await coll.limit(MAX_COUNT_DOCS + 1).get();
      count = snapshot.size > MAX_COUNT_DOCS ? `>${MAX_COUNT_DOCS}` : snapshot.size;

      snapshot.docs.slice(0, 5).forEach(doc => {
        const data = doc.data() || {};
        const entry = { id: doc.id };
        const keys = Object.keys(data).slice(0, 8);
        entry.fields = keys;
        // last-modified heuristics
        for (const f of ['updatedAt', 'createdAt', 'lastModified', 'timestamp', 'ts']) {
          const v = data[f];
          if (v) {
            const t = v && v.toDate ? v.toDate().toISOString() : new Date(v).toISOString();
            if (!isNaN(new Date(t))) {
              if (!lastModified || new Date(t) > new Date(lastModified)) lastModified = t;
            }
          }
        }
        entry.preview = {};
        for (const f of keys.slice(0, 4)) {
          const v = data[f];
          entry.preview[f] = (typeof v === 'object' && v !== null)
            ? (v.toDate ? v.toDate().toISOString() : `[${Array.isArray(v) ? 'array' : 'object'}]`)
            : String(v).slice(0, 60);
        }
        sampleDocs.push(entry);
      });
    } catch (e) {
      report.push({ collection: name, error: e.message });
      continue;
    }

    report.push({ collection: name, count, lastModified, samples: sampleDocs });
  }

  const md = ['# Firestore Inventory — ' + new Date().toISOString().slice(0, 10),
    '',
    'Read-only reconciliation. No writes/deletes performed. Owner-installed credentials only.',
    '',
    '| Collection | Doc count | Last modified (heuristic) | Sample doc IDs |',
    '|---|---|---|---|',
  ];
  for (const r of report) {
    if (r.error) { md.push(`| ${r.collection} | ERROR: ${r.error} | — | — |`); continue; }
    const ids = (r.samples || []).map(s => s.id).join(', ').slice(0, 120) || '—';
    md.push(`| ${r.collection} | ${r.count} | ${r.lastModified || 'unknown'} | ${ids} |`);
  }
  md.push('', '## Field previews (first 5 docs, first 8 fields)');
  for (const r of report) {
    if (r.error || !r.samples) continue;
    md.push(`\n### ${r.collection}`);
    for (const s of r.samples) {
      md.push(`- \`${s.id}\`: ${JSON.stringify(s.preview)}`);
    }
  }
  const out = path.join(__dirname, '..', 'docs', 'firestore-inventory.md');
  fs.writeFileSync(out, md.join('\n') + '\n');
  console.log('✅ Inventory written to', out);
  console.log(`Collections: ${report.length}`);
}

main().catch(e => { console.error('❌', e.message); process.exit(1); });
