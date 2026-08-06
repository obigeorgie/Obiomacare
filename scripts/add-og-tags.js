const fs = require('fs');
const path = require('path');

const contentDir = 'content';
const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.html') && f !== 'index.html');

let updated = 0;
let skipped = 0;

for (const file of files) {
  const filepath = path.join(contentDir, file);
  let html = fs.readFileSync(filepath, 'utf8');
  
  // Skip if OG tags already present
  if (html.includes('og:title')) {
    skipped++;
    continue;
  }
  
  // Extract title
  const titleMatch = html.match(/<title>([^<]*)<\/title>/);
  const title = titleMatch ? titleMatch[1].trim() : 'NCLEX Study Guide | Obioma Care';
  
  // Extract description
  const descMatch = html.match(/<meta name="description" content="([^"]*)"/);
  const description = descMatch ? descMatch[1].trim() : 'Free NCLEX study guide from Obioma Care.';
  
  // Extract datePublished from schema
  const dateMatch = html.match(/"datePublished":\s*"([^"]+)"/);
  const datePublished = dateMatch ? dateMatch[1] : '2026-08-07';
  
  // Build OG tags
  const ogTags = `
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:type" content="article">
<meta property="og:url" content="https://obiomacare.com/content/${file}">
<meta property="og:site_name" content="Obioma Care">
<meta property="article:published_time" content="${datePublished}">
<meta property="og:image" content="https://obiomacare.com/obioma-seo.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="https://obiomacare.com/obioma-seo.png">`;
  
  // Insert after the last meta tag before title, or before closing </head>
  // Find position: after the description meta tag or after charset meta
  const insertAfter = html.match(/<meta name="description"[^>]*>/) || html.match(/<meta charset="UTF-8">/);
  
  if (insertAfter) {
    const pos = html.indexOf(insertAfter[0]) + insertAfter[0].length;
    html = html.slice(0, pos) + ogTags + html.slice(pos);
    fs.writeFileSync(filepath, html);
    updated++;
  } else {
    // Fallback: insert before </head>
    html = html.replace('</head>', ogTags + '\n</head>');
    fs.writeFileSync(filepath, html);
    updated++;
  }
}

console.log(`Added OG tags to ${updated} pages, skipped ${skipped} (already had them)`);
