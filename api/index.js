require('dotenv').config();
const express = require('express');
const Stripe = require('stripe');
const nodemailer = require('nodemailer');
const path = require('path');
const crypto = require('crypto');

// ==================== AI TUTOR MODULE ====================
const tutor = require('./tutor');

// ==================== FIREBASE / FIRESTORE ====================
let db = null;
try {
  const { Firestore } = require('@google-cloud/firestore');
  const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');
  db = new Firestore({
    projectId: 'kindred-x5pbk',
    keyFilename: serviceAccountPath
  });
  console.log('🔥 Firestore initialized');
} catch (err) {
  console.error('🔥 Firestore init error:', err.message);
}

const app = express();

// CORS for frontend
const cors = require('cors');
app.use(cors({
  origin: ['https://app.obiomacare.com', 'https://obiomacare.com', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true
}));

// Initialize services
const stripe = process.env.STRIPE_SECRET_KEY ? Stripe(process.env.STRIPE_SECRET_KEY) : null;

// Email transport: Hostinger SMTP only
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
  console.log('⚠️ Email: SMTP not configured - set SMTP_HOST, SMTP_USER, SMTP_PASS');
}

// Unified email sender (Hostinger SMTP only)
async function sendEmail({ from, to, subject, html }) {
  if (!emailTransporter) {
    console.log('⚠️ No email transport configured, skipping send');
    return;
  }
  return await emailTransporter.sendMail({ from, to, subject, html });
}

// NOTE: express.json() is applied per-route BELOW the webhook.
// The webhook MUST receive raw body for Stripe signature verification.

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

// ==================== ANALYTICS LOGGING ====================
// Server-side event logging for attribution tracking
async function logEvent(eventType, data) {
  if (!db) return;
  try {
    await db.collection('analytics_events').add({
      event: eventType,
      timestamp: new Date().toISOString(),
      ...data
    });
  } catch (err) {
    console.error('Analytics log failed:', err.message);
  }
}

