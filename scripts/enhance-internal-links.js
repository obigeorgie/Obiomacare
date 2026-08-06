const fs = require('fs');
const path = require('path');

// Topic mapping: filename keywords → related content files
const topicMap = {
  'fundamentals': ['nclex-vital-signs-interpretation.html', 'nclex-infection-control-precautions.html', 'nclex-safety-infection-control.html', 'nclex-therapeutic-communication.html'],
  'vital-signs': ['nclex-nursing-fundamentals.html', 'nclex-nursing-fundamentals-master.html', 'nclex-abg-interpretation-guide.html'],
  'infection': ['nclex-nursing-fundamentals.html', 'nclex-nursing-fundamentals-master.html', 'nclex-antibiotics-infectious-diseases.html', 'nclex-wound-care-pressure-injuries.html'],
  'iv-therapy': ['nclex-fluids-electrolytes-deep-dive.html', 'nclex-drug-calculations-guide.html', 'nclex-emergency-drugs.html', 'nclex-mechanical-ventilation-ards.html'],
  'fluids': ['nclex-iv-therapy-calculations.html', 'nclex-dialysis-renal-replacement.html', 'nclex-renal-disorders.html', 'nclex-heart-failure-deep-dive.html'],
  'electrolytes': ['nclex-iv-therapy-calculations.html', 'nclex-renal-disorders.html', 'nclex-dialysis-renal-replacement.html'],
  'mechanical-ventilation': ['nclex-respiratory-disorders.html', 'nclex-copd-asthma-deep-dive.html', 'nclex-mechanical-ventilation-ards.html', 'nclex-abg-interpretation-guide.html', 'nclex-emergency-drugs.html'],
  'trauma': ['nclex-emergency-trauma-triage.html', 'nclex-burns-wound-care-deep-dive.html', 'nclex-burns-integumentary-disorders.html', 'nclex-musculoskeletal-disorders-deep-dive.html', 'nclex-emergency-drugs.html'],
  'cardiac': ['nclex-heart-failure-deep-dive.html', 'nclex-cardiac-devices-cath-lab.html', 'nclex-emergency-drugs.html', 'nclex-abg-interpretation-guide.html'],
  'heart-failure': ['nclex-cardiac-disorders.html', 'nclex-cardiac-devices-cath-lab.html', 'nclex-fluids-electrolytes-deep-dive.html', 'nclex-mechanical-ventilation-ards.html'],
  'respiratory': ['nclex-copd-asthma-deep-dive.html', 'nclex-mechanical-ventilation-ards.html', 'nclex-mechanical-ventilation-modes.html', 'nclex-abg-interpretation-guide.html', 'nclex-emergency-drugs.html'],
  'copd': ['nclex-respiratory-disorders.html', 'nclex-mechanical-ventilation-ards.html', 'nclex-mechanical-ventilation-modes.html', 'nclex-abg-interpretation-guide.html'],
  'gi': ['nclex-liver-pancreas-disorders.html', 'nclex-gi-surgery-ostomies-bariatric.html', 'nclex-nutrition-therapeutic-diets.html', 'nclex-pharmacology-drug-classes.html'],
  'liver': ['nclex-gi-disorders.html', 'nclex-gi-surgery-ostomies-bariatric.html', 'nclex-nutrition-therapeutic-diets.html', 'nclex-lab-values-memorization-guide.html'],
  'renal': ['nclex-dialysis-renal-replacement.html', 'nclex-fluids-electrolytes-deep-dive.html', 'nclex-iv-therapy-calculations.html', 'nclex-lab-values-memorization-guide.html'],
  'dialysis': ['nclex-renal-disorders.html', 'nclex-fluids-electrolytes-deep-dive.html', 'nclex-iv-therapy-calculations.html'],
  'endocrine': ['nclex-diabetes-thyroid-deep-dive.html', 'nclex-fluids-electrolytes-deep-dive.html', 'nclex-lab-values-memorization-guide.html', 'nclex-pharmacology-drug-classes.html'],
  'diabetes': ['nclex-endocrine-disorders.html', 'nclex-fluids-electrolytes-deep-dive.html', 'nclex-pharmacology-drug-classes.html', 'nclex-nutrition-therapeutic-diets.html'],
  'neuro': ['nclex-stroke-seizures-deep-dive.html', 'nclex-neurological-degenerative-deep-dive.html', 'nclex-mental-health-nursing.html', 'nclex-emergency-drugs.html'],
  'stroke': ['nclex-neurological-disorders.html', 'nclex-neurological-degenerative-deep-dive.html', 'nclex-rehabilitation-nursing.html', 'nclex-emergency-drugs.html'],
  'seizure': ['nclex-neurological-disorders.html', 'nclex-neurological-degenerative-deep-dive.html', 'nclex-emergency-drugs.html'],
  'musculo': ['nclex-musculoskeletal-disorders.html', 'nclex-musculoskeletal-disorders-deep-dive.html', 'nclex-orthopedic-surgery-joint-replacement.html', 'nclex-rehabilitation-nursing.html'],
  'burn': ['nclex-burns-integumentary-disorders.html', 'nclex-wound-care-pressure-injuries.html', 'nclex-emergency-trauma-triage.html', 'nclex-emergency-drugs.html'],
  'wound': ['nclex-burns-wound-care-deep-dive.html', 'nclex-burns-integumentary-disorders.html', 'nclex-infection-control-precautions.html'],
  'hematology': ['nclex-immune-disorders.html', 'nclex-oncology-nursing.html', 'nclex-lab-values-memorization-guide.html'],
  'sensory': ['nclex-gerontology-study-guide.html', 'nclex-diabetes-thyroid-deep-dive.html'],
  'maternity': ['nclex-obstetric-complications.html', 'nclex-newborn-complications-nicu.html', 'nclex-pediatrics-study-guide.html', 'nclex-pediatric-cardiac-congenital.html'],
  'obstetric': ['nclex-maternity-study-guide.html', 'nclex-newborn-complications-nicu.html', 'nclex-pediatrics-study-guide.html'],
  'newborn': ['nclex-maternity-study-guide.html', 'nclex-obstetric-complications.html', 'nclex-pediatrics-study-guide.html', 'nclex-pediatric-cardiac-congenital.html'],
  'pediatric': ['nclex-pediatric-cardiac-congenital.html', 'nclex-maternity-study-guide.html', 'nclex-pediatric-milestones-reference.html', 'nclex-growth-development.html'],
  'mental-health': ['nclex-psychiatric-medications.html', 'nclex-therapeutic-communication.html', 'nclex-cultural-competence-diversity.html', 'nclex-emergency-drugs.html'],
  'psychiatric': ['nclex-mental-health-nursing.html', 'nclex-therapeutic-communication.html', 'nclex-cultural-competence-diversity.html'],
  'therapeutic': ['nclex-mental-health-nursing.html', 'nclex-psychiatric-medications.html', 'nclex-cultural-competence-diversity.html'],
  'gerontology': ['nclex-dementia-alzheimers.html', 'nclex-palliative-care-hospice.html', 'nclex-sensory-disorders.html', 'nclex-pharmacology-drug-classes.html'],
  'oncology': ['nclex-oncology-pharmacology-advanced.html', 'nclex-immune-disorders.html', 'nclex-palliative-care-hospice.html', 'nclex-nutrition-therapeutic-diets.html'],
  'cancer': ['nclex-oncology-nursing.html', 'nclex-immune-disorders.html', 'nclex-palliative-care-hospice.html', 'nclex-nutrition-therapeutic-diets.html'],
  'immune': ['nclex-oncology-nursing.html', 'nclex-hematology-disorders.html', 'nclex-lab-values-memorization-guide.html'],
  'rehabilitation': ['nclex-stroke-seizures-deep-dive.html', 'nclex-musculoskeletal-disorders-deep-dive.html', 'nclex-orthopedic-surgery-joint-replacement.html', 'nclex-gerontology-study-guide.html'],
  'palliative': ['nclex-oncology-nursing.html', 'nclex-gerontology-study-guide.html', 'nclex-cultural-competence-diversity.html'],
  'genetics': ['nclex-pediatric-cardiac-congenital.html', 'nclex-oncology-nursing.html', 'nclex-immune-disorders.html'],
  'orthopedic': ['nclex-musculoskeletal-disorders-deep-dive.html', 'nclex-musculoskeletal-disorders.html', 'nclex-rehabilitation-nursing.html', 'nclex-emergency-drugs.html'],
  'emergency': ['nclex-trauma-nursing.html', 'nclex-emergency-trauma-triage.html', 'nclex-emergency-drugs.html', 'nclex-burns-wound-care-deep-dive.html'],
  'drugs': ['nclex-pharmacology-drug-classes.html', 'nclex-medication-suffixes.html', 'nclex-high-alert-medications.html', 'nclex-emergency-drugs.html'],
  'pharmacology': ['nclex-drug-calculations-guide.html', 'nclex-medication-suffixes.html', 'nclex-high-alert-medications.html', 'nclex-pharmacology-mnemonics.html'],
  'calculation': ['nclex-pharmacology-drug-classes.html', 'nclex-iv-therapy-calculations.html', 'nclex-lab-values-memorization-guide.html'],
  'lab': ['nclex-abg-interpretation-guide.html', 'nclex-fluids-electrolytes-deep-dive.html', 'nclex-pharmacology-drug-classes.html', 'nclex-cardiac-disorders.html'],
  'professional': ['nclex-leadership-management.html', 'nclex-cultural-competence-diversity.html', 'nclex-research-evidence-based-practice.html'],
  'leadership': ['nclex-professional-issues-ethics.html', 'nclex-delegation-assignment.html', 'nclex-prioritization-strategy.html'],
  'delegation': ['nclex-prioritization-strategy.html', 'nclex-leadership-management.html', 'nclex-professional-issues-ethics.html'],
  'prioritization': ['nclex-delegation-assignment.html', 'nclex-clinical-judgment-framework.html', 'nclex-sata-questions-strategy.html'],
  'sata': ['nclex-prioritization-strategy.html', 'nclex-clinical-judgment-framework.html', 'nclex-bow-tie-items.html'],
  'bow-tie': ['nclex-sata-questions-strategy.html', 'nclex-ngn-case-studies.html', 'nclex-clinical-judgment-framework.html'],
  'community': ['nclex-cultural-competence-diversity.html', 'nclex-professional-issues-ethics.html'],
  'nutrition': ['nclex-gi-disorders.html', 'nclex-liver-pancreas-disorders.html', 'nclex-diabetes-thyroid-deep-dive.html', 'nclex-oncology-nursing.html'],
  'perioperative': ['nclex-cardiac-devices-cath-lab.html', 'nclex-orthopedic-surgery-joint-replacement.html', 'nclex-infection-control-precautions.html', 'nclex-emergency-drugs.html'],
};

