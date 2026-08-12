#!/usr/bin/env node
/**
 * Render NCLEX Trap videos from JSON scripts
 * Usage: node render-trap.js --script scripts/trap-001-potassium.json --out out/
 */

const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

const args = process.argv.slice(2);
const scriptFlag = args.indexOf('--script');
const outFlag = args.indexOf('--out');

if (scriptFlag === -1) {
  console.error('Usage: node render-trap.js --script <path-to-json> --out <output-dir>');
  process.exit(1);
}

const scriptPath = args[scriptFlag + 1];
const outDir = outFlag !== -1 ? args[outFlag + 1] : 'out';

// Load script
const script = JSON.parse(fs.readFileSync(scriptPath, 'utf-8'));

// Validate
if (script.reviewStatus !== 'approved') {
  console.error(`❌ Build failed: Script "${script.id}" is not approved (status: ${script.reviewStatus})`);
  process.exit(1);
}

console.log(`✅ Script approved: ${script.id}`);
console.log(`🎬 Rendering: ${script.title}`);

// Ensure output dir
fs.mkdirSync(outDir, {recursive: true});

const outputFile = path.join(outDir, `${script.id}.mp4`);

// Render using remotion
const cmd = `npx remotion render src/index.ts NclexTrap "${outputFile}" --props='${JSON.stringify({
  scriptId: script.id,
  hook: script.hook,
  scenario: script.scenario,
  answer: script.answer,
  payoff: script.payoff,
  cta: script.cta,
})}' --log=verbose`;

console.log(`Running: ${cmd}`);

try {
  execSync(cmd, {stdio: 'inherit', cwd: __dirname});
  console.log(`✅ Rendered: ${outputFile}`);
  
  // Log to ledger
  const ledgerPath = path.join(__dirname, 'LEDGER.md');
  const ledger = fs.readFileSync(ledgerPath, 'utf-8');
  const now = new Date().toISOString().split('T')[0];
  const newEntry = `| ${now} | ${script.id} | ${script.title} | 45s | Manual | Rendered |`;
  fs.writeFileSync(ledgerPath, ledger.replace('| Date |', `| Date |\n| ${now} | ${script.id} | ${script.title} | 45s | ~$0.50 | Rendered |`));
  
} catch (err) {
  console.error('❌ Render failed:', err.message);
  process.exit(1);
}
