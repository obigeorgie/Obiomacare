require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const { Resend } = require('resend');
const path = require('path');
const crypto = require('crypto');

const app = express();

// Only initialize if env vars exist (for build time)
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

app.use(express.json());

// In-memory delivery tokens (use Redis in production)
const deliveryTokens = new Map();

// Product catalog
const PRODUCTS = {
  core: {
    name: 'Clinical Judgment Core System',
    price: 4700,
    description: 'NGN Decision Framework + Prioritization Tools'
  },
  complete: {
    name: 'Clinical Judgment Complete Mastery',
    price: 6700,
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
    
    if (resend) {
      try {
        await resend.emails.send({
          from: 'Obioma Care <admin@obiomacare.com>',
          to: email,
          subject: `Your ${product.name} is ready!`,
          html: `
            <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px;">
              <h1 style="color: #1a365d;">Your ${product.name} is ready!</h1>
              <p>Thanks for your purchase. Click below to access your files:</p>
              <a href="${req.headers.origin}/download/${downloadToken}" 
                 style="display: inline-block; background: #c53030; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 700;">
                 Download Now
              </a>
              <p style="margin-top: 24px; color: #718096;">This link expires in 24 hours.</p>
            </div>
          `
        });
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
        from: 'Obioma Care <admin@obiomacare.com>',
        to: email,
        subject: 'Your Free NGN Clinical Judgment Framework',
        html: `
          <div style="font-family: Inter, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px;">
            <h2 style="color: #1a365d;">Hey ${firstName || 'there'}!</h2>
            <p>Here's your free NGN Clinical Judgment Framework.</p>
            <p>Over the next few days, I'll send you my best clinical judgment tips.</p>
            <p>— Nnamdi, RN</p>
          </div>
        `
      });
    } catch (err) {
      console.error('Lead magnet error:', err);
    }
  }
  
  res.json({ success: true, message: 'Check your email!' });
});

// ==================== HEALTH CHECK ====================
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    stripe: !!stripe,
    resend: !!resend
  });
});

// ==================== EXPORT FOR VERCEL ====================
module.exports = app;
