const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * YouTube Shorts Uploader
 * Uses browser automation to upload Shorts to YouTube
 * 
 * Prerequisites:
 * 1. Log into YouTube Studio in a regular browser
 * 2. Export cookies to cookies/youtube.json
 * 3. Or set YOUTUBE_COOKIES env var with JSON string
 */

const COOKIES_PATH = path.join(__dirname, '..', 'cookies', 'youtube.json');

async function loadCookies() {
  if (process.env.YOUTUBE_COOKIES) {
    return JSON.parse(process.env.YOUTUBE_COOKIES);
  }
  
  if (fs.existsSync(COOKIES_PATH)) {
    return JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'));
  }
  
  throw new Error('No YouTube cookies found. Set YOUTUBE_COOKIES env var or save to cookies/youtube.json');
}

async function uploadToYouTube(videoPath, title, description, options = {}) {
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 }
    });
    
    const cookies = await loadCookies();
    await context.addCookies(cookies);
    
    const page = await context.newPage();
    
    console.log('▶️  Navigating to YouTube Studio...');
    await page.goto('https://studio.youtube.com', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Click "Create" button
    console.log('🎬 Opening upload dialog...');
    await page.click('button[aria-label="Create"]');
    await page.click('text=Upload videos');
    
    // Upload file
    console.log('📤 Uploading video...');
    const fileInput = await page.waitForSelector('input[type="file"]', { timeout: 30000 });
    await fileInput.setInputFiles(videoPath);
    
    // Wait for upload dialog
    console.log('⏳ Processing...');
    await page.waitForSelector('text=Details', { timeout: 60000 });
    
    // Fill title
    console.log('📝 Adding title...');
    const titleInput = await page.$('textbox[name="title"]');
    await titleInput.fill(title);
    
    // Fill description
    if (description) {
      console.log('📝 Adding description...');
      const descInput = await page.$('textbox[name="description"]');
      await descInput.fill(description);
    }
    
    // Set visibility
    if (options.visibility) {
      console.log('👁️  Setting visibility...');
      await page.click(`radio[aria-label="${options.visibility}"]`); // Public, Unlisted, Private
    }
    
    // Schedule if specified
    if (options.scheduleDate) {
      console.log('📅 Scheduling...');
      await page.click('text=Schedule');
      const dateInput = await page.$('input[type="datetime-local"]');
      await dateInput.fill(options.scheduleDate);
    }
    
    // Set as Short (detected automatically for <60s vertical videos, but verify)
    console.log('✅ Verifying Short format...');
    const shortIndicator = await page.$('text=Short');
    if (!shortIndicator) {
      console.warn('⚠️  Video may not be detected as a Short. Check aspect ratio and duration.');
    }
    
    // Click Next through screens
    console.log('➡️  Proceeding to publish...');
    await page.click('text=Next'); // Details
    await page.waitForTimeout(1000);
    await page.click('text=Next'); // Video elements
    await page.waitForTimeout(1000);
    await page.click('text=Next'); // Checks
    await page.waitForTimeout(1000);
    
    // Publish
    console.log('🚀 Publishing Short...');
    await page.click('text=Publish');
    
    // Wait for confirmation
    await page.waitForSelector('text=Video published', { timeout: 60000 });
    
    console.log('✅ YouTube Short uploaded successfully!');
    return { success: true };
    
  } catch (err) {
    console.error('❌ YouTube upload failed:', err.message);
    return { success: false, error: err.message };
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const videoPath = args[args.indexOf('--video') + 1];
  const title = args[args.indexOf('--title') + 1];
  const description = args[args.indexOf('--description') + 1];
  
  if (!videoPath || !title) {
    console.error('Usage: node youtube-uploader.js --video <path> --title <title> [--description <text>]');
    process.exit(1);
  }
  
  uploadToYouTube(videoPath, title, description).then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { uploadToYouTube };
