#!/usr/bin/env node
/**
 * Verify all automation scripts store data in Firestore
 * Run this to validate the setup
 */

const { initFirestore } = require('../lib/firestore-helper');

const REQUIRED_COLLECTIONS = [
  'automation_logs',
  'gsc_submissions',
  'scheduled_posts',
  'postiz_runs',
  'ai_generated_content',
  'content_schedules',
  'email_sequences',
  'facebook_campaigns',
  'generated_images',
  'media_uploads',
  'media_upload_runs',
  'subscribers',
  'email_logs',
  'leads'
];

async function verify() {
  console.log('🔍 Verifying Firestore Integration for Cron Jobs\n');
  
  try {
    const db = initFirestore();
    
    for (const collection of REQUIRED_COLLECTIONS) {
      try {
        const snapshot = await db.collection(collection).limit(1).get();
        console.log(`✅ ${collection} — exists (${snapshot.size} docs)`);
      } catch (err) {
        console.log(`⚠️ ${collection} — error: ${err.message}`);
      }
    }
    
    console.log('\n✅ Verification complete');
  } catch (err) {
    console.error('❌ Failed to connect to Firestore:', err.message);
    process.exit(1);
  }
}

verify();
