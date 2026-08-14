#!/usr/bin/env node
/**
 * Case Engine E2E Proof
 * Loads the Case Engine, selects a case, completes Step 1.
 * Reports console errors and success/failure.
 */

const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:8765';

(async () => {
  console.log('🧪 Case Engine E2E Proof');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Capture console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    consoleMessages.push({ type, text });
    if (type === 'error' || type === 'warning') {
      console.log(`  🌐 [${type.toUpperCase()}] ${text.substring(0, 120)}`);
    }
  });

  // Capture page errors
  const pageErrors = [];
  page.on('pageerror', err => {
    pageErrors.push(err.message);
    console.log(`  🌐 [PAGE ERROR] ${err.message.substring(0, 120)}`);
  });

  // Step 1: Navigate to Case Engine
  console.log('\n📄 Step 1: Navigate to Case Engine');
  await page.goto(`${BASE_URL}/case-engine.html`);
  await page.waitForLoadState('networkidle');

  // Check for "Failed to load" text
  const hasFailed = await page.locator('text=Failed to load').count() > 0;
  if (hasFailed) {
    console.log('  ❌ Case Engine shows "Failed to load" — cases did not load');
    await browser.close();
    process.exit(1);
  }
  console.log('  ✅ No "Failed to load" error displayed');

  // Step 2: Wait for case cards to appear
  console.log('\n📄 Step 2: Wait for case cards');
  await page.waitForSelector('.case-card, [data-case-id]', { timeout: 5000 });
  const caseCards = await page.locator('.case-card, [data-case-id]').count();
  console.log(`  ✅ Found ${caseCards} case card(s)`);

  if (caseCards === 0) {
    console.log('  ❌ No case cards found');
    await browser.close();
    process.exit(1);
  }

  // Step 3: Click first case
  console.log('\n📄 Step 3: Click first case');
  await page.locator('.case-card, [data-case-id]').first().click();
  await page.waitForTimeout(1000);

  // Step 4: Check that case content loaded
  console.log('\n📄 Step 4: Verify case content');
  const hasScenario = await page.locator('text=Scenario').count() > 0;
  const hasVitals = await page.locator('text=Vital Signs').count() > 0;
  const hasQuestion = await page.locator('.question-text, [data-question]').count() > 0;

  console.log(`  ${hasScenario ? '✅' : '❌'} Scenario section visible`);
  console.log(`  ${hasVitals ? '✅' : '❌'} Vital Signs visible`);
  console.log(`  ${hasQuestion ? '✅' : '❌'} Question visible`);

  // Step 5: Complete Step 1 (click an answer option)
  console.log('\n📄 Step 5: Complete Step 1');
  const options = await page.locator('.option, [data-option], input[type="radio"]').count();
  if (options > 0) {
    await page.locator('.option, [data-option], input[type="radio"]').first().click();
    await page.waitForTimeout(500);
    console.log('  ✅ Selected an answer option');
  } else {
    console.log('  ⚠️  No answer options found (may be free-text or different UI)');
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const errorCount = consoleMessages.filter(m => m.type === 'error').length;
  const warnCount = consoleMessages.filter(m => m.type === 'warning').length;

  console.log(`📊 Console: ${errorCount} error(s), ${warnCount} warning(s), ${pageErrors.length} page error(s)`);

  if (errorCount === 0 && pageErrors.length === 0 && hasScenario) {
    console.log('✅ PASS: Case Engine loads cases and renders Step 1 cleanly.');
    await browser.close();
    process.exit(0);
  } else {
    console.log('❌ FAIL: Issues detected during Case Engine test.');
    await browser.close();
    process.exit(1);
  }
})();