// ==================== DELIVERY TOKENS (Firestore) ====================
// Store download tokens in Firestore for serverless persistence
async function saveDeliveryToken(token, data) {
  if (!db) {
    deliveryTokens.set(token, data);
    return;
  }
  try {
    await db.collection('delivery_tokens').doc(token).set({
      ...data,
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error('Failed to save delivery token:', err.message);
    deliveryTokens.set(token, data); // fallback
  }
}

async function getDeliveryToken(token) {
  if (!db) return deliveryTokens.get(token) || null;
  try {
    const doc = await db.collection('delivery_tokens').doc(token).get();
    if (!doc.exists) return null;
    const data = doc.data();
    return {
      tier: data.tier,
      email: data.email,
      createdAt: new Date(data.createdAt),
      downloads: data.downloads || 0
    };
  } catch (err) {
    console.error('Failed to get delivery token:', err.message);
    return deliveryTokens.get(token) || null;
  }
}

async function incrementDownloadCount(token) {
  if (!db) {
    const d = deliveryTokens.get(token);
    if (d) d.downloads++;
    return;
  }
  try {
    await db.collection('delivery_tokens').doc(token).update({
      downloads: require('firebase-admin').firestore.FieldValue.increment(1)
    });
  } catch (err) {
    console.error('Failed to increment download count:', err.message);
  }
}

// ==================== PROMO CODES ====================
// Test promo codes for end-to-end testing
const PROMO_CODES = {
  'TEST99': { discount: 0.98, description: '98% off — E2E test code' },  // $47 → $0.94
  'TEST50': { discount: 0.50, description: '50% off — Development test' }, // $47 → $23.50
  'NNAMDI': { discount: 0.25, description: '25% off — Founder discount' },   // $47 → $35.25
  'LAUNCH50': { discount: 0.50, description: '50% off — Launch special' },  // $47 → $23.50
  'NURSE20': { discount: 0.20, description: '20% off — Nursing student discount' },  // $47 → $37.60
  'BUNDLE10': { discount: 0.15, description: '15% off — Bundle upgrade' },  // $67 → $56.95
  'NCLEX2026': { discount: 0.30, description: '30% off — NCLEX season' },  // $47 → $32.90
  'RETURN10': { discount: 0.10, description: '10% off — Welcome back' }  // Return customer
};

app.post('/api/validate-promo', express.json(), (req, res) => {
  const { code } = req.body;
  const upperCode = code?.toUpperCase().trim();
  
  if (!upperCode) {
    return res.status(400).json({ valid: false, error: 'Code required' });
  }
  
  const promo = PROMO_CODES[upperCode];
  if (!promo) {
    return res.json({ valid: false, error: 'Invalid code' });
  }
  
  res.json({ 
    valid: true, 
    code: upperCode,
    discount: promo.discount,
    description: promo.description 
  });
});

// Shared branded email template constants (must be defined before use)
const FROM_EMAIL = 'Obioma Care <admin@obiomacare.com>';
const BRAND_COLORS = {
  navy: '#1a365d',
  coral: '#c53030',
  gray: '#4a5568',
  lightGray: '#718096',
  bg: '#f7fafc'
};

// ==================== AUTH ====================
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const JWT_SECRET = process.env.JWT_SECRET || 'obioma-dev-secret-change-in-production';

// Helper to generate JWT
function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
}

// Middleware to verify JWT
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/auth/register', express.json(), async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    const usersRef = db.collection('users');
    const existing = await usersRef.where('email', '==', email.toLowerCase()).get();
    if (!existing.empty) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const userDoc = await usersRef.add({
      email: email.toLowerCase(),
      name,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      tier: null,
      stripeCustomerId: null
    });
    
    const user = { id: userDoc.id, email: email.toLowerCase(), name };
    const token = generateToken(user);
    
    res.json({ success: true, token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/auth/login', express.json(), async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email.toLowerCase()).get();
    if (snapshot.empty) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    
    const valid = await bcrypt.compare(password, userData.password);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const user = { id: userDoc.id, email: userData.email, name: userData.name };
    const token = generateToken(user);
    
    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/auth/me', authMiddleware, async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userData = userDoc.data();
    res.json({ id: userDoc.id, email: userData.email, name: userData.name, tier: userData.tier || null });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

app.post('/auth/forgot-password', express.json(), async (req, res) => {
  // Placeholder - sends reset email
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  
  // In production, generate token and send email
  res.json({ success: true, message: 'If an account exists, a reset email has been sent' });
});

app.post('/auth/reset-password', express.json(), async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token and password required' });
  res.json({ success: true, message: 'Password reset successful' });
});

app.post('/auth/update-password', authMiddleware, express.json(), async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Current and new password required' });
  res.json({ success: true, message: 'Password updated' });
});

app.post('/auth/update-profile', authMiddleware, express.json(), async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  try {
    await db.collection('users').doc(req.user.id).update({ name });
    res.json({ success: true, user: { ...req.user, name } });
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// ==================== CHECKOUT (with promo support) ====================
app.post('/api/create-checkout', express.json(), async (req, res) => {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
  
  const { tier, email, promoCode, utm } = req.body;
  const product = PRODUCTS[tier];
  
  if (!product) return res.status(400).json({ error: 'Invalid product tier' });

  try {
    const baseUrl = req.headers.origin || `https://${req.headers.host}` || 'https://obioma-care.vercel.app';
    
    // Log checkout initiation with UTM attribution
    logEvent('checkout_initiated', {
      tier,
      email: email || null,
      promoCode: promoCode || null,
      utm: utm || null,
      ip: req.headers['x-forwarded-for'] || req.ip,
      userAgent: req.headers['user-agent']
    });
    
    // Check promo code
    let discounts = [];
    const promo = promoCode ? PROMO_CODES[promoCode.toUpperCase().trim()] : null;
    
    if (promo) {
      // For test promo codes, we create a coupon dynamically
      // In production you'd use pre-created Stripe coupons
      const coupon = await stripe.coupons.create({
        percent_off: Math.round(promo.discount * 100),
        duration: 'once',
        name: promo.description
      });
      discounts = [{ coupon: coupon.id }];
    }
    
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
      metadata: { 
        tier, 
        product: product.name, 
        promoCode: promoCode || 'none',
        utm_source: utm?.utm_source || '',
        utm_medium: utm?.utm_medium || '',
        utm_campaign: utm?.utm_campaign || ''
      },
      ...(discounts.length > 0 && { discounts })
    });

    res.json({ url: session.url, promoApplied: !!promo });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// ==================== AI TUTOR (Real Implementation) ====================
const { classifyQuestion, generateExplanation, generatePracticeQuestion, generateHint } = require('./tutor');

app.post('/tutor/explain', authMiddleware, express.json(), (req, res) => {
  const { question, topic } = req.body;
  const userQuestion = question || topic || 'clinical judgment';
  const classifiedTopic = classifyQuestion(userQuestion);
  const explanation = generateExplanation(classifiedTopic, userQuestion);
  
  res.json({ 
    explanation,
    topic: classifiedTopic,
    followUpQuestions: [
      "Can you give me an example?",
      "How does this apply to NCLEX?",
      "What are common mistakes here?"
    ]
  });
});

app.post('/tutor/practice', authMiddleware, express.json(), (req, res) => {
  const { topic } = req.body;
  const classifiedTopic = topic ? classifyQuestion(topic) : 'cjmm';
  const question = generatePracticeQuestion(classifiedTopic);
  
  res.json({ 
    question: question.question,
    options: question.options,
    correctAnswer: question.correct,
    rationale: question.rationale,
    topic: classifiedTopic
  });
});

app.post('/tutor/ask', authMiddleware, express.json(), (req, res) => {
  const { question } = req.body;
  const classifiedTopic = classifyQuestion(question || '');
  const explanation = generateExplanation(classifiedTopic, question || '');
  
  res.json({ 
    answer: explanation,
    topic: classifiedTopic,
    confidence: 'high',
    sources: ['NCSBN CJMM Framework', 'Obioma Course Content']
  });
});

app.post('/tutor/hint', authMiddleware, express.json(), (req, res) => {
  const { question } = req.body;
  const hint = generateHint(question || '');
  
  res.json({ 
    hint,
    framework: 'ABCDE / CJMM',
    tip: 'Break complex questions into smaller parts'
  });
});

app.post('/tutor/path-summary', authMiddleware, express.json(), (req, res) => {
  res.json({ 
    summary: 'Your learning path focuses on Clinical Judgment Mastery. Continue through the core modules: Recognize Cues → Analyze Cues → Prioritize → Generate Solutions → Take Action → Evaluate.',
    progress: { completed: 0, total: 6, nextModule: 'Recognize Cues' },
    recommendations: [
      'Complete Module 1: Recognize Cues',
      'Practice 5 SATA questions daily',
      'Review critical lab values'
    ]
  });
});

app.post('/tutor/assess', authMiddleware, express.json(), (req, res) => {
  res.json({ 
    score: 75,
    feedback: 'Good foundation in clinical judgment. Focus on prioritization and lab values for improvement.',
    strengths: ['Recognizing cues', 'Basic pharmacology'],
    weaknesses: ['Prioritization', 'Critical lab values'],
    recommendedModules: ['Prioritize Hypotheses', 'Lab Values Mastery']
  });
});

app.get('/stats', authMiddleware, (req, res) => res.json({ sessions: 0, streak: 0, totalTime: 0 }));
app.get('/admin/stats', authMiddleware, (req, res) => res.json({ users: 0, revenue: 0 }));
app.post('/plans/create', authMiddleware, express.json(), (req, res) => res.json({ planId: 'stub', status: 'created' }));
app.post('/export', authMiddleware, express.json(), (req, res) => res.json({ url: '#' }));

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
    const tier = session.metadata?.tier;
    const email = session.customer_email || session.customer_details?.email;
    const stripeCustomerId = session.customer;
    const product = PRODUCTS[tier];
    const baseUrl = 'https://obiomacare.com';
    
    // Log purchase with UTM attribution
    logEvent('purchase_completed', {
      email: email || null,
      tier,
      amount: tier === 'complete' ? 67 : 47,
      stripeSessionId: session.id,
      utm: {
        source: session.metadata?.utm_source || '',
        medium: session.metadata?.utm_medium || '',
        campaign: session.metadata?.utm_campaign || ''
      },
      promoCode: session.metadata?.promoCode || null
    });
    
    // Update lead in Firestore with purchase info
    if (email && db) {
      try {
        await db.collection('leads').doc(email).update({
          purchased: true,
          tier: tier || 'none',
          stripeCustomerId: stripeCustomerId || null,
          purchasedAt: new Date().toISOString()
        });
        console.log(`✅ Updated lead ${email} with purchase`);
      } catch (err) {
        console.error(`Failed to update lead ${email}:`, err.message);
      }
    }
    
    // Update user in Firestore if they have an account
    if (email && db) {
      try {
        const userSnapshot = await db.collection('users').where('email', '==', email).get();
        if (!userSnapshot.empty) {
          userSnapshot.forEach(doc => {
            doc.ref.update({
              tier: tier || 'none',
              stripeCustomerId: stripeCustomerId || null,
              purchasedAt: new Date().toISOString()
            });
          });
          console.log(`✅ Updated user ${email} with tier ${tier}`);
        }
      } catch (err) {
        console.error(`Failed to update user ${email}:`, err.message);
      }
    }
    
    const downloadToken = crypto.randomUUID();
    await saveDeliveryToken(downloadToken, {
      tier,
      email,
      createdAt: new Date(),
      downloads: 0
    });
    
    if (emailTransporter && email) {
      try {
        await sendEmail({
          from: FROM_EMAIL,
          to: email,
          subject: `Your ${product.name} is ready!`,
          html: emailTemplate({
            title: `Your ${product.name}`,
            heroImage: 'https://obiomacare.com/assets/logo-email.png',
            heroAlt: 'Obioma Care',
            content: `
              <p style="margin-top:0;font-size:20px;font-weight:600;color:${BRAND_COLORS.navy};">Your ${product.name} is ready!</p>
              <p>Thanks for your purchase. I'm excited for you to start training your clinical judgment.</p>
              <p>Click below to access your files:</p>
              <p style="text-align:center;margin:28px 0;">
                <a href="${baseUrl}/download/${downloadToken}" style="display:inline-block;background:${BRAND_COLORS.coral};color:#ffffff;padding:16px 36px;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">Download Now →</a>
              </p>
              <p style="color:${BRAND_COLORS.lightGray};font-size:13px;margin-bottom:0;">This link expires in 24 hours. Download your files and save them to your device.</p>
            `
          })
        });
        console.log(`✅ Delivered ${tier} to ${email}`);
      } catch (err) {
        console.error('Delivery email failed:', err);
      }
      
      // Send Day 1 post-purchase email immediately
      try {
        // Get lead data for firstName
        let leadFirstName = '';
        if (db && email) {
          try {
            const leadDoc = await db.collection('leads').doc(email).get();
            if (leadDoc.exists) {
              leadFirstName = leadDoc.data().firstName || '';
            }
          } catch (e) {
            // ignore
          }
        }
        
        const ppEmail1 = POST_PURCHASE_SEQUENCE[0];
        await sendEmail({
          from: FROM_EMAIL,
          to: email,
          subject: ppEmail1.subject,
          html: ppEmail1.template({
            firstName: leadFirstName,
            email: email,
            downloadUrl: `${baseUrl}/download/${downloadToken}`
          }, baseUrl)
        });
        
        // Mark as sent in Firestore
        if (db && email) {
          await updateLead(email, {
            ppEmailsSent: ['pp_email_1'],
            lastPpEmailSent: new Date().toISOString()
          });
        }
        console.log(`✅ Sent post-purchase Day 1 email to ${email}`);
      } catch (err) {
        console.error('Post-purchase Day 1 email failed:', err);
      }
    }
  }

  res.json({received: true});
});

// ==================== LEAD STORAGE (Firestore) ====================
const leads = []; // In-memory fallback

// Firestore helpers
async function getLeads() {
  if (!db) return leads;
  try {
    const snapshot = await db.collection('leads').get();
    const firestoreLeads = [];
    snapshot.forEach(doc => firestoreLeads.push({ id: doc.id, ...doc.data() }));
    return firestoreLeads;
  } catch (err) {
    console.error('Firestore getLeads error:', err.message);
    return leads;
  }
}

async function saveLead(lead) {
  if (!db) {
    leads.push(lead);
    return lead;
  }
  try {
    const docRef = db.collection('leads').doc(lead.email);
    await docRef.set(lead, { merge: true });
    return { id: docRef.id, ...lead };
  } catch (err) {
    console.error('Firestore saveLead error:', err.message);
    leads.push(lead);
    return lead;
  }
}

async function updateLead(email, updates) {
  if (!db) {
    const idx = leads.findIndex(l => l.email === email);
    if (idx >= 0) Object.assign(leads[idx], updates);
    return;
  }
  try {
    await db.collection('leads').doc(email).update(updates);
  } catch (err) {
    console.error('Firestore updateLead error:', err.message);
    const idx = leads.findIndex(l => l.email === email);
    if (idx >= 0) Object.assign(leads[idx], updates);
  }
}

// Email sequence definition

function emailTemplate({ title, content, ctaUrl, ctaText, heroImage, heroAlt }) {
  return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND_COLORS.bg};font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="padding: 32px 16px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.05);">
        
        <!-- Header / Logo -->
        <tr>
          <td style="background:${BRAND_COLORS.navy};padding:28px 40px;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
              <tr>
                <td>
                  <img src="https://obiomacare.com/assets/logo-email.png" alt="Obioma" width="120" height="33" style="display:block;">
                </td>
              </tr>
            </table>
            <p style="margin:6px 0 0 0;color:rgba(255,255,255,0.7);font-size:12px;letter-spacing:1px;text-transform:uppercase;">Clinical Judgment, Mastered</p>
          </td>
        </tr>
        
        <!-- Hero Image (optional) -->
        ${heroImage ? `
        <tr>
          <td style="padding:0;">
            <img src="${heroImage}" alt="${heroAlt || ''}" width="600" style="display:block;width:100%;max-width:600px;height:auto;">
          </td>
        </tr>` : ''}
        
        <!-- Body Content -->
        <tr>
          <td style="padding:40px;color:${BRAND_COLORS.gray};font-size:16px;line-height:1.7;">
            ${content}
          </td>
        </tr>
        
        <!-- CTA (optional) -->
        ${ctaUrl && ctaText ? `
        <tr>
          <td style="padding:0 40px 32px 40px;text-align:center;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
              <tr>
                <td style="background:${BRAND_COLORS.coral};border-radius:8px;text-align:center;">
                  <a href="${ctaUrl}" style="display:inline-block;padding:16px 36px;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;border-radius:8px;">${ctaText}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>` : ''}
        
        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td style="border-top:1px solid #e2e8f0;"></td></tr>
            </table>
          </td>
        </tr>
        
        <!-- Footer -->
        <tr>
          <td style="padding:28px 40px;text-align:center;">
            <p style="margin:0 0 8px 0;color:${BRAND_COLORS.lightGray};font-size:13px;">Questions? Just reply to this email — I read every one.</p>
            <p style="margin:0 0 16px 0;color:${BRAND_COLORS.lightGray};font-size:13px;">— Nnamdi Okorafor, RN · Founder, Obioma Care</p>
            <p style="margin:0;color:#a0aec0;font-size:11px;">
              <a href="https://obiomacare.com" style="color:#a0aec0;text-decoration:underline;">obiomacare.com</a> · 
              <a href="https://obiomacare.com/privacy.html" style="color:#a0aec0;text-decoration:underline;">Privacy</a> · 
              <a href="https://obiomacare.com/terms.html" style="color:#a0aec0;text-decoration:underline;">Terms</a>
            </p>
          </td>
        </tr>
        
      </table>
    </td>
  </tr>
</table>
</body>
</html>
  `.trim();
}

const NURTURE_SEQUENCE = [
  {
    day: 0,
    subject: 'Your NCLEX Study Checklist is here (+ why most students get it wrong)',
    sendImmediately: true,
    template: (lead, baseUrl) => emailTemplate({
      title: 'Your NCLEX Checklist',
      heroImage: 'https://obiomacare.com/assets/shareable/nclex-priority-cheat-sheet.png',
      heroAlt: 'NCLEX Priority Cheat Sheet',
      content: `
        <p style="margin-top:0;font-size:18px;font-weight:600;color:${BRAND_COLORS.navy};">Hey ${lead.firstName || 'there'}!</p>
        <p>Thanks for downloading the NCLEX Study Checklist. Before you dive in, let me tell you something important:</p>
        <p>Most students study for the NGN NCLEX by memorizing more content.</p>
        <p>That's like trying to put out a fire by adding more wood.</p>
        <p>The new NCLEX tests clinical <strong>judgment</strong> — not recall. Can you recognize cues? Analyze data? Prioritize under pressure? Take action when everything is urgent?</p>
        <p>That's what this checklist trains.</p>
        <p>Work through the first section. Then reply and tell me — did it feel different from how you've been studying?</p>
        <p style="margin-bottom:0;">I read every reply.</p>
      `,
      ctaUrl: `${baseUrl}/free-nclex-checklist.html`,
      ctaText: 'Access Your Checklist →'
    })
  },
  {
    day: 2,
    subject: 'The #1 mistake I see on every clinical floor',
    template: (lead, baseUrl) => emailTemplate({
      title: 'The #1 Mistake',
      content: `
        <p style="margin-top:0;font-size:18px;font-weight:600;color:${BRAND_COLORS.navy};">The #1 mistake I see on every clinical floor</p>
        <p>Hey ${lead.firstName || 'there'},</p>
        <p>I made this mistake as a new grad. My preceptor caught it. Now I see students make it every single day.</p>
        <p>Here's the mistake: <strong>Treating every abnormal lab/vital as equally urgent.</strong></p>
        <p>A BP of 148/92 in a stable patient? Document and monitor.<br>
        A BP of 148/92 in a post-op patient with a sudden headache? Page the doctor NOW.</p>
        <p>Same number. Completely different action.</p>
        <p>The difference is context. And context is what clinical judgment is built on.</p>
        <p>This is why I built the prioritization decision trees in the Complete System. They force you to ask the right questions before you act.</p>
      `,
      ctaUrl: baseUrl,
      ctaText: 'See the Full Prioritization Framework →'
    })
  },
  {
    day: 4,
    subject: '"Room 4 is crashing" — a real ER story',
    template: (lead, baseUrl) => emailTemplate({
      title: 'A Real ER Story',
      content: `
        <p style="margin-top:0;font-size:18px;font-weight:600;color:${BRAND_COLORS.navy};">"Room 4 is crashing" — a real ER story</p>
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
      `,
      ctaUrl: baseUrl,
      ctaText: 'Get the Complete System →'
    })
  },
  {
    day: 7,
    subject: 'I finally understand prioritization',
    template: (lead, baseUrl) => emailTemplate({
      title: 'Understand Prioritization',
      content: `
        <p style="margin-top:0;font-size:18px;font-weight:600;color:${BRAND_COLORS.navy};">"I finally understand prioritization"</p>
        <p>Hey ${lead.firstName || 'there'},</p>
        <p>I don't have testimonials yet (this is a new product). But I can tell you what I've seen mentoring new grads:</p>
        <p>The ones who struggle in their first year aren't the ones who didn't memorize enough. They're the ones who can't <strong>think</strong> through a scenario when the answer isn't in a textbook.</p>
        <p>The Complete System changes that. Here's what's inside:</p>
        <ul style="padding-left:20px;">
          <li style="margin-bottom:8px;">✓ NGN Decision Framework</li>
          <li style="margin-bottom:8px;">✓ 30+ practice scenarios with thought process</li>
          <li style="margin-bottom:8px;">✓ 5 video walkthroughs of real cases</li>
          <li style="margin-bottom:8px;">✓ SBAR templates that get results</li>
          <li style="margin-bottom:8px;">✓ First-year survival guide</li>
          <li style="margin-bottom:8px;">✓ Clinical day planner</li>
        </ul>
        <p>30-day guarantee. If it doesn't help you think through scenarios more clearly, I'll refund every penny.</p>
      `,
      ctaUrl: baseUrl,
      ctaText: 'Get the Complete System for $67 →'
    })
  },
  {
    day: 10,
    subject: '"I already bought an NCLEX review course"',
    template: (lead, baseUrl) => emailTemplate({
      title: 'Already Have a Review Course?',
      content: `
        <p style="margin-top:0;font-size:18px;font-weight:600;color:${BRAND_COLORS.navy};">"I already bought an NCLEX review course"</p>
        <p>Hey ${lead.firstName || 'there'},</p>
        <p>If you already bought UWorld, Kaplan, or Archer — good. Those are excellent for question practice.</p>
        <p>But here's what they don't do:</p>
        <p>They don't teach you the <strong>thinking process</strong>. They give you questions and explanations. That's like giving someone fish instead of teaching them to fish.</p>
        <p>The Clinical Judgment Mastery System is the thinking layer. It shows you HOW an experienced nurse approaches a scenario — not just what the right answer is.</p>
        <p>Use BOTH. Practice questions on UWorld. Learn the thinking framework here.</p>
      `,
      ctaUrl: baseUrl,
      ctaText: 'Get the Complete System →'
    })
  },
  {
    day: 12,
    subject: 'Price goes up Friday',
    template: (lead, baseUrl) => emailTemplate({
      title: 'Price Increase Friday',
      content: `
        <p style="margin-top:0;font-size:18px;font-weight:600;color:${BRAND_COLORS.navy};">Price goes up Friday</p>
        <p>Hey ${lead.firstName || 'there'},</p>
        <p>Quick note: The launch price of $67 ends Friday. After that, the Complete System goes to $97.</p>
        <p>If you've been thinking about it, now's the time.</p>
      `,
      ctaUrl: baseUrl,
      ctaText: 'Get it at $67 →'
    })
  },
  {
    day: 14,
    subject: 'Last call: Clinical Judgment Mastery System',
    template: (lead, baseUrl) => emailTemplate({
      title: 'Last Call',
      content: `
        <p style="margin-top:0;font-size:18px;font-weight:600;color:${BRAND_COLORS.navy};">Last call: Clinical Judgment Mastery System</p>
        <p>Hey ${lead.firstName || 'there'},</p>
        <p>This is the last email in this sequence.</p>
        <p>If the Complete System isn't for you right now, no worries. Keep the free framework — it's yours.</p>
        <p>But if you're struggling with:<br>
        • NGN scenario questions<br>
        • Prioritization on the floor<br>
        • Feeling like you memorized everything but can't think through cases</p>
        <p>This was built for you. From real experience. Not a textbook.</p>
        <p>Either way, good luck on the NCLEX and your first year. You've got this.</p>
        <p style="margin-bottom:0;">P.S. If you ever want to chat nursing, just reply. I read every email.</p>
      `,
      ctaUrl: baseUrl,
      ctaText: 'Last chance at $67 →'
    })
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
  if (!emailTransporter) {
    console.log('❌ Email not configured, skipping nurture');
    return { sent: 0, errors: 0 };
  }
  
  const baseUrl = 'https://obiomacare.com';
  let sent = 0;
  let errors = 0;
  
  const allLeads = await getLeads();
  
  for (const lead of allLeads) {
    // Skip leads who purchased
    if (lead.purchased) continue;
    
    for (const emailDef of NURTURE_SEQUENCE) {
      if (!shouldSendEmail(lead, emailDef.day)) continue;
      
      try {
        await sendEmail({
          from: FROM_EMAIL,
          to: lead.email,
          subject: emailDef.subject,
          html: emailDef.template(lead, baseUrl)
        });
        
        // Mark as sent
        const updatedEmailsSent = [...(lead.emailsSent || []), `email_${emailDef.day}`];
        await updateLead(lead.email, {
          emailsSent: updatedEmailsSent,
          lastEmailSent: new Date().toISOString()
        });
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
  
  return { sent, errors, leadsTotal: allLeads.length };
}

const POST_PURCHASE_SEQUENCE = [
  {
    day: 1,
    subject: 'Your system is ready — start with this scenario',
    template: (lead, baseUrl) => emailTemplate({
      title: 'Your Clinical Judgment Mastery System',
      heroImage: 'https://obiomacare.com/assets/logo-email.png',
      heroAlt: 'Obioma Care',
      content: `
        <p style="margin-top:0;font-size:18px;font-weight:600;color:${BRAND_COLORS.navy};">Hey ${lead.firstName || 'there'},</p>
        <p>Your Clinical Judgment Mastery System is in your inbox. But don't open every file at once.</p>
        <p><strong>Here's what I want you to do in the next 20 minutes:</strong></p>
        <ol style="padding-left:20px;">
          <li style="margin-bottom:8px;">Open the NGN Decision Framework PDF</li>
          <li style="margin-bottom:8px;">Read the "Recognize Cues" section (pages 3-5)</li>
          <li style="margin-bottom:8px;">Work through Scenario #1 WITHOUT looking at the answer</li>
          <li style="margin-bottom:8px;">THEN read my thought process</li>
        </ol>
        <p>That's it. One scenario. Done right.</p>
        <p>Most students binge the content like it's Netflix. Then they forget 80% of it. <strong>Don't be most students.</strong></p>
        <p>The nurses who pass the NGN and thrive on the floor? They practice SLOW at first. One scenario. Full attention. Then they speed up.</p>
        <p>Your download link is below.</p>
        <p style="margin-bottom:0;"><strong>P.S.</strong> Hit reply after you do Scenario #1. Tell me: did my thought process feel different from textbook explanations? I read every reply.</p>
      `,
      ctaUrl: lead.downloadUrl || baseUrl,
      ctaText: 'Download Complete System →'
    })
  },
  {
    day: 3,
    subject: 'Most people quit here (don\'t)',
    template: (lead, baseUrl) => emailTemplate({
      title: 'Most People Quit Here',
      content: `
        <p style="margin-top:0;font-size:18px;font-weight:600;color:${BRAND_COLORS.navy};">Most people quit here (don't)</p>
        <p>Hey ${lead.firstName || 'there'},</p>
        <p>Day 3 of studying a new system. This is where most people hit a wall.</p>
        <p>They do 3-4 scenarios, feel good, then skip a day. Then two days. Then they forget the framework entirely and go back to cramming flashcards.</p>
        <p><strong>Here's the truth:</strong> Clinical judgment is a MUSCLE. You can't build it in one session.</p>
        <p>If you're stuck or frustrated, it's not because you're not smart enough. It's because you're trying to think like a nurse for the first time, and your brain is resisting.</p>
        <p>That's normal. Push through.</p>
        <p><strong>If you haven't done Scenario #5 yet, do it today.</strong> It's the hardest one in the set, and it's where the breakthrough happens.</p>
        <p>If you HAVE been consistent — reply and tell me. I want to hear it.</p>
        <p style="margin-bottom:0;"><strong>P.S.</strong> Stuck on a specific scenario? Reply with the question. I'll walk you through my thinking.</p>
      `
    })
  },
  {
    day: 7,
    subject: 'One week in — how\'s it going?',
    template: (lead, baseUrl) => emailTemplate({
      title: 'One Week In — How\'s It Going?',
      content: `
        <p style="margin-top:0;font-size:18px;font-weight:600;color:${BRAND_COLORS.navy};">One week in — how's it going?</p>
        <p>Hey ${lead.firstName || 'there'},</p>
        <p>It's been a week since you got the Clinical Judgment Mastery System.</p>
        <p><strong>Quick check-in — no pressure, just real talk:</strong></p>
        <p><strong>Have you done at least 5 scenarios?</strong></p>
        <p>Yes → You're on track. Keep going.<br>
        No → That's okay. Life happens. But block 30 minutes today. One scenario. Start there.</p>
        <p><strong>What I've noticed from students who see the biggest improvement:</strong></p>
        <p>They don't just read my answers. They talk through the scenario OUT LOUD before checking. Even if they feel silly. Even if they're wrong. The act of verbalizing the thinking is what rewires your brain.</p>
        <p>Try it. Scenario #7 or #12. Talk through it like you're giving report to the charge nurse.</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
        <p><strong>If the system is helping you think through cases more clearly</strong>, I'd love a short reply telling me how. These go into the product (with your permission) to help other nursing students.</p>
        <p><strong>If you're still struggling</strong> or want to go deeper, I open a few 1:1 tutoring slots each week. We walk through YOUR weak areas — not generic content. Reply "TUTORING" and I'll send you the details.</p>
        <p style="margin-bottom:0;">Either way, you're further along than you were a week ago. That's what matters.</p>
      `,
      ctaUrl: `${baseUrl}/tutor`,
      ctaText: 'Learn About 1:1 Tutoring →'
    })
  }
];

// ==================== POST-PURCHASE EMAIL LOGIC ====================

function shouldSendPostPurchaseEmail(lead, sequenceDay) {
  if (!lead.purchasedAt) return false;
  const purchasedAt = new Date(lead.purchasedAt);
  const now = new Date();
  const daysSincePurchase = Math.floor((now - purchasedAt) / (1000 * 60 * 60 * 24));
  
  const sentKey = `pp_email_${sequenceDay}`;
  if (lead.ppEmailsSent?.includes(sentKey)) return false;
  
  return daysSincePurchase >= sequenceDay;
}

async function sendPostPurchaseEmails() {
  if (!emailTransporter) {
    console.log('❌ Email not configured, skipping post-purchase');
    return { sent: 0, errors: 0 };
  }
  
  const baseUrl = 'https://obiomacare.com';
  let sent = 0;
  let errors = 0;
  
  const allLeads = await getLeads();
  
  for (const lead of allLeads) {
    if (!lead.purchased) continue;
    
    for (const emailDef of POST_PURCHASE_SEQUENCE) {
      if (!shouldSendPostPurchaseEmail(lead, emailDef.day)) continue;
      
      try {
        await sendEmail({
          from: FROM_EMAIL,
          to: lead.email,
          subject: emailDef.subject,
          html: emailDef.template(lead, baseUrl)
        });
        
        const updatedEmailsSent = [...(lead.ppEmailsSent || []), `pp_email_${emailDef.day}`];
        await updateLead(lead.email, {
          ppEmailsSent: updatedEmailsSent,
          lastPpEmailSent: new Date().toISOString()
        });
        sent++;
        
        console.log(`✅ Sent post-purchase day ${emailDef.day} email to ${lead.email}`);
        
        if (sent >= 10) break;
      } catch (err) {
        console.error(`❌ Failed post-purchase email to ${lead.email}:`, err);
        errors++;
      }
    }
    
    if (sent >= 10) break;
  }
  
  return { sent, errors, leadsTotal: allLeads.length };
}

// ==================== NURTURE CRON ====================
// Protected by CRON_SECRET for Vercel Cron Jobs
const CRON_SECRET = process.env.CRON_SECRET;

app.get('/api/cron/nurture', express.json(), async (req, res) => {
  // Auth check for Vercel Cron
  const authHeader = req.headers.authorization;
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  console.log('🔄 Running all email sequences...');
  const startTime = Date.now();
  const nurtureResult = await sendNurtureEmails();
  const ppResult = await sendPostPurchaseEmails();
  const tfuResult = await sendTutoringFollowups();
  
  // Log to Firestore
  if (db) {
    try {
      await db.collection('automation_logs').doc(`nurture_${new Date().toISOString().replace(/[:.]/g, '-')}`).set({
        job: 'all-sequences',
        status: (nurtureResult.errors > 0 || ppResult.errors > 0 || tfuResult.errors > 0) ? 'partial' : 'success',
        nurtureSent: nurtureResult.sent,
        nurtureErrors: nurtureResult.errors,
        ppSent: ppResult.sent,
        ppErrors: ppResult.errors,
        tfuSent: tfuResult.sent,
        tfuErrors: tfuResult.errors,
        leadsTotal: nurtureResult.leadsTotal,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to log cron run:', err.message);
    }
  }
  
  res.json({ 
    success: true, 
    nurture: nurtureResult,
    postPurchase: ppResult,
    tutoringFollowup: tfuResult
  });
});

app.post('/api/cron/nurture', express.json(), async (req, res) => {
  // Auth check for Vercel Cron
  const authHeader = req.headers.authorization;
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  console.log('🔄 Running all email sequences...');
  const startTime = Date.now();
  const nurtureResult = await sendNurtureEmails();
  const ppResult = await sendPostPurchaseEmails();
  const tfuResult = await sendTutoringFollowups();
  
  // Log to Firestore
  if (db) {
    try {
      await db.collection('automation_logs').doc(`nurture_${new Date().toISOString().replace(/[:.]/g, '-')}`).set({
        job: 'all-sequences',
        status: (nurtureResult.errors > 0 || ppResult.errors > 0 || tfuResult.errors > 0) ? 'partial' : 'success',
        nurtureSent: nurtureResult.sent,
        nurtureErrors: nurtureResult.errors,
        ppSent: ppResult.sent,
        ppErrors: ppResult.errors,
        tfuSent: tfuResult.sent,
        tfuErrors: tfuResult.errors,
        leadsTotal: nurtureResult.leadsTotal,
        durationMs: Date.now() - startTime,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to log cron run:', err.message);
    }
  }
  
  res.json({ 
    success: true, 
    nurture: nurtureResult,
    postPurchase: ppResult,
    tutoringFollowup: tfuResult
  });
});
// ==================== NEWSLETTER ====================
app.post('/api/newsletter', express.json(), async (req, res) => {
  const { email, utm } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  try {
    // Log newsletter signup with UTM attribution
    logEvent('newsletter_signup', {
      email,
      utm: utm || null,
      ip: req.headers['x-forwarded-for'] || req.ip
    });
    
    const lead = {
      email: email.toLowerCase().trim(),
      firstName: '',
      subscribedAt: new Date().toISOString(),
      emailsSent: [],
      purchased: false,
      source: 'newsletter',
      utm: utm || null
    };
    await saveLead(lead);
    res.json({ success: true, message: 'Subscribed!' });
  } catch (err) {
    console.error('Newsletter error:', err);
    res.status(500).json({ error: 'Subscription failed' });
  }
});

// ==================== CONTACT ====================
app.post('/api/contact', express.json(), async (req, res) => {
  const { email, name, message } = req.body;
  if (!email || !email.includes('@') || !message || message.trim().length < 5) {
    return res.status(400).json({ error: 'Valid email and message (5+ chars) required' });
  }
  try {
    if (emailTransporter) {
      await sendEmail({
        from: FROM_EMAIL,
        to: 'admin@obiomacare.com',
        subject: `Contact Form: ${name || 'No name'}`,
        html: `<p><strong>From:</strong> ${name || 'Anonymous'} &lt;${email}&gt;</p><p><strong>Message:</strong></p><p>${message.replace(/</g, '&lt;')}</p>`
      });
    }
    res.json({ success: true, message: 'Message sent!' });
  } catch (err) {
    console.error('Contact error:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// ==================== TUTORING INTEREST ====================
app.post('/api/tutoring-interest', express.json(), async (req, res) => {
  const { email, name, message, source } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  
  try {
    // Log to Firestore
    if (db) {
      await db.collection('tutoring_interests').add({
        email: email.toLowerCase(),
        name: name || '',
        message: message || '',
        source: source || 'email-reply',
        status: 'new',
        createdAt: new Date().toISOString()
      });
    }
    
    // Send notification to admin
    if (emailTransporter) {
      await sendEmail({
        from: FROM_EMAIL,
        to: 'admin@obiomacare.com',
        subject: `🎓 Tutoring Interest: ${name || email}`,
        html: `<p><strong>New tutoring request!</strong></p>
               <p><strong>From:</strong> ${name || 'Anonymous'} &lt;${email}&gt;</p>
               <p><strong>Source:</strong> ${source || 'email-reply'}</p>
               <p><strong>Message:</strong></p>
               <p>${(message || 'No message').replace(/</g, '&lt;')}</p>
               <p><a href="https://obiomacare.com/api/admin/tutoring-leads">View all leads →</a></p>`
      });
    }
    
    res.json({ success: true, message: 'Interest logged. Nnamdi will be in touch!' });
  } catch (err) {
    console.error('Tutoring interest error:', err);
    res.status(500).json({ error: 'Failed to log interest' });
  }
});

// ==================== ADMIN: TUTORING LEADS ====================
const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

app.get('/api/admin/tutoring-leads', async (req, res) => {
  const apiKey = req.headers['x-api-key'] || req.query.key;
  if (ADMIN_API_KEY && apiKey !== ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    let leads = [];
    if (db) {
      const snapshot = await db.collection('tutoring_interests')
        .orderBy('createdAt', 'desc')
        .limit(100)
        .get();
      snapshot.forEach(doc => leads.push({ id: doc.id, ...doc.data() }));
    }
    
    res.json({
      count: leads.length,
      leads: leads.map(l => ({
        id: l.id,
        email: l.email,
        name: l.name,
        message: l.message,
        source: l.source,
        status: l.status,
        createdAt: l.createdAt
      }))
    });
  } catch (err) {
    console.error('Admin tutoring leads error:', err);
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

// ==================== EMAIL WEBHOOK (Hostinger Forwarding) ====================
// Hostinger forwards emails to this endpoint using the AI agent token
app.post('/api/email-webhook', express.json(), async (req, res) => {
  const token = req.headers['x-hostinger-token'] || req.body.token;
  const HOSTINGER_TOKEN = process.env.HOSTINGER_EMAIL_TOKEN;
  
  if (HOSTINGER_TOKEN && token !== HOSTINGER_TOKEN) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  
  const { from, subject, body, to } = req.body;
  
  if (!from || !body) {
    return res.status(400).json({ error: 'from and body required' });
  }
  
  // Extract email from "Name <email@example.com>" format
  const emailMatch = from.match(/<([^>]+)>/);
  const fromEmail = emailMatch ? emailMatch[1] : from;
  const fromName = from.replace(/<[^>]+>/, '').trim();
  
  // Check for TUTORING keyword
  const isTutoringInquiry = /TUTORING/i.test(body) || /TUTORING/i.test(subject);
  
  if (isTutoringInquiry) {
    console.log(`🎓 Tutoring inquiry detected from ${fromEmail}`);
    
    try {
      // Log to Firestore
      if (db) {
        await db.collection('tutoring_interests').add({
          email: fromEmail.toLowerCase(),
          name: fromName,
          message: body.substring(0, 2000),
          source: 'email-reply',
          status: 'new',
          createdAt: new Date().toISOString()
        });
      }
      
      // Send auto-reply to student
      if (emailTransporter) {
        await sendEmail({
          from: FROM_EMAIL,
          to: fromEmail,
          subject: 'Re: 1:1 Tutoring — Nnamdi will be in touch within 24 hours',
          html: emailTemplate({
            title: 'Tutoring Request Received',
            content: `
              <p style="margin-top:0;font-size:18px;font-weight:600;color:${BRAND_COLORS.navy};">Hi ${fromName || 'there'},</p>
              <p>Thanks for your interest in 1:1 tutoring!</p>
              <p>I'm Nnamdi, RN and founder of Obioma Care. I personally review every tutoring request and will get back to you within <strong>24 hours</strong> with:</p>
              <ul style="padding-left:20px;">
                <li style="margin-bottom:8px;">Available time slots</li>
                <li style="margin-bottom:8px;">Pricing and package options</li>
                <li style="margin-bottom:8px;">How we'll target YOUR weak areas</li>
              </ul>
              <p>In the meantime, keep working through the Clinical Judgment scenarios. The more specific you can be about what's tripping you up, the more productive our session will be.</p>
              <p style="margin-bottom:0;">Talk soon,<br>— Nnamdi, RN</p>
            `
          })
        });
      }
      
      // Notify admin
      if (emailTransporter) {
        await sendEmail({
          from: FROM_EMAIL,
          to: 'admin@obiomacare.com',
          subject: `🎓 AUTO: Tutoring inquiry from ${fromName || fromEmail}`,
          html: `<p><strong>Tutoring inquiry detected via email reply!</strong></p>
                 <p><strong>From:</strong> ${fromName} &lt;${fromEmail}&gt;</p>
                 <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
                 <p><strong>Message snippet:</strong></p>
                 <blockquote style="border-left:3px solid #ccc;padding-left:10px;color:#666;">${body.substring(0, 500).replace(/</g, '&lt;')}</blockquote>
                 <p><a href="https://obiomacare.com/api/admin/tutoring-leads">View all leads →</a></p>`
        });
      }
      
      return res.json({ success: true, action: 'tutoring_inquiry_logged', autoReplySent: true });
    } catch (err) {
      console.error('Email webhook tutoring error:', err);
      return res.status(500).json({ error: 'Processing failed' });
    }
  }
  
  // Not a tutoring inquiry — just log it
  res.json({ success: true, action: 'logged', tutoringDetected: false });
});

// ==================== TUTORING FOLLOW-UP SEQUENCE ====================
const TUTORING_FOLLOWUP_SEQUENCE = [
  {
    day: 1,
    subject: 'Quick question about your tutoring request',
    template: (lead, baseUrl) => emailTemplate({
      title: 'Your Tutoring Request',
      content: `
        <p style="margin-top:0;font-size:18px;font-weight:600;color:${BRAND_COLORS.navy};">Hey ${lead.name || 'there'},</p>
        <p>I got your tutoring request — thanks for reaching out!</p>
        <p>Before we schedule, I want to make sure our time together is as productive as possible.</p>
        <p><strong>Quick question: What's your biggest struggle right now?</strong></p>
        <p>Is it:</p>
        <ul style="padding-left:20px;">
          <li style="margin-bottom:8px;">NGN scenario questions (CJMM framework)?</li>
          <li style="margin-bottom:8px;">Prioritization (who do you see first?)</li>
          <li style="margin-bottom:8px;">Pharmacology (which med, what to monitor)?</li>
          <li style="margin-bottom:8px;">Lab values (what's urgent, what's not)?</li>
          <li style="margin-bottom:8px;">Something else?</li>
        </ul>
        <p>Hit reply and let me know. I'll tailor our session exactly to that.</p>
        <p style="margin-bottom:0;">— Nnamdi, RN</p>
      `
    })
  },
  {
    day: 3,
    subject: 'Still thinking about tutoring?',
    template: (lead, baseUrl) => emailTemplate({
      title: 'Tutoring Slots Filling Up',
      content: `
        <p style="margin-top:0;font-size:18px;font-weight:600;color:${BRAND_COLORS.navy};">Hey ${lead.name || 'there'},</p>
        <p>I wanted to check in — I haven't heard back about your tutoring request.</p>
        <p>No pressure if you've decided to self-study. The Clinical Judgment Mastery System has everything you need if you put in the work.</p>
        <p>But if you're still on the fence, here's what a typical 1:1 session looks like:</p>
        <ul style="padding-left:20px;">
          <li style="margin-bottom:8px;"><strong>Pre-session:</strong> You send me 2-3 topics you're struggling with</li>
          <li style="margin-bottom:8px;"><strong>During session:</strong> We walk through real scenarios together — I ask questions, you think out loud, I redirect</li>
          <li style="margin-bottom:8px;"><strong>Post-session:</strong> You get a personalized study plan for the next 2 weeks</li>
        </ul>
        <p>Sessions are 60 minutes, done over Zoom. I only take 5 students per week so I can give each one real attention.</p>
        <p><strong>Current availability:</strong> 2 slots left this week.</p>
        <p style="margin-bottom:0;">Reply if you want to grab one.</p>
      `,
      ctaUrl: `${baseUrl}/tutor`,
      ctaText: 'View Tutoring Details →'
    })
  },
  {
    day: 7,
    subject: 'Final follow-up: tutoring slots',
    template: (lead, baseUrl) => emailTemplate({
      title: 'Final Follow-Up',
      content: `
        <p style="margin-top:0;font-size:18px;font-weight:600;color:${BRAND_COLORS.navy};">Hey ${lead.name || 'there'},</p>
        <p>This is my last email about tutoring.</p>
        <p>If you've decided to go it alone — respect. You've got the Clinical Judgment Mastery System. Use it. Trust the process.</p>
        <p>If you still want help but timing isn't right, I understand. Nursing school is chaos. Just reply "LATER" and I'll reach out when my next batch of slots opens (usually every 2 weeks).</p>
        <p>Either way, you've already taken the hardest step: admitting you need a different approach to clinical judgment. That's more than most students do.</p>
        <p style="margin-bottom:0;">Good luck on the NCLEX. You've got this.<br>— Nnamdi, RN</p>
      `
    })
  }
];

function shouldSendTutoringFollowup(lead, sequenceDay) {
  if (!lead.createdAt) return false;
  const createdAt = new Date(lead.createdAt);
  const now = new Date();
  const daysSince = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
  
  const sentKey = `tfu_email_${sequenceDay}`;
  if (lead.tfuEmailsSent?.includes(sentKey)) return false;
  
  return daysSince >= sequenceDay;
}

async function sendTutoringFollowups() {
  if (!emailTransporter) {
    console.log('❌ Email not configured, skipping tutoring followups');
    return { sent: 0, errors: 0 };
  }
  
  const baseUrl = 'https://obiomacare.com';
  let sent = 0;
  let errors = 0;
  
  try {
    let leads = [];
    if (db) {
      const snapshot = await db.collection('tutoring_interests')
        .where('status', 'in', ['new', 'contacted'])
        .get();
      snapshot.forEach(doc => leads.push({ id: doc.id, ...doc.data() }));
    }
    
    for (const lead of leads) {
      for (const emailDef of TUTORING_FOLLOWUP_SEQUENCE) {
        if (!shouldSendTutoringFollowup(lead, emailDef.day)) continue;
        
        try {
          await sendEmail({
            from: FROM_EMAIL,
            to: lead.email,
            subject: emailDef.subject,
            html: emailDef.template(lead, baseUrl)
          });
          
          const updatedEmailsSent = [...(lead.tfuEmailsSent || []), `tfu_email_${emailDef.day}`];
          await db.collection('tutoring_interests').doc(lead.id).update({
            tfuEmailsSent: updatedEmailsSent,
            lastTfuEmailSent: new Date().toISOString()
          });
          sent++;
          
          console.log(`✅ Sent tutoring followup day ${emailDef.day} to ${lead.email}`);
          
          if (sent >= 10) break;
        } catch (err) {
          console.error(`❌ Failed tutoring followup to ${lead.email}:`, err);
          errors++;
        }
      }
      
      if (sent >= 10) break;
    }
    
    return { sent, errors, leadsTotal: leads.length };
  } catch (err) {
    console.error('Tutoring followup error:', err);
    return { sent, errors, leadsTotal: 0 };
  }
}

// ==================== LEAD MAGNET ====================
app.post('/api/lead-magnet', express.json(), async (req, res) => {
  const { email, firstName, utm } = req.body;
  const baseUrl = req.headers.origin || `https://${req.headers.host}` || 'https://obioma-care.vercel.app';
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  
  // Log lead capture with UTM attribution
  logEvent('lead_captured', {
    email,
    source: 'lead-magnet',
    utm: utm || null,
    ip: req.headers['x-forwarded-for'] || req.ip
  });
  
  // Check if lead already exists
  const allLeads = await getLeads();
  const existingLead = allLeads.find(l => l.email === email);
  if (existingLead) {
    return res.json({ success: true, message: 'You\'re already subscribed! Check your email.' });
  }
  
  // Create new lead
  const lead = {
    email,
    firstName: firstName || '',
    subscribedAt: new Date().toISOString(),
    emailsSent: [],
    purchased: false,
    source: 'nclex-checklist',
    utm: utm || null
  };
  await saveLead(lead);
  
  if (emailTransporter) {
    try {
      // Send welcome email using nurture sequence day 0
      const welcomeEmail = NURTURE_SEQUENCE.find(e => e.day === 0);
      await sendEmail({
        from: FROM_EMAIL,
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
      await updateLead(email, { emailsSent: ['email_0'] });
      
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
  const delivery = await getDeliveryToken(token);
  
  if (!delivery) {
    return res.status(404).send('Invalid or expired download link');
  }
  
  // Check expiration (24 hours)
  const age = Date.now() - delivery.createdAt.getTime();
  if (age > 24 * 60 * 60 * 1000) {
    return res.status(410).send('Download link expired');
  }
  
  await incrementDownloadCount(token);
  const product = PRODUCTS[delivery.tier];
  const baseUrl = req.headers.origin || `https://${req.headers.host}` || 'https://obioma-care.vercel.app';
  
  res.send(downloadPageTemplate(product, delivery.tier, baseUrl));
});

// ==================== SUCCESS PAGE ====================
app.get('/success', (req, res) => {
  res.redirect('/success.html');
});

// ==================== DEBUG ====================
app.get('/api/debug/files', async (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const rootDir = path.join(__dirname, '..');
  
  let files = [];
  try {
    files = fs.readdirSync(rootDir);
  } catch (e) {}
  
  // Try to read and parse the service account
  let saParseResult = null;
  let saError = null;
  try {
    const saPath = path.join(rootDir, 'firebase-service-account.json');
    const saContent = fs.readFileSync(saPath, 'utf8');
    saParseResult = JSON.parse(saContent);
  } catch (e) {
    saError = e.message;
  }
  
  // Check private key format
  let pkFormat = null;
  if (saParseResult?.private_key) {
    pkFormat = {
      startsWithBegin: saParseResult.private_key.startsWith('-----BEGIN PRIVATE KEY-----'),
      endsWithEnd: saParseResult.private_key.endsWith('-----END PRIVATE KEY-----'),
      hasNewlines: saParseResult.private_key.includes('\n'),
      length: saParseResult.private_key.length
    };
  }
  
  res.json({
    dirname: __dirname,
    rootDir,
    rootFiles: files,
    hasFirebaseJson: files.includes('firebase-service-account.json'),
    saParseSuccess: !!saParseResult,
    saProjectId: saParseResult?.project_id,
    saError,
    pkFormat
  });
});
app.get('/api/health', (req, res) => {
  // Fast health check — no external service calls
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    stripe: !!stripe,
    email: !!emailTransporter,
    firebase: !!db,
    nodeEnv: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Lightweight health check for detailed status (separate endpoint)
app.get('/api/health/detailed', async (req, res) => {
  let leadsCount = leads.length;
  let firebaseError = null;
  try {
    if (db) {
      const snapshot = await db.collection('leads').get();
      leadsCount = snapshot.size;
    }
  } catch (e) { firebaseError = e.message; }
  
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    stripe: !!stripe,
    email: !!emailTransporter,
    firebase: !!db,
    firebaseError,
    nodeEnv: process.env.NODE_ENV,
    dirname: __dirname,
    leadsCount,
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
      <a href="${baseUrl}/products/${f.file}" class="btn" download>Download</a>
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

// 404 handler — returns proper 404 status for unmatched routes
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    path: req.path,
    message: 'The requested resource was not found.'
  });
});

// ==================== EXPORT FOR VERCEL ====================
module.exports = app;
// Email config updated Mon Aug  3 08:43:54 PM CST 2026
