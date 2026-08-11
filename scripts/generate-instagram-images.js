const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const templates = [
  'lab-context.html',
  'checklist.html',
  'case-engine.html',
  'mnemonics.html',
  'delegation.html',
  'priority.html',
  'before-after.html',
  'which-choose.html',
  'august-wrapup.html'
];

async function screenshot(template) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1080 });
  
  const filePath = path.join(__dirname, '..', 'instagram-templates', template);
  await page.goto('file://' + filePath, { waitUntil: 'networkidle0' });
  
  const outputName = template.replace('.html', '.png');
  await page.screenshot({
    path: path.join(__dirname, '..', 'instagram-images', outputName),
    fullPage: false,
    clip: { x: 0, y: 0, width: 1080, height: 1080 }
  });
  
  console.log(`✅ ${outputName}`);
  await browser.close();
}

async function main() {
  fs.mkdirSync(path.join(__dirname, '..', 'instagram-images'), { recursive: true });
  
  for (const template of templates) {
    await screenshot(template);
  }
  
  console.log('\n🏁 All 9 Instagram images generated!');
}

main().catch(console.error);
