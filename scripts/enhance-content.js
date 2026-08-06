#!/usr/bin/env node
/**
 * Add breadcrumbs and enhanced related articles to content pages
 */
const fs = require('fs');
const path = require('path');

const CONTENT_DIRS = ['content', 'landing/content'];

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

function getAllContentFiles() {
  const files = [];
  for (const dir of CONTENT_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const entries = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
    for (const f of entries) {
      files.push({ dir, file: f });
    }
  }
  return files;
}

function generateRelatedArticles(currentFile, allFiles) {
  const others = allFiles
    .filter(f => f.file !== currentFile)
    .sort(() => 0.5 - Math.random())
    .slice(0, 6);

  let html = '<h2>Related Articles</h2>\n<ul>\n';
  for (const { dir, file } of others) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    const title = getTitle(content);
    html += `  <li><a href="/content/${file}" style="color:var(--coral);">${title}</a></li>\n`;
  }
  html += '</ul>\n';
  return html;
}

function processFile(dir, filename, allFiles) {
  const filepath = path.join(dir, filename);
  let content = fs.readFileSync(filepath, 'utf8');

  // Skip if already has breadcrumb
  if (content.includes('aria-label="breadcrumb"')) {
    console.log(`  ⏭️  Skipped: ${dir}/${filename}`);
    return false;
  }

  const title = getTitle(content);

  // Add breadcrumb after header
  const breadcrumb = generateBreadcrumb(filename, title);
  content = content.replace(
    '</header>',
    '</header>' + breadcrumb
  );

  // Replace existing Related Articles section or add before footer
  const relatedSection = generateRelatedArticles(filename, allFiles);
  if (content.includes('<h2>Related Articles</h2>')) {
    content = content.replace(
      /<h2>Related Articles<\/h2>[\s\S]*?<\/ul>/,
      relatedSection.trim()
    );
  } else {
    content = content.replace(
      '<footer>',
      relatedSection + '<footer>'
    );
  }

  fs.writeFileSync(filepath, content);
  console.log(`  ✅ Updated: ${dir}/${filename}`);
  return true;
}

// Main
const allFiles = getAllContentFiles();
console.log(`Found ${allFiles.length} content pages across ${CONTENT_DIRS.length} directories\n`);

let updated = 0;
let skipped = 0;
for (const { dir, file } of allFiles) {
  if (processFile(dir, file, allFiles)) {
    updated++;
  } else {
    skipped++;
  }
}

console.log(`\n✅ Done: ${updated} updated, ${skipped} skipped`);
