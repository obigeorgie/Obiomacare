const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * TikTok Video Uploader
 * Uses browser automation to upload videos to TikTok
 * 
 * Prerequisites:
 * 1. Log into TikTok in a regular browser
 * 2. Export cookies to cookies/tiktok.json
 * 3. Or set TIKTOK_COOKIES env var with JSON string
 */

const COOKIES_PATH = path.join(__dirname, '..', 'cookies', 'tiktok.json');

async function loadCookies() {
  // Try env var first
  if (process.env.TIKTOK_COOKIES) {
    return JSON.parse(process.env.TIKTOK_COOKIES);
  }
  
  // Try file
  if (fs.existsSync(COOKIES_PATH)) {
    return JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'));
  }
  
  throw new Error('No TikTok cookies found. Set TIKTOK_COOKIES env var or save to cookies/tiktok.json');
}

async function uploadToTikTok(videoPath, caption, options = {}) {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    // Load cookies
    const cookies = await loadCookies();
    await context.addCookies(cookies);
    
    const page = await context.newPage();
    
    console.log('🎵 Navigating to TikTok Studio...');
    await page.goto('https://www.tiktok.com/tiktokstudio/upload', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Wait for upload area
    console.log('⏳ Waiting for upload interface...');
    await page.waitForSelector('iframe[src*="upload"]', { timeout: 30000 });
    
    const frame = page.frame({ url: /upload/ });
    if (!frame) {
      throw new Error('Upload iframe not found');
    }
    
    // Upload video file
    console.log('📤 Uploading video...');
    const fileInput = await frame.waitForSelector('input[type="file"]', { timeout: 30000 });
    await fileInput.setInputFiles(videoPath);
    
    // Wait for upload to complete
    console.log('⏳ Waiting for upload to complete...');
    await frame.waitForSelector('.upload-progress-bar', { state: 'hidden', timeout: 120000 });
    
    // Add caption
    console.log('📝 Adding caption...');
    const captionInput = await frame.waitForSelector('[contenteditable="true"]', { timeout: 30000 });
    await captionInput.fill(caption);
    
    // Set privacy
    if (options.privacy) {
      console.log('🔒 Setting privacy...');
      await frame.click('[data-e2e="privacy-selector"]');
      await frame.click(`text=${options.privacy}`); // 'Public', 'Friends', 'Private'
    }
    
    // Toggle options
    if (options.duet !== undefined) {
      const duetToggle = await frame.$('[data-e2e="duet-toggle"]');
      if (duetToggle) await duetToggle.click();
    }
    
    if (options.stitch !== undefined) {
      const stitchToggle = await frame.$('[data-e2e="stitch-toggle"]');
      if (stitchToggle) await stitchToggle.click();
    }
    
    // Schedule if specified
    if (options.scheduleDate) {
      console.log('📅 Scheduling post...');
      await frame.click('text=Schedule');
      // Set date/time picker
      const dateInput = await frame.$('[data-e2e="schedule-date"]');
      if (dateInput) await dateInput.fill(options.scheduleDate);
    }
    
    // Post now
    console.log('🚀 Publishing...');
    await frame.click('[data-e2e="post-button"]');
    
    // Wait for confirmation
    await frame.waitForSelector('text=Your video has been posted', { timeout: 30000 });
    
    console.log('✅ TikTok upload successful!');
    return { success: true };
    
  } catch (err) {
    console.error('❌ TikTok upload failed:', err.message);
    return { success: false, error: err.message };
  } finally {
    await browser.close();
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  const videoPath = args[args.indexOf('--video') + 1];
  const caption = args[args.indexOf('--caption') + 1];
  const scheduleDate = args[args.indexOf('--schedule') + 1];
  
  if (!videoPath || !caption) {
    console.error('Usage: node tiktok-uploader.js --video <path> --caption <text> [--schedule <ISO-date>]');
    process.exit(1);
  }
  
  uploadToTikTok(videoPath, caption, { scheduleDate }).then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { uploadToTikTok };
