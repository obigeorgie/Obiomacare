#!/usr/bin/env node
/**
 * Firestore lister (READ-ONLY): full inventory of `content` and `social_videos`
 * collections — doc id, filename, path, contentType. No writes.
 */
const { Firestore } = require('@google-cloud/firestore');
const path = require('path');
const fs = require('fs');

const SA = path.join(__dirname, '..', 'firebase-service-account.json');
function resolveConfig() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return { keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS };
  if (fs.existsSync(SA)) return { projectId: JSON.parse(fs.readFileSync(SA, 'utf-8')).project_id, keyFilename: SA };
  throw new Error('No Firebase credentials');
}

async function listCollection(db, name) {
  const coll = db.collection(name);
  const snap = await coll.limit(2000).get();
  const rows = [];
  snap.forEach(doc => {
    const d = doc.data() || {};
    rows.push({
      id: doc.id,
      filename: d.filename || null,
      path: d.path || null,
      contentType: d.contentType || null,
      updatedAt: d.updatedAt || d.createdAt || d.timestamp || null,
    });
  });
  rows.sort((a, b) => (a.filename || a.id).localeCompare(b.filename || b.id));
  return rows;
}

async function main() {
  const db = new Firestore(resolveConfig());
  for (const name of ['content', 'social_videos']) {
    const rows = await listCollection(db, name);
    console.log(`\n=== ${name} (${rows.length}) ===`);
    for (const r of rows) {
      console.log(`${r.filename || r.id}\t${r.path || ''}\t${r.contentType || ''}`);
    }
  }
  process.exit(0);
}
main().catch(e => { console.error(e.message); process.exit(1); });
