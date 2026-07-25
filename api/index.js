require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const { Resend } = require('resend');
const path = require('path');
const crypto = require('crypto');

const app = express();

// Initialize services
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

app.use(express.json());

// In-memory delivery tokens (use Redis in production)
const deliveryTokens = new Map();

// Product catalog with Stripe Price IDs
const PRODUCTS = {
  core: {
    name: 'Clinical Judgment Core System',
    priceId: 'price_1TwJ5MJQl5hjYpdc5z5vTSwg', // $47
    description: 'NGN Decision Framework + Prioritization Tools'
  },
  complete: {
    name: 'Clinical Judgment Complete Mastery',
    priceId: 'price_1TwJ7ZJQl5hjYpdcoiOk0I0v', // $67
    description: 'Full system with video walkthroughs and case studies'
  }
};

// ==================== CHECKOUT ====================
app.post('/api/create-checkout', async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
  
  const { tier, email } = req.body;
  const product = PRODUCTS[tier];
  
  if (!product) return res.status(400).json({ error: 'Invalid product tier' });

  try {
    const baseUrl = req.headers.origin || `https://${req.headers.host}` || 'https://obioma-care.vercel.app';
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: product.priceId,
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/`,
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
  if (!stripe) return res.status(500).send('Stripe not configured');
  
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
    const baseUrl = 'https://obioma-care.vercel.app';
    
    const downloadToken = crypto.randomUUID();
    deliveryTokens.set(downloadToken, {
      tier,
      email,
      createdAt: new Date(),
      downloads: 0
    });
    
    if (resend && email) {
      try {
        await resend.emails.send({
          from: process.env.FROM_EMAIL || 'Obioma Care <admin@obiomacare.com>',
          to: email,
          subject: `Your ${product.name} is ready!`,
          html: `
            <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #2d3748;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="font-size: 2rem; margin-bottom: 8px;">🩺</div>
                <h1 style="color: #1a365d; margin: 0; font-size: 1.5rem;">Obioma Care</h1>
              </div>
              
              <h2 style="color: #1a365d;">Your ${product.name} is ready!</h2>
              <p>Thanks for your purchase. Click below to access your files:</p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="${baseUrl}/download/${downloadToken}" 
                   style="display: inline-block; background: #c53030; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 1.125rem;">
                   Download Now →
                </a>
              </div>
              
              <p style="color: #718096; font-size: 0.875rem;">This link expires in 24 hours. Download your files and save them to your device.</p>
              
              <div style="border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 24px;">
                <p style="color: #718096; margin-bottom: 16px;">Questions? Reply to this email — I read every one.</p>
                <p style="color: #718096; margin: 0;">— Nnamdi, RN<br>Founder, Obioma Care</p>
              </div>
            </div>
          `
        });
        console.log(`✅ Delivered ${tier} to ${email}`);
      } catch (err) {
        console.error('Delivery email failed:', err);
      }
    }
  }

  res.json({received: true});
});

const fs = require('fs');

// In-memory lead store (use database in production)
const leads = [];
const LEADS_FILE = path.join(__dirname, '..', 'data', 'leads.json');

// Load leads from file if exists
try {
  if (fs.existsSync(LEADS_FILE)) {
    const data = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf8'));
    leads.push(...data);
    console.log(`📋 Loaded ${leads.length} leads`);
  }
} catch (err) {
  console.error('Failed to load leads:', err);
}

// Save leads to file
function saveLeads() {
  try {
    const dir = path.dirname(LEADS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
  } catch (err) {
    console.error('Failed to save leads:', err);
  }
}

// Email sequence definition
const NURTURE_SEQUENCE = [
  {
    day: 0,
    subject: 'Your NCLEX Study Checklist is here (+ why most students get it wrong)',
    sendImmediately: true,
    template: (lead, baseUrl) => `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #2d3748;">
        <h2 style="color: #1a365d;">Hey ${lead.firstName || 'there'}!</h2>
        <p>Thanks for downloading the NCLEX Study Checklist. Before you dive in, let me tell you something important:</p>
        <p>Most students study for the NGN NCLEX by memorizing more content.</p>
        <p>That's like trying to put out a fire by adding more wood.</p>
        <p>The new NCLEX tests clinical <strong>JUDGMENT</strong> — not recall. Can you recognize cues? Analyze data? Prioritize under pressure? Take action when everything is urgent?</p>
        <p>That's what this checklist trains.</p>
        <p>Access your checklist here: <a href="${baseUrl}/free-nclex-checklist.html" style="color: #c53030; font-weight: 700;">NCLEX Study Checklist →</a></p>
        <p>Work through the first section. Then reply and tell me — did it feel different from how you've been studying?</p>
        <p>I read every reply.</p>
        <p>— Nnamdi, RN<br>Obioma Care</p>
        <p style="margin-top: 24px;"><a href="${baseUrl}/#pricing" style="color: #c53030;">P.S. If you want 30+ more scenarios + video walkthroughs, the Complete System is here →</a></p>
      </div>
    `
  },
  {
    day: 2,
    subject: 'The #1 mistake I see on every clinical floor',
    template: (lead, baseUrl) => `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #2d3748;">
        <h2 style="color: #1a365d;">The #1 mistake I see on every clinical floor</h2>
        <p>Hey ${lead.firstName || 'there'},</p>
        <p>I made this mistake as a new grad. My preceptor caught it. Now I see students make it every single day.</p>
        <p>Here's the mistake: <strong>Treating every abnormal lab/vital as equally urgent.</strong></p>
        <p>A BP of 148/92 in a stable patient? Document and monitor.<br>
        A BP of 148/92 in a post-op patient with a sudden headache? Page the doctor NOW.</p>
        <p>Same number. Completely different action.</p>
        <p>The difference is context. And context is what clinical judgment is built on.</p>
        <p>This is why I built the prioritization decision trees in the Complete System. They force you to ask the right questions before you act.</p>
        <p><a href="${baseUrl}" style="color: #c53030;">See the full prioritization framework →</a></p>
        <p>— Nnamdi</p>
      </div>
    `
  },
  {
    day: 4,
    subject: '"Room 4 is crashing" — a real ER story',
    template: (lead, baseUrl) => `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #2d3748;">
        <h2 style="color: #1a365d;">"Room 4 is crashing" — a real ER story</h2>
        <p>Hey ${lead.firstName || 'there'},</p>
        <p>3 AM. I'm the only ER nurse with 6 patients.</p>
        <p>The charge nurse yells: "Room 4 is crashing!"</p>
        <p>At the same time:<br>
        • Room 2: Chest pain, troponin elevated<br>
        • Room 5: Post-op appendectomy, fever 102.3<br>
        • Room 8: COPD exacerbation, O2 sat 88% on 2L</p>
        <p>Who do I see first?</p>
        <p>Not Room 2 (chest pain is stable, troponin is trending). Not Room 5 (post-op fever, concerning but not crashing). Definitely not Room 8 (COPD patient, needs titration but not emergent).</p>
        <p>Room 4. Because "crashing" means airway/breathing/circulation are failing RIGHT NOW.</p>
        <p>But here's what textbooks don't teach you: After I stabilize Room 4, I DON'T go to Room 2 next. I delegate Room 8's O2 titration to the tech, reassess Room 5 from the doorway, THEN see Room 2.</p>
        <p>That's clinical judgment. That's what the NGN tests. That's what I teach.</p>
        <p><a href="${baseUrl}" style="color: #c53030;">Want the full framework? Complete System →</a></p>
        <p>— Nnamdi</p>
      </div>
    `
  },
  {
    day: 7,
    subject: 'I finally understand prioritization',
    template: (lead, baseUrl) => `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #2d3748;">
        <h2 style="color: #1a365d;">"I finally understand prioritization"</h2>
        <p>Hey ${lead.firstName || 'there'},</p>
        <p>I don't have testimonials yet (this is a new product). But I can tell you what I've seen mentoring new grads:</p>
        <p>The ones who struggle in their first year aren't the ones who didn't memorize enough. They're the ones who can't THINK through a scenario when the answer isn't in a textbook.</p>
        <p>The Complete System changes that. Here's what's inside:</p>
        <ul>
          <li>✓ NGN Decision Framework</li>
          <li>✓ 30+ practice scenarios with thought process</li>
          <li>✓ 5 video walkthroughs of real cases</li>
          <li>✓ SBAR templates that get results</li>
          <li>✓ First-year survival guide</li>
          <li>✓ Clinical day planner</li>
        </ul>
        <p><a href="${baseUrl}" style="display: inline-block; background: #c53030; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700;">Get the Complete System for $67 →</a></p>
        <p>30-day guarantee. If it doesn't help you think through scenarios more clearly, I'll refund every penny.</p>
        <p>— Nnamdi</p>
      </div>
    `
  },
  {
    day: 10,
    subject: '"I already bought an NCLEX review course"',
    template: (lead, baseUrl) => `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #2d3748;">
        <h2 style="color: #1a365d;">"I already bought an NCLEX review course"</h2>
        <p>Hey ${lead.firstName || 'there'},</p>
        <p>If you already bought UWorld, Kaplan, or Archer — good. Those are excellent for question practice.</p>
        <p>But here's what they don't do:</p>
        <p>They don't teach you the THINKING process. They give you questions and explanations. That's like giving someone fish instead of teaching them to fish.</p>
        <p>The Clinical Judgment Mastery System is the thinking layer. It shows you HOW an experienced nurse approaches a scenario — not just what the right answer is.</p>
        <p>Use BOTH. Practice questions on UWorld. Learn the thinking framework here.</p>
        <p><a href="${baseUrl}" style="color: #c53030;">Get the Complete System →</a></p>
        <p>— Nnamdi</p>
      </div>
    `
  },
  {
    day: 12,
    subject: 'Price goes up Friday',
    template: (lead, baseUrl) => `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #2d3748;">
        <h2 style="color: #1a365d;">Price goes up Friday</h2>
        <p>Hey ${lead.firstName || 'there'},</p>
        <p>Quick note: The launch price of $67 ends Friday. After that, the Complete System goes to $97.</p>
        <p>If you've been thinking about it, now's the time.</p>
        <p><a href="${baseUrl}" style="display: inline-block; background: #c53030; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700;">Get it at $67 →</a></p>
        <p>— Nnamdi</p>
      </div>
    `
  },
  {
    day: 14,
    subject: 'Last call: Clinical Judgment Mastery System',
    template: (lead, baseUrl) => `
      <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #2d3748;">
        <h2 style="color: #1a365d;">Last call: Clinical Judgment Mastery System</h2>
        <p>Hey ${lead.firstName || 'there'},</p>
        <p>This is the last email in this sequence.</p>
        <p>If the Complete System isn't for you right now, no worries. Keep the free framework — it's yours.</p>
        <p>But if you're struggling with:<br>
        • NGN scenario questions<br>
        • Prioritization on the floor<br>
        • Feeling like you memorized everything but can't think through cases</p>
        <p>This was built for you. From real experience. Not a textbook.</p>
        <p><a href="${baseUrl}" style="color: #c53030;">Last chance at $67 →</a></p>
        <p>Either way, good luck on the NCLEX and your first year. You've got this.</p>
        <p>— Nnamdi, RN<br>Obioma Care</p>
        <p>P.S. If you ever want to chat nursing, just reply. I read every email.</p>
      </div>
    `
  }
];

function shouldSendEmail(lead, sequenceDay) {
  const subscribedAt = new Date(lead.subscribedAt);
  const now = new Date();
  const daysSinceSubscription = Math.floor((now - subscribedAt) / (1000 * 60 * 60 * 24));
  
  // Check if this email has already been sent
  const sentKey = `email_${sequenceDay}`;
  if (lead.emailsSent?.includes(sentKey)) return false;
  
  // Check if it's time to send
  return daysSinceSubscription >= sequenceDay;
}

async function sendNurtureEmails() {
  if (!resend) {
    console.log('❌ Resend not configured, skipping nurture');
    return { sent: 0, errors: 0 };
  }
  
  const baseUrl = 'https://obiomacare.com';
  let sent = 0;
  let errors = 0;
  
  for (const lead of leads) {
    // Skip leads who purchased
    if (lead.purchased) continue;
    
    for (const emailDef of NURTURE_SEQUENCE) {
      if (!shouldSendEmail(lead, emailDef.day)) continue;
      
      try {
        await resend.emails.send({
          from: process.env.FROM_EMAIL || 'Obioma Care <admin@obiomacare.com>',
          to: lead.email,
          subject: emailDef.subject,
          html: emailDef.template(lead, baseUrl)
        });
        
        // Mark as sent
        if (!lead.emailsSent) lead.emailsSent = [];
        lead.emailsSent.push(`email_${emailDef.day}`);
        lead.lastEmailSent = new Date().toISOString();
        sent++;
        
        console.log(`✅ Sent day ${emailDef.day} email to ${lead.email}`);
        
        // Rate limit: max 10 emails per batch
        if (sent >= 10) break;
      } catch (err) {
        console.error(`❌ Failed to send to ${lead.email}:`, err);
        errors++;
      }
    }
    
    if (sent >= 10) break;
  }
  
  if (sent > 0) saveLeads();
  return { sent, errors };
}

// ==================== NURTURE CRON ====================
// Protected by CRON_SECRET for Vercel Cron Jobs
const CRON_SECRET = process.env.CRON_SECRET;

app.get('/api/cron/nurture', async (req, res) => {
  // Auth check for Vercel Cron
  const authHeader = req.headers.authorization;
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  console.log('🔄 Running nurture sequence...');
  const result = await sendNurtureEmails();
  res.json({ success: true, ...result, leadsTotal: leads.length });
});

app.post('/api/cron/nurture', async (req, res) => {
  // Auth check for Vercel Cron
  const authHeader = req.headers.authorization;
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  console.log('🔄 Running nurture sequence...');
  const result = await sendNurtureEmails();
  res.json({ success: true, ...result, leadsTotal: leads.length });
});
app.post('/api/lead-magnet', async (req, res) => {
  const { email, firstName } = req.body;
  const baseUrl = req.headers.origin || `https://${req.headers.host}` || 'https://obioma-care.vercel.app';
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  
  // Check if lead already exists
  const existingLead = leads.find(l => l.email === email);
  if (existingLead) {
    return res.json({ success: true, message: 'You\'re already subscribed! Check your email.' });
  }
  
  // Create new lead
  const lead = {
    email,
    firstName: firstName || '',
    subscribedAt: new Date().toISOString(),
    emailsSent: [],
    purchased: false
  };
  leads.push(lead);
  saveLeads();
  
  if (resend) {
    try {
      // Send welcome email using nurture sequence day 0
      const welcomeEmail = NURTURE_SEQUENCE.find(e => e.day === 0);
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'Obioma Care <admin@obiomacare.com>',
        to: email,
        subject: welcomeEmail ? welcomeEmail.subject : 'Your Free NGN Clinical Judgment Framework',
        html: welcomeEmail ? welcomeEmail.template(lead, baseUrl) : `
          <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #2d3748;">
            <h2>Hey ${firstName || 'there'}!</h2>
            <p>Here's your free NGN Clinical Judgment Framework preview.</p>
          </div>
        `
      });
      
      // Mark welcome email as sent
      lead.emailsSent.push('email_0');
      saveLeads();
      
      console.log(`🎯 Lead captured: ${email}`);
    } catch (err) {
      console.error('Lead magnet error:', err);
    }
  }
  
  res.json({ success: true, message: 'Check your email!' });
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
  const baseUrl = req.headers.origin || `https://${req.headers.host}` || 'https://obioma-care.vercel.app';
  
  res.send(downloadPageTemplate(product, delivery.tier, baseUrl));
});

