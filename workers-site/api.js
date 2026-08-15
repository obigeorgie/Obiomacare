/**
 * Worker-native Subscription API
 * Tiers match config/pricing.js exactly. Test mode only.
 * Uses Stripe REST API via fetch (no Node.js SDK).
 */

import { routeReadiness } from './api-readiness.js';
import { getAuthUser, handleSendLink, handleVerify, handleMe, handleLogout, handleUserTier as handleAuthUserTier } from './auth.js';
import { handleSRNext, handleSRAnswer, handleSRStats, handleSRAddCard, handleSRImportFromReadiness } from './api-sr.js';
import { handleCreateCohort, handleListCohorts, handleJoinCohort, handleGetCohort, handleAssignContent, handleSubmitAnalytics } from './api-institution.js';

// ─── TIER ENUM — must match config/pricing.js exactly ───
const TIER = {
  FREE: 'free',
  STUDENT_MONTHLY: 'student_monthly',
  STUDENT_ANNUAL: 'student_annual',
  LIFETIME: 'lifetime',
  INSTITUTIONAL_INSTRUCTOR: 'institutional_instructor',
  INSTITUTIONAL_STUDENT: 'institutional_student',
};

// ─── PLAN DEFINITIONS — synced from config/pricing.js ───
const PLANS = {
  [TIER.STUDENT_MONTHLY]: {
    name: 'Student Monthly',
    price: 19,
    interval: 'month',
    trialDays: 7,
    stripePriceId: null, // Set via env for live mode
  },
  [TIER.STUDENT_ANNUAL]: {
    name: 'Student Annual',
    price: 99,
    interval: 'year',
    trialDays: 14,
    stripePriceId: null,
  },
  [TIER.LIFETIME]: {
    name: 'Lifetime',
    price: 47,
    interval: 'once',
    trialDays: 0,
    stripePriceId: null,
  },
};

// Valid checkout tiers (must have a price ID or be in test mode)
const CHECKOUT_TIERS = Object.keys(PLANS);

// ─── FEATURE ENTITLEMENTS ───
const FEATURES = {
  questionBank: { free: true, student_monthly: true, student_annual: true, lifetime: true, institutional_instructor: true, institutional_student: true },
  caseEngine: { free: true, student_monthly: true, student_annual: true, lifetime: true, institutional_instructor: true, institutional_student: true },
  readiness: { free: false, student_monthly: true, student_annual: true, lifetime: true, institutional_instructor: true, institutional_student: true },
  spacedRepetition: { free: false, student_monthly: true, student_annual: true, lifetime: true, institutional_instructor: true, institutional_student: true },
  progressSync: { free: false, student_monthly: true, student_annual: true, lifetime: true, institutional_instructor: true, institutional_student: true },
  tutorCredits: { free: 0, student_monthly: 5, student_annual: 5, lifetime: -1, institutional_instructor: -1, institutional_student: 5 },
  analytics: { free: false, student_monthly: true, student_annual: true, lifetime: true, institutional_instructor: true, institutional_student: true },
  printPdfs: { free: false, student_monthly: true, student_annual: true, lifetime: true, institutional_instructor: true, institutional_student: true },
  support: { free: 'community', student_monthly: 'priority', student_annual: 'priority', lifetime: 'priority', institutional_instructor: 'dedicated', institutional_student: 'priority' },
  liveReview: { free: false, student_monthly: false, student_annual: false, lifetime: false, institutional_instructor: true, institutional_student: false },
  cmeCredits: { free: false, student_monthly: false, student_annual: false, lifetime: false, institutional_instructor: true, institutional_student: false },
  sso: { free: false, student_monthly: false, student_annual: false, lifetime: false, institutional_instructor: true, institutional_student: false },
};

function hasAccess(tier, feature) {
  const config = FEATURES[feature];
  if (!config) return false;
  const val = config[tier];
  if (typeof val === 'number') return val !== 0;
  return val !== false && val !== undefined;
}

function getEntitlements(tier) {
  const result = {};
  for (const [feature, config] of Object.entries(FEATURES)) {
    const val = config[tier];
    result[feature] = val !== undefined ? val : false;
  }
  return result;
}

// ─── STRIPE API (HTTP fetch) ───
async function stripeRequest(path, opts = {}, stripeKey) {
  const url = `https://api.stripe.com/v1${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Authorization': `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      ...opts.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Stripe API error');
  return data;
}

// ─── ROUTE HANDLERS ───

async function handleUserTier(request) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  const uid = url.searchParams.get('uid');

  // For now, return free tier (no Firestore in Worker)
  const tier = TIER.FREE;

  return jsonResponse({
    tier,
    subscriptionStatus: 'active',
    features: getEntitlements(tier),
    hasAccess: (feature) => hasAccess(tier, feature),
    _note: 'Worker-native API. User lookup via Firestore not yet wired.',
  });
}

