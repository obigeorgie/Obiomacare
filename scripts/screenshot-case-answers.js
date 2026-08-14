#!/usr/bin/env node
const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:8767';
const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots', 'light-theme-v2');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  await page.goto(`${BASE_URL}/case-engine.html`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  
  // Click first case card
  await page.locator('.case-card').first().click();
  await page.waitForTimeout(800);
  
  // Scroll down to see answer options
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(300);
  
  const filepath = path.join(OUTPUT_DIR, 'case-engine-answers.png');
  await page.screenshot({ path: filepath, fullPage: false });
  console.log('  ✅ case-engine-answers.png');
  
  await browser.close();
})();
