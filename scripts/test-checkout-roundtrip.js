#!/usr/bin/env node
/**
 * Checkout Round-Trip Test
 * Validates that every plan in config/pricing.js with a stripePriceId
 * (or test placeholder) can successfully create a checkout session.
 *
 * Usage: node scripts/test-checkout-roundtrip.js [baseUrl]
 * Default baseUrl: http://localhost:8787 (wrangler dev)
 */

const http = require('http');

const BASE_URL = process.argv[2] || 'http://localhost:8787';

// Import pricing config to ensure we test exactly what's defined
const { PLANS, TIER } = require('../config/pricing');

// Plans that should support checkout (have price IDs or test placeholders)
const CHECKOUT_PLANS = Object.entries(PLANS).filter(([_, plan]) => {
  // Free and institutional plans don't have checkout
  return plan.stripePriceId !== null && plan.ctaAction === 'checkout';
});

console.log(`Testing checkout round-trips against ${BASE_URL}`);
console.log(`Plans to test: ${CHECKOUT_PLANS.map(([k]) => k).join(', ')}`);
console.log('');

let passed = 0;
let failed = 0;

async function testCheckout(tierKey, plan) {
  const start = Date.now();
  const testEmail = `test-${tierKey}@example.com`;

  try {
    const res = await fetch(`${BASE_URL}/api/create-subscription-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tier: tierKey,
        email: testEmail,
        successUrl: 'https://obiomacare.com/success',
        cancelUrl: 'https://obiomacare.com/pricing',
      }),
    });

    const data = await res.json();
    const duration = Date.now() - start;

    if (res.status === 200 && data.url) {
      console.log(`✅ ${tierKey} (${plan.name}) — ${res.status} in ${duration}ms`);
      console.log(`   URL: ${data.url.substring(0, 80)}...`);
      if (data.testMode) console.log(`   Mode: TEST`);
      passed++;
      return true;
    } else {
      console.log(`❌ ${tierKey} (${plan.name}) — ${res.status} in ${duration}ms`);
      console.log(`   Error: ${data.error || JSON.stringify(data)}`);
      failed++;
      return false;
    }
  } catch (err) {
    console.log(`❌ ${tierKey} (${plan.name}) — EXCEPTION`);
    console.log(`   ${err.message}`);
    failed++;
    return false;
  }
}

async function runTests() {
  for (const [tierKey, plan] of CHECKOUT_PLANS) {
    await testCheckout(tierKey, plan);
  }

  console.log('');
  console.log('─'.repeat(50));
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.error('\n❌ CHECKOUT TEST FAILED — do not deploy');
    process.exit(1);
  } else {
    console.log('\n✅ All checkout tiers verified');
    process.exit(0);
  }
}

// Polyfill fetch for Node < 18
if (!global.fetch) {
  const fetch = (url, opts = {}) => new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const req = http.request({
      hostname: urlObj.hostname,
      port: urlObj.port || 80,
      path: urlObj.pathname + urlObj.search,
      method: opts.method || 'GET',
      headers: opts.headers || {},
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          json: () => Promise.resolve(JSON.parse(body)),
        });
      });
    });
    req.on('error', reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
  global.fetch = fetch;
}

runTests();
