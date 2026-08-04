const fs = require('fs');
const path = require('path');

// Postiz API config
const API_KEY = 'pos_80nVwWb8TIdMFTDV3Q8Z0Wpzu61bGiUy8iADDCMB';
const API_URL = 'https://api.postiz.com';

// Integration IDs
const INTEGRATIONS = {
  'x_posts': 'cmrqspwfp0843qj0yyiru88sy',      // @obiomacare
  'x_threads': 'cmrqspwfp0843qj0yyiru88sy',     // @obiomacare
  'instagram_posts': 'cmrrmzsu20dg4qj0ym3m4eskv', // @obiomacare
  'tiktok_scripts': 'cmrrmrnsz0dj4pc0yzrtdgo2q'   // @obiomacare
};

async function schedulePost(post) {
  const integrationId = INTEGRATIONS[post.platform];
  if (!integrationId) {
    console.log(`⚠️ Skipping unknown platform: ${post.platform}`);
    return { skipped: true };
  }

  const dateStr = `${post.date}T${post.time}:00Z`;

  const platformSettings = {
    'x_posts': { who_can_reply_post: 'everyone' },
    'x_threads': { who_can_reply_post: 'everyone' },
    'instagram_posts': { post_type: 'post' },
    'tiktok_scripts': {
      privacy_level: 'PUBLIC_TO_EVERYONE',
      duet: false,
      stitch: false,
      comment: true,
      autoAddMusic: 'no',
      brand_content_toggle: false,
      brand_organic_toggle: false,
      content_posting_method: 'DIRECT_POST'
    }
  };

  // Split threads into multiple posts for X
  let values = [];
  if (post.platform === 'x_threads') {
    // Try numbered split first (1/ 2/ etc.)
    let parts = post.content.split(/\n?\d+\//).filter(p => p.trim());
    // If no number markers, split by double newlines
    if (parts.length <= 1) {
      parts = post.content.split(/\n\n+/).filter(p => p.trim());
    }
    // If still too long chunks, split by single newlines
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

  // Skip platforms that require media (Instagram, TikTok) - no images available
  if (post.platform === 'instagram_posts' || post.platform === 'tiktok_scripts') {
    console.log(`⚠️ ${post.platform} on ${post.date} ${post.time} — skipped (requires image/video media)`);
    return { skipped: true };
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
    return { success: true, id: result.id };
  } catch (err) {
    console.log(`❌ ${post.platform} on ${post.date} ${post.time}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function main() {
  const schedulePath = path.join(__dirname, 'social-schedule.json');
  const posts = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));

  const today = '2026-08-04';
  const postsToSchedule = posts.filter(p => {
    // Only schedule X threads that failed before (too long)
    // X posts already succeeded, Instagram/TikTok need media
    return p.platform === 'x_threads' && p.date >= today;
  });

  console.log(`Found ${postsToSchedule.length} posts to schedule (from ${today} onwards)\n`);

  let success = 0;
  let failed = 0;
  let skipped = 0;

  for (const post of postsToSchedule) {
    const result = await schedulePost(post);
    if (result.success) success++;
    else if (result.skipped) skipped++;
    else failed++;

    // Rate limit: small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n🏁 Done: ${success} scheduled, ${failed} failed, ${skipped} skipped`);
}

main().catch(console.error);
