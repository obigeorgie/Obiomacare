#!/usr/bin/env node
/**
 * Thorough Light Theme Migration for index.html
 * Handles all edge cases: body bg, gradients, rgba variations, text colors
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'landing', 'index.html');
let content = fs.readFileSync(FILE, 'utf-8');

// ─── BODY & BACKGROUND ───
content = content.replace(
  /body\s*\{\s*font-family:\s*'Inter',\s*sans-serif;\s*line-height:\s*1\.6;\s*color:\s*var\(--text-primary\);\s*background:\s*var\(--navy-900\);\s*overflow-x:\s*hidden;\s*\}/,
  `body { 
            font-family: 'Inter', sans-serif; 
            line-height: 1.6; 
            color: var(--color-text-primary); 
            background: var(--color-bg); 
            overflow-x: hidden;
        }`
);

// Fix gradient-bg
content = content.replace(
  /\.gradient-bg\s*\{[^}]*\}/s,
  `.gradient-bg {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
            background: 
                radial-gradient(ellipse at 20% 20%, var(--color-coral-5) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 80%, rgba(148, 163, 184, 0.1) 0%, transparent 50%),
                var(--color-bg);
        }`
);

// ─── PARTICLES ───
content = content.replace(
  /background:\s*var\(--coral\);/,
  `background: var(--color-coral);`
);

// ─── NAV ───
content = content.replace(
  /\.nav\s*\{[^}]*display:\s*flex[^}]*\}/s,
  `.nav { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            padding: 20px 0;
        }`
);

// Fix nav-link color
content = content.replace(
  /\.nav-link\s*\{[^}]*color:\s*var\(--text-secondary\)[^}]*\}/s,
  `.nav-link { 
            color: var(--color-text-secondary); 
            text-decoration: none; 
            font-weight: 500; 
            font-size: 15px; 
            transition: all 0.3s;
        }`
);

// ─── HERO ───
content = content.replace(
  /\.hero\s*\{[^}]*padding:[^}]*\}/s,
  `.hero { 
            padding: 120px 0 80px; 
            text-align: center; 
            position: relative;
        }`
);

// ─── SECTIONS ───
// Convert section-alt
content = content.replace(
  /\.section-alt\s*\{[^}]*background:\s*rgba\(15,\s*29,\s*50,\s*0\.5\)[^}]*\}/s,
  `.section-alt { background: var(--color-bg-secondary); }`
);

// ─── CARDS ───
// Problem cards
content = content.replace(
  /\.problem-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.03\)[^}]*\}/s,
  `.problem-card { 
            background: var(--color-bg-elevated); 
            border-radius: 16px; 
            padding: 32px; 
            border: 1px solid var(--color-border);
            transition: all 0.3s;
        }`
);

// Feature cards
content = content.replace(
  /\.feature\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.02\)[^}]*\}/s,
  `.feature { 
            text-align: center; 
            padding: 40px 32px;
            background: var(--color-bg-elevated);
            border-radius: 16px;
            border: 1px solid var(--color-border);
            transition: all 0.3s;
        }`
);

// Product card
content = content.replace(
  /\.product-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.02\)[^}]*\}/s,
  `.product-card { 
            background: var(--color-bg-elevated);
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid var(--color-border);
        }`
);

// ─── PRICING ───
content = content.replace(
  /\.pricing-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.03\)[^}]*\}/s,
  `.pricing-card { 
            background: var(--color-bg-elevated); 
            border-radius: 16px; 
            padding: 40px; 
            border: 1px solid var(--color-border);
            transition: all 0.3s;
        }`
);

content = content.replace(
  /\.pricing-card\.featured\s*\{[^}]*background:[^}]*\}/s,
  `.pricing-card.featured { 
            background: var(--color-bg-elevated); 
            border: 2px solid var(--color-coral);
            position: relative;
        }`
);

// ─── FAQ ───
content = content.replace(
  /\.faq-item\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.02\)[^}]*\}/s,
  `.faq-item { 
            background: var(--color-bg-elevated); 
            border-radius: 12px; 
            overflow: hidden;
            border: 1px solid var(--color-border);
        }`
);

// ─── BLOG CARDS ───
content = content.replace(
  /\.blog-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.02\)[^}]*\}/s,
  `.blog-card { 
            background: var(--color-bg-elevated); 
            border-radius: 16px; 
            overflow: hidden; 
            transition: all 0.3s;
            border: 1px solid var(--color-border);
        }`
);

// ─── STUDY GUIDE CARDS ───
content = content.replace(
  /\.guide-card\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.02\)[^}]*\}/s,
  `.guide-card { 
            background: var(--color-bg-elevated); 
            border-radius: 12px; 
            padding: 24px; 
            transition: all 0.3s;
            border: 1px solid var(--color-border);
        }`
);

// ─── COMPARISON TABLE ───
content = content.replace(
  /\.comparison-table\s*\{[^}]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.02\)[^}]*\}/s,
  `.comparison-table { 
            width: 100%; 
            border-collapse: collapse; 
            background: var(--color-bg-elevated);
            border-radius: 16px;
            overflow: hidden;
            border: 1px solid var(--color-border);
        }`
);

// ─── EMAIL CAPTURE ───
content = content.replace(
  /\.email-capture\s*\{[^}]*background:[^}]*\}/s,
  `.email-capture { 
            background: var(--color-bg-secondary); 
            border-radius: 20px; 
            padding: 60px 40px; 
            text-align: center;
            border: 1px solid var(--color-border);
        }`
);

// ─── FOOTER ───
content = content.replace(
  /footer\s*\{[^}]*background:[^}]*\}/s,
  `footer { 
            background: var(--color-bg-secondary); 
            color: var(--color-text-secondary); 
            padding: 48px 0 24px; 
            border-top: 1px solid var(--color-border);
        }`
);

// ─── BUTTONS ───
// Ghost button
content = content.replace(
  /\.btn-ghost\s*\{[^}]*border:\s*2px\s+solid\s+rgba\(255,\s*255,\s*255,\s*0\.1\)[^}]*\}/s,
  `.btn-ghost { 
            background: transparent; 
            color: var(--color-text-primary); 
            border: 2px solid var(--color-border-dark);
        }`
);

// ─── GLOBAL TEXT COLOR FIXES ───
// Fix any remaining dark-themed text references
content = content.replace(/color:\s*var\(--text-primary\)/g, 'color: var(--color-text-primary)');
content = content.replace(/color:\s*var\(--text-secondary\)/g, 'color: var(--color-text-secondary)');
content = content.replace(/color:\s*var\(--text-muted\)/g, 'color: var(--color-text-muted)');

// ─── HERO STAT NUMBER ───
content = content.replace(
  /\.hero-stat-number\s*\{[^}]*\}/s,
  `.hero-stat-number { 
            font-size: 36px; 
            font-weight: 800; 
            color: var(--color-coral); 
            line-height: 1;
        }`
);

content = content.replace(
  /\.hero-stat-label\s*\{[^}]*\}/s,
  `.hero-stat-label { 
            font-size: 13px; 
            color: var(--color-text-secondary); 
            margin-top: 4px;
        }`
);

// ─── SAVE ───
fs.writeFileSync(FILE, content, 'utf-8');
console.log('✅ landing/index.html thoroughly migrated to light theme');
