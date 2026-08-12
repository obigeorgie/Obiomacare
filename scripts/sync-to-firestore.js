#!/usr/bin/env node
/**
 * Sync all NCLEX Trap videos and schedules to Firestore
 * Usage: node sync-to-firestore.js [--reset]
 */

const path = require('path');
const { syncVideoSeries, getDashboardData } = require('../lib/social-sync');

const VIDEOS = [
  {
    id: 'trap-001-potassium',
    title: 'NCLEX Trap: Potassium + Digoxin = Deadly Combo',
    caption: '🚨 NCLEX Trap of the Day: Potassium + Digoxin\n\nThis combo kills more patients than you think. Hypokalemia INCREASES digoxin toxicity. Always check K+ first!\n\n#nclex #nursingstudent #clinicaljudgment #nursesofinstagram #nursingschool #rn #nclexprep',
    file: path.join(__dirname, '..', 'video', 'out', 'trap-001-potassium.mp4'),
    fileSize: '2.7MB',
    duration: '45s',
    aspectRatio: '9:16',
    resolution: '1080x1920',
    series: 'nclex-trap-of-the-day',
    episode: 1,
    topic: 'medication-safety',
    tags: ['potassium', 'digoxin', 'lab-values', 'cardiac'],
    scheduleDate: '2026-08-13T12:00:00Z',
    sources: [
      'NCSBN Clinical Judgment Measurement Model',
      'AACN Essentials of Critical Care Nursing'
    ],
    disclosure: 'ai-generated, nurse-reviewed'
  },
  {
    id: 'trap-002-abcs',
    title: 'NCLEX Trap: ABCs vs. The Distraction',
    caption: '🚨 NCLEX Trap of the Day: ABCs\n\nABCs ALWAYS come first. The NCLEX gives you 5 urgent tasks — 95% pick the wrong one.\n\n#nclex #prioritization #nursingstudent #clinicaljudgment #nursesofinstagram',
    file: path.join(__dirname, '..', 'video', 'out', 'trap-002-abcs.mp4'),
    fileSize: '2.9MB',
    duration: '45s',
    aspectRatio: '9:16',
    resolution: '1080x1920',
    series: 'nclex-trap-of-the-day',
    episode: 2,
    topic: 'prioritization',
    tags: ['abcs', 'prioritization', 'post-op', 'assessment'],
    scheduleDate: '2026-08-14T12:00:00Z',
    sources: [
      'NCSBN Clinical Judgment Measurement Model - Prioritization',
      'ATI Nursing Fundamentals'
    ],
    disclosure: 'ai-generated, nurse-reviewed'
  },
  {
    id: 'trap-003-delegation',
    title: 'NCLEX Trap: Who Do You Delegate To?',
    caption: '🚨 NCLEX Trap of the Day: Delegation\n\nRN keeps assessment, meds, sterile procedures. UAP gets ADLs and routine tasks. Simple rule.\n\n#nclex #delegation #nursingstudent #clinicaljudgment #nursingschool',
    file: path.join(__dirname, '..', 'video', 'out', 'trap-003-delegation.mp4'),
    fileSize: '3.0MB',
    duration: '45s',
    aspectRatio: '9:16',
    resolution: '1080x1920',
    series: 'nclex-trap-of-the-day',
    episode: 3,
    topic: 'delegation',
    tags: ['delegation', 'scope-of-practice', 'uap', 'rn'],
    scheduleDate: '2026-08-15T12:00:00Z',
    sources: [
      'NCSBN Delegation Decision-Making Framework',
      'State Board of Nursing - Scope of Practice'
    ],
    disclosure: 'ai-generated, nurse-reviewed'
  },
  {
    id: 'trap-004-sata',
    title: 'NCLEX Trap: SATA True/False Method',
    caption: '🚨 NCLEX Trap of the Day: SATA\n\nTreat EACH option as true/false. That\'s the secret. No patterns. No overthinking.\n\n#nclex #sata #testtips #nursingstudent #clinicaljudgment',
    file: path.join(__dirname, '..', 'video', 'out', 'trap-004-sata.mp4'),
    fileSize: '3.0MB',
    duration: '45s',
    aspectRatio: '9:16',
    resolution: '1080x1920',
    series: 'nclex-trap-of-the-day',
    episode: 4,
    topic: 'test-taking-strategy',
    tags: ['sata', 'select-all-that-apply', 'test-strategy'],
    scheduleDate: '2026-08-16T12:00:00Z',
    sources: [
      'Kaplan NCLEX Review - SATA Strategy',
      'NCSBN Next Generation NCLEX Item Types'
    ],
    disclosure: 'ai-generated, nurse-reviewed'
  },
  {
    id: 'trap-005-isolation',
    title: 'NCLEX Trap: Isolation Precautions',
    caption: '🚨 NCLEX Trap of the Day: Isolation\n\nAirborne=N95, Droplet=Surgical mask, Contact=Gown+gloves. One trick, instant recall.\n\n#nclex #infectioncontrol #ppe #nursingstudent #clinicaljudgment',
    file: path.join(__dirname, '..', 'video', 'out', 'trap-005-isolation.mp4'),
    fileSize: '2.6MB',
    duration: '45s',
    aspectRatio: '9:16',
    resolution: '1080x1920',
    series: 'nclex-trap-of-the-day',
    episode: 5,
    topic: 'infection-control',
    tags: ['isolation', 'ppe', 'n95', 'tuberculosis', 'infection-control'],
    scheduleDate: '2026-08-17T12:00:00Z',
    sources: [
      'CDC Isolation Precautions Guidelines',
      'OSHA Respiratory Protection Standard'
    ],
    disclosure: 'ai-generated, nurse-reviewed'
  }
];

const PLATFORM_CONFIG = {
  tiktok: true,
  instagram: true,
  youtube: true,
  x: true,
  linkedin: true
};

async function main() {
  console.log('🔥 Syncing NCLEX Trap series to Firestore...\n');
  
  try {
    // Sync all videos and create post records
    const synced = await syncVideoSeries(VIDEOS, PLATFORM_CONFIG);
    
    console.log('\n📊 Sync Summary:');
    console.log(`  Videos: ${VIDEOS.length}`);
    console.log(`  Posts created: ${synced.length}`);
    
    // Get dashboard data
    const dashboard = await getDashboardData();
    
    console.log('\n📈 Dashboard:');
    console.log(`  Total posts: ${dashboard.summary.totalPosts}`);
    console.log(`  Scheduled: ${dashboard.summary.scheduled}`);
    console.log(`  Published: ${dashboard.summary.published}`);
    console.log(`  Failed: ${dashboard.summary.failed}`);
    
    console.log('\n📱 Platform Breakdown:');
    for (const [platform, count] of Object.entries(dashboard.platformBreakdown)) {
      console.log(`  ${platform}: ${count} posts`);
    }
    
    console.log('\n✅ Sync complete!');
    
  } catch (err) {
    console.error('❌ Sync failed:', err.message);
    process.exit(1);
  }
}

main();
