#!/usr/bin/env node
const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:8767';
const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots', 'light-theme-final');

const fs = require('fs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  await page.goto(`${BASE_URL}/index.html`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  
  // Hero
  await page.screenshot({ path: path.join(OUTPUT_DIR, '01-hero.png'), fullPage: false });
  console.log('  ✅ 01-hero.png');
  
  // Scroll through sections
  const scrollPoints = [800, 1600, 2400, 3200, 4000, 4800, 5600, 6400];
  let i = 2;
  for (const y of scrollPoints) {
    await page.evaluate(y => window.scrollTo(0, y), y);
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUTPUT_DIR, `${String(i).padStart(2, '0')}-scroll-${y}.png`), fullPage: false });
    console.log(`  ✅ ${String(i).padStart(2, '0')}-scroll-${y}.png`);
    i++;
  }
  
  await browser.close();
})();
