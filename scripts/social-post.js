#!/usr/bin/env node
/**
 * Social Media Posting Automation for Obioma Care
 * 
 * Usage:
 *   node scripts/social-post.js --platform=x --content="Your post here"
 *   node scripts/social-post.js --schedule --date=2026-08-14 --time=14:00
 * 
 * Platforms supported:
 *   - x (Twitter/X)
 *   - instagram
 *   - linkedin
 *   - pinterest
 *   - tiktok (manual reminder)
 * 
 * Setup:
 * 1. Create .env file with API credentials
 * 2. Run npm install twitter-api-v2 axios
 * 3. Schedule via cron: 0 9,14 * * * cd /path && node scripts/social-post.js --auto
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  contentFile: path.join(__dirname, '../content-nursing/social-schedule.json'),
  postedLog: path.join(__dirname, '../content-nursing/social-posted.json'),
  maxChars: {
    x: 280,
    instagram: 2200,
    linkedin: 3000,
    pinterest: 500
  }
};

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2);
      const value = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
      options[key] = value;
      if (value !== true) i++;
    }
  }
  
  return options;
}

// Load scheduled content
function loadSchedule() {
  try {
    const data = fs.readFileSync(CONFIG.contentFile, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error loading schedule:', e.message);
    return [];
  }
}

// Load posted log
function loadPostedLog() {
  try {
    const data = fs.readFileSync(CONFIG.postedLog, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { posts: [], lastPosted: null };
  }
}

// Save posted log
function savePostedLog(log) {
  fs.writeFileSync(CONFIG.postedLog, JSON.stringify(log, null, 2));
}

// Find post for today
function findTodaysPost(schedule) {
  const today = new Date().toISOString().split('T')[0];
  return schedule.filter(post => post.date === today && !isPosted(post));
}

// Check if post was already made
function isPosted(post) {
  const log = loadPostedLog();
  return log.posts.some(p => 
    p.date === post.date && 
    p.platform === post.platform &&
    p.time === post.time
  );
}

// Format content for platform
function formatForPlatform(content, platform) {
  const maxLen = CONFIG.maxChars[platform] || 280;
  
  if (content.length <= maxLen) return content;
  
  // Try to truncate at sentence boundary
  const truncated = content.substring(0, maxLen - 3);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastPeriod > maxLen * 0.7) {
    return truncated.substring(0, lastPeriod + 1);
  }
  
  return truncated.substring(0, lastSpace) + '...';
}

// Simulate posting (replace with actual API calls)
async function postToX(content) {
  console.log(`\n[POSTING TO X]\n${content}\n`);
  // TODO: Implement X API posting
  // const { TwitterApi } = require('twitter-api-v2');
  // const client = new TwitterApi(process.env.X_BEARER_TOKEN);
  // await client.v2.tweet(content);
  return { success: true, platform: 'x', id: `simulated_${Date.now()}` };
}

async function postToInstagram(content) {
  console.log(`\n[POSTING TO INSTAGRAM]\n${content}\n`);
  // TODO: Implement Instagram Graph API
  return { success: true, platform: 'instagram', id: `simulated_${Date.now()}` };
}

async function postToLinkedIn(content) {
  console.log(`\n[POSTING TO LINKEDIN]\n${content}\n`);
  // TODO: Implement LinkedIn API
  return { success: true, platform: 'linkedin', id: `simulated_${Date.now()}` };
}

async function postToPinterest(content) {
  console.log(`\n[POSTING TO PINTEREST]\n${content}\n`);
  // TODO: Implement Pinterest API
  return { success: true, platform: 'pinterest', id: `simulated_${Date.now()}` };
}

// Post to platform
async function postToPlatform(post) {
  const formatted = formatForPlatform(post.content, post.platform);
  
  switch (post.platform) {
    case 'x_posts':
    case 'x_threads':
      return await postToX(formatted);
    case 'instagram_posts':
      return await postToInstagram(formatted);
    case 'linkedin_posts':
      return await postToLinkedIn(formatted);
    case 'pinterest_pins':
      return await postToPinterest(formatted);
    case 'tiktok_scripts':
      console.log(`\n[TIKTOK SCRIPT - MANUAL POSTING REQUIRED]\n${formatted}\n`);
      return { success: true, platform: 'tiktok', manual: true };
    default:
      console.log(`\n[UNKNOWN PLATFORM: ${post.platform}]\n${formatted}\n`);
      return { success: false, error: 'Unknown platform' };
  }
}

// Main function
async function main() {
  const args = parseArgs();
  
  if (args.help || args.h) {
    console.log(`
Social Media Posting Automation

Usage:
  node social-post.js --auto              Post today's scheduled content
  node social-post.js --platform=x        Post to specific platform
  node social-post.js --content="text"    Post custom content
  node social-post.js --list              List scheduled posts
  node social-post.js --dry-run           Show what would be posted (no actual posting)

Options:
  --auto          Automatically post today's scheduled content
  --platform      Target platform (x, instagram, linkedin, pinterest)
  --content       Custom content to post
  --dry-run       Show posts without sending
  --list          List all scheduled posts
  --help          Show this help
    `);
    return;
  }
  
  if (args.list) {
    const schedule = loadSchedule();
    console.log('\nScheduled Posts:');
    console.log('================');
    schedule.forEach((post, i) => {
      const posted = isPosted(post) ? ' [POSTED]' : '';
      console.log(`${i + 1}. [${post.date} ${post.time}] ${post.platform}${posted}`);
      console.log(`   ${post.content.substring(0, 80)}...\n`);
    });
    return;
  }
  
  if (args.auto) {
    const schedule = loadSchedule();
    const todaysPosts = findTodaysPost(schedule);
    
    if (todaysPosts.length === 0) {
      console.log('No posts scheduled for today.');
      return;
    }
    
    console.log(`Found ${todaysPosts.length} post(s) for today.`);
    
    const log = loadPostedLog();
    const results = [];
    
    for (const post of todaysPosts) {
      if (args['dry-run']) {
        console.log(`\n[DRY RUN] Would post to ${post.platform}:`);
        console.log(formatForPlatform(post.content, post.platform));
        continue;
      }
      
      try {
        const result = await postToPlatform(post);
        if (result.success) {
          log.posts.push({
            date: post.date,
            time: post.time,
            platform: post.platform,
            content: post.content.substring(0, 200),
            postedAt: new Date().toISOString(),
            postId: result.id
          });
          results.push({ success: true, platform: post.platform });
        }
      } catch (e) {
        console.error(`Failed to post to ${post.platform}:`, e.message);
        results.push({ success: false, platform: post.platform, error: e.message });
      }
    }
    
    if (!args['dry-run']) {
      log.lastPosted = new Date().toISOString();
      savePostedLog(log);
      console.log('\nPosting complete!');
      console.log('Results:', results);
    }
    
    return;
  }
  
  if (args.content && args.platform) {
    const post = {
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      platform: args.platform,
      content: args.content
    };
    
    if (args['dry-run']) {
      console.log(`[DRY RUN] Would post to ${post.platform}:`);
      console.log(formatForPlatform(post.content, post.platform));
      return;
    }
    
    const result = await postToPlatform(post);
    console.log('Result:', result);
    return;
  }
  
  console.log('Use --help for usage information.');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { loadSchedule, postToPlatform, formatForPlatform };
