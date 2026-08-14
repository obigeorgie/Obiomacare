#!/usr/bin/env node
const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:8767';
const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots', 'light-theme-final');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  await page.goto(`${BASE_URL}/index.html`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  // Scroll to bottom for footer
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '10-footer.png'), fullPage: false });
  console.log('  ✅ 10-footer.png');
  
  await browser.close();
})();
