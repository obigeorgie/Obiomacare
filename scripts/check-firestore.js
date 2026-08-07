const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('../firebase-service-account.json');
const app = initializeApp({ credential: cert(serviceAccount) }, 'storage-check');
const db = getFirestore(app);

async function checkStorage() {
  console.log('=== FIRESTORE STORAGE AUDIT ===\n');
  
  const collections = await db.listCollections();
  console.log(`Collections found: ${collections.length}`);
  
  let totalDocs = 0;
  let totalSizeEstimate = 0;
  
  for (const col of collections) {
    const snapshot = await col.get();
    const count = snapshot.size;
    totalDocs += count;
    
    let avgSize = 0;
    if (count > 0) {
      const sample = snapshot.docs[0].data();
      avgSize = JSON.stringify(sample).length;
    }
    
    const estimatedBytes = count * avgSize;
    totalSizeEstimate += estimatedBytes;
    
    console.log(`\n📁 ${col.id}`);
    console.log(`   Documents: ${count}`);
    console.log(`   Est. size: ~${(estimatedBytes / 1024).toFixed(1)} KB`);
    
    if (count > 0) {
      const ids = snapshot.docs.slice(0, 3).map(d => d.id);
      console.log(`   Sample IDs: ${ids.join(', ')}${count > 3 ? '...' : ''}`);
    }
    
    if (col.id === 'leads') {
      const unsubscribed = snapshot.docs.filter(d => d.data().unsubscribed).length;
      const withStripe = snapshot.docs.filter(d => d.data().stripeCustomerId).length;
      console.log(`   Unsubscribed: ${unsubscribed}`);
      console.log(`   With Stripe ID: ${withStripe}`);
    }
    
    if (col.id === 'users') {
      const tiers = {};
      snapshot.docs.forEach(d => {
        const t = d.data().tier || 'none';
        tiers[t] = (tiers[t] || 0) + 1;
      });
      console.log(`   Tiers: ${JSON.stringify(tiers)}`);
    }
  }
  
  console.log(`\n=== SUMMARY ===`);
  console.log(`Total collections: ${collections.length}`);
  console.log(`Total documents: ${totalDocs}`);
  console.log(`Est. total size: ~${(totalSizeEstimate / 1024).toFixed(1)} KB`);
  console.log(`Project ID: ${serviceAccount.project_id}`);
  
  console.log(`\n=== HEALTH CHECKS ===`);
  
  const leadsSnapshot = await db.collection('leads').get();
  const emails = {};
  leadsSnapshot.docs.forEach(d => {
    const email = d.data().email;
    if (email) emails[email] = (emails[email] || 0) + 1;
  });
  const duplicates = Object.entries(emails).filter(([e, c]) => c > 1);
  console.log(`Duplicate leads: ${duplicates.length}`);
  if (duplicates.length > 0) {
    duplicates.slice(0, 5).forEach(([email, count]) => {
      console.log(`  - ${email}: ${count} docs`);
    });
  }
  
  const logsSnapshot = await db.collection('automation_logs').get();
  console.log(`Automation logs: ${logsSnapshot.size}`);
  
  process.exit(0);
}

checkStorage().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
