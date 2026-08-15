require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const nodemailer = require('nodemailer');
const path = require('path');
const crypto = require('crypto');

const app = express();
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Email transport: Hostinger SMTP
let emailTransporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '465'),
    secure: process.env.SMTP_PORT === '587' ? false : true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
  console.log('✉️ Email: Using Hostinger SMTP');
} else {
  console.log('⚠️ Email: SMTP not configured — set SMTP_HOST, SMTP_USER, SMTP_PASS');
}

app.use(express.json());
app.use(express.static('landing'));
app.use(express.static('public'));

// In-memory delivery tokens (use Redis in production)
const deliveryTokens = new Map();

// Product catalog with file mappings
const PRODUCTS = {
  core: {
    name: 'Clinical Judgment Core System',
    price: 4700, // $47 in cents
    description: 'NGN Decision Framework + Prioritization Tools',
    files: [
      { name: 'NGN-Clinical-Judgment-Framework.pdf', path: '/products/ngn-framework.pdf' },
      { name: 'Prioritization-Decision-Trees.pdf', path: '/products/prioritization-trees.pdf' },
      { name: 'Clinical-Cheat-Sheets.pdf', path: '/products/cheat-sheets.pdf' },
      { name: 'Clinical-Day-Planner.pdf', path: '/products/clinical-day-planner.pdf' }
    ]
  },
  complete: {
    name: 'Clinical Judgment Complete Mastery',
    price: 6700, // $67 in cents
    description: 'Full system with video walkthroughs and case studies',
    files: [
      { name: 'NGN-Clinical-Judgment-Framework.pdf', path: '/products/ngn-framework.pdf' },
      { name: 'Prioritization-Decision-Trees.pdf', path: '/products/prioritization-trees.pdf' },
      { name: 'Real-Case-Walkthroughs.pdf', path: '/products/case-walkthroughs.pdf' },
      { name: 'SBAR-Templates.pdf', path: '/products/sbar-templates.pdf' },
      { name: 'First-Year-Survival-Guide.pdf', path: '/products/survival-guide.pdf' },
      { name: 'Clinical-Cheat-Sheets.pdf', path: '/products/cheat-sheets.pdf' },
      { name: 'Clinical-Day-Planner.pdf', path: '/products/clinical-day-planner.pdf' },
      { name: 'Video-Scripts.pdf', path: '/products/video-scripts.md' },
      { name: 'VIDEO-1-NGN-Deep-Dive.mp4', path: '/products/videos/video-1.mp4', type: 'video' },
      { name: 'VIDEO-2-ER-Chest-Pain.mp4', path: '/products/videos/video-2.mp4', type: 'video' },
      { name: 'VIDEO-3-Prioritization.mp4', path: '/products/videos/video-3.mp4', type: 'video' },
      { name: 'VIDEO-4-SBAR-Masterclass.mp4', path: '/products/videos/video-4.mp4', type: 'video' },
      { name: 'VIDEO-5-First-Year-Survival.mp4', path: '/products/videos/video-5.mp4', type: 'video' }
    ]
  }
};

