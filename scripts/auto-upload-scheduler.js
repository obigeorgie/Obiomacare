const fs = require('fs');
const path = require('path');
const { uploadToTikTok } = require('./tiktok-uploader');
const { uploadToInstagram } = require('./instagram-uploader');
const { uploadToYouTube } = require('./youtube-uploader');

/**
 * Master Scheduler for NCLEX Trap Videos
 * Automatically uploads videos to all social platforms
 * 
 * Usage:
 *   node auto-upload-scheduler.js --dry-run
 *   node auto-upload-scheduler.js --platform tiktok
 *   node auto-upload-scheduler.js --all
 */

const VIDEOS = [
  {
    id: 'trap-001-potassium',
    title: 'NCLEX Trap: Potassium + Digoxin = Deadly Combo',
    caption: '🚨 NCLEX Trap of the Day: Potassium + Digoxin\n\nThis combo kills more patients than you think. Hypokalemia INCREASES digoxin toxicity. Always check K+ first!\n\n#nclex #nursingstudent #clinicaljudgment #nursesofinstagram #nursingschool #rn #nclexprep',
    file: path.join(__dirname, '..', 'video', 'out', 'trap-001-potassium.mp4'),
    scheduleDate: '2026-08-13T12:00:00Z'
  },
  {
    id: 'trap-002-abcs',
    title: 'NCLEX Trap: ABCs vs. The Distraction',
    caption: '🚨 NCLEX Trap of the Day: ABCs\n\nABCs ALWAYS come first. The NCLEX gives you 5 urgent tasks — 95% pick the wrong one.\n\n#nclex #prioritization #nursingstudent #clinicaljudgment #nursesofinstagram',
    file: path.join(__dirname, '..', 'video', 'out', 'trap-002-abcs.mp4'),
    scheduleDate: '2026-08-14T12:00:00Z'
  },
  {
    id: 'trap-003-delegation',
    title: 'NCLEX Trap: Who Do You Delegate To?',
    caption: '🚨 NCLEX Trap of the Day: Delegation\n\nRN keeps assessment, meds, sterile procedures. UAP gets ADLs and routine tasks. Simple rule.\n\n#nclex #delegation #nursingstudent #clinicaljudgment #nursingschool',
    file: path.join(__dirname, '..', 'video', 'out', 'trap-003-delegation.mp4'),
    scheduleDate: '2026-08-15T12:00:00Z'
  },
  {
    id: 'trap-004-sata',
    title: 'NCLEX Trap: SATA True/False Method',
    caption: '🚨 NCLEX Trap of the Day: SATA\n\nTreat EACH option as true/false. That\'s the secret. No patterns. No overthinking.\n\n#nclex #sata #testtips #nursingstudent #clinicaljudgment',
    file: path.join(__dirname, '..', 'video', 'out', 'trap-004-sata.mp4'),
    scheduleDate: '2026-08-16T12:00:00Z'
  },
  {
    id: 'trap-005-isolation',
    title: 'NCLEX Trap: Isolation Precautions',
    caption: '🚨 NCLEX Trap of the Day: Isolation\n\nAirborne=N95, Droplet=Surgical mask, Contact=Gown+gloves. One trick, instant recall.\n\n#nclex #infectioncontrol #ppe #nursingstudent #clinicaljudgment',
    file: path.join(__dirname, '..', 'video', 'out', 'trap-005-isolation.mp4'),
    scheduleDate: '2026-08-17T12:00:00Z'
  }
];

async function scheduleAll(options = {}) {
  const { dryRun, platform } = options;
  
  console.log(`🎬 NCLEX Trap Video Auto-Upload`);
  console.log(`📅 Scheduling ${VIDEOS.length} videos\n`);
  
  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No actual uploads\n');
  }
  
  const results = [];
  
  for (const video of VIDEOS) {
    console.log(`\n📹 ${video.title}`);
    console.log(`📅 Scheduled: ${video.scheduleDate}`);
    
    if (!fs.existsSync(video.file)) {
      console.error(`❌ Video file not found: ${video.file}`);
      continue;
    }
    
    const videoResult = { id: video.id, platforms: {} };
    
    // TikTok
    if (!platform || platform === 'tiktok') {
      if (dryRun) {
        console.log(`🔍 [DRY] Would upload to TikTok`);
        videoResult.platforms.tiktok = { success: true, dryRun: true };
      } else {
        try {
          const result = await uploadToTikTok(video.file, video.caption, {
            scheduleDate: video.scheduleDate
          });
          videoResult.platforms.tiktok = result;
        } catch (err) {
          videoResult.platforms.tiktok = { success: false, error: err.message };
        }
      }
    }
    
    // Instagram Reels
    if (!platform || platform === 'instagram') {
      if (dryRun) {
        console.log(`🔍 [DRY] Would upload to Instagram Reels`);
        videoResult.platforms.instagram = { success: true, dryRun: true };
      } else {
        try {
          const result = await uploadToInstagram(video.file, video.caption);
          videoResult.platforms.instagram = result;
        } catch (err) {
          videoResult.platforms.instagram = { success: false, error: err.message };
        }
      }
    }
    
    // YouTube Shorts
    if (!platform || platform === 'youtube') {
      if (dryRun) {
        console.log(`🔍 [DRY] Would upload to YouTube Shorts`);
        videoResult.platforms.youtube = { success: true, dryRun: true };
      } else {
        try {
          const result = await uploadToYouTube(video.file, video.title, video.caption, {
            scheduleDate: video.scheduleDate,
            visibility: 'Public'
          });
          videoResult.platforms.youtube = result;
        } catch (err) {
          videoResult.platforms.youtube = { success: false, error: err.message };
        }
      }
    }
    
    results.push(videoResult);
    
    // Delay between videos to avoid rate limits
    if (!dryRun) {
      console.log('⏳ Waiting 5 seconds before next video...');
      await new Promise(r => setTimeout(r, 5000));
    }
  }
  
  // Summary
  console.log(`\n🏁 Upload Summary`);
  console.log(`================`);
  
  for (const result of results) {
    console.log(`\n📹 ${result.id}`);
    for (const [platform, status] of Object.entries(result.platforms)) {
      const icon = status.success ? '✅' : '❌';
      const detail = status.dryRun ? '(dry run)' : (status.error || 'success');
      console.log(`  ${icon} ${platform}: ${detail}`);
    }
  }
  
  return results;
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const platformIdx = args.indexOf('--platform');
  const platform = platformIdx !== -1 ? args[platformIdx + 1] : null;
  
  scheduleAll({ dryRun, platform }).then(() => {
    console.log('\n✨ Done!');
    process.exit(0);
  }).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}

module.exports = { scheduleAll, VIDEOS };
