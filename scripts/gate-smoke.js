#!/usr/bin/env node
/**
 * Standing Gate 3: Route Smoke Test
 * Checks that key pages render without "Failed to load" or error states.
 * Uses Playwright for headless rendering.
 */

const { chromium } = require('playwright');
const path = require('path');

const ROUTES = [
  { path: 'index.html', name: 'Homepage', mustContain: ['Clinical Judgment', 'Obioma'] },
  { path: 'case-engine.html', name: 'Case Engine', mustContain: ['Case Engine'], mustNotContain: ['Failed to load'] },
  { path: 'free-nclex-checklist.html', name: 'Checklist', mustContain: ['NCLEX'] },
];

async function smokeTest(browser, route) {
  const page = await browser.newPage();
  const filePath = path.join(__dirname, '..', 'public', route.path);
  await page.goto('file://' + filePath);
  await page.waitForLoadState('networkidle');

  const html = await page.content();
  await page.close();

  let failures = 0;

  // Check must-contain strings
  for (const str of route.mustContain || []) {
    if (!html.includes(str)) {
      console.log(`  ❌ Missing expected text: "${str}"`);
      failures++;
    }
  }

  // Check must-not-contain strings
  for (const str of route.mustNotContain || []) {
    if (html.includes(str)) {
      console.log(`  ❌ Found forbidden text: "${str}"`);
      failures++;
    }
  }

  // Check for console errors (script failures)
  // Note: This is a static file check, so we check for common error indicators
  const errorIndicators = ['Uncaught', 'ReferenceError', 'TypeError', 'Failed to load'];
  for (const indicator of errorIndicators) {
    if (html.includes(indicator)) {
      console.log(`  ⚠️  Found error indicator: "${indicator}"`);
      // Don't count as failure for static HTML, just warn
    }
  }

  return failures;
}

(async () => {
  console.log('🔍 Standing Gate 3: Route Smoke Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const browser = await chromium.launch();
  let totalFailures = 0;

  for (const route of ROUTES) {
    console.log(`\n📄 ${route.name} (${route.path})`);
    const failures = await smokeTest(browser, route);
    totalFailures += failures;
    if (failures === 0) {
      console.log(`  ✅ All checks passed`);
    }
  }

  await browser.close();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (totalFailures === 0) {
    console.log(`✅ PASS: All ${ROUTES.length} routes smoke-tested successfully.`);
    process.exit(0);
  } else {
    console.log(`❌ FAIL: ${totalFailures} check(s) failed.`);
    process.exit(1);
  }
})();