// ==================== SUCCESS PAGE ====================
app.get('/success', (req, res) => {
  res.redirect('/success.html');
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    stripe: !!stripe,
    resend: !!resend,
    version: '1.0.0'
  });
});

// ==================== TEMPLATES ====================
function downloadPageTemplate(product, tier, baseUrl) {
  const isComplete = tier === 'complete';
  
  const coreFiles = [
    { name: 'NGN Clinical Judgment Framework', file: 'ngn-framework.pdf', desc: 'The core decision-making model' },
    { name: 'Prioritization Decision Trees', file: 'prioritization-trees.pdf', desc: '10 practice scenarios with answers' },
    { name: 'SBAR Templates & Scripts', file: 'sbar-templates.pdf', desc: 'Communication frameworks' },
    { name: 'Clinical Day Planner', file: 'clinical-day-planner.pdf', desc: 'Printable daily organizer' },
  ];
  
  const completeFiles = [
    { name: 'Real Case Walkthroughs', file: 'case-walkthroughs.pdf', desc: '5 detailed cases from ER & oncology' },
    { name: 'First-Year Survival Guide', file: 'survival-guide.pdf', desc: 'What nursing school didn\'t teach you' },
    { name: 'Video Scripts', file: 'video-scripts.pdf', desc: 'Scripts for clinical walkthroughs' },
  ];
  
  const files = isComplete ? [...coreFiles, ...completeFiles] : coreFiles;
  
  const fileListHtml = files.map(f => `
    <li class="file-item">
      <span class="file-icon">📄</span>
      <div class="file-info">
        <span class="file-name">${f.name}</span>
        <span class="file-desc">${f.desc}</span>
      </div>
      <a href="${baseUrl}/downloads/${f.file}" class="btn" download>Download</a>
    </li>
  `).join('');
  
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
        .file-item { display: flex; align-items: center; padding: 16px; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; background: #fff; }
        .file-icon { font-size: 1.5rem; margin-right: 16px; }
        .file-info { flex: 1; }
        .file-name { font-weight: 600; display: block; }
        .file-desc { color: #718096; font-size: 0.875rem; }
        .btn { background: #c53030; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 0.875rem; }
        .support { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e2e8f0; color: #718096; }
        .expiry { background: #fffaf0; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px; font-size: 0.875rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🩺 ${product.name}</h1>
        <p class="subtitle">Your purchase is confirmed. Download your files below.</p>
        
        <div class="expiry">
          ⏰ <strong>Important:</strong> Download your files now. This link expires in 24 hours.
        </div>
        
        <ul class="file-list">
          ${fileListHtml}
        </ul>
        
        <div class="support">
          <p><strong>Problems downloading?</strong> Reply to your delivery email — I'll help you out.</p>
          <p>— Nnamdi, RN | Obioma Care</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ==================== EXPORT FOR VERCEL ====================
module.exports = app;
