/**
 * Firestore helper for Obioma Care automation scripts
 * Centralized logging and storage for all cron jobs
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

let app;
let db;

function initFirestore() {
  if (!db) {
    const serviceAccount = require('../firebase-service-account.json');
    app = initializeApp({ credential: cert(serviceAccount) }, 'cron-helper');
    db = getFirestore(app);
  }
  return db;
}

async function storeDocument(collection, docId, data) {
  const db = initFirestore();
  await db.collection(collection).doc(docId).set({
    ...data,
    _storedAt: new Date().toISOString(),
    _source: 'cron-automation'
  }, { merge: true });
  return true;
}

async function storeLog(jobName, status, details = {}) {
  const db = initFirestore();
  const docId = `${jobName}_${new Date().toISOString().replace(/[:.]/g, '-')}`;
  await db.collection('automation_logs').doc(docId).set({
    job: jobName,
    status,
    details,
    timestamp: new Date().toISOString()
  });
  return docId;
}

async function getLastRun(jobName) {
  const db = initFirestore();
  const snapshot = await db.collection('automation_logs')
    .where('job', '==', jobName)
    .orderBy('timestamp', 'desc')
    .limit(1)
    .get();
  return snapshot.empty ? null : snapshot.docs[0].data();
}

module.exports = {
  initFirestore,
  storeDocument,
  storeLog,
  getLastRun
};
