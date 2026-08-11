const fs = require('fs');
const path = require('path');
const { storeLog, storeDocument } = require('../lib/firestore-helper');

// Postiz API config
const API_KEY = 'pos_80nVwWb8TIdMFTDV3Q8Z0Wpzu61bGiUy8iADDCMB';
const API_URL = 'https://api.postiz.com';

// Integration IDs
const INTEGRATIONS = {
  'x_posts': 'cmrqspwfp0843qj0yyiru88sy',        // @obiomacare
  'x_threads': 'cmrqspwfp0843qj0yyiru88sy',       // @obiomacare
  'instagram_posts': 'cmrrmzsu20dg4qj0ym3m4eskv', // @obiomacare
  'tiktok_scripts': 'cmrrmrnsz0dj4pc0yzrtdgo2q',  // @obiomacare
  'linkedin_posts': 'cmplx746g04hxma0y5w4fdyxv',  // Obioma
  'pinterest_pins': null                            // Not connected
};

async function schedulePost(post) {
  const integrationId = INTEGRATIONS[post.platform];
  if (!integrationId) {
    console.log(`⚠️ Skipping unknown platform: ${post.platform}`);
    return { skipped: true, reason: 'unknown_platform' };
  }

  const dateStr = `${post.date}T${post.time}:00Z`;

  const platformSettings = {
    'x_posts': { __type: 'x', who_can_reply_post: 'everyone' },
    'x_threads': { __type: 'x', who_can_reply_post: 'everyone' },
    'instagram_posts': { __type: 'instagram-standalone', post_type: 'post' },
    'tiktok_scripts': {
      __type: 'tiktok',
      privacy_level: 'PUBLIC_TO_EVERYONE',
      duet: false,
      stitch: false,
      comment: true,
      autoAddMusic: 'no',
      brand_content_toggle: false,
      brand_organic_toggle: false,
      content_posting_method: 'DIRECT_POST'
    },
    'linkedin_posts': { __type: 'linkedin-page' },
    'pinterest_pins': { __type: 'pinterest' }
  };

  // Split threads into multiple posts for X
  let values = [];
  if (post.platform === 'x_threads') {
    let parts = post.content.split(/\n?\d+\//).filter(p => p.trim());
    if (parts.length <= 1) {
      parts = post.content.split(/\n\n+/).filter(p => p.trim());
    }
    if (parts.some(p => p.length > 280)) {
      parts = post.content.split(/\n/).filter(p => p.trim());
    }
    values = parts.map((part, i) => ({
      content: part.trim(),
      image: [],
      delay: i === 0 ? 0 : 1
    }));
  } else {
    values = [{
      content: post.content,
      image: [],
      delay: 0
    }];
  }

  // Skip platforms that require media (Instagram, TikTok)
  if (post.platform === 'instagram_posts' || post.platform === 'tiktok_scripts') {
    console.log(`⚠️ ${post.platform} on ${post.date} ${post.time} — skipped (requires image/video media)`);
    return { skipped: true, reason: 'requires_media' };
  }

  const payload = {
    type: 'schedule',
    creationMethod: 'API',
    date: dateStr,
    shortLink: true,
    tags: [],
    posts: [{
      integration: { id: integrationId },
      value: values,
      settings: platformSettings[post.platform] || {}
    }]
  };

  try {
    const response = await fetch(`${API_URL}/public/v1/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    const result = await response.json();
    console.log(`✅ ${post.platform} on ${post.date} ${post.time} → ${result.id || 'scheduled'}`);
    
    // Store successful post in Firestore
    await storeDocument('scheduled_posts', `post_${post.date}_${post.platform}_${post.time}`, {
      platform: post.platform,
      date: post.date,
      time: post.time,
      content: post.content.substring(0, 500),
      postizId: result.id,
      status: 'scheduled',
      scheduledAt: new Date().toISOString()
    });
    
    return { success: true, id: result.id };
  } catch (err) {
    console.log(`❌ ${post.platform} on ${post.date} ${post.time}: ${err.message}`);
    
    // Store failed post in Firestore
    await storeDocument('scheduled_posts', `post_${post.date}_${post.platform}_${post.time}`, {
      platform: post.platform,
      date: post.date,
      time: post.time,
      status: 'failed',
      error: err.message,
      attemptedAt: new Date().toISOString()
    });
    
    return { success: false, error: err.message };
  }
}

async function main() {
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const schedulePath = path.join(__dirname, 'social-schedule.json');
  const posts = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));

  const today = new Date().toISOString().split('T')[0];
  const postsToSchedule = posts.filter(p => p.date >= today);

  console.log(`Found ${postsToSchedule.length} posts to schedule (from ${today} onwards)\n`);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const post of postsToSchedule) {
    const result = await schedulePost(post);
    if (result.success) success++;
    else if (result.skipped) skipped++;
    else failed++;

    await new Promise(r => setTimeout(r, 500));
  }

  const summary = { runId, total: postsToSchedule.length, success, failed, skipped, date: today };
  
  // Store run summary in Firestore
  await storeLog('schedule-posts', failed === 0 ? 'success' : 'partial', summary);
  await storeDocument('postiz_runs', `run_${runId}`, summary);
  
  console.log(`\n🏁 Done: ${success} scheduled, ${failed} failed, ${skipped} skipped`);
  console.log('💾 Results stored in Firestore');
}

main().catch(async err => {
  console.error('Fatal error:', err);
  await storeLog('schedule-posts', 'failed', { error: err.message });
  process.exit(1);
});
