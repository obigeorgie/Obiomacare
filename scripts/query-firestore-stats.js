#!/usr/bin/env node
/**
 * Firestore Stats Query
 * Pulls actual subscriber and download counts from Firebase Firestore
 */

const { Firestore } = require('@google-cloud/firestore');
const path = require('path');

const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');

const db = new Firestore({
  projectId: 'kindred-x5pbk',
  keyFilename: serviceAccountPath
});

async function getStats() {
  console.log('🔥 Querying Firestore for actual statistics...\n');

  // 1. Total leads (all email subscribers)
  const leadsSnapshot = await db.collection('leads').get();
  const totalLeads = leadsSnapshot.size;

  // 2. Leads by source
  const sourceBreakdown = {};
  leadsSnapshot.forEach(doc => {
    const data = doc.data();
    const source = data.source || 'unknown';
    sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
  });

  // 3. Checklist downloads (source = 'nclex-checklist' or 'lead-magnet')
  const checklistLeads = leadsSnapshot.docs.filter(doc => {
    const source = doc.data().source;
    return source === 'nclex-checklist' || source === 'lead-magnet';
  });
  const checklistDownloads = checklistLeads.length;

  // 4. Newsletter subscribers (source = 'newsletter')
  const newsletterLeads = leadsSnapshot.docs.filter(doc => {
    const source = doc.data().source;
    return source === 'newsletter';
  });
  const newsletterSubscribers = newsletterLeads.length;

  // 5. Purchased leads
  const purchasedLeads = leadsSnapshot.docs.filter(doc => {
    return doc.data().purchased === true;
  });
  const purchasedCount = purchasedLeads.length;

  // 6. Recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentLeads = leadsSnapshot.docs.filter(doc => {
    const subscribedAt = doc.data().subscribedAt;
    if (!subscribedAt) return false;
    const date = new Date(subscribedAt);
    return date >= thirtyDaysAgo;
  });
  const recentCount = recentLeads.length;

  // Output statistics table
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 FIRESTORE STATISTICS (Actual Numbers)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('┌─────────────────────────────────┬──────────┬─────────────────────────────┐');
  console.log('│ Metric                          │ Count    │ Source / Collection         │');
  console.log('├─────────────────────────────────┼──────────┼─────────────────────────────┤');
  console.log(`│ Total email leads               │ ${String(totalLeads).padEnd(8)} │ Firestore: leads            │`);
  console.log(`│ Checklist downloads             │ ${String(checklistDownloads).padEnd(8)} │ leads.source = nclex-check  │`);
  console.log(`│ Newsletter subscribers          │ ${String(newsletterSubscribers).padEnd(8)} │ leads.source = newsletter   │`);
  console.log(`│ Purchased customers             │ ${String(purchasedCount).padEnd(8)} │ leads.purchased = true      │`);
  console.log(`│ New leads (last 30 days)        │ ${String(recentCount).padEnd(8)} │ leads.subscribedAt >= 30d   │`);
  console.log('└─────────────────────────────────┴──────────┴─────────────────────────────┘');
  console.log('');
  console.log('📋 Source Breakdown:');
  Object.entries(sourceBreakdown)
    .sort((a, b) => b[1] - a[1])
    .forEach(([source, count]) => {
      console.log(`   ${source}: ${count}`);
    });
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  return {
    totalLeads,
    checklistDownloads,
    newsletterSubscribers,
    purchasedCount,
    recentCount,
    sourceBreakdown
  };
}

getStats().catch(err => {
  console.error('❌ Error querying Firestore:', err.message);
  process.exit(1);
});
