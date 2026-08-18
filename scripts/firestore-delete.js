#!/usr/bin/env node
/**
 * Firestore deletion — line-item approved collections ONLY.
 * Usage: node scripts/firestore-delete.js <collection> [<collection>...]
 * Requires: firebase-service-account.json (owner-installed).
 * Behavior: prints pre-delete count, deletes every doc, prints post-delete count.
 * NO wildcards. NO schema changes. Only the named collections are touched.
 */
const { Firestore } = require('@google-cloud/firestore');
const fs = require('fs');

const collections = process.argv.slice(2);
if (collections.length === 0) {
  console.error('Usage: node scripts/firestore-delete.js <collection> [<collection>...]');
  process.exit(1);
}

const db = new Firestore({
  projectId: JSON.parse(fs.readFileSync('firebase-service-account.json', 'utf8')).project_id,
  keyFilename: 'firebase-service-account.json',
});

async function main() {
  for (const name of collections) {
    const coll = db.collection(name);
    const before = await coll.get();
    console.log(`[${name}] before: ${before.size} docs`);
    let deleted = 0;
    // delete in batches of 400 (Firestore bulk-delete pattern, no new writes beyond deletes)
    for (const doc of before.docs) {
      await doc.ref.delete();
      deleted++;
    }
    const after = await coll.get();
    console.log(`[${name}] deleted: ${deleted} | after: ${after.size} docs`);
  }
}
main().catch(e => { console.error('❌', e.message); process.exit(1); });