const contentDir = 'content';
const files = fs.readdirSync(contentDir).filter(f => f.endsWith('.html') && f !== 'index.html');

let updated = 0;

for (const file of files) {
  const filepath = path.join(contentDir, file);
  let content = fs.readFileSync(filepath, 'utf8');
  
  // Skip if no Related Articles section
  if (!content.includes('Related Articles')) continue;
  
  const base = file.replace('.html', '');
  
  // Find matching topics for this file
  let related = [];
  for (const [topic, links] of Object.entries(topicMap)) {
    if (base.includes(topic)) {
      related.push(...links);
    }
  }
  
  // Deduplicate and filter out self
  related = [...new Set(related)].filter(f => f !== file);
  
  // Limit to 5 related articles
  related = related.slice(0, 5);
  
  if (related.length === 0) continue;
  
  // Build new Related Articles HTML
  let relatedHtml = '<h2>Related Articles</h2>\n<ul>\n';
  for (const rel of related) {
    // Extract a title from the filename
    const title = rel.replace('.html', '').replace(/-/g, ' ').replace(/nclex /g, '').replace(/\b\w/g, c => c.toUpperCase());
    relatedHtml += `<li><a href="/content/${rel}" style="color:var(--coral);">${title}</a></li>\n`;
  }
  relatedHtml += '</ul>';
  
  // Replace existing Related Articles section
  const regex = /<h2>Related Articles<\/h2>[\s\S]*?<\/ul>/;
  if (regex.test(content)) {
    content = content.replace(regex, relatedHtml);
    fs.writeFileSync(filepath, content);
    updated++;
  }
}

console.log(`Updated Related Articles on ${updated} pages`);
