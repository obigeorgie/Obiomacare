/**
 * Cookie Extraction Helper
 * 
 * This script helps you extract cookies from your browser for automated uploads.
 * 
 * Usage:
 * 1. Log into TikTok, Instagram, and YouTube in your browser
 * 2. Open DevTools (F12) → Application/Storage → Cookies
 * 3. Export cookies as JSON or copy them manually
 * 4. Save to cookies/<platform>.json
 * 
 * Or use a browser extension:
 * - Chrome: "Get cookies.txt" or "Export cookies"
 * - Firefox: "cookies.txt"
 */

const fs = require('fs');
const path = require('path');

const COOKIES_DIR = path.join(__dirname, '..', 'cookies');

function ensureDir() {
  if (!fs.existsSync(COOKIES_DIR)) {
    fs.mkdirSync(COOKIES_DIR, { recursive: true });
  }
}

function saveCookies(platform, cookies) {
  ensureDir();
  const filePath = path.join(COOKIES_DIR, `${platform}.json`);
  fs.writeFileSync(filePath, JSON.stringify(cookies, null, 2));
  console.log(`✅ Cookies saved to ${filePath}`);
  console.log(`⚠️  IMPORTANT: Add 'cookies/' to .gitignore to avoid committing credentials!`);
}

function validateCookies(platform) {
  const filePath = path.join(COOKIES_DIR, `${platform}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ No cookies found for ${platform} at ${filePath}`);
    return false;
  }
  
  try {
    const cookies = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
    if (!Array.isArray(cookies) || cookies.length === 0) {
      console.error(`❌ Invalid cookie format for ${platform}`);
      return false;
    }
    
    // Check for essential cookies
    const essential = ['sessionid', 'csrftoken', 'ds_user_id']; // Instagram
    const hasEssential = cookies.some(c => essential.includes(c.name));
    
    if (!hasEssential) {
      console.warn(`⚠️  Cookies may be missing essential fields for ${platform}`);
    }
    
    console.log(`✅ Valid cookies for ${platform} (${cookies.length} cookies)`);
    return true;
    
  } catch (err) {
    console.error(`❌ Failed to parse cookies for ${platform}: ${err.message}`);
    return false;
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const action = args[0];
  
  if (action === 'validate') {
    const platform = args[1];
    if (!platform) {
      console.error('Usage: node cookies-helper.js validate <platform>');
      process.exit(1);
    }
    validateCookies(platform);
  } else if (action === 'save') {
    const platform = args[1];
    const cookiesFile = args[2];
    
    if (!platform || !cookiesFile) {
      console.error('Usage: node cookies-helper.js save <platform> <cookies.json>');
      process.exit(1);
    }
    
    const cookies = JSON.parse(fs.readFileSync(cookiesFile, 'utf-8'));
    saveCookies(platform, cookies);
  } else {
    console.log(`
Cookie Helper for Social Media Auto-Upload

Commands:
  validate <platform>     Validate saved cookies (tiktok, instagram, youtube)
  save <platform> <file>  Save cookies from exported file

Examples:
  node cookies-helper.js validate tiktok
  node cookies-helper.js save instagram ~/Downloads/instagram_cookies.json

To export cookies:
  1. Log into the platform in your browser
  2. Open DevTools → Application → Cookies
  3. Copy cookies array or use extension
  4. Save as JSON and use 'save' command
    `);
  }
}

module.exports = { saveCookies, validateCookies };
