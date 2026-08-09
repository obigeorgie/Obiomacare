#!/usr/bin/env node
/**
 * Hostinger Mail Webhook Setup
 * Creates a webhook that forwards emails to our /api/email-webhook endpoint
 */

const https = require('https');

const TOKEN = process.env.HOSTINGER_EMAIL_TOKEN || '6487fef9d27f863d37a93057731f61f0ceca019e227e92824e2eb082a5e3a95f';
const MAILBOX_ID = process.env.HOSTINGER_MAILBOX_ID; // You'll need this from Hostinger panel
const WEBHOOK_URL = 'https://obiomacare.com/api/email-webhook';

function apiRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.mail.hostinger.com',
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function main() {
  console.log('🔧 Hostinger Mail Webhook Setup\n');
  
  if (!MAILBOX_ID) {
    console.log('❌ HOSTINGER_MAILBOX_ID not set.');
    console.log('\nTo get your mailbox ID:');
    console.log('1. Log into https://mail.hostinger.com');
    console.log('2. Go to Settings → API or Developer');
    console.log('3. Copy the Mailbox Resource ID (looks like: AC1a2b3c4d5e6f7g)');
    console.log('\nThen run:');
    console.log('  export HOSTINGER_MAILBOX_ID=your-id-here');
    console.log('  node scripts/setup-hostinger-webhook.js');
    process.exit(1);
  }
  
  try {
    // List existing webhooks
    console.log('📋 Listing existing webhooks...');
    const listRes = await apiRequest(`/api/v1/mailboxes/${MAILBOX_ID}/webhooks`);
    console.log(`   Status: ${listRes.status}`);
    
    if (listRes.status === 200 && listRes.body.data) {
      console.log(`   Found ${listRes.body.data.length} webhook(s)`);
      for (const wh of listRes.body.data) {
        console.log(`   - ${wh.id}: ${wh.url} (${wh.status})`);
      }
    }
    
    // Create new webhook
    console.log('\n➕ Creating webhook for TUTORING automation...');
    const createRes = await apiRequest(
      `/api/v1/mailboxes/${MAILBOX_ID}/webhooks`,
      'POST',
      {
        url: WEBHOOK_URL,
        events: ['email.received'],
        description: 'Obioma Care TUTORING detection'
      }
    );
    
    if (createRes.status === 201 || createRes.status === 200) {
      console.log('✅ Webhook created!');
      console.log('   Secret (save this in Vercel as HOSTINGER_WEBHOOK_SECRET):');
      console.log(`   ${createRes.body.secret || '(check response below)'}`);
      console.log('\n📦 Response:', JSON.stringify(createRes.body, null, 2));
    } else {
      console.log('⚠️ Unexpected response:', createRes.status);
      console.log(JSON.stringify(createRes.body, null, 2));
    }
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