async function handleCreateCheckout(request, env) {
  const body = await request.json().catch(() => ({}));
  const { tier, email, successUrl, cancelUrl } = body;
  const plan = PLANS[tier];

  if (!plan) {
    return jsonResponse({
      error: 'Invalid tier',
      validTiers: CHECKOUT_TIERS,
      received: tier,
    }, 400);
  }

  // Test mode: return mock checkout URL
  if (!plan.stripePriceId || !env.STRIPE_SECRET_KEY) {
    const baseUrl = successUrl || 'https://obiomacare.com';
    return jsonResponse({
      url: `${baseUrl}/success?test_mode=1&tier=${tier}&email=${encodeURIComponent(email || '')}`,
      testMode: true,
      tier,
      plan: plan.name,
      message: 'Stripe test mode — no real charge. Configure STRIPE_SECRET_KEY and STRIPE_PRICE_* for live checkout.',
    });
  }

  try {
    const params = new URLSearchParams();
    params.append('payment_method_types[]', 'card');
    params.append('line_items[0][price]', plan.stripePriceId);
    params.append('line_items[0][quantity]', '1');
    params.append('mode', plan.interval === 'once' ? 'payment' : 'subscription');
    params.append('success_url', successUrl || 'https://obiomacare.com/success?session_id={CHECKOUT_SESSION_ID}');
    params.append('cancel_url', cancelUrl || 'https://obiomacare.com/pricing');
    params.append('metadata[tier]', tier);
    params.append('metadata[planName]', plan.name);
    params.append('metadata[source]', 'pricing_page');

    if (email) params.append('customer_email', email);
    if (plan.trialDays && plan.interval !== 'once') {
      params.append('subscription_data[trial_period_days]', String(plan.trialDays));
    }

    const session = await stripeRequest('/checkout/sessions', {
      method: 'POST',
      body: params.toString(),
    }, env.STRIPE_SECRET_KEY);

    return jsonResponse({ url: session.url });
  } catch (err) {
    return jsonResponse({ error: 'Checkout failed', details: err.message }, 500);
  }
}

async function handlePortal(request, env) {
  const body = await request.json().catch(() => ({}));
  const { customerId } = body;

  if (!customerId) {
    return jsonResponse({ error: 'customerId required' }, 400);
  }

  if (!env.STRIPE_SECRET_KEY) {
    return jsonResponse({
      url: 'https://obiomacare.com/account',
      testMode: true,
      message: 'Stripe test mode — no portal available.',
    });
  }

  try {
    const params = new URLSearchParams();
    params.append('customer', customerId);
    params.append('return_url', 'https://obiomacare.com/account');

    const session = await stripeRequest('/billing_portal/sessions', {
      method: 'POST',
      body: params.toString(),
    }, env.STRIPE_SECRET_KEY);

    return jsonResponse({ url: session.url });
  } catch (err) {
    return jsonResponse({ error: 'Portal failed', details: err.message }, 500);
  }
}

async function handleWebhook(request, env) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  try {
    event = JSON.parse(payload);
  } catch (err) {
    return jsonResponse({ error: 'Invalid payload' }, 400);
  }

  console.log(`[Webhook] ${event.type}`, event.data?.object?.id);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const tier = session.metadata?.tier;
      const email = session.customer_email || session.customer_details?.email;
      console.log(`[Webhook] Subscription created: ${tier} for ${email}`);
      break;
    }
    case 'invoice.payment_failed': {
      console.log(`[Webhook] Payment failed: ${event.data.object.subscription}`);
      break;
    }
    case 'customer.subscription.deleted': {
      console.log(`[Webhook] Subscription canceled: ${event.data.object.id}`);
      break;
    }
  }

  return jsonResponse({ received: true, type: event.type });
}

async function handleHealth() {
  return jsonResponse({
    status: 'ok',
    api: 'obiomacare-subscriptions',
    version: '1.1.0',
    mode: 'test',
    timestamp: new Date().toISOString(),
  });
}

// ─── UTILS ───

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// ─── MAIN ROUTER ───

export async function routeApi(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    switch (path) {
      case '/api/health':
        return await handleHealth();
      case '/api/user-tier':
        return await handleAuthUserTier(request, env);
      case '/api/create-subscription-checkout':
        if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
        return await handleCreateCheckout(request, env);
      case '/api/customer-portal':
        if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
        return await handlePortal(request, env);
      case '/api/webhook':
        if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
        return await handleWebhook(request, env);
      case '/api/auth/send-link':
        if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
        return await handleSendLink(request, env);
      case '/api/auth/verify':
        if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);
        return await handleVerify(request, env);
      case '/api/auth/me':
        if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);
        return await handleMe(request, env);
      case '/api/auth/logout':
        if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
        return await handleLogout(request, env);

      // ─── SPACED REPETITION ───
      case '/api/sr/next':
        if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);
        return await handleSRNext(request, env);
      case '/api/sr/answer':
        if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
        return await handleSRAnswer(request, env);
      case '/api/sr/stats':
        if (request.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405);
        return await handleSRStats(request, env);
      case '/api/sr/add-card':
        if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
        return await handleSRAddCard(request, env);
      case '/api/sr/import-readiness':
        if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
        return await handleSRImportFromReadiness(request, env);

      // ─── INSTITUTIONAL DASHBOARD ───
      case '/api/institution/cohorts':
        if (request.method === 'GET') return await handleListCohorts(request, env);
        if (request.method === 'POST') return await handleCreateCohort(request, env);
        return jsonResponse({ error: 'Method not allowed' }, 405);
      case '/api/institution/join':
        if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405);
        return await handleJoinCohort(request, env);

      default:
        // Institution sub-routes with path params
        if (path.startsWith('/api/institution/cohort/')) {
          if (path.endsWith('/assign') && request.method === 'POST') {
            return await handleAssignContent(request, env);
          }
          if (request.method === 'GET') {
            return await handleGetCohort(request, env);
          }
          return jsonResponse({ error: 'Method not allowed' }, 405);
        }
        if (path.startsWith('/api/institution/analytics/')) {
          if (request.method === 'POST') return await handleSubmitAnalytics(request, env);
          return jsonResponse({ error: 'Method not allowed' }, 405);
        }

        // Try readiness routes
        const readinessResponse = await routeReadiness(request, env);
        if (readinessResponse) return readinessResponse;
        return null; // Not an API route
    }
  } catch (err) {
    console.error('API error:', err);
    return jsonResponse({ error: 'Internal error', details: err.message }, 500);
  }
}