// ==================== CHECKOUT ====================
app.post('/api/create-checkout', async (req, res) => {
  const { tier, email } = req.body;
  const product = PRODUCTS[tier];
  
  if (!product) return res.status(400).json({ error: 'Invalid product tier' });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.price,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/`,
      customer_email: email,
      metadata: { tier, product: product.name }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// ==================== WEBHOOK ====================
app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const tier = session.metadata.tier;
    const email = session.customer_email || session.customer_details?.email;
    const product = PRODUCTS[tier];
    
    // Generate secure download token
    const downloadToken = crypto.randomUUID();
    deliveryTokens.set(downloadToken, {
      tier,
      email,
      createdAt: new Date(),
      downloads: 0
    });
    
    // Send delivery email
    try {
      if (emailTransporter) {
        await emailTransporter.sendMail({
          from: 'Obioma Care <admin@obiomacare.com>',
          to: email,
          subject: `Your ${product.name} is ready!`,
          html: deliveryEmailTemplate(product, downloadToken, req.headers.origin)
        });
        console.log(`✅ Delivered ${tier} to ${email}`);
      } else {
        console.log('⚠️ Email not configured, skipping delivery email');
      }
    } catch (err) {
      console.error('Delivery email failed:', err);
    }
    
    // Optional: Add to email list
    try {
      await addToEmailList(email, tier);
    } catch (err) {
      console.error('Email list add failed:', err);
    }
  }

  res.json({received: true});
});

// ==================== DOWNLOAD ====================
app.get('/download/:token', async (req, res) => {
  const token = req.params.token;
  const delivery = deliveryTokens.get(token);
  
  if (!delivery) {
    return res.status(404).send('Invalid or expired download link');
  }
  
  // Check expiration (24 hours)
  const age = Date.now() - delivery.createdAt.getTime();
  if (age > 24 * 60 * 60 * 1000) {
    return res.status(410).send('Download link expired');
  }
  
  delivery.downloads++;
  const product = PRODUCTS[delivery.tier];
  
  res.send(downloadPageTemplate(product, token));
});

// ==================== LEAD MAGNET ====================
app.post('/api/lead-magnet', async (req, res) => {
  const { email, firstName, leadMagnet } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  
  // Determine which lead magnet to send
  const magnetType = leadMagnet || 'ngn-framework';
  
  const leadMagnets = {
    'ngn-framework': {
      subject: 'Your Free NGN Clinical Judgment Framework',
      template: (name) => leadMagnetTemplate(name),
      attachment: { filename: 'NGN-Clinical-Judgment-Framework-Preview.pdf', path: path.join(__dirname, 'public', 'downloads', 'ngn-framework.pdf') }
    },
    'neuro-cheat-sheet': {
      subject: 'Your NCLEX Neuro Assessment Cheat Sheet 🧠',
      template: (name) => neuroCheatSheetEmailTemplate(name),
      attachment: { filename: 'NCLEX-Neuro-Assessment-Cheat-Sheet.pdf', path: path.join(__dirname, 'public', 'downloads', 'neuro-assessment-cheat-sheet.html') }
    }
  };
  
  const magnet = leadMagnets[magnetType];
  if (!magnet) {
    return res.status(400).json({ error: 'Unknown lead magnet type' });
  }
  
  try {
    const fs = require('fs');
    const attachment = fs.existsSync(magnet.attachment.path) ? {
      filename: magnet.attachment.filename,
      path: magnet.attachment.path
    } : null;
    
    if (emailTransporter) {
      await emailTransporter.sendMail({
        from: 'Obioma Care <admin@obiomacare.com>',
        to: email,
        subject: magnet.subject,
        html: magnet.template(firstName),
        attachments: attachment ? [attachment] : undefined
      });
      console.log(`🎯 Lead magnet "${magnetType}" sent to ${email}`);
    } else {
      console.log('⚠️ Email not configured, skipping lead magnet');
    }
    
    // Add to nurture sequence
    await addToNurtureSequence(email, firstName, magnetType);
    
    res.json({ success: true, message: 'Check your email!' });
  } catch (err) {
    console.error('Lead magnet error:', err);
    res.status(500).json({ error: 'Failed to send' });
  }
});

// ==================== SUCCESS PAGE ====================
app.get('/success', (req, res) => {
  const sessionId = req.query.session_id;
  res.send(successPageTemplate());
});

// ==================== EMAIL TEMPLATES ====================
function deliveryEmailTemplate(product, token, origin) {
  const downloadUrl = `${origin}/download/${token}`;
  
  return `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #2d3748;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 2rem; margin-bottom: 8px;">🩺</div>
        <h1 style="color: #1a365d; margin: 0;">Obioma Care</h1>
      </div>
      
      <h2 style="color: #1a365d;">Your ${product.name} is ready!</h2>
      <p>Thanks for investing in your clinical judgment. Here's everything you need:</p>
      
      <div style="background: #fffaf0; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <h3 style="margin-top: 0;">📦 What's included:</h3>
        <ul style="padding-left: 20px;">
          ${product.files.map(f => `<li>${f.name}</li>`).join('')}
        </ul>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${downloadUrl}" style="display: inline-block; background: #c53030; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 1.125rem;">Download Your Files</a>
      </div>
      
      <p style="color: #718096; font-size: 0.875rem;">This link expires in 24 hours. Download your files now and save them to your device.</p>
      
      <div style="border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 24px;">
        <p style="color: #718096; margin-bottom: 16px;">Questions? Reply to this email — I read every one.</p>
        <p style="color: #718096; margin: 0;">— Nnamdi, RN<br>Founder, Obioma Care</p>
      </div>
    </div>
  `;
}

function leadMagnetTemplate(firstName) {
  return `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #2d3748;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 2rem; margin-bottom: 8px;">🩺</div>
        <h1 style="color: #1a365d; margin: 0;">Obioma Care</h1>
      </div>
      
      <h2 style="color: #1a365d;">Hey ${firstName || 'there'}!</h2>
      <p>Here's your free NGN Clinical Judgment Framework preview. This is the exact model I use to think through scenarios in ER and teach every new grad:</p>
      
      <div style="background: #fffaf0; padding: 24px; border-radius: 8px; margin: 24px 0;">
        <h3 style="margin-top: 0;">📋 The Four-Phase Model:</h3>
        <ol>
          <li><strong>Recognize</strong> — What cues matter?</li>
          <li><strong>Analyze</strong> — What's really going on?</li>
          <li><strong>Prioritize</strong> — Who needs you first?</li>
          <li><strong>Act</strong> — What's the right intervention?</li>
          <li><strong>Evaluate</strong> — Did it work?</li>
        </ol>
      </div>
      
      <p>Your full PDF is attached. Over the next few days, I'll send you:</p>
      <ul>
        <li><strong>Day 1:</strong> The #1 mistake students make on NGN scenarios</li>
        <li><strong>Day 3:</strong> How ER nurses prioritize when everything is urgent</li>
        <li><strong>Day 5:</strong> The SBAR script that gets doctors to act fast</li>
      </ul>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://obiomacare.com" style="display: inline-block; background: #c53030; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700;">See the Complete System →</a>
      </div>
      
      <p>Talk soon,<br>Nnamdi, RN</p>
      
      <div style="border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 24px; color: #718096; font-size: 0.875rem;">
        <p>You're receiving this because you downloaded the free NGN framework from obiomacare.com.</p>
      </div>
    </div>
  `;
}

function neuroCheatSheetEmailTemplate(firstName) {
  return `
    <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #2d3748;">
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="font-size: 2rem; margin-bottom: 8px;">🧠</div>
        <h1 style="color: #1a365d; margin: 0;">Obioma Care</h1>
      </div>
      
      <h2 style="color: #1a365d;">Hey ${firstName || 'there'}!</h2>
      <p>Here's your <strong>NCLEX Neuro Assessment Cheat Sheet</strong> — the same one I wish I had when I was studying for the NCLEX.</p>
      
      <div style="background: #f0f9ff; padding: 24px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #0284c7;">
        <h3 style="margin-top: 0; color: #0c4a6e;">📋 What's Inside:</h3>
        <ul style="padding-left: 20px; margin: 0;">
          <li>Glasgow Coma Scale scoring + NCLEX traps</li>
          <li>12 Cranial Nerves (OOOTTAFVGVAH mnemonic)</li>
          <li>Stroke: BE FAST recognition + tPA window</li>
          <li>Seizure first aid Do's & Don'ts</li>
          <li>Increased ICP: Early vs Late signs</li>
          <li>Parkinson's vs Alzheimer's vs ALS</li>
          <li>Myasthenia Gravis vs Cholinergic Crisis</li>
        </ul>
      </div>
      
      <p><strong>🖨️ Pro tip:</strong> Print this and keep it in your clinical bag. I referenced my cheat sheets daily during rotations.</p>
      
      <p>Your cheat sheet is attached. Over the next few days, I'll send you:</p>
      <ul>
        <li><strong>Day 1:</strong> The #1 mistake students make on neuro NCLEX questions</li>
        <li><strong>Day 3:</strong> How to think through neuro scenarios using clinical judgment</li>
        <li><strong>Day 5:</strong> The cranial nerve assessment trick that saves time</li>
      </ul>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://obiomacare.com/content" style="display: inline-block; background: #c53030; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700;">Browse All 60 Free NCLEX Guides →</a>
      </div>
      
      <p>Talk soon,<br>Nnamdi, RN</p>
      
      <div style="border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 24px; color: #718096; font-size: 0.875rem;">
        <p>You're receiving this because you downloaded the free Neuro Assessment Cheat Sheet from obiomacare.com.</p>
      </div>
    </div>
  `;
}

function downloadPageTemplate(product, token) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Download Your Files — Obioma Care</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; background: #fffaf0; color: #2d3748; margin: 0; padding: 40px 20px; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 48px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
        h1 { color: #1a365d; margin-bottom: 8px; }
        .subtitle { color: #718096; margin-bottom: 32px; }
        .file-list { list-style: none; padding: 0; }
        .file-item { display: flex; align-items: center; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; }
        .file-icon { font-size: 1.5rem; margin-right: 16px; }
        .file-name { flex: 1; font-weight: 600; }
        .file-type { color: #718096; font-size: 0.875rem; }
        .download-btn { background: #c53030; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-weight: 600; }
        .support { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; color: #718096; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Your ${product.name}</h1>
        <p class="subtitle">Download your files below. Save them to your device — this link expires in 24 hours.</p>
        
        <ul class="file-list">
          ${product.files.map(f => `
            <li class="file-item">
              <span class="file-icon">${f.type === 'video' ? '🎥' : '📄'}</span>
              <span class="file-name">${f.name}</span>
              <span class="file-type">${f.type === 'video' ? 'Video' : 'PDF'}</span>
            </li>
          `).join('')}
        </ul>
        
        <div class="support">
          <p>Problems downloading? Reply to your delivery email — I'll help you out.</p>
          <p>— Nnamdi, RN | Obioma Care</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function successPageTemplate() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Thank You — Obioma Care</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Inter', sans-serif; background: #fffaf0; color: #2d3748; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { max-width: 600px; text-align: center; padding: 40px; }
        .icon { font-size: 4rem; margin-bottom: 24px; }
        h1 { color: #1a365d; font-size: 2rem; margin-bottom: 16px; }
        p { color: #718096; font-size: 1.125rem; margin-bottom: 32px; }
        .btn { display: inline-block; background: #c53030; color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 700; }
        .note { margin-top: 32px; padding: 24px; background: white; border-radius: 8px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🎉</div>
        <h1>Thank You for Your Purchase!</h1>
        <p>Your Clinical Judgment Mastery System is being prepared. Check your email in the next 2-3 minutes for your download link.</p>
        <a href="/" class="btn">Back to Homepage</a>
        <div class="note">
          <p style="margin: 0; font-size: 1rem; color: #2d3748;"><strong>What's next:</strong></p>
          <p style="margin: 8px 0 0; font-size: 0.875rem;">1. Download your files<br>2. Start with the NGN Framework<br>3. Work through one scenario per day</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ==================== NURTURE SEQUENCE (Firestore-backed) ====================
const { initFirestore, storeDocument } = require('./lib/firestore-helper');
const db = initFirestore();

const EMAIL_SEQUENCES = {
  'ngn-framework': require('./content-nursing/email-sequence.json'),
  'neuro-cheat-sheet': require('./content-nursing/neuro-email-sequence.json')
};

// Load subscribers from Firestore
let subscribers = [];
let subscribersLoaded = false;

async function loadSubscribers() {
  if (subscribersLoaded) return;
  try {
    const snapshot = await db.collection('subscribers').get();
    subscribers = snapshot.docs.map(d => d.data());
    subscribersLoaded = true;
    console.log(`📋 Loaded ${subscribers.length} subscribers from Firestore`);
  } catch (err) {
    console.log('⚠️ Could not load subscribers from Firestore:', err.message);
    subscribers = [];
  }
}

async function saveSubscriber(subscriber) {
  try {
    const docId = subscriber.email.replace(/[^a-zA-Z0-9]/g, '-');
    await db.collection('subscribers').doc(docId).set(subscriber, { merge: true });
  } catch (err) {
    console.error('Failed to save subscriber to Firestore:', err.message);
  }
}

function personalizeEmail(body, firstName) {
  return body.replace(/\{\{firstName\}\}/g, firstName || 'there');
}

function scheduleEmail(subscriber, emailData, delayMs) {
  setTimeout(async () => {
    if (!emailTransporter) {
      console.log(`⚠️ Email not configured, skipping sequence email to ${subscriber.email}`);
      return;
    }
    
    try {
      const personalizedBody = personalizeEmail(emailData.body, subscriber.firstName);
      
      await emailTransporter.sendMail({
        from: 'Nnamdi, RN <admin@obiomacare.com>',
        to: subscriber.email,
        subject: emailData.subject,
        text: personalizedBody,
        html: `<div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #2d3748; white-space: pre-wrap;">${personalizedBody.replace(/\n/g, '<br>')}</div>`
      });
      
      subscriber.emailsSent = subscriber.emailsSent || [];
      subscriber.emailsSent.push({
        day: emailData.day,
        subject: emailData.subject,
        sentAt: new Date().toISOString()
      });
      
      await saveSubscriber(subscriber);
      await storeDocument('email_logs', `send_${Date.now()}`, {
        email: subscriber.email,
        day: emailData.day,
        subject: emailData.subject,
        leadMagnet: subscriber.leadMagnet,
        status: 'sent',
        sentAt: new Date().toISOString()
      });
      
      console.log(`✅ Day ${emailData.day} email sent to ${subscriber.email}`);
    } catch (err) {
      console.error(`❌ Failed to send Day ${emailData.day} email to ${subscriber.email}:`, err);
      await storeDocument('email_logs', `send_${Date.now()}`, {
        email: subscriber.email,
        day: emailData.day,
        subject: emailData.subject,
        status: 'failed',
        error: err.message,
        sentAt: new Date().toISOString()
      });
    }
  }, delayMs);
}

