#!/usr/bin/env node
/**
 * Push Obioma Care business docs to Firestore
 * Stores all text/markdown files as documents for easy querying
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

const serviceAccount = require('../firebase-service-account.json');

const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);
const ROOT = path.join(__dirname, '..');

async function syncCollection(collectionName, dirPath, options = {}) {
  console.log(`\n📂 Syncing ${collectionName}...`);

  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️ Directory not found: ${dirPath}`);
    return 0;
  }

  const files = walkDir(dirPath);
  const batch = db.batch();
  let count = 0;

  for (const file of files) {
    const relPath = path.relative(dirPath, file);
    const ext = path.extname(file).toLowerCase();
    const docId = relPath.replace(/[^a-zA-Z0-9]/g, '-').substring(0, 100);

    // Skip node_modules, .git, etc
    if (file.includes('node_modules') || file.includes('.git/')) continue;

    let content = null;
    let contentType = 'binary';

    if (['.md', '.txt', '.json', '.js', '.html', '.css'].includes(ext)) {
      content = fs.readFileSync(file, 'utf8');
      contentType = 'text';
    } else if (['.png', '.jpg', '.jpeg', '.gif', '.pdf', '.mp4', '.wav'].includes(ext)) {
      content = `Binary file (${ext}) - ${fs.statSync(file).size} bytes`;
      contentType = 'binary';
    }

    const docRef = db.collection(collectionName).doc(docId);
    batch.set(docRef, {
      filename: path.basename(file),
      path: relPath,
      content: content,
      contentType: contentType,
      size: fs.statSync(file).size,
      modified: fs.statSync(file).mtime.toISOString(),
      syncedAt: new Date().toISOString()
    });

    count++;

    // Firestore batch limit is 500
    if (count % 450 === 0) {
      await batch.commit();
      console.log(`  Committed ${count} docs...`);
    }
  }

  await batch.commit();
  console.log(`✅ Synced ${count} files to ${collectionName}`);
  return count;
}

function walkDir(dir) {
  const results = [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...walkDir(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

async function syncLeads() {
  console.log('\n📊 Syncing leads...');

  const leadsPath = path.join(ROOT, 'leads', 'nursing-leads-master.md');
  if (!fs.existsSync(leadsPath)) {
    console.log('⚠️ No leads file found');
    return;
  }

  const content = fs.readFileSync(leadsPath, 'utf8');
  const docRef = db.collection('documents').doc('nursing-leads-master');
  await docRef.set({
    filename: 'nursing-leads-master.md',
    collection: 'leads',
    content: content,
    contentType: 'markdown',
    syncedAt: new Date().toISOString()
  });

  console.log('✅ Leads document synced');
}

async function syncOutreachTemplates() {
  console.log('\n📧 Syncing outreach templates...');

  const templatesPath = path.join(ROOT, 'leads', 'outreach-templates.md');
  if (!fs.existsSync(templatesPath)) {
    console.log('⚠️ No templates file found');
    return;
  }

  const content = fs.readFileSync(templatesPath, 'utf8');
  const docRef = db.collection('documents').doc('outreach-templates');
  await docRef.set({
    filename: 'outreach-templates.md',
    collection: 'leads',
    content: content,
    contentType: 'markdown',
    syncedAt: new Date().toISOString()
  });

  console.log('✅ Outreach templates synced');
}

async function main() {
  console.log('🔥 Obioma Care → Firestore Backup');
  console.log('=====================================\n');

  const dirs = [
    { name: 'content', path: path.join(ROOT, 'content-nursing') },
    { name: 'products', path: path.join(ROOT, 'products') },
    { name: 'marketing', path: path.join(ROOT, 'marketing') },
    { name: 'email_funnel', path: path.join(ROOT, 'email-funnel') },
    { name: 'landing', path: path.join(ROOT, 'landing') },
    { name: 'public', path: path.join(ROOT, 'public') }
  ];

  let total = 0;
  for (const dir of dirs) {
    total += await syncCollection(dir.name, dir.path);
  }

  await syncLeads();
  await syncOutreachTemplates();

  console.log(`\n✅ All done! Total documents: ${total + 2}`);
  console.log('Access at: https://console.firebase.google.com/project/kindred-x5pbk/firestore');

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
