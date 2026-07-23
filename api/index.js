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
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price: product.priceId,
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
                <a href="${req.headers.origin}/download/${downloadToken}" 
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

// ==================== LEAD MAGNET ====================
app.post('/api/lead-magnet', async (req, res) => {
  const { email, firstName } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  
  if (resend) {
    try {
      await resend.emails.send({
        from: process.env.FROM_EMAIL || 'Obioma Care <admin@obiomacare.com>',
        to: email,
        subject: 'Your Free NGN Clinical Judgment Framework',
        html: `
          <div style="font-family: Inter, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; color: #2d3748;">
            <div style="text-align: center; margin-bottom: 32px;">
              <div style="font-size: 2rem; margin-bottom: 8px;">🩺</div>
              <h1 style="color: #1a365d; margin: 0; font-size: 1.5rem;">Obioma Care</h1>
            </div>
            
            <h2 style="color: #1a365d;">Hey ${firstName || 'there'}!</h2>
            <p>Here's your free NGN Clinical Judgment Framework preview.</p>
            
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
            
            <p>Over the next few days, I'll send you my best clinical judgment tips:</p>
            <ul>
              <li><strong>Day 1:</strong> The #1 mistake students make on NGN scenarios</li>
              <li><strong>Day 3:</strong> How ER nurses prioritize when everything is urgent</li>
              <li><strong>Day 5:</strong> The SBAR script that gets doctors to act fast</li>
            </ul>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${req.headers.origin}" 
                 style="display: inline-block; background: #c53030; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700;">
                 See the Complete System →
              </a>
            </div>
            
            <p>Talk soon,<br>Nnamdi, RN</p>
          </div>
        `
      });
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
  
  res.send(downloadPageTemplate(product, token, req.headers.host));
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
function downloadPageTemplate(product, token, host) {
  const protocol = host?.includes('localhost') ? 'http' : 'https';
  
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
          <li class="file-item">
            <span class="file-icon">📄</span>
            <div class="file-info">
              <span class="file-name">NGN Clinical Judgment Framework</span>
              <span class="file-desc">PDF — The core decision-making model</span>
            </div>
          </li>
          <li class="file-item">
            <span class="file-icon">📄</span>
            <div class="file-info">
              <span class="file-name">Prioritization Decision Trees</span>
              <span class="file-desc">PDF — 10 practice scenarios with answers</span>
            </div>
          </li>
          <li class="file-item">
            <span class="file-icon">📄</span>
            <div class="file-info">
              <span class="file-name">Clinical Cheat Sheets</span>
              <span class="file-desc">PDF — Quick reference cards</span>
            </div>
          </li>
          <li class="file-item">
            <span class="file-icon">📄</span>
            <div class="file-info">
              <span class="file-name">Clinical Day Planner</span>
              <span class="file-desc">PDF — Printable daily organizer</span>
            </div>
          </li>
          ${delivery.tier === 'complete' ? `
          <li class="file-item">
            <span class="file-icon">📄</span>
            <div class="file-info">
              <span class="file-name">Real Case Walkthroughs</span>
              <span class="file-desc">PDF — 5 detailed cases from ER & oncology</span>
            </div>
          </li>
          <li class="file-item">
            <span class="file-icon">📄</span>
            <div class="file-info">
              <span class="file-name">SBAR Templates & Scripts</span>
              <span class="file-desc">PDF — Communication frameworks</span>
            </div>
          </li>
          <li class="file-item">
            <span class="file-icon">📄</span>
            <div class="file-info">
              <span class="file-name">First-Year Survival Guide</span>
              <span class="file-desc">PDF — What nursing school didn't teach you</span>
            </div>
          </li>
          <li class="file-item">
            <span class="file-icon">🎥</span>
            <div class="file-info">
              <span class="file-name">5 Video Walkthroughs</span>
              <span class="file-desc">MP4 — Real cases explained by an ER nurse</span>
            </div>
          </li>
          ` : ''}
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
