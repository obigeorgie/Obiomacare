#!/usr/bin/env node
/**
 * Standing Gate 2: Contrast Audit (v2)
 * Computes effective background by walking up the DOM tree.
 * Only flags genuine contrast failures.
 */

const { chromium } = require('playwright');
const path = require('path');

const PAGES_TO_CHECK = [
  { path: 'index.html', name: 'Homepage' },
  { path: 'case-engine.html', name: 'Case Engine' },
  { path: 'free-nclex-checklist.html', name: 'Checklist' },
];

const CONTRAST_THRESHOLD_AA = 4.5;
const CONTRAST_THRESHOLD_AA_LARGE = 3.0;

function luminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function contrastRatio(color1, color2) {
  const lum1 = luminance(color1.r, color1.g, color1.b);
  const lum2 = luminance(color2.r, color2.g, color2.b);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

function parseColor(str) {
  // Parse rgb(r, g, b) or rgba(r, g, b, a)
  const match = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) return null;
  return {
    r: parseInt(match[1]),
    g: parseInt(match[2]),
    b: parseInt(match[3]),
    a: match[4] ? parseFloat(match[4]) : 1
  };
}

function composite(over, under) {
  // Alpha composite over on top of under
  const a = over.a + under.a * (1 - over.a);
  if (a < 0.001) return { r: 255, g: 255, b: 255, a: 0 };
  return {
    r: Math.round((over.r * over.a + under.r * under.a * (1 - over.a)) / a),
    g: Math.round((over.g * over.a + under.g * under.a * (1 - over.a)) / a),
    b: Math.round((over.b * over.a + under.b * under.a * (1 - over.a)) / a),
    a: a
  };
}

async function auditPage(browser, pageConfig) {
  const page = await browser.newPage();
  const filePath = path.join(__dirname, '..', 'public', pageConfig.path);
  await page.goto('file://' + filePath);
  await page.waitForLoadState('networkidle');

  const elements = await page.$$eval('p, span, a, h1, h2, h3, h4, h5, h6, li, td, th, label, button', els => {
    return els.map(el => {
      const style = window.getComputedStyle(el);
      // Walk up tree to compute effective background
      let bg = { r: 255, g: 255, b: 255, a: 0 }; // Start transparent (will inherit from body)
      let node = el;
      while (node && node !== document.body && node !== document.documentElement) {
        const s = window.getComputedStyle(node);
        const c = s.backgroundColor;
        if (c && c !== 'rgba(0, 0, 0, 0)' && c !== 'transparent') {
          const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
          if (m) {
            const layer = {
              r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]),
              a: m[4] ? parseFloat(m[4]) : 1
            };
            bg = { r: layer.r, g: layer.g, b: layer.b, a: layer.a };
            break; // Found first opaque background
          }
        }
        node = node.parentElement;
      }
      // If still transparent, use body background
      if (bg.a === 0) {
        const bodyBg = window.getComputedStyle(document.body).backgroundColor;
        const m = bodyBg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
        if (m) {
          bg = { r: parseInt(m[1]), g: parseInt(m[2]), b: parseInt(m[3]), a: m[4] ? parseFloat(m[4]) : 1 };
        } else {
          bg = { r: 255, g: 255, b: 255, a: 1 };
        }
      }

      return {
        tag: el.tagName.toLowerCase(),
        text: el.textContent.trim().substring(0, 60),
        color: style.color,
        bgR: bg.r, bgG: bg.g, bgB: bg.b,
        fontSize: parseFloat(style.fontSize),
        fontWeight: parseInt(style.fontWeight),
      };
    });
  });

  let failures = 0;
  let checks = 0;

  for (const el of elements) {
    const textColor = parseColor(el.color);
    if (!textColor) continue;

    const bgColor = { r: el.bgR, g: el.bgG, b: el.bgB };
    const ratio = contrastRatio(textColor, bgColor);

    // Determine threshold: large text (>=18px normal or >=14px bold) uses 3:1
    const isLarge = el.fontSize >= 18 || (el.fontSize >= 14 && el.fontWeight >= 700);
    const threshold = isLarge ? CONTRAST_THRESHOLD_AA_LARGE : CONTRAST_THRESHOLD_AA;

    checks++;

    if (ratio < threshold) {
      const sizeLabel = isLarge ? 'large' : 'normal';
      console.log(`  ❌ ${el.tag} (${sizeLabel}): "${el.text}" — ${ratio.toFixed(2)}:1 (bg: rgb(${el.bgR},${el.bgG},${el.bgB}), text: ${el.color})`);
      failures++;
    }
  }

  await page.close();
  return { checks, failures };
}

(async () => {
  console.log('🔍 Standing Gate 2: Contrast Audit (v2 — effective backgrounds)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const browser = await chromium.launch();
  let totalChecks = 0;
  let totalFailures = 0;

  for (const pageConfig of PAGES_TO_CHECK) {
    console.log(`\n📄 ${pageConfig.name} (${pageConfig.path})`);
    const result = await auditPage(browser, pageConfig);
    totalChecks += result.checks;
    totalFailures += result.failures;
    console.log(`   ${result.failures === 0 ? '✅' : '❌'} ${result.checks} elements checked, ${result.failures} failures`);
  }

  await browser.close();

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (totalFailures === 0) {
    console.log(`✅ PASS: ${totalChecks} contrast checks passed.`);
    process.exit(0);
  } else {
    console.log(`❌ FAIL: ${totalFailures} contrast failure(s) across ${totalChecks} checks.`);
    process.exit(1);
  }
})();
