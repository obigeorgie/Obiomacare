const fs = require('fs');
const path = require('path');

// Postiz API config
const API_KEY = 'pos_80nVwWb8TIdMFTDV3Q8Z0Wpzu61bGiUy8iADDCMB';
const API_URL = 'https://api.postiz.com';
const X_INTEGRATION = 'cmrqspwfp0843qj0yyiru88sy';

async function schedulePost(post) {
  const dateStr = `${post.date}T${post.time}:00Z`;
  
  const payload = {
    type: 'schedule',
    creationMethod: 'API',
    date: dateStr,
    shortLink: true,
    tags: [],
    posts: [{
      integration: { id: X_INTEGRATION },
      value: [{
        content: post.content,
        image: [],
        delay: 0
      }],
      settings: { __type: 'x', who_can_reply_post: 'everyone' }
    }]
  };

  try {
    const resp = await fetch(`${API_URL}/public/v1/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': API_KEY
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const error = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${error}`);
    }

    const result = await resp.json();
    console.log(`✅ ${post.date} ${post.time} → ${result[0]?.postId || 'scheduled'}`);
    return { success: true };
  } catch (err) {
    console.log(`❌ ${post.date} ${post.time}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function main() {
  const schedulePath = path.join(__dirname, '..', 'content-nursing', 'social-schedule.json');
  const posts = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));

  const today = new Date().toISOString().split('T')[0];
  
  // Only X posts (text only, no media needed)
  const xPosts = posts.filter(p => 
    p.date >= today && 
    (p.platform === 'x_posts' || p.platform === 'x_threads')
  );

  console.log(`Found ${xPosts.length} X posts to schedule (from ${today})\n`);

  let success = 0;
  let failed = 0;

  for (const post of xPosts) {
    const result = await schedulePost(post);
    if (result.success) success++;
    else failed++;
    await new Promise(r => setTimeout(r, 1000)); // 1s delay
  }

  console.log(`\n🏁 Done: ${success} scheduled, ${failed} failed`);
}

main().catch(console.error);