async function addToNurtureSequence(email, firstName, leadMagnet) {
  await loadSubscribers();
  
  // Check if already subscribed
  const existing = subscribers.find(s => s.email === email);
  if (existing) {
    console.log(`📧 ${email} already in nurture sequence`);
    return;
  }
  
  const magnetType = leadMagnet || 'ngn-framework';
  const sequence = EMAIL_SEQUENCES[magnetType];
  if (!sequence) {
    console.log(`⚠️ Unknown lead magnet "${magnetType}", using default`);
  }
  
  const subscriber = {
    email,
    firstName: firstName || '',
    leadMagnet: magnetType,
    joinedAt: new Date().toISOString(),
    emailsSent: [],
    source: 'api'
  };
  
  subscribers.push(subscriber);
  await saveSubscriber(subscriber);
  
  const signupTime = Date.now();
  const emailSequence = sequence || EMAIL_SEQUENCES['ngn-framework'];
  
  // Schedule all emails in the sequence
  for (const emailData of emailSequence) {
    const delayMs = (emailData.day * 24 * 60 * 60 * 1000);
    const timeUntilSend = Math.max(0, delayMs - (Date.now() - signupTime));
    
    scheduleEmail(subscriber, emailData, timeUntilSend);
    console.log(`📅 Scheduled Day ${emailData.day} email for ${email} in ${Math.round(timeUntilSend / 3600000)}h`);
  }
  
  console.log(`🎯 Added ${email} to ${magnetType} nurture sequence (${emailSequence.length} emails)`);
}

