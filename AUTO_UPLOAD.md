# Social Media Auto-Upload System

## Overview
Fully automated video posting to TikTok, Instagram Reels, and YouTube Shorts without manual intervention.

## Approach
Since Postiz API doesn't support media uploads, we use **browser automation** via Playwright to simulate manual uploads.

## Platforms

### TikTok
- **Method**: Playwright browser automation
- **URL**: https://www.tiktok.com/upload
- **Requirements**: Logged-in session (cookies)
- **Features**: Upload video, add caption, hashtags, schedule

### Instagram Reels
- **Method**: Playwright browser automation
- **URL**: https://www.instagram.com/reels/upload
- **Requirements**: Logged-in session (cookies)
- **Features**: Upload video, add caption, hashtags, schedule

### YouTube Shorts
- **Method**: Playwright browser automation  
- **URL**: https://studio.youtube.com
- **Requirements**: Logged-in session (cookies)
- **Features**: Upload video, add title/description, schedule

## Setup

### 1. Install Playwright
```bash
npm install playwright
npx playwright install chromium
```

### 2. Extract Cookies
Log into each platform manually, then export cookies:
- TikTok: Use browser dev tools → Application → Cookies
- Instagram: Same method
- YouTube: Same method

Save cookies to `cookies/tiktok.json`, `cookies/instagram.json`, `cookies/youtube.json`

### 3. Run Uploads
```bash
node scripts/auto-upload.js --platform tiktok --video video/out/trap-001-potassium.mp4 --caption "..."
node scripts/auto-upload.js --platform instagram --video video/out/trap-001-potassium.mp4 --caption "..."
node scripts/auto-upload.js --platform youtube --video video/out/trap-001-potassium.mp4 --title "..."
```

## Security Notes
- Cookies stored locally only (never committed)
- Use `.gitignore` for cookies directory
- Refresh cookies monthly (they expire)

## Alternative: Official APIs

### TikTok API v2
- Requires: TikTok Developer Account + Business Verification
- Endpoint: `POST /v2/video/upload/`
- Pros: Direct upload, reliable
- Cons: Requires approval, complex setup

### Instagram Graph API
- Requires: Facebook App + Instagram Business Account
- Endpoint: `POST /{ig-user-id}/media`
- Pros: Official API
- Cons: Requires business account, approval process

### YouTube Data API v3
- Requires: Google Cloud Project + OAuth
- Endpoint: `POST /youtube/v3/videos`
- Pros: Well-documented, reliable
- Cons: Quota limits

## Recommendation
Start with browser automation (fastest to implement), then migrate to official APIs for long-term reliability.
