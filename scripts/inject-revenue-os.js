/**
 * Revenue OS Phase 1 — build-time injection (analytics beacon + events client).
 * Runs inside build.js AFTER assets are copied to public/.
 * Idempotent: pages already injected are skipped. Missing beacon token
 * (config/analytics.json) skips the beacon but still injects the events JS.
 */
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const CONFIG_PATH = path.join(__dirname, '..', 'config', 'analytics.json');

function findHtmlFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(full);
      else if (entry.name.endsWith('.html')) out.push(full);
    }
  }
  return out;
}

function main() {
  let token = '';
  try {
    token = (JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')).cfBeaconToken || '').trim();
  } catch (e) { /* no config — beacon skipped */ }

  const beacon = token
    ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"${token}"}'></script>`
    : null;
  const eventsScript = '<script src="/assets/revenue-events.js" defer></script>';

  const files = findHtmlFiles(PUBLIC_DIR);
  let injected = 0;
  let beaconCount = 0;
  for (const f of files) {
    let src = fs.readFileSync(f, 'utf-8');
    const orig = src;
    let changed = false;

    if (beacon && !src.includes('cloudflareinsights.com/beacon.min.js')) {
      if (src.includes('</head>')) {
        src = src.replace('</head>', '  ' + beacon + '\n</head>');
        changed = true;
        beaconCount++;
      }
    }
    if (!src.includes('revenue-events.js')) {
      if (src.includes('</body>')) {
        src = src.replace('</body>', '  ' + eventsScript + '\n</body>');
        changed = true;
      }
    }
    if (changed) {
      fs.writeFileSync(f, src);
      injected++;
    }
  }
  console.log(`📊 Revenue OS injection: ${files.length} pages scanned, ${injected} modified (beacon: ${beaconCount}${beacon ? '' : ' — SKIPPED, no token in config/analytics.json'})`);
}

main();
