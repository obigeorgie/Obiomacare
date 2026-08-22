#!/usr/bin/env node
/**
 * Standing Gate: Deterministic Contrast Audit (browser-free)
 * Mirrors scripts/gate-contrast.js semantics without needing a browser:
 *   - element set: p, span, a, h1-h6, li, td, th, label, button
 *   - bg = first non-transparent ancestor background (alpha DROPPED, per gate)
 *   - thresholds: 4.5:1 normal, 3:1 large (>=18px, or >=14px bold)
 * Also reports true alpha-composited visual contrast as a second column.
 *
 * Why: the rendered gate needs chromium system libs (libnspr4 etc.) which may
 * not be installable on the ops box (no root). This gate resolves the CSS
 * cascade deterministically (cheerio) — validated against the quiz pages.
 *
 * Usage:
 *   node scripts/contrast-audit.mjs                     # default pages
 *   node scripts/contrast-audit.mjs quiz/index.html     # specific page(s)
 * Exit 0 = pass, 1 = fail.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from 'cheerio';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DEFAULT_PAGES = ['quiz/index.html', 'quiz/lab-values.html'];
const PAGES = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_PAGES;

const tokensCss = readFileSync(join(ROOT, 'public/design-tokens/tokens.css'), 'utf8');

function parseRules(css) {
  css = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(css))) {
    const selectors = m[1].split(',').map(s => s.trim()).filter(s => s && !s.startsWith('@') && !s.includes(':hover'));
    if (!selectors.length) continue;
    const decls = {};
    for (const d of m[2].split(';')) {
      const i = d.indexOf(':');
      if (i < 0) continue;
      decls[d.slice(0, i).trim().toLowerCase()] = d.slice(i + 1).trim();
    }
    rules.push({ selectors, decls });
  }
  return rules;
}

function luminance(r, g, b) {
  const a = [r, g, b].map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}
const ratio = (c1, c2) => { const l1 = luminance(c1.r, c1.g, c1.b), l2 = luminance(c2.r, c2.g, c2.b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
const composite = (over, under) => {
  const a = over.a + under.a * (1 - over.a);
  if (a < 0.001) return { r: 255, g: 255, b: 255, a: 0 };
  return { r: Math.round((over.r * over.a + under.r * under.a * (1 - over.a)) / a),
           g: Math.round((over.g * over.a + under.g * under.a * (1 - over.a)) / a),
           b: Math.round((over.b * over.a + under.b * under.a * (1 - over.a)) / a), a };
};

function parseColor(str) {
  if (!str) return null;
  str = str.trim();
  if (str === 'white') return { r: 255, g: 255, b: 255, a: 1 };
  if (str === 'black') return { r: 0, g: 0, b: 0, a: 1 };
  let m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? parseFloat(m[4]) : 1 };
  m = str.match(/^#([0-9a-f]{6})$/i);
  if (m) { const n = parseInt(m[1], 16); return { r: n >> 16 & 255, g: n >> 8 & 255, b: n & 255, a: 1 }; }
  m = str.match(/^#([0-9a-f]{3})$/i);
  if (m) { const n = parseInt(m[1], 16); return { r: (n >> 8 & 15) * 17, g: (n >> 4 & 15) * 17, b: (n & 15) * 17, a: 1 }; }
  return null;
}

function resolveVar(val, v, depth = 0) {
  if (depth > 10 || typeof val !== 'string') return val;
  if (val.startsWith('var(')) {
    const inner = val.slice(4, -1);
    const [name, ...rest] = inner.split(',');
    const fallback = rest.join(',').trim();
    return v[name.trim()] ? resolveVar(v[name.trim()], v, depth + 1) : (fallback || 'transparent');
  }
  return val;
}

function partMatches(part, el) {
  if (part === '*') return true;
  let tag = null, cls = null;
  if (part.startsWith('.')) cls = part.slice(1);
  else { const i = part.indexOf('.'); if (i >= 0) { tag = part.slice(0, i); cls = part.slice(i + 1); } else tag = part; }
  if (tag && el[0].tagName && el[0].tagName.toLowerCase() !== tag) return false;
  if (cls) { const c = el.attr('class') || ''; if (!c.split(/\s+/).includes(cls)) return false; }
  return true;
}
function specificity(sel) {
  const s = [0, 0, 0];
  for (const part of sel.split(/\s+/)) { if (part.startsWith('.')) s[1]++; else s[2]++; }
  return s;
}
const cmpSpec = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
function matches(sel, el) {
  const parts = sel.split(/\s+/);
  if (!partMatches(parts[parts.length - 1], el)) return false;
  let cur = el.parent();
  for (let i = parts.length - 2; i >= 0; i--) {
    let found = false;
    while (cur.length) { if (partMatches(parts[i], cur)) { found = true; break; } cur = cur.parent(); }
    if (!found) return false;
  }
  return true;
}

function auditPage(pagePath) {
  const html = readFileSync(join(ROOT, 'public', pagePath), 'utf8');
  const $ = load(html);
  // vars: tokens :root -> tokens [data-theme=dark] -> page :root (inline <style>)
  const v = {};
  for (const r of parseRules(tokensCss)) if (!r.selectors.some(s => s.includes('data-theme'))) Object.assign(v, r.decls);
  for (const r of parseRules(tokensCss)) if (r.selectors.some(s => s.includes('data-theme'))) Object.assign(v, r.decls);
  const PAGE_RULES = parseRules($('style').first().html() || '');
  for (const r of PAGE_RULES) if (r.selectors.some(s => s === ':root' || s === 'html')) Object.assign(v, r.decls);

  const ruleFor = (el, prop) => {
    let best = null, bestSpec = null;
    for (const r of PAGE_RULES) {
      const d = r.decls[prop];
      if (d === undefined) continue;
      const sel = r.selectors.find(s => matches(s, el));
      if (!sel) continue;
      const spec = specificity(sel);
      if (!best || cmpSpec(spec, bestSpec) > 0) { best = resolveVar(d, v); bestSpec = spec; }
    }
    return best;
  };
  const computed = (el, prop) => {
    if (!el || !el.length) return null;
    const direct = ruleFor(el, prop);
    if (direct !== null && direct !== undefined) return direct;
    if (el[0].tagName.toLowerCase() === 'html') return prop === 'color' ? '#000000' : prop === 'font-size' ? '16px' : '400';
    return computed(el.parent(), prop);
  };
  const bgLayers = (el) => {
    const layers = [];
    let node = el;
    while (node.length && node[0].tagName.toLowerCase() !== 'html') {
      const bg = ruleFor(node, 'background') ?? ruleFor(node, 'background-color');
      if (bg && bg !== 'transparent' && !bg.startsWith('linear-gradient') && !bg.startsWith('none')) {
        const c = parseColor(bg);
        if (c && c.a > 0) layers.push(c);
      }
      node = node.parent();
    }
    const bodyBg = ruleFor($('body'), 'background') ?? ruleFor($('body'), 'background-color');
    const bc = bodyBg ? parseColor(bodyBg) : null;
    if (bc && bc.a > 0) layers.push(bc);
    else layers.push({ r: 255, g: 255, b: 255, a: 1 });
    return layers;
  };

  let checks = 0, failures = 0;
  const results = [];
  $('p, span, a, h1, h2, h3, h4, h5, h6, li, td, th, label, button').each((_, el) => {
    const $el = $(el);
    const text = $el.text().trim();
    if (!text) return;
    const color = parseColor(computed($el, 'color'));
    if (!color) return;
    const fs = parseFloat(computed($el, 'font-size')) || 16;
    const fw = parseInt(computed($el, 'font-weight')) || 400;
    const layers = bgLayers($el);
    const gateBg = { r: layers[0].r, g: layers[0].g, b: layers[0].b };
    const rGate = ratio(color, gateBg);
    let trueBg = { r: 255, g: 255, b: 255, a: 1 };
    for (let i = layers.length - 1; i >= 0; i--) trueBg = composite(layers[i], trueBg);
    const rTrue = ratio(color, trueBg);
    const isLarge = fs >= 18 || (fs >= 14 && fw >= 700);
    const th = isLarge ? 3.0 : 4.5;
    checks++;
    const pass = rGate >= th;
    if (!pass) failures++;
    results.push({ tag: $el[0].tagName.toLowerCase(), text: text.slice(0, 52), color, gateBg, rGate: rGate.toFixed(2), rTrue: rTrue.toFixed(2), isLarge, pass });
  });
  return { pagePath, checks, failures, results };
}

console.log('🔍 Deterministic Contrast Audit (browser-free — gate semantics)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
let totalChecks = 0, totalFailures = 0;
for (const page of PAGES) {
  const r = auditPage(page);
  totalChecks += r.checks;
  totalFailures += r.failures;
  console.log(`\n📄 ${r.pagePath}`);
  for (const el of r.results) {
    if (!el.pass) {
      console.log(`  ❌ <${el.tag}> (${el.isLarge ? 'large' : 'normal'}): "${el.text}" — gate ${el.rGate}:1 (vs rgb(${el.gateBg.r},${el.gateBg.g},${el.gateBg.b})) · visual ${el.rTrue}:1`);
    }
  }
  console.log(`   ${r.failures === 0 ? '✅' : '❌'} ${r.checks} elements checked, ${r.failures} failures`);
}
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (totalFailures === 0) {
  console.log(`✅ PASS: ${totalChecks} contrast checks across ${PAGES.length} page(s).`);
  process.exit(0);
} else {
  console.log(`❌ FAIL: ${totalFailures} contrast failure(s) across ${totalChecks} checks.`);
  process.exit(1);
}
