/**
 * Phase 1 WO 1.4 — build-time cookie-consent injection (GDPR/CCPA).
 *
 * For every built HTML page that loads Google Analytics (gtag) or the Meta
 * pixel (fbevents.js):
 *   1. Replaces the immediate gtag.js <script async> tag with a
 *      consent-gated loader (consent-mode default = denied; gtag.js only
 *      loads after the user accepts, persisted in localStorage).
 *   2. Removes the inline gtag('js')/gtag('config') calls (the loader runs
 *      them post-grant so the page_view isn't dropped pre-consent).
 *   3. Neutralizes the standard Meta pixel snippet: the fbevents.js script
 *      is not loaded until consent; init/track are queued until grant.
 *   4. Injects the consent banner (bottom bar, Accept/Decline, links to
 *      /privacy.html) into every page that carries either tracker.
 *
 * Idempotent: pages already containing the banner are skipped. Placeholder
 * measurement IDs (GA_MEASUREMENT_ID) are normalized to G-922HP9B76M.
 */
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = process.env.OBIOMA_PUBLIC_DIR || path.join(__dirname, '..', 'public');
const GA_ID = 'G-922HP9B76M';
const FB_PIXEL_ID = '1045171501242922';
const MARKER = 'obioma-consent-banner';

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

const GA_LOADER = (id) => `<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',functionality_storage:'denied',personalization_storage:'denied',security_storage:'granted'});
function __obiomaLoadGtag(){if(window.__obiomaGtagLoaded)return;window.__obiomaGtagLoaded=1;var s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id=${id}';document.head.appendChild(s);s.onload=function(){gtag('js',new Date());gtag('config','${id}',{send_page_view:true,cookie_flags:'SameSite=None;Secure'});};}
if(localStorage.getItem('obioma_consent')==='granted'){__obiomaLoadGtag();}
document.addEventListener('ObiomaConsentGranted',__obiomaLoadGtag);
</script>`;

const FB_GATED = `window.ObiomaLoadFbPixel=window.ObiomaLoadFbPixel||function(){var s=document.createElement('script');s.async=true;s.src='https://connect.facebook.net/en_US/fbevents.js';document.head.appendChild(s);s.onload=function(){fbq('init','${FB_PIXEL_ID}');fbq('track','PageView');};};if(localStorage.getItem('obioma_consent')==='granted'){window.ObiomaLoadFbPixel();}else{document.addEventListener('ObiomaConsentGranted',window.ObiomaLoadFbPixel);}`;

const BANNER = `<!-- Obioma cookie consent (Phase 1 WO 1.4) -->
<div id="${MARKER}" role="dialog" aria-label="Cookie consent" style="position:fixed;left:0;right:0;bottom:0;z-index:9999;display:none;background:#0b1f3a;color:#fff;padding:14px 20px;font-family:'Inter',system-ui,sans-serif;font-size:14px;line-height:1.5;box-shadow:0 -2px 12px rgba(0,0,0,.25);">
  <div style="max-width:960px;margin:0 auto;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;">
    <p style="margin:0;flex:1 1 60%;min-width:260px;">We use cookies to understand how visitors use our site — analytics only, no personal data sold. <a href="/privacy.html" style="color:#fbbf24;text-decoration:underline;">Privacy Policy</a></p>
    <div style="display:flex;gap:10px;flex-shrink:0;">
      <button id="obioma-consent-decline" style="background:transparent;border:1px solid rgba(255,255,255,.6);color:#fff;padding:8px 18px;border-radius:8px;font-size:14px;cursor:pointer;">Decline</button>
      <button id="obioma-consent-accept" style="background:#c53030;border:none;color:#fff;padding:8px 18px;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;">Accept</button>
    </div>
  </div>
</div>
<script>
(function(){var KEY='obioma_consent',b=document.getElementById('${MARKER}');
function set(v){localStorage.setItem(KEY,v);}
function grant(){set('granted');document.dispatchEvent(new CustomEvent('ObiomaConsentGranted'));}
function hide(){b.style.display='none';}
if(!localStorage.getItem(KEY)){b.style.display='block';}
document.getElementById('obioma-consent-accept').addEventListener('click',function(){grant();hide();});
document.getElementById('obioma-consent-decline').addEventListener('click',function(){set('denied');hide();});
})();
</script>`;

function main() {
  const files = findHtmlFiles(PUBLIC_DIR);
  let gaCount = 0, fbCount = 0, bannerCount = 0, skipCount = 0;

  for (const file of files) {
    let html = fs.readFileSync(file, 'utf8');
    if (html.includes(MARKER)) { skipCount++; continue; }

    const hasGA = html.includes('googletagmanager.com/gtag/js?id=');
    const hasFB = html.includes('connect.facebook.net/en_US/fbevents.js');
    if (!hasGA && !hasFB) continue;

    if (hasGA) {
      const idMatch = html.match(/gtag\/js\?id=([A-Za-z0-9_-]+)/);
      const id = idMatch && idMatch[1] !== 'GA_MEASUREMENT_ID' ? idMatch[1] : GA_ID;
      // 1. replace the async gtag.js tag with the consent-gated loader
      html = html.replace(
        /<script[^>]*async[^>]*src="https:\/\/www\.googletagmanager\.com\/gtag\/js\?id=[A-Za-z0-9_-]+"[^>]*><\/script>/,
        GA_LOADER(id)
      );
      // 2. remove inline gtag('js') / gtag('config') calls (loader re-runs them post-grant)
      html = html.replace(/gtag\('js',\s*new Date\(\)\);\s*/g, '');
      html = html.replace(/gtag\('config',\s*'[A-Za-z0-9_-]+'(?:\s*,\s*\{[^}]*\})?\);\s*/g, '');
      gaCount++;
    }

    if (hasFB) {
      // 3a. neutralize the standard Meta snippet: don't load fbevents.js yet
      html = html.replace(
        /\(window,\s*document,'script',\s*'https:\/\/connect\.facebook\.net\/en_US\/fbevents\.js'\);/,
        "(window, document,'script','data:text/javascript,');"
      );
      // 3b. gate init/track on consent
      html = html.replace(
        /fbq\('init',\s*'1045171501242922'\);\s*fbq\('track',\s*'PageView'\);/,
        FB_GATED
      );
      fbCount++;
    }

    // 4. banner before </body>
    html = html.replace(/<\/body>/i, BANNER + '\n</body>');
    fs.writeFileSync(file, html);
    bannerCount++;
  }

  console.log(`Consent injection: GA=${gaCount} FB=${fbCount} banners=${bannerCount} skipped=${skipCount}`);
}

main();
