#!/usr/bin/env node
const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:8767';
const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots', 'light-theme-v2');

const fs = require('fs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

(async () => {
  console.log('📸 Capturing viewport screenshots...');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  await page.goto(`${BASE_URL}/index.html`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  
  // Screenshot just the viewport (not full page)
  const filepath = path.join(OUTPUT_DIR, 'homepage-viewport.png');
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`  ✅ homepage-viewport.png`);
  
  // Scroll and capture sections
  const sections = ['hero', 'features', 'pricing', 'faq'];
  for (const section of sections) {
    try {
      const el = await page.locator(`#${section}`).first();
      if (await el.count() > 0) {
        await el.scrollIntoViewIfNeeded();
        await page.waitForTimeout(500);
        const fp = path.join(OUTPUT_DIR, `homepage-${section}.png`);
        await page.screenshot({ path: fp, fullPage: false });
        console.log(`  ✅ homepage-${section}.png`);
      }
    } catch (e) {
      console.log(`  ⚠️  Section #${section} not found`);
    }
  }
  
  await browser.close();
  console.log(`\n📁 Screenshots saved to: ${OUTPUT_DIR}`);
})();
