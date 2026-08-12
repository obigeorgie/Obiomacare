const { initializeApp, cert, getApps, getApp } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');

let app;
const apps = getApps();
const existingApp = apps.find(a => a.name === 'social-sync-promo');
if (existingApp) {
  app = existingApp;
} else {
  app = initializeApp({ credential: cert(require('../firebase-service-account.json')) }, 'social-sync-promo');
}
const db = getFirestore(app);

const stats = fs.statSync('./video/out/promo-landing-v1.mp4');

const videoRef = db.collection('social_videos').doc('promo-landing-v1');
videoRef.set({
  id: 'promo-landing-v1',
  title: 'Obioma Landing Page Promo',
  description: 'Product demo hybrid: real UI capture + motion graphic callouts',
  duration: 75,
  format: '16:9',
  fileName: 'promo-landing-v1.mp4',
  fileSize: stats.size,
  tags: ['promo', 'landing-page', 'product-demo'],
  sourceFile: 'video/out/promo-landing-v1.mp4',
  landingPage: true,
  reviewStatus: 'in_review',
  createdAt: FieldValue.serverTimestamp(),
  updatedAt: FieldValue.serverTimestamp(),
}, { merge: true })
.then(() => console.log('✅ Synced promo-landing-v1 to Firestore'))
.catch(err => console.error('❌ Error:', err));
