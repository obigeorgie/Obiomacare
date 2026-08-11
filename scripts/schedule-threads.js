const fs = require('fs');
const path = require('path');

const API_KEY = 'pos_80nVwWb8TIdMFTDV3Q8Z0Wpzu61bGiUy8iADDCMB';
const API_URL = 'https://api.postiz.com';
const X_INTEGRATION = 'cmrqspwfp0843qj0yyiru88sy';

async function scheduleThread(post) {
  const dateStr = `${post.date}T${post.time}:00Z`;
  
  // Split thread by numbered sections
  let parts = [];
  const lines = post.content.split('\n');
  let currentPart = '';
  
  for (const line of lines) {
    if (/^\d+\//.test(line.trim())) {
      if (currentPart) parts.push(currentPart.trim());
      currentPart = line + '\n';
    } else {
      currentPart += line + '\n';
    }
  }
  if (currentPart) parts.push(currentPart.trim());
  
  // If no numbered parts, split by paragraphs
  if (parts.length <= 1) {
    parts = post.content.split('\n\n').filter(p => p.trim());
  }
  
  // Ensure each part is under 280 chars
  const values = parts.map((part, i) => ({
    content: part.trim().substring(0, 280),
    image: [],
    delay: i === 0 ? 0 : 1
  }));
  
  const payload = {
    type: 'schedule',
    creationMethod: 'API',
    date: dateStr,
    shortLink: true,
    tags: [],
    posts: [{
      integration: { id: X_INTEGRATION },
      value: values,
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
    console.log(`✅ Thread ${post.date} ${post.time} → ${result[0]?.postId || 'scheduled'} (${values.length} parts)`);
    return { success: true };
  } catch (err) {
    console.log(`❌ Thread ${post.date} ${post.time}: ${err.message}`);
    return { success: false, error: err.message };
  }
}

async function main() {
  const schedulePath = path.join(__dirname, '..', 'content-nursing', 'social-schedule.json');
  const posts = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));

  // Failed posts that need threading
  const failedDates = ['2026-08-11', '2026-08-16', '2026-08-22', '2026-08-24', '2026-08-27'];
  const threads = posts.filter(p => failedDates.includes(p.date) && p.platform === 'x_threads');

  console.log(`Scheduling ${threads.length} threads...\n`);

  for (const post of threads) {
    await scheduleThread(post);
    await new Promise(r => setTimeout(r, 1000));
  }
}

main().catch(console.error);
