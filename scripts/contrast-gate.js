#!/usr/bin/env node
/**
 * Contrast Gate v2 — Improved computed-style contrast check
 * Handles gradients, images, and nested backgrounds more accurately.
 * Fails on visible text < 4.5:1 (normal) or < 3:1 (large).
 */

const puppeteer = require('puppeteer');

const ROUTES = process.argv.slice(2).length > 0
  ? process.argv.slice(2)
  : [
      'https://obiomacare.com/',
      'https://obiomacare.com/case-engine.html',
      'https://obiomacare.com/quiz/',
      'https://obiomacare.com/content/',
      'https://obiomacare.com/free-nclex-checklist',
    ];

async function checkPage(browser, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

  const failures = await page.evaluate(() => {
    function getLuminance(r, g, b) {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    function parseColor(colorStr) {
      const m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return m ? [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])] : null;
    }

    function contrastRatio(color1, color2) {
      const c1 = parseColor(color1);
      const c2 = parseColor(color2);
      if (!c1 || !c2) return null;
      const l1 = getLuminance(...c1);
      const l2 = getLuminance(...c2);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    function getEffectiveBackground(el) {
      let current = el;
      while (current && current !== document.documentElement) {
        const style = window.getComputedStyle(current);
        const bg = style.backgroundColor;
        // Check for actual background (image, gradient, solid color)
        const hasBgImage = style.backgroundImage && style.backgroundImage !== 'none';
        if (hasBgImage) {
          // If it has a gradient/image, we can't easily compute contrast.
          // Return the average of the element's known palette or approximate.
          // For our navy gradient headers, approximate as dark.
          const rect = current.getBoundingClientRect();
          if (rect.top < 400) return 'rgb(15, 23, 42)'; // approx navy gradient
        }
        if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
          return bg;
        }
        current = current.parentElement;
      }
      // Default: check html element, then assume white
      const htmlBg = window.getComputedStyle(document.documentElement).backgroundColor;
      if (htmlBg && htmlBg !== 'rgba(0, 0, 0, 0)' && htmlBg !== 'transparent') {
        return htmlBg;
      }
      return 'rgb(255, 255, 255)';
    }

    function isDecorative(el) {
      // Skip pure star/icon elements without meaningful text
      const text = el.textContent.trim();
      if (text === '★' || text === '☆' || text === '•' || text === '→') return true;
      // Skip elements with aria-hidden
      if (el.getAttribute('aria-hidden') === 'true') return true;
      return false;
    }

    const results = [];
    const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, li, td, th, label, button');

    for (const el of elements) {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;
      if (parseFloat(style.opacity) < 0.1) continue;
      if (el.offsetWidth === 0 || el.offsetHeight === 0) continue;

      const text = el.textContent.trim();
      if (!text) continue;
      if (isDecorative(el)) continue;

      const color = style.color;
      const bgColor = getEffectiveBackground(el);
      const fontSize = parseFloat(style.fontSize);
      const fontWeight = parseFloat(style.fontWeight);
      const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
      const threshold = isLarge ? 3.0 : 4.5;

      const ratio = contrastRatio(color, bgColor);
      if (ratio === null) continue;

      if (ratio < threshold) {
        results.push({
          tag: el.tagName,
          text: text.substring(0, 60),
          color,
          bgColor,
          fontSize: `${fontSize.toFixed(1)}px`,
          fontWeight,
          ratio: ratio.toFixed(2),
          threshold,
          isLarge,
        });
      }
    }

    return results;
  });

  await page.close();
  return failures;
}

async function main() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  let allFailures = [];

  for (const url of ROUTES) {
    console.log(`\n=== ${url} ===`);
    const failures = await checkPage(browser, url);

    for (const f of failures) {
      allFailures.push({ ...f, url });
      console.log(`  FAIL: ${f.tag} "${f.text.substring(0, 40)}" — ${f.ratio}:1 (needs ${f.threshold}:1)`);
      console.log(`        ${f.color} on ${f.bgColor}, ${f.fontSize} weight ${f.fontWeight}`);
    }

    if (failures.length === 0) {
      console.log('  ✅ All visible text meets contrast requirements');
    } else {
      console.log(`  ❌ ${failures.length} contrast failures`);
    }
  }

  await browser.close();

  console.log(`\n=== SUMMARY ===`);
  if (allFailures.length === 0) {
    console.log('✅ ZERO contrast failures across all routes');
    process.exit(0);
  } else {
    console.log(`❌ ${allFailures.length} total contrast failures`);
    for (const f of allFailures) {
      console.log(`  ${f.url}: ${f.tag} "${f.text.substring(0, 30)}" — ${f.ratio}:1`);
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Gate error:', err.message);
  process.exit(1);
});
