const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('../firebase-service-account.json');
const app = initializeApp({ credential: cert(serviceAccount) }, 'cleanup');
const db = getFirestore(app);

async function deleteCollection(collectionPath, batchSize = 100) {
  const collectionRef = db.collection(collectionPath);
  const query = collectionRef.limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query, resolve) {
  const snapshot = await query.get();

  const batchSize = snapshot.size;
  if (batchSize === 0) {
    resolve(0);
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

async function cleanup() {
  console.log('=== FIRESTORE CLEANUP ===\n');

  const collectionsToDelete = ['landing', 'public'];

  for (const col of collectionsToDelete) {
    console.log(`Deleting collection: ${col}...`);
    const count = await deleteCollection(col);
    console.log(`  ✅ Deleted`);
  }

  console.log('\n=== CLEANUP COMPLETE ===');
  process.exit(0);
}

cleanup().catch(err => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
