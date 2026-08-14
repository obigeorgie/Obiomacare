#!/usr/bin/env node
const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:8767';
const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots', 'light-theme-v2');

const fs = require('fs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

(async () => {
  console.log('📸 Capturing light theme v2 screenshots...');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
  await page.goto(`${BASE_URL}/index.html`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  const filepath = path.join(OUTPUT_DIR, 'homepage-desktop.png');
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`  ✅ homepage-desktop.png`);
  
  await browser.close();
  console.log(`\n📁 Screenshot saved to: ${OUTPUT_DIR}`);
})();
