const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * Instagram Reels Uploader
 * Uses browser automation to upload Reels to Instagram
 * 
 * Prerequisites:
 * 1. Log into Instagram in a regular browser
 * 2. Export cookies to cookies/instagram.json
 * 3. Or set INSTAGRAM_COOKIES env var with JSON string
 */

const COOKIES_PATH = path.join(__dirname, '..', 'cookies', 'instagram.json');

async function loadCookies() {
  if (process.env.INSTAGRAM_COOKIES) {
    return JSON.parse(process.env.INSTAGRAM_COOKIES);
  }
  
  if (fs.existsSync(COOKIES_PATH)) {
    return JSON.parse(fs.readFileSync(COOKIES_PATH, 'utf-8'));
  }
  
  throw new Error('No Instagram cookies found. Set INSTAGRAM_COOKIES env var or save to cookies/instagram.json');
}

async function uploadToInstagram(videoPath, caption, options = {}) {
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
    
    console.log('📸 Navigating to Instagram...');
    await page.goto('https://www.instagram.com/reels/upload/', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    
    // Handle "Turn on Notifications" popup
    try {
      await page.click('text=Not Now', { timeout: 5000 });
    } catch (e) {
      // No popup, continue
    }
    
    // Click "Create" button if present
    try {
      await page.click('text=Create', { timeout: 5000 });
    } catch (e) {
      // Already on upload page
    }
    
    // Upload video
    console.log('📤 Uploading video...');
    const fileInput = await page.waitForSelector('input[type="file"][accept*="video"]', { timeout: 30000 });
    await fileInput.setInputFiles(videoPath);
    
    // Wait for upload
    console.log('⏳ Processing video...');
    await page.waitForSelector('img[alt*="preview"]', { timeout: 120000 });
    
    // Click "Next" to proceed to details
    await page.click('text=Next');
    
    // Add caption
    console.log('📝 Adding caption...');
    const captionArea = await page.waitForSelector('[aria-label="Write a caption..."]', { timeout: 30000 });
    await captionArea.fill(caption);
    
    // Add hashtags if provided
    if (options.hashtags) {
      await captionArea.press('End');
      await captionArea.type('\n\n' + options.hashtags);
    }
    
    // Click "Share"
    console.log('🚀 Publishing Reel...');
    await page.click('text=Share');
    
    // Wait for confirmation
    await page.waitForSelector('text=Your reel has been shared', { timeout: 60000 });
    
    console.log('✅ Instagram Reel uploaded successfully!');
    return { success: true };
    
  } catch (err) {
    console.error('❌ Instagram upload failed:', err.message);
    return { success: false, error: err.message };
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const videoPath = args[args.indexOf('--video') + 1];
  const caption = args[args.indexOf('--caption') + 1];
  
  if (!videoPath || !caption) {
    console.error('Usage: node instagram-uploader.js --video <path> --caption <text>');
    process.exit(1);
  }
  
  uploadToInstagram(videoPath, caption).then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

module.exports = { uploadToInstagram };
