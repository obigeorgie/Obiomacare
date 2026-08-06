#!/usr/bin/env node
/**
 * Add breadcrumbs and enhanced related articles to content pages
 */
const fs = require('fs');
const path = require('path');

const CONTENT_DIR = 'public/content';

// Topic mappings for breadcrumbs
const topicMap = {
  'clinical-judgment': 'Clinical Judgment',
  'cardiac': 'Cardiac',
  'abg': 'ABG & Labs',
  'burns': 'Burns & Wounds',
  'diabetes': 'Endocrine',
  'respiratory': 'Respiratory',
  'neuro': 'Neurological',
  'gi': 'GI',
  'renal': 'Renal',
  'pediatric': 'Pediatrics',
  'maternity': 'Maternity',
  'pharmacology': 'Pharmacology',
  'priority': 'Prioritization',
  'delegation': 'Delegation',
  'sata': 'SATA',
  'lab-values': 'Lab Values',
  'study-plan': 'Study Plans',
  'anxiety': 'Test Prep',
  'fluids': 'Fluids & Electrolytes',
  'mental-health': 'Mental Health',
  'infection': 'Infection Control',
  'legal': 'Legal/Ethical',
  'leadership': 'Leadership',
  'nutrition': 'Nutrition',
  'safety': 'Safety',
  'fundamentals': 'Fundamentals',
  'immunology': 'Immunology',
  'musculoskeletal': 'Musculoskeletal',
  'integumentary': 'Integumentary',
  'oncology': 'Oncology',
  'hematology': 'Hematology',
  'sensory': 'Sensory',
  'reproductive': 'Reproductive',
  'cultural': 'Cultural',
  'communication': 'Communication',
  'emergency': 'Emergency',
  'perioperative': 'Perioperative',
  ' hospice': 'Hospice',
  'obioma-vs': 'Reviews',
  'why-nursing': 'Test Prep',
  '2-week': 'Study Plans',
  '30-day': 'Study Plans',
  'nursing-concepts': 'Fundamentals',
  'health-assessment': 'Assessment',
  'vital-signs': 'Assessment',
  'medication': 'Pharmacology',
  'drug': 'Pharmacology',
  'crna': 'Advanced Practice',
  'np': 'Advanced Practice',
  'lpn': 'LPN/LVN',
  'case-study': 'Case Studies',
  'practice': 'Practice',
  'review': 'Reviews',
  'guide': 'Study Guides',
  'checklist': 'Study Guides',
  'cheat-sheet': 'Study Guides',
};

function getTopic(filename) {
  const base = filename.replace('nclex-', '').replace(/\.html$/, '');
  for (const [key, topic] of Object.entries(topicMap)) {
    if (base.includes(key)) return topic;
  }
  return 'NCLEX Study Guide';
}

function getTitle(content) {
  const match = content.match(/<title>(.*?)<\/title>/);
  return match ? match[1].replace(' | Obioma Care', '').replace(' | Obioma', '') : 'Study Guide';
}

function generateBreadcrumb(filename, title) {
  const topic = getTopic(filename);
  return `
<!-- Breadcrumb Navigation -->
<nav aria-label="breadcrumb" style="padding:12px 0;font-size:14px;color:var(--text-muted);border-bottom:1px solid rgba(255,255,255,0.05);margin-bottom:24px;">
  <div class="container">
    <a href="/" style="color:var(--coral);text-decoration:none;">Home</a>
    <span style="margin:0 8px;">›</span>
    <a href="/content/nclex-clinical-judgment-framework.html" style="color:var(--coral);text-decoration:none;">${topic}</a>
    <span style="margin:0 8px;">›</span>
    <span style="color:var(--text-secondary);">${title}</span>
  </div>
</nav>
`;
}

function generateRelatedArticles(currentFile) {
  const allFiles = fs.readdirSync(CONTENT_DIR)
    .filter(f => f.endsWith('.html') && f !== currentFile)
    .sort(() => 0.5 - Math.random()) // shuffle
    .slice(0, 6);

  let html = '<h2>Related Articles</h2>\n<ul>\n';
  for (const file of allFiles) {
    const content = fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8');
    const title = getTitle(content);
    html += `  <li><a href="/content/${file}" style="color:var(--coral);">${title}</a></li>\n`;
  }
  html += '</ul>\n';
  return html;
}

function processFile(filename) {
  const filepath = path.join(CONTENT_DIR, filename);
  let content = fs.readFileSync(filepath, 'utf8');

  // Skip if already has breadcrumb
  if (content.includes('aria-label="breadcrumb"')) {
    console.log(`  ⏭️  Skipped (already has breadcrumb): ${filename}`);
    return;
  }

  const title = getTitle(content);

  // Add breadcrumb after header
  const breadcrumb = generateBreadcrumb(filename, title);
  content = content.replace(
    '</header>',
    '</header>' + breadcrumb
  );

  // Replace existing Related Articles section or add before footer
  const relatedSection = generateRelatedArticles(filename);
  if (content.includes('<h2>Related Articles</h2>')) {
    content = content.replace(
      /<h2>Related Articles<\/h2>[\s\S]*?<\/ul>/,
      relatedSection.trim()
    );
  } else {
    // Add before footer
    content = content.replace(
      '<footer>',
      relatedSection + '<footer>'
    );
  }

  fs.writeFileSync(filepath, content);
  console.log(`  ✅ Updated: ${filename}`);
}

// Main
const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.html'));
console.log(`Processing ${files.length} content pages...\n`);

let updated = 0;
let skipped = 0;
for (const file of files) {
  const filepath = path.join(CONTENT_DIR, file);
  const content = fs.readFileSync(filepath, 'utf8');
  if (content.includes('aria-label="breadcrumb"')) {
    skipped++;
  } else {
    processFile(file);
    updated++;
  }
}

console.log(`\n✅ Done: ${updated} updated, ${skipped} skipped`);
