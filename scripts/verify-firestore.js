#!/usr/bin/env node
/**
 * Query Firestore to verify what was uploaded
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('../firebase-service-account.json');

const app = initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore(app);

async function listCollections() {
  console.log('🔍 Firestore Inventory — kindred-x5pbk\n');

  const collections = ['content', 'products', 'marketing', 'email_funnel', 'landing', 'public', 'leads', 'documents'];
  let total = 0;

  for (const name of collections) {
    const snapshot = await db.collection(name).get();
    console.log(`📁 ${name}: ${snapshot.size} documents`);

    if (snapshot.size > 0) {
      // Show first 3 doc IDs
      const ids = snapshot.docs.slice(0, 3).map(d => d.id);
      console.log(`   Sample IDs: ${ids.join(', ')}${snapshot.size > 3 ? '...' : ''}`);

      // Show content preview for first doc
      const first = snapshot.docs[0].data();
      console.log(`   First doc: ${first.filename || first.name || '(no filename)'}`);
      if (first.content) {
        const preview = first.content.toString().substring(0, 120).replace(/\n/g, ' ');
        console.log(`   Preview: ${preview}...`);
      }
    }
    total += snapshot.size;
  }

  console.log(`\n📊 Total documents: ${total}`);
  process.exit(0);
}

listCollections().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
