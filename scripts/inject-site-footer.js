#!/usr/bin/env node
/**
 * Sitewide footer standardization (2026-08-18, P1).
 * Runs post-build on public/**\/*.html:
 *  - replaces any existing <footer>...</footer> with the canonical footer
 *  - removes stray footer fragments + orphaned </footer> tags
 *  - appends the canonical footer before </body> when missing
 * Self-contained inline styles so it renders identically on every page.
 * Gate: scripts/footer-gate.js enforces exactly one canonical footer per page.
 */
const fs = require('fs');
const path = require('path');

const PUBLIC = path.join(__dirname, '..', 'public');

const CANONICAL_FOOTER = `<!-- Obioma canonical footer (standardized 2026-08-18) -->
<footer class="site-footer">
<style>
  .site-footer{background:#0b1f3a;color:rgba(255,255,255,.78);padding:56px 0 32px;margin-top:56px;font-family:system-ui,sans-serif}
  .site-footer .container{max-width:1100px;margin:0 auto;padding:0 20px}
  .site-footer .footer-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:40px}
  .site-footer .footer-brand{display:flex;align-items:center;font-size:1.3rem;font-weight:800;color:#fff;margin-bottom:12px}
  .site-footer .footer-brand span span{color:#ff6b4a}
  .site-footer .footer-desc{font-size:.92rem;line-height:1.6;color:rgba(255,255,255,.6);max-width:280px}
  .site-footer .footer-col h4{color:#fff;font-size:.95rem;text-transform:uppercase;letter-spacing:.5px;margin:0 0 14px}
  .site-footer .footer-col a{display:block;color:rgba(255,255,255,.7);text-decoration:none;font-size:.92rem;margin-bottom:10px}
  .site-footer .footer-col a:hover{color:#fff}
  .site-footer .footer-bottom{border-top:1px solid rgba(255,255,255,.12);margin-top:40px;padding-top:20px;font-size:.85rem;color:rgba(255,255,255,.5);line-height:1.6}
  .site-footer .footer-ncsbn{font-size:.72rem;color:rgba(255,255,255,.4);margin-top:8px}
  @media(max-width:820px){.site-footer .footer-grid{grid-template-columns:1fr 1fr}}
  @media(max-width:520px){.site-footer .footer-grid{grid-template-columns:1fr}}
</style>
  <div class="container">
    <div class="footer-grid">
      <div>
        <div class="footer-brand">
          <img src="/assets/logo.svg" alt="Obioma" width="28" height="28" style="vertical-align:middle;margin-right:8px">
          <span>Obioma<span>.</span></span>
        </div>
        <p class="footer-desc">Clinical Judgment, Mastered. NCLEX Next Gen preparation for nursing students worldwide.</p>
      </div>
      <div class="footer-col">
        <h4>Product</h4>
        <a href="/case-engine.html">Case Engine</a>
        <a href="/quiz/">Quizzes</a>
        <a href="/pricing">Pricing</a>
        <a href="/content/">Blog</a>
      </div>
      <div class="footer-col">
        <h4>Resources</h4>
        <a href="/free-nclex-checklist">Free Checklist</a>
        <a href="/readiness">Readiness</a>
        <a href="/content/">Study Tips</a>
      </div>
      <div class="footer-col">
        <h4>Company</h4>
        <a href="/contact.html">Contact</a>
        <a href="/privacy.html">Privacy</a>
        <a href="/terms.html">Terms</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© 2026 Obioma. Built by nurses, for nurses. All rights reserved.</p>
      <p class="footer-ncsbn">NCLEX<sup>&reg;</sup> and NGN<sup>&reg;</sup> are registered trademarks of the National Council of State Boards of Nursing, Inc. (NCSBN). NCSBN is not affiliated with Obioma and does not endorse this product.</p>
    </div>
  </div>
</footer>`;

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
  let replaced = 0, added = 0, cleaned = 0;
  for (const file of walk(PUBLIC)) {
    let body = fs.readFileSync(file, 'utf8');
    const orig = body;

    // 1) remove any complete existing <footer>...</footer>
    body = body.replace(/<footer[\s\S]*?<\/footer>\s*/g, () => { replaced++; return ''; });
    // 2) remove stray </footer> tags (homepage-style breakage)
    const strayBefore = (body.match(/<\/footer>/g) || []).length;
    body = body.replace(/<\/footer>\s*/g, '');
    if (strayBefore > 0) cleaned += strayBefore;
    // 3) remove orphaned footer fragments (footer-bottom / footer-col remnants)
    body = body.replace(/\s*<div class="footer-bottom">[\s\S]*?<\/div>\s*/g, '');
    body = body.replace(/\s*<div class="footer-col">[\s\S]*?<\/div>\s*/g, '');

    // 4) append canonical footer before </body>
    if (/<\/body>/i.test(body)) {
      body = body.replace(/<\/body>/i, CANONICAL_FOOTER + '\n</body>');
      added++;
    }

    if (body !== orig) fs.writeFileSync(file, body);
  }
  console.log(`Footer standardization: replaced=${replaced} appended=${added} stray-cleanups=${cleaned}`);
};