// Resume scheduled emails on server restart
async function resumeScheduledEmails() {
  await loadSubscribers();
  
  for (const subscriber of subscribers) {
    const signupTime = new Date(subscriber.joinedAt).getTime();
    const magnetType = subscriber.leadMagnet || 'ngn-framework';
    const emailSequence = EMAIL_SEQUENCES[magnetType] || EMAIL_SEQUENCES['ngn-framework'];
    
    for (const emailData of emailSequence) {
      const sent = subscriber.emailsSent?.find(e => e.day === emailData.day);
      if (sent) continue;
      
      const scheduledTime = signupTime + (emailData.day * 24 * 60 * 60 * 1000);
      const timeUntilSend = Math.max(0, scheduledTime - Date.now());
      
      scheduleEmail(subscriber, emailData, timeUntilSend);
      console.log(`🔄 Resumed Day ${emailData.day} email for ${subscriber.email}`);
    }
  }
}

// Resume on startup
(async () => {
  await loadSubscribers();
  if (subscribers.length > 0) {
    console.log(`🔄 Resuming ${subscribers.length} subscribers' email sequences...`);
    await resumeScheduledEmails();
  }
})();

// ==================== AUTOMATION HELPERS ====================
async function addToEmailList(email, tier) {
  console.log(`📧 Added ${email} to email list (tier: ${tier})`);
}

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;

// Export for serverless (Cloudflare Workers)
module.exports = app;

// Start server for local dev
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`🚀 Obioma Care server running on port ${PORT}`));
}
// Cache bust: 1785450246
