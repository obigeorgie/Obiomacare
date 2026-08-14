#!/usr/bin/env node
const { chromium } = require('playwright');
const path = require('path');

const BASE_URL = 'http://localhost:8767';
const OUTPUT_DIR = path.join(__dirname, '..', 'screenshots', 'light-theme');

const PAGES = [
  { path: 'index.html', name: 'homepage' },
  { path: 'case-engine.html', name: 'case-engine' },
  { path: 'free-nclex-checklist.html', name: 'checklist' },
];

const VIEWPORTS = [
  { width: 1280, height: 800, suffix: 'desktop' },
  { width: 390, height: 844, suffix: 'mobile' },
];

const fs = require('fs');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

(async () => {
  console.log('📸 Capturing light theme screenshots...');
  const browser = await chromium.launch();

  for (const pageConfig of PAGES) {
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: vp });
      await page.goto(`${BASE_URL}/${pageConfig.path}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      const filename = `${pageConfig.name}-${vp.suffix}.png`;
      const filepath = path.join(OUTPUT_DIR, filename);
      await page.screenshot({ path: filepath, fullPage: true });
      console.log(`  ✅ ${filename}`);
      await page.close();
    }
  }

  await browser.close();
  console.log(`\n📁 Screenshots saved to: ${OUTPUT_DIR}`);
})();
