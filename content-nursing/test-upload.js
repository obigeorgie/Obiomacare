const fs = require('fs');
const path = require('path');

const API_KEY = process.env.POSTIZ_API_KEY || ''; // owner-installed (rotated 2026-08-18; was hardcoded)
const API_URL = 'https://api.postiz.com';

const BASE_DIR = '/root/.openclaw/workspace/obioma-care/content-nursing/media';

async function testImageFormats() {
  // Try different image object formats
  const testFormats = [
    { image: [{ url: 'https://via.placeholder.com/1080x1080.png' }] },
    { image: [{ path: '/test.png' }] },
    { image: [{ id: 'test123' }] },
    { image: [{ externalUrl: 'https://via.placeholder.com/1080x1080.png' }] },
    { image: [{ link: 'https://via.placeholder.com/1080x1080.png' }] },
  ];

  for (const format of testFormats) {
    const payload = {
      type: 'now',
      creationMethod: 'API',
      date: new Date().toISOString(),
      shortLink: true,
      tags: [],
      posts: [{
        integration: { id: 'cmrrmzsu20dg4qj0ym3m4eskv' },
        value: [{
          content: 'Test post',
          image: format.image,
          delay: 0
        }],
        settings: { post_type: 'post' }
      }]
    };

    try {
      const response = await fetch(`${API_URL}/public/v1/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': API_KEY
        },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      console.log(`Format ${JSON.stringify(format.image[0])}: ${response.status} ${text.substring(0, 200)}`);
    } catch (err) {
      console.log(`Format ${JSON.stringify(format.image[0])}: ERROR ${err.message}`);
    }
  }
}

async function testUploadEndpoint() {
  // Try various upload endpoints
  const endpoints = [
    '/public/v1/upload',
    '/public/v1/media',
    '/public/v1/medias/upload',
    '/public/v1/posts/upload',
    '/public/v1/integrations/upload',
  ];

  const filePath = path.join(BASE_DIR, 'instagram-images/aug-04.png');
  const buffer = fs.readFileSync(filePath);

  for (const endpoint of endpoints) {
    const boundary = '----FormBoundary' + Math.random().toString(36).slice(2);
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.png"\r\nContent-Type: image/png\r\n\r\n`),
      buffer,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ]);

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': API_KEY,
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: body
      });

      const text = await response.text();
      console.log(`POST ${endpoint}: ${response.status} ${text.substring(0, 200)}`);
    } catch (err) {
      console.log(`POST ${endpoint}: ERROR ${err.message}`);
    }
  }
}

async function main() {
  console.log('=== Testing image formats ===');
  await testImageFormats();
  
  console.log('\n=== Testing upload endpoints ===');
  await testUploadEndpoint();
}

main().catch(console.error);
