const fs = require('fs');
const path = require('path');
const { storeLog, storeDocument } = require('../lib/firestore-helper');

const API_KEY = 'pos_80nVwWb8TIdMFTDV3Q8Z0Wpzu61bGiUy8iADDCMB';
const API_URL = 'https://api.postiz.com';
const BASE_DIR = '/root/.openclaw/workspace/obioma-care/content-nursing/media';

const INTEGRATIONS = {
  'instagram_posts': 'cmrrmzsu20dg4qj0ym3m4eskv',
  'tiktok_scripts': 'cmrrmrnsz0dj4pc0yzrtdgo2q'
};

const MEDIA_MAP = {
  '2026-08-02T12:00': { platform: 'instagram_posts', file: 'instagram-images/aug-02.png' },
  '2026-08-04T18:00': { platform: 'instagram_posts', file: 'instagram-images/aug-04.png' },
  '2026-08-06T15:00': { platform: 'instagram_posts', file: 'instagram-images/aug-06.png' },
  '2026-08-08T11:00': { platform: 'instagram_posts', file: 'instagram-images/aug-08.png' },
  '2026-08-10T19:00': { platform: 'instagram_posts', file: 'instagram-images/aug-10.png' },
  '2026-08-12T14:00': { platform: 'instagram_posts', file: 'instagram-images/aug-12.png' },
  '2026-08-03T10:00': { platform: 'tiktok_scripts', file: 'tiktok-videos/aug-03.mp4' },
  '2026-08-05T16:00': { platform: 'tiktok_scripts', file: 'tiktok-videos/aug-05.mp4' },
  '2026-08-07T20:00': { platform: 'tiktok_scripts', file: 'tiktok-videos/aug-07.mp4' },
  '2026-08-09T14:00': { platform: 'tiktok_scripts', file: 'tiktok-videos/aug-09.mp4' },
  '2026-08-11T11:00': { platform: 'tiktok_scripts', file: 'tiktok-videos/aug-11.mp4' }
};

async function uploadFile(filePath) {
  const fullPath = path.join(BASE_DIR, filePath);
  const buffer = fs.readFileSync(fullPath);
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName).toLowerCase();
  const mimeType = ext === '.png' ? 'image/png' : ext === '.mp4' ? 'video/mp4' : 'application/octet-stream';

  const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ]);

  const response = await fetch(`${API_URL}/public/v1/upload`, {
    method: 'POST',
    headers: {
      'Authorization': API_KEY,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Upload failed: ${response.status} ${text}`);
  }

  return await response.json();
}

async function schedulePost(post, media) {
  const integrationId = INTEGRATIONS[post.platform];
  const dateStr = `${post.date}T${post.time}:00Z`;

  const settings = post.platform === 'instagram_posts'
    ? { post_type: 'post' }
    : {
        privacy_level: 'PUBLIC_TO_EVERYONE',
        duet: false,
        stitch: false,
        comment: true,
        autoAddMusic: 'no',
        brand_content_toggle: false,
        brand_organic_toggle: false,
        content_posting_method: 'DIRECT_POST'
      };

  const payload = {
    type: 'schedule',
    creationMethod: 'API',
    date: dateStr,
    shortLink: true,
    tags: [],
    posts: [{
      integration: { id: integrationId },
      value: [{
        content: post.content,
        image: [{
          id: media.id,
          path: media.path
        }],
        delay: 0
      }],
      settings: settings
    }]
  };

  const response = await fetch(`${API_URL}/public/v1/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': API_KEY
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Schedule failed: ${response.status} ${text}`);
  }

  return await response.json();
}

async function main() {
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const schedulePath = path.join(__dirname, 'social-schedule.json');
  const posts = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));

  const today = new Date().toISOString().split('T')[0];
  const postsToUpload = posts.filter(p => {
    const key = `${p.date}T${p.time}`;
    return MEDIA_MAP[key] && p.date >= today;
  });

  console.log(`Found ${postsToUpload.length} posts with media to upload & schedule\n`);

  let success = 0;
  let failed = 0;
  const results = [];

  for (const post of postsToUpload) {
    const key = `${post.date}T${post.time}`;
    const mediaInfo = MEDIA_MAP[key];

    console.log(`\n📤 ${post.platform} on ${post.date} ${post.time}`);
    console.log(`   File: ${mediaInfo.file}`);

    try {
      process.stdout.write('   Uploading... ');
      const uploaded = await uploadFile(mediaInfo.file);
      console.log(`✅ ${uploaded.id}`);

      process.stdout.write('   Scheduling... ');
      const result = await schedulePost(post, uploaded);
      console.log(`✅ ${result.id || 'scheduled'}`);
      
      success++;
      results.push({
        platform: post.platform,
        date: post.date,
        time: post.time,
        mediaFile: mediaInfo.file,
        mediaId: uploaded.id,
        postId: result.id,
        status: 'success'
      });
      
      // Store successful upload in Firestore
      await storeDocument('media_uploads', `upload_${post.date}_${post.platform}_${post.time}`, {
        platform: post.platform,
        date: post.date,
        time: post.time,
        mediaFile: mediaInfo.file,
        mediaId: uploaded.id,
        postId: result.id,
        status: 'success',
        uploadedAt: new Date().toISOString()
      });
    } catch (err) {
      console.log(`❌ ${err.message.substring(0, 200)}`);
      failed++;
      results.push({
        platform: post.platform,
        date: post.date,
        time: post.time,
        mediaFile: mediaInfo.file,
        status: 'failed',
        error: err.message
      });
      
      // Store failed upload in Firestore
      await storeDocument('media_uploads', `upload_${post.date}_${post.platform}_${post.time}`, {
        platform: post.platform,
        date: post.date,
        time: post.time,
        mediaFile: mediaInfo.file,
        status: 'failed',
        error: err.message,
        attemptedAt: new Date().toISOString()
      });
    }

    await new Promise(r => setTimeout(r, 800));
  }

  // Store run summary
  const summary = { runId, total: postsToUpload.length, success, failed, date: today, results };
  await storeLog('upload-media', failed === 0 ? 'success' : 'partial', summary);
  await storeDocument('media_upload_runs', `run_${runId}`, summary);

  console.log(`\n🏁 Done: ${success} uploaded & scheduled, ${failed} failed`);
  console.log('💾 Results stored in Firestore');
}

main().catch(async err => {
  console.error(err);
  await storeLog('upload-media', 'failed', { error: err.message });
  process.exit(1);
});
