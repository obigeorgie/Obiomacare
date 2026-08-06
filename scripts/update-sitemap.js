const fs = require('fs');
const path = require('path');
const baseUrl = 'https://obiomacare.com';

let urls = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/free-nclex-checklist.html', priority: '0.9', changefreq: 'monthly' },
  { loc: '/neuro-cheat-sheet.html', priority: '0.9', changefreq: 'monthly' },
  { loc: '/privacy.html', priority: '0.3', changefreq: 'yearly' },
];

// Collect all content files from both directories
const contentDirs = ['content', 'landing/content'];
const allFiles = new Set();

for (const dir of contentDirs) {
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  for (const f of files) {
    allFiles.add(f);
  }
}

for (const file of Array.from(allFiles).sort()) {
  urls.push({ loc: '/content/' + file, priority: '0.8', changefreq: 'monthly' });
}

const today = new Date().toISOString().split('T')[0];
let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
for (const url of urls) {
  xml += '  <url>\n    <loc>' + baseUrl + url.loc + '</loc>\n    <lastmod>' + today + '</lastmod>\n    <changefreq>' + url.changefreq + '</changefreq>\n    <priority>' + url.priority + '</priority>\n  </url>\n';
}
xml += '</urlset>\n';
fs.writeFileSync('public/sitemap.xml', xml);
console.log('Sitemap: ' + urls.length + ' URLs');
