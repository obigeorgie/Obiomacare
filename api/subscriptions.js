/**
 * Subscription Module — Stripe subscriptions, tier gating, webhooks
 * Test mode only. No live keys touched.
 */

const { TIER, PLANS, FEATURE, hasAccess } = require('../config/pricing');

// Stripe instance will be injected from parent
let stripe = null;
let db = null;

function init(stripeInstance, firestoreDb) {
  stripe = stripeInstance;
  db = firestoreDb;
}

// ─── CHECKOUT ───
async function createSubscriptionCheckout(req, res) {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });

  const { tier, email, successUrl, cancelUrl } = req.body;
  const plan = PLANS[tier];

  if (!plan || !plan.stripePriceId || plan.stripePriceId.startsWith('price_test')) {
    // Test mode: return mock URL for development
    console.log('[TEST MODE] Subscription checkout requested:', { tier, email });
    return res.json({
      url: `${successUrl || req.headers.origin || 'https://obiomacare.com'}/success?test_mode=1&tier=${tier}&email=${encodeURIComponent(email || '')}`,
      testMode: true,
      message: 'Stripe test mode — no real charge. Set STRIPE_PRICE_MONTHLY/ANNUAL env vars for live checkout.'
    });
  }

  try {
    const baseUrl = req.headers.origin || `https://${req.headers.host}` || 'https://obiomacare.com';
    
    // Log event
    await logEvent('subscription_checkout_initiated', {
      tier,
      email: email || null,
      ip: req.headers['x-forwarded-for'] || req.ip,
    });

    const sessionConfig = {
      payment_method_types: ['card'],
      line_items: [{
        price: plan.stripePriceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: successUrl || `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${baseUrl}/pricing`,
      metadata: {
        tier,
        planName: plan.name,
        source: 'pricing_page',
      },
    };

    if (email) sessionConfig.customer_email = email;
    if (plan.trialDays > 0) {
      sessionConfig.subscription_data = {
        trial_period_days: plan.trialDays,
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    res.json({ url: session.url });
  } catch (err) {
    console.error('Subscription checkout error:', err);
    res.status(500).json({ error: 'Checkout failed', details: err.message });
  }
}

// ─── WEBHOOKS ───
async function handleSubscriptionWebhook(event) {
  const type = event.type;
  const data = event.data.object;

  console.log(`[Webhook] ${type}`, data.id);

  switch (type) {
    case 'checkout.session.completed': {
      const session = data;
      const tier = session.metadata?.tier;
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      const email = session.customer_email || session.customer_details?.email;

      if (!tier || !subscriptionId) {
        console.log('[Webhook] Missing tier or subscriptionId, skipping');
        return;
      }

      // Log conversion
      await logEvent('subscription_created', {
        tier,
        email: email || null,
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
      });

      // Update user in Firestore
      if (email && db) {
        try {
          const userSnapshot = await db.collection('users').where('email', '==', email).get();
          if (!userSnapshot.empty) {
            userSnapshot.forEach(doc => {
              doc.ref.update({
                tier,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                subscriptionStatus: 'active',
                subscribedAt: new Date().toISOString(),
              });
            });
          } else {
            // Create lead record
            await db.collection('leads').doc(email).set({
              email,
              tier,
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              subscriptionStatus: 'active',
              subscribedAt: new Date().toISOString(),
            }, { merge: true });
          }
        } catch (err) {
          console.error('Failed to update user on subscription:', err.message);
        }
      }
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = data;
      const customerId = invoice.customer;
      const subscriptionId = invoice.subscription;

      await logEvent('subscription_payment_failed', {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        attemptCount: invoice.attempt_count,
      });

      // Set grace period
      if (db && customerId) {
        try {
          const userSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).get();
          userSnapshot.forEach(doc => {
            doc.ref.update({
              subscriptionStatus: 'past_due',
              gracePeriodEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days grace
            });
          });
        } catch (err) {
          console.error('Failed to set grace period:', err.message);
        }
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = data;
      const customerId = subscription.customer;

      await logEvent('subscription_canceled', {
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        cancelReason: subscription.cancellation_details?.reason || 'unknown',
      });

      // Downgrade to free (preserve data)
      if (db && customerId) {
        try {
          const userSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).get();
          userSnapshot.forEach(doc => {
            doc.ref.update({
              tier: TIER.FREE,
              subscriptionStatus: 'canceled',
              previousTier: doc.data().tier,
              canceledAt: new Date().toISOString(),
            });
          });
        } catch (err) {
          console.error('Failed to downgrade user:', err.message);
        }
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = data;
      const status = subscription.status;
      const customerId = subscription.customer;

      if (db && customerId) {
        try {
          const userSnapshot = await db.collection('users').where('stripeCustomerId', '==', customerId).get();
          userSnapshot.forEach(doc => {
            doc.ref.update({
              subscriptionStatus: status,
              currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
            });
          });
        } catch (err) {
          console.error('Failed to update subscription status:', err.message);
        }
      }
      break;
    }
  }
}

// ─── CUSTOMER PORTAL ───
async function createPortalSession(req, res) {
  if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });

  const { customerId } = req.body;
  if (!customerId) return res.status(400).json({ error: 'customerId required' });

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${req.headers.origin || 'https://obiomacare.com'}/account`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Portal error:', err);
    res.status(500).json({ error: 'Portal failed' });
  }
}

// ─── TIER CHECK (for gating) ───
async function getUserTier(req, res) {
  const { email, uid } = req.query;
  
  if (!db) return res.json({ tier: TIER.FREE, features: ENTITLEMENTS[TIER.FREE] });

  try {
    let userDoc = null;
    
    if (uid) {
      const doc = await db.collection('users').doc(uid).get();
      if (doc.exists) userDoc = doc.data();
    } else if (email) {
      const snapshot = await db.collection('users').where('email', '==', email).limit(1).get();
      if (!snapshot.empty) userDoc = snapshot.docs[0].data();
    }

    const tier = userDoc?.tier || TIER.FREE;
    const status = userDoc?.subscriptionStatus || 'active';
    
    // Check grace period
    let effectiveTier = tier;
    if (status === 'past_due' && userDoc?.gracePeriodEndsAt) {
      const graceEnd = new Date(userDoc.gracePeriodEndsAt);
      if (graceEnd > new Date()) {
        effectiveTier = tier; // Still has access during grace
      } else {
        effectiveTier = TIER.FREE; // Grace expired
      }
    }

    res.json({
      tier: effectiveTier,
      subscriptionStatus: status,
      features: ENTITLEMENTS[effectiveTier] || ENTITLEMENTS[TIER.FREE],
      hasAccess: (feature) => hasAccess(effectiveTier, feature),
    });
  } catch (err) {
    console.error('Tier check error:', err);
    res.json({ tier: TIER.FREE, features: ENTITLEMENTS[TIER.FREE] });
  }
}

// ─── ANALYTICS LOGGING ───
async function logEvent(eventType, data) {
  console.log(`[Analytics] ${eventType}`, data);
  if (!db) return;
  try {
    await db.collection('analytics_events').add({
      event: eventType,
      timestamp: new Date().toISOString(),
      ...data,
    });
  } catch (err) {
    console.error('Analytics log failed:', err.message);
  }
}

module.exports = {
  init,
  createSubscriptionCheckout,
  handleSubscriptionWebhook,
  createPortalSession,
  getUserTier,
  logEvent,
};
