#!/usr/bin/env node
/**
 * Light Theme Migration for case-engine.html
 */

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, '..', 'public', 'case-engine.html');
let content = fs.readFileSync(FILE, 'utf-8');

// Replace dark color variables and body background
content = content.replace(
  /:root\s*\{[^}]*\}/s,
  `:root {
            --navy: #1e40af;
            --dark: #f8fafc;
            --obioma-red: #C53030;
            --obioma-coral: #FF6B5B;
            --success: #10b981;
            --warning: #f59e0b;
            --text: #0f172a;
            --text-secondary: #475569;
            --bg-card: #ffffff;
            --border: #e2e8f0;
        }`
);

// Body background
content = content.replace(
  /body\s*\{[^}]*background:\s*var\(--dark\)[^}]*\}/s,
  `body {
            font-family: 'Inter', sans-serif;
            background: #f8fafc;
            color: var(--text);
            min-height: 100vh;
            line-height: 1.6;
        }`
);

// Header gradient
content = content.replace(
  /header\s*\{[^}]*background:\s*linear-gradient\(135deg,\s*var\(--navy\)\s*0%,\s*var\(--dark\)\s*100%\)[^}]*\}/s,
  `header {
            background: linear-gradient(135deg, #1e40af 0%, #1e3a5f 100%);
            padding: 40px 0 32px;
            border-bottom: 2px solid var(--obioma-red);
        }`
);

// Logo text should stay white on dark header
content = content.replace(
  /\.logo-text\s*\{[^}]*color:\s*white[^}]*\}/s,
  `.logo-text { font-size: 1.25rem; font-weight: 800; color: white; }`
);

// Scenario panel
content = content.replace(
  /\.scenario-panel\s*\{[^}]*background:\s*var\(--bg-card\)[^}]*\}/s,
  `.scenario-panel {
            background: #ffffff;
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 24px;
            margin: 24px 0;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }`
);

// Answer options
content = content.replace(
  /\.answer-option\s*\{[^}]*background:[^}]*\}/s,
  `.answer-option {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            padding: 16px;
            background: #ffffff;
            border: 2px solid var(--border);
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }`
);

// Answer option hover
content = content.replace(
  /\.answer-option:hover\s*\{[^}]*\}/s,
  `.answer-option:hover { 
            border-color: var(--obioma-coral); 
            background: #fff5f5;
        }`
);

// Answer option selected
content = content.replace(
  /\.answer-option\.selected\s*\{[^}]*\}/s,
  `.answer-option.selected { 
            border-color: var(--obioma-red); 
            background: #fff5f5;
        }`
);

// Answer option correct
content = content.replace(
  /\.answer-option\.correct\s*\{[^}]*\}/s,
  `.answer-option.correct { 
            border-color: var(--success); 
            background: #f0fdf4;
        }`
);

// Answer option incorrect
content = content.replace(
  /\.answer-option\.incorrect\s*\{[^}]*\}/s,
  `.answer-option.incorrect { 
            border-color: #ef4444; 
            background: #fef2f2;
        }`
);

// Rationale panel
content = content.replace(
  /\.rationale-panel\s*\{[^}]*\}/s,
  `.rationale-panel {
            background: #f0fdf4;
            border: 1px solid #86efac;
            border-radius: 12px;
            padding: 20px;
            margin-top: 16px;
        }`
);

// Footer
content = content.replace(
  /footer\s*\{[^}]*background:[^}]*\}/s,
  `footer {
            background: #f1f5f9;
            border-top: 1px solid var(--border);
            padding: 32px 0;
            margin-top: 48px;
        }`
);

// Tag/case card backgrounds
content = content.replace(
  /\.case-card\s*\{[^}]*background:[^}]*\}/s,
  `.case-card {
            background: #ffffff;
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 20px;
            transition: all 0.2s;
            cursor: pointer;
        }`
);

content = content.replace(
  /\.case-card:hover\s*\{[^}]*\}/s,
  `.case-card:hover {
            border-color: var(--obioma-coral);
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }`
);

// Difficulty tags
content = content.replace(
  /\.tag-easy\s*\{[^}]*\}/s,
  `.tag-easy { background: #f0fdf4; color: #166534; }`
);
content = content.replace(
  /\.tag-medium\s*\{[^}]*\}/s,
  `.tag-medium { background: #fffbeb; color: #92400e; }`
);
content = content.replace(
  /\.tag-hard\s*\{[^}]*\}/s,
  `.tag-hard { background: #fef2f2; color: #991b1b; }`
);

// Meta/difficulty text
content = content.replace(
  /\.case-meta\s*\{[^}]*color:[^}]*\}/s,
  `.case-meta { font-size: 0.85rem; color: var(--text-secondary); margin-top: 8px; }`
);

// Navigation buttons container
content = content.replace(
  /\.nav-buttons\s*\{[^}]*\}/s,
  `.nav-buttons { 
            display: flex; 
            justify-content: space-between; 
            margin-top: 32px; 
            padding-top: 24px;
            border-top: 1px solid var(--border);
        }`
);

// Check remaining dark patterns in inline styles
content = content.replace(/background:\s*#0a1628/g, 'background: #f8fafc');
content = content.replace(/background:\s*#0f1d32/g, 'background: #f1f5f9');
content = content.replace(/color:\s*#e2e8f0/g, 'color: #0f172a');
content = content.replace(/color:\s*#94a3b8/g, 'color: #475569');

// Save
fs.writeFileSync(FILE, content, 'utf-8');
console.log('✅ public/case-engine.html migrated to light theme');
