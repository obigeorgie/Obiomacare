#!/usr/bin/env node
/**
 * Sitewide header/logo standardization (2026-08-18).
 * Runs post-build on public/**\/*.html:
 *  1. Pages WITHOUT a <header> get the canonical front-page header injected
 *     (logo.svg + "Obioma." wordmark + nav). Self-contained inline styles so it
 *     renders identically on every page regardless of each page's stylesheet.
 *  2. Pages WITH a header get their logo anchor normalized to the canonical
 *     front-page form (logo.svg + logo-text "Obioma.").
 * Idempotent: already-standardized pages are skipped.
 */
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');

const CANONICAL_HEADER = `<!-- Site header (standardized 2026-08-18) -->
<style>
  .site-header{background:#0b1f3a;border-bottom:1px solid rgba(255,255,255,.08);padding:14px 0}
  .site-header .container{max-width:1100px;margin:0 auto;padding:0 20px;display:flex;align-items:center;justify-content:space-between;gap:20px}
  .site-header .logo{display:flex;align-items:center;gap:10px;text-decoration:none}
  .site-header .logo img{width:40px;height:40px}
  .site-header .logo-text{font-size:1.35rem;font-weight:800;color:#fff;font-family:inherit;letter-spacing:.3px}
  .site-header .logo-text span{color:#ff6b4a}
  .site-header .nav-links{display:flex;align-items:center;gap:22px}
  .site-header .nav-links a{color:rgba(255,255,255,.88);text-decoration:none;font-size:.95rem;font-weight:500}
  .site-header .nav-links a:hover{color:#fff}
  .site-header .nav-links .btn-primary{background:#ff6b4a;color:#fff;padding:9px 18px;border-radius:8px;font-weight:600}
  .site-header .nav-links .btn-primary:hover{background:#e85a3c}
  @media(max-width:720px){.site-header .nav-links{display:none}}
</style>
<header class="site-header">
  <div class="container">
    <a href="/" class="logo">
      <img src="/assets/logo.svg" alt="Obioma">
      <span class="logo-text">Obioma<span>.</span></span>
    </a>
    <nav class="nav-links" aria-label="Main">
      <a href="/case-engine.html">Case Engine</a>
      <a href="/quiz/">Quizzes</a>
      <a href="/content/">Blog</a>
      <a href="/free-nclex-checklist">Free Checklist</a>
      <a href="/pricing" class="btn btn-primary">Get Started</a>
    </nav>
  </div>
</header>`;

const CANONICAL_LOGO = `<a href="/" class="logo"><img src="/assets/logo.svg" alt="Obioma"> <span class="logo-text">Obioma<span>.</span></span></a>`;

function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

module.exports = function () {
  let added = 0, normalized = 0, skipped = 0, headerAbove = 0;
  for (const file of walk(PUBLIC)) {
    let body = fs.readFileSync(file, 'utf8');
    const orig = body;

    if (!/<header[\s>]/.test(body)) {
      body = body.replace(/<body[^>]*>/, (m) => m + '\n' + CANONICAL_HEADER);
      added++;
    } else if (!body.includes('logo-text">Obioma<span>')) {
      if (/<div class="logo">/.test(body)) {
        // app-style header with text-only logo -> canonical logo anchor
        body = body.replace(/<div class="logo">[\s\S]*?<\/div>/, CANONICAL_LOGO);
        normalized++;
      } else if (!/<header[\s\S]*?logo\.svg/.test(body)) {
        // header exists but has NO logo image at all (title/breadcrumb headers)
        // -> canonical site header above it
        body = body.replace(/(<body[^>]*>)/, (m) => m + '\n' + CANONICAL_HEADER);
        headerAbove++;
      } else {
        // header has a logo image but non-canonical anchor -> normalize the anchor
        body = body.replace(/<a href="\/"[^>]*>[\s\S]*?<\/a>/, CANONICAL_LOGO);
        normalized++;
      }
    } else {
      skipped++;
    }

    if (body !== orig) fs.writeFileSync(file, body);
  }
  console.log(`Header standardization: added=${added} logo-normalized=${normalized} header-above=${headerAbove} already-ok=${skipped} total=${added + normalized + headerAbove + skipped}`);
};
