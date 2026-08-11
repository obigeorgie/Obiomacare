const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
const { storeLog, storeDocument } = require('../lib/firestore-helper');

const KEY_PATH = process.env.GSC_KEY_PATH || '/root/.openclaw/workspace/downloads/19f65655-36f2-893e-8000-00000311d180_gsc-service-account.json';
const SITE_URL = process.env.GSC_SITE_URL || 'sc-domain:obiomacare.com';
const SITEMAP_URL = 'https://obiomacare.com/sitemap.xml';

async function main() {
  console.log('🔍 GSC Auto-Submit Script');
  console.log('==========================');
  
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const results = { submitted: 0, errors: 0, sitemapStatus: null, analytics: null, urlsSubmitted: [] };

  if (!fs.existsSync(KEY_PATH)) {
    console.error('❌ Service account key not found:', KEY_PATH);
    await storeLog('gsc-auto-submit', 'failed', { error: 'Service account key not found', runId });
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    keyFile: KEY_PATH,
    scopes: [
      'https://www.googleapis.com/auth/webmasters',
      'https://www.googleapis.com/auth/webmasters.readonly',
      'https://www.googleapis.com/auth/indexing'
    ]
  });

  const webmasters = google.webmasters({ version: 'v3', auth });
  const indexing = google.indexing({ version: 'v3', auth });

  // 1. Submit sitemap
  console.log('\n📤 Submitting sitemap...');
  try {
    await webmasters.sitemaps.submit({
      siteUrl: SITE_URL,
      feedpath: SITEMAP_URL
    });
    console.log('✅ Sitemap submitted:', SITEMAP_URL);
    results.sitemapSubmitted = true;
  } catch (err) {
    console.log('⚠️ Sitemap submit result:', err.message);
    results.sitemapSubmitted = false;
    results.sitemapError = err.message;
  }

  // 2. Get sitemap status
  console.log('\n📊 Checking sitemap status...');
  try {
    const sitemapRes = await webmasters.sitemaps.list({ siteUrl: SITE_URL });
    if (sitemapRes.data.sitemap) {
      results.sitemapStatus = sitemapRes.data.sitemap.map(s => ({
        path: s.path,
        errors: s.errors || 0,
        warnings: s.warnings || 0
      }));
      sitemapRes.data.sitemap.forEach(s => {
        console.log(`  - ${s.path}: ${s.errors || 0} errors, ${s.warnings || 0} warnings`);
      });
    } else {
      console.log('  No sitemaps found yet');
      results.sitemapStatus = [];
    }
  } catch (err) {
    console.log('⚠️ Could not list sitemaps:', err.message);
    results.sitemapError = err.message;
  }

  // 3. Get search analytics (last 7 days)
  console.log('\n📈 Search analytics (last 7 days)...');
  try {
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const analyticsRes = await webmasters.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query']
      }
    });
    if (analyticsRes.data.rows) {
      const totalClicks = analyticsRes.data.rows.reduce((sum, r) => sum + (r.clicks || 0), 0);
      const totalImpressions = analyticsRes.data.rows.reduce((sum, r) => sum + (r.impressions || 0), 0);
      results.analytics = { totalClicks, totalImpressions, startDate, endDate, queries: analyticsRes.data.rows.length };
      console.log(`  Total clicks: ${totalClicks}`);
      console.log(`  Total impressions: ${totalImpressions}`);
    } else {
      console.log('  No search data available yet');
      results.analytics = null;
    }
  } catch (err) {
    console.log('⚠️ Analytics query failed:', err.message);
    results.analyticsError = err.message;
  }

  // 4. Submit key URLs for indexing
  console.log('\n🚀 Submitting URLs for indexing...');
  const urlsToSubmit = [
    'https://obiomacare.com/',
    'https://obiomacare.com/free-nclex-checklist.html',
    'https://obiomacare.com/content/index.html',
    'https://obiomacare.com/content/nclex-lab-values-memorization-guide.html',
    'https://obiomacare.com/content/nclex-abg-interpretation-guide.html',
    'https://obiomacare.com/content/nclex-medication-suffixes.html',
    'https://obiomacare.com/content/nclex-high-alert-medications.html',
    'https://obiomacare.com/content/nclex-drug-calculations-guide.html',
    'https://obiomacare.com/content/nclex-bow-tie-items.html',
    'https://obiomacare.com/content/nclex-cardiac-disorders.html',
    'https://obiomacare.com/content/nclex-maternity-study-guide.html',
    'https://obiomacare.com/content/nclex-mental-health-nursing.html',
    'https://obiomacare.com/content/nclex-respiratory-disorders.html',
    'https://obiomacare.com/content/nclex-gi-disorders.html',
    'https://obiomacare.com/content/nclex-renal-disorders.html',
    'https://obiomacare.com/content/nclex-endocrine-disorders.html',
    'https://obiomacare.com/content/nclex-neurological-disorders.html',
    'https://obiomacare.com/content/nclex-pediatrics-study-guide.html',
    'https://obiomacare.com/content/nclex-infection-control-precautions.html',
    'https://obiomacare.com/content/nclex-wound-care-pressure-injuries.html',
    'https://obiomacare.com/content/nclex-emergency-drugs.html',
    'https://obiomacare.com/content/nclex-nutrition-therapeutic-diets.html'
  ];

  for (const url of urlsToSubmit) {
    try {
      await indexing.urlNotifications.publish({
        requestBody: {
          url: url,
          type: 'URL_UPDATED'
        }
      });
      results.submitted++;
      results.urlsSubmitted.push({ url, status: 'success' });
      process.stdout.write('.');
    } catch (err) {
      results.errors++;
      results.urlsSubmitted.push({ url, status: 'error', error: err.message });
      process.stdout.write('x');
    }
    // Rate limit: max 200 requests per minute
    await new Promise(r => setTimeout(r, 300));
  }
  console.log(`\n✅ Submitted ${results.submitted} URLs, ${results.errors} errors`);

  // Store results in Firestore
  await storeDocument('gsc_submissions', `run_${runId}`, {
    runId,
    siteUrl: SITE_URL,
    sitemapUrl: SITEMAP_URL,
    ...results,
    timestamp: new Date().toISOString()
  });
  await storeLog('gsc-auto-submit', results.errors === 0 ? 'success' : 'partial', results);
  console.log('\n💾 Results stored in Firestore');
  console.log('\n🏁 Done!');
}

main().catch(async err => {
  console.error('❌ Fatal error:', err.message);
  await storeLog('gsc-auto-submit', 'failed', { error: err.message });
  process.exit(1);
});
