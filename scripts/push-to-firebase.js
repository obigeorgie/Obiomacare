#!/usr/bin/env node
/**
 * Push Obioma Care business docs to Firebase
 * - Uploads content/PDFs to Firebase Storage
 * - Uploads leads to Firestore
 * - Backs up marketing content
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getStorage } = require('firebase-admin/storage');
const fs = require('fs');
const path = require('path');

// Initialize Firebase
const serviceAccount = require('../firebase-service-account.json');

const app = initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'kindred-x5pbk.appspot.com'
});

const db = getFirestore(app);
const storage = getStorage(app);
const bucket = storage.bucket();

const ROOT = path.join(__dirname, '..');

async function uploadFile(localPath, destination) {
  try {
    await bucket.upload(localPath, {
      destination,
      metadata: {
        contentType: getContentType(localPath),
        metadata: {
          uploadedAt: new Date().toISOString(),
          source: 'obioma-care-backup'
        }
      }
    });
    console.log(`✅ Uploaded: ${destination}`);
    return true;
  } catch (err) {
    console.error(`❌ Failed: ${destination} — ${err.message}`);
    return false;
  }
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.pdf': 'application/pdf',
    '.html': 'text/html',
    '.md': 'text/markdown',
    '.json': 'application/json',
    '.txt': 'text/plain',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg'
  };
  return types[ext] || 'application/octet-stream';
}

async function uploadDirectory(localDir, storagePrefix) {
  const files = fs.readdirSync(localDir);
  for (const file of files) {
    const localPath = path.join(localDir, file);
    const stat = fs.statSync(localPath);
    if (stat.isDirectory()) {
      await uploadDirectory(localPath, `${storagePrefix}/${file}`);
    } else {
      await uploadFile(localPath, `${storagePrefix}/${file}`);
    }
  }
}

async function syncLeadsToFirestore() {
  console.log('\n📊 Syncing leads to Firestore...');

  const leadsPath = path.join(ROOT, 'leads', 'nursing-leads-master.md');
  if (!fs.existsSync(leadsPath)) {
    console.log('⚠️ No leads file found');
    return;
  }

  const leadsContent = fs.readFileSync(leadsPath, 'utf8');
  const leads = parseLeadsFromMarkdown(leadsContent);

  const batch = db.batch();
  const collection = db.collection('leads');

  for (const lead of leads) {
    const docRef = collection.doc(lead.id);
    batch.set(docRef, {
      ...lead,
      syncedAt: new Date().toISOString()
    }, { merge: true });
  }

  await batch.commit();
  console.log(`✅ Synced ${leads.length} leads to Firestore`);
}

function parseLeadsFromMarkdown(content) {
  const leads = [];
  const sections = content.split(/### \d+\. /);

  for (const section of sections) {
    const nameMatch = section.match(/^([^\n]+)/);
    const emailMatch = section.match(/\*\*Email:\*\*\s*(.+)/);
    const socialMatch = section.match(/\*\*Social:\*\*\s*(.+)/);
    const focusMatch = section.match(/\*\*Focus:\*\*\s*(.+)/);
    const priorityMatch = section.match(/\*\*Priority:\*\*\s*(.+)/);
    const youtubeMatch = section.match(/\*\*YouTube:\*\*\s*(.+)/);
    const websiteMatch = section.match(/\*\*Website:\*\*\s*(.+)/);

    if (nameMatch && nameMatch[1].trim() && nameMatch[1].trim() !== '') {
      const name = nameMatch[1].trim();
      leads.push({
        id: name.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50),
        name: name,
        email: emailMatch ? emailMatch[1].trim() : null,
        social: socialMatch ? socialMatch[1].trim() : null,
        focus: focusMatch ? focusMatch[1].trim() : null,
        priority: priorityMatch ? priorityMatch[1].trim() : null,
        youtube: youtubeMatch ? youtubeMatch[1].trim() : null,
        website: websiteMatch ? websiteMatch[1].trim() : null,
        rawText: section.substring(0, 2000)
      });
    }
  }

  return leads;
}

async function syncSubscribersToFirestore() {
  console.log('\n👥 Syncing subscribers to Firestore...');

  const subsPath = path.join(ROOT, 'subscribers.json');
  if (!fs.existsSync(subsPath)) {
    console.log('⚠️ No subscribers.json found');
    return;
  }

  const subs = JSON.parse(fs.readFileSync(subsPath, 'utf8'));
  const batch = db.batch();
  const collection = db.collection('subscribers');

  for (const sub of subs) {
    const docId = sub.email.replace(/[^a-z0-9]/g, '-');
    const docRef = collection.doc(docId);
    batch.set(docRef, {
      ...sub,
      syncedAt: new Date().toISOString()
    }, { merge: true });
  }

  await batch.commit();
  console.log(`✅ Synced ${subs.length} subscribers to Firestore`);
}

async function createBackupManifest() {
  console.log('\n📝 Creating backup manifest...');

  const manifest = {
    project: 'kindred-x5pbk',
    backupDate: new Date().toISOString(),
    files: []
  };

  const dirsToBackup = [
    'content-nursing',
    'leads',
    'marketing',
    'products',
    'email-funnel',
    'landing',
    'public'
  ];

  for (const dir of dirsToBackup) {
    const dirPath = path.join(ROOT, dir);
    if (fs.existsSync(dirPath)) {
      const files = walkDir(dirPath);
      for (const file of files) {
        manifest.files.push({
          localPath: file,
          storagePath: `backups/obioma-care/${dir}/${path.relative(dirPath, file)}`,
          size: fs.statSync(file).size,
          modified: fs.statSync(file).mtime.toISOString()
        });
      }
    }
  }

  const manifestPath = path.join(ROOT, 'firebase-backup-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  await uploadFile(manifestPath, 'backups/obioma-care/manifest.json');
  console.log(`✅ Manifest created with ${manifest.files.length} files`);
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

async function main() {
  console.log('🔥 Obioma Care → Firebase Backup');
  console.log('=====================================\n');

  // 1. Upload content to Storage
  console.log('📦 Uploading content to Firebase Storage...');
  if (fs.existsSync(path.join(ROOT, 'content-nursing'))) {
    await uploadDirectory(path.join(ROOT, 'content-nursing'), 'obioma-care/content-nursing');
  }
  if (fs.existsSync(path.join(ROOT, 'products'))) {
    await uploadDirectory(path.join(ROOT, 'products'), 'obioma-care/products');
  }
  if (fs.existsSync(path.join(ROOT, 'leads'))) {
    await uploadDirectory(path.join(ROOT, 'leads'), 'obioma-care/leads');
  }
  if (fs.existsSync(path.join(ROOT, 'marketing'))) {
    await uploadDirectory(path.join(ROOT, 'marketing'), 'obioma-care/marketing');
  }
  if (fs.existsSync(path.join(ROOT, 'email-funnel'))) {
    await uploadDirectory(path.join(ROOT, 'email-funnel'), 'obioma-care/email-funnel');
  }

  // 2. Sync leads to Firestore
  await syncLeadsToFirestore();

  // 3. Sync subscribers to Firestore
  await syncSubscribersToFirestore();

  // 4. Create backup manifest
  await createBackupManifest();

  console.log('\n✅ All done! Access your files at:');
  console.log('   Firestore: https://console.firebase.google.com/project/kindred-x5pbk/firestore');
  console.log('   Storage: https://console.firebase.google.com/project/kindred-x5pbk/storage');

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
