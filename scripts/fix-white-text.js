#!/usr/bin/env node
/**
 * Fix remaining hardcoded white text on light backgrounds
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'landing', 'index.html');
let content = fs.readFileSync(FILE, 'utf-8');

const replacements = [
  // 1. Logo text on light header
  {
    old: `.logo-text { 
            font-size: 24px; 
            font-weight: 800; 
            color: #fff;`,
    new: `.logo-text { 
            font-size: 24px; 
            font-weight: 800; 
            color: var(--color-text-primary);`
  },
  // 2. Hero visual card text
  {
    old: `.hero-visual-card-text {
            font-size: 14px;
            color: #fff;`,
    new: `.hero-visual-card-text {
            font-size: 14px;
            color: var(--color-text-primary);`
  },
  // 3. Problem card headings
  {
    old: `.problem-card h3 { 
            font-size: 18px; 
            font-weight: 700; 
            margin-bottom: 12px; 
            color: #fff;`,
    new: `.problem-card h3 { 
            font-size: 18px; 
            font-weight: 700; 
            margin-bottom: 12px; 
            color: var(--color-text-primary);`
  },
  // 4. Step headings
  {
    old: `.step h4 { 
            font-size: 15px; 
            font-weight: 700; 
            margin-bottom: 8px;
            color: #fff;`,
    new: `.step h4 { 
            font-size: 15px; 
            font-weight: 700; 
            margin-bottom: 8px;
            color: var(--color-text-primary);`
  },
  // 5. Feature headings
  {
    old: `.feature h3 { 
            font-size: 20px; 
            font-weight: 700; 
            margin-bottom: 12px;
            color: #fff;`,
    new: `.feature h3 { 
            font-size: 20px; 
            font-weight: 700; 
            margin-bottom: 12px;
            color: var(--color-text-primary);`
  },
  // 6. Comparison table highlight row
  {
    old: `.comparison-table .highlight-row td {
            background: var(--color-coral-5);
            color: #fff;`,
    new: `.comparison-table .highlight-row td {
            background: var(--color-coral-5);
            color: var(--color-text-primary);`
  },
  // 7. Testimonial name
  {
    old: `.testimonial-name { 
            font-weight: 700;
            color: #fff;`,
    new: `.testimonial-name { 
            font-weight: 700;
            color: var(--color-text-primary);`
  },
  // 8. FAQ card headings
  {
    old: `.faq-card h3 { 
            font-size: 17px; 
            font-weight: 700; 
            margin-bottom: 12px; 
            color: #fff;`,
    new: `.faq-card h3 { 
            font-size: 17px; 
            font-weight: 700; 
            margin-bottom: 12px; 
            color: var(--color-text-primary);`
  },
  // 9. Footer brand
  {
    old: `.footer-brand { 
            font-size: 24px; 
            font-weight: 800; 
            color: #fff;`,
    new: `.footer-brand { 
            font-size: 24px; 
            font-weight: 800; 
            color: var(--color-text-primary);`
  },
  // 10. Footer column headings
  {
    old: `.footer-col h4 { 
            color: #fff;`,
    new: `.footer-col h4 { 
            color: var(--color-text-primary);`
  },
  // 11. Star empty (for light bg)
  {
    old: `.star-empty {
            color: rgba(255,255,255,0.2);`,
    new: `.star-empty {
            color: var(--color-border);`
  },
  // 12. Inline style demo card text
  {
    old: `<div style="font-size: 15px; color: #fff; font-weight: 600; margin-bottom: 12px;">A 67-year-old male presents with crushing chest pain...`,
    new: `<div style="font-size: 15px; color: var(--color-text-primary); font-weight: 600; margin-bottom: 12px;">A 67-year-old male presents with crushing chest pain...`
  },
  // 13. Inline style "Student" label
  {
    old: `<div style="font-size: 13px; color: #fff; font-weight: 600;">Student`,
    new: `<div style="font-size: 13px; color: var(--color-text-primary); font-weight: 600;">Student`
  }
];

let changed = 0;
for (const r of replacements) {
  if (content.includes(r.old)) {
    content = content.replace(r.old, r.new);
    changed++;
  } else {
    console.log(`  ⚠️  Skipped (not found): ${r.old.slice(0, 50)}...`);
  }
}

fs.writeFileSync(FILE, content, 'utf-8');
console.log(`✅ Fixed ${changed} hardcoded white text instances`);
