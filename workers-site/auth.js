/**
 * ObiomaCare Authentication System
 * Magic links + JWT sessions. No passwords. No external auth providers.
 *
 * Flow:
 * 1. POST /api/auth/send-link { email } → sends magic link via Resend
 * 2. GET /api/auth/verify?token=... → verifies token, sets JWT cookie
 * 3. GET /api/auth/me → returns current user from JWT
 * 4. POST /api/auth/logout → clears cookie
 */

// TIER constant (duplicated here to avoid circular import from api.js)
const TIER = {
  FREE: 'free',
  STUDENT_MONTHLY: 'student_monthly',
  STUDENT_ANNUAL: 'student_annual',
  LIFETIME: 'lifetime',
  INSTITUTIONAL_INSTRUCTOR: 'institutional_instructor',
  INSTITUTIONAL_STUDENT: 'institutional_student',
};

// ─── ENV HELPER (service worker globals fallback) ───
function getEnvVar(env, name) {
  // Module format: env.SECRET
  if (env && env[name]) return env[name];
  // Service worker format: global SECRET
  try { return globalThis[name]; } catch { }
  try { return self[name]; } catch { }
  return undefined;
}

function base64urlEncode(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(str) {
  const padding = '='.repeat((4 - str.length % 4) % 4);
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/') + padding;
  const binary = atob(base64);
  return Uint8Array.from(binary, c => c.charCodeAt(0));
}

async function importKey(secret) {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign', 'verify']
  );
}

async function signJWT(payload, secret) {
  const encoder = new TextEncoder();
  const key = await importKey(secret);
  const header = base64urlEncode(encoder.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = base64urlEncode(encoder.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${body}`));
  return `${header}.${body}.${base64urlEncode(sig)}`;
}

async function verifyJWT(token, secret) {
  const [headerB64, bodyB64, sigB64] = token.split('.');
  if (!headerB64 || !bodyB64 || !sigB64) throw new Error('Malformed JWT');

  const encoder = new TextEncoder();
  const key = await importKey(secret);
  const valid = await crypto.subtle.verify(
    'HMAC', key,
    base64urlDecode(sigB64),
    encoder.encode(`${headerB64}.${bodyB64}`)
  );
  if (!valid) throw new Error('Invalid signature');

  const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(bodyB64)));
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('Token expired');
  }
  return payload;
}

// ─── COOKIE UTILS ───

function getCookie(request, name) {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name, value, options = {}) {
  const { maxAge, httpOnly = true, secure = true, sameSite = 'lax', path = '/' } = options;
  let cookie = `${name}=${encodeURIComponent(value)}; Path=${path}`;
  if (maxAge) cookie += `; Max-Age=${maxAge}`;
  if (httpOnly) cookie += '; HttpOnly';
  if (secure) cookie += '; Secure';
  cookie += `; SameSite=${sameSite}`;
  return cookie;
}

function clearCookie(name, path = '/') {
  return `${name}=; Path=${path}; Max-Age=0; HttpOnly; Secure; SameSite=lax`;
}

// ─── USER KV HELPERS ───

function getUsersKV(env) {
  // Try module format first, then service worker global
  if (env && env.users) return env.users;
  try { return users; } catch { return null; }
}

async function getUser(env, email) {
  const kv = getUsersKV(env);
  if (!kv) return null;
  const data = await kv.get(`user:${email.toLowerCase()}`);
  return data ? JSON.parse(data) : null;
}

async function setUser(env, email, userData) {
  const kv = getUsersKV(env);
  if (!kv) throw new Error('Users KV not bound');
  await kv.put(`user:${email.toLowerCase()}`, JSON.stringify(userData));
}

async function getMagicLink(env, token) {
  const kv = getUsersKV(env);
  if (!kv) return null;
  const data = await kv.get(`magic:${token}`);
  return data ? JSON.parse(data) : null;
}

async function setMagicLink(env, token, email, ttlSeconds = 600) {
  const kv = getUsersKV(env);
  if (!kv) throw new Error('Users KV not bound');
  await kv.put(`magic:${token}`, JSON.stringify({ email, createdAt: Date.now() }), { expirationTtl: ttlSeconds });
}

// ─── EMAIL (Resend) ───

async function sendMagicLinkEmail(email, token, env) {
  const resendKey = getEnvVar(env, 'RESEND_API_KEY');
  if (!resendKey) {
    console.warn(`[Auth] RESEND_API_KEY not set. Magic link for ${email}: /api/auth/verify?token=${token}`);
    return { sent: false, reason: 'RESEND_API_KEY not configured', token };
  }

  const appUrl = getEnvVar(env, 'APP_URL') || 'https://obiomacare.com';
  const verifyUrl = `${appUrl}/api/auth/verify?token=${token}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.FROM_EMAIL || 'ObiomaCare <auth@obiomacare.com>',
      to: email,
      subject: 'Your ObiomaCare Login Link',
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px">
          <h2 style="color:#1a1a2e">Log in to ObiomaCare</h2>
          <p>Click the button below to log in. This link expires in 10 minutes.</p>
          <a href="${verifyUrl}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:12px 24px;border-radius:6px;margin:16px 0">Log In to ObiomaCare</a>
          <p style="color:#666;font-size:14px">Or copy this URL:<br><code style="background:#f4f4f5;padding:8px;border-radius:4px;word-break:break-all">${verifyUrl}</code></p>
          <p style="color:#666;font-size:12px;margin-top:24px">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
      text: `Log in to ObiomaCare: ${verifyUrl}\n\nThis link expires in 10 minutes.`,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[Auth] Resend failed:', err);
    return { sent: false, reason: err };
  }

  return { sent: true };
}

// ─── AUTH MIDDLEWARE ───

async function getAuthUser(request, env) {
  const jwtSecret = getEnvVar(env, 'JWT_SECRET');
  if (!jwtSecret) return null;

  const token = getCookie(request, 'obioma_session');
  if (!token) return null;

  try {
    const payload = await verifyJWT(token, jwtSecret);
    const user = await getUser(env, payload.sub);
    if (!user) return null;
    return user;
  } catch (err) {
    return null;
  }
}

// ─── ROUTE HANDLERS ───

async function handleSendLink(request, env) {
  const body = await request.json().catch(() => ({}));
  const { email } = body;

  if (!email || !email.includes('@')) {
    return jsonResponse({ error: 'Valid email required' }, 400);
  }

  const jwtSecret = getEnvVar(env, 'JWT_SECRET');
  if (!jwtSecret) {
    return jsonResponse({ error: 'Auth not configured (JWT_SECRET missing)' }, 500);
  }

  // Generate token (URL-safe random)
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = base64urlEncode(tokenBytes);

  // Store in KV (10 min expiry)
  await setMagicLink(env, token, email);

  // Send email
  const result = await sendMagicLinkEmail(email, token, env);

  return jsonResponse({
    success: true,
    message: result.sent
      ? 'Check your email for the login link.'
      : 'Email service not configured. Contact support.',
    // In dev/test mode, include token for testing
    ...(env.NODE_ENV === 'development' || !result.sent ? { _token: token } : {}),
  });
}

async function handleVerify(request, env) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return Response.redirect(`${env.APP_URL || 'https://obiomacare.com'}/login?error=missing_token`, 302);
  }

  const linkData = await getMagicLink(env, token);
  if (!linkData) {
    const appUrl = getEnvVar(env, 'APP_URL') || 'https://obiomacare.com';
    return Response.redirect(`${appUrl}/login?error=invalid_token`, 302);
  }

  const jwtSecret = getEnvVar(env, 'JWT_SECRET');
  if (!jwtSecret) {
    return Response.redirect(`${getEnvVar(env, 'APP_URL') || 'https://obiomacare.com'}/login?error=not_configured`, 302);
  }

  const email = linkData.email;

  // Get or create user
  let user = await getUser(env, email);
  if (!user) {
    user = {
      email,
      tier: TIER.FREE,
      stripeCustomerId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  }

  // Update last login
  user.lastLoginAt = Date.now();
  await setUser(env, email, user);

  // Create JWT (7 day expiry)
  const jwtPayload = {
    sub: email,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    tier: user.tier,
  };
  const jwt = await signJWT(jwtPayload, jwtSecret);

  const appUrl = getEnvVar(env, 'APP_URL') || 'https://obiomacare.com';
  const response = Response.redirect(`${appUrl}/account`, 302);
  response.headers.set('Set-Cookie', setCookie('obioma_session', jwt, { maxAge: 7 * 24 * 60 * 60 }));
  return response;
}

async function handleMe(request, env) {
  const user = await getAuthUser(request, env);
  if (!user) {
    return jsonResponse({ error: 'Not authenticated' }, 401);
  }

  return jsonResponse({
    user: {
      email: user.email,
      tier: user.tier,
      stripeCustomerId: user.stripeCustomerId,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    },
  });
}

async function handleLogout(request, env) {
  const response = jsonResponse({ success: true });
  response.headers.set('Set-Cookie', clearCookie('obioma_session'));
  return response;
}

// ─── UPDATED USER TIER (auth-aware) ───

async function handleUserTier(request, env) {
  const user = await getAuthUser(request, env);

  if (!user) {
    return jsonResponse({
      tier: TIER.FREE,
      subscriptionStatus: 'none',
      features: getEntitlements(TIER.FREE),
      authenticated: false,
    });
  }

  return jsonResponse({
    tier: user.tier,
    subscriptionStatus: user.stripeCustomerId ? 'active' : 'none',
    features: getEntitlements(user.tier),
    authenticated: true,
    email: user.email,
  });
}

// Helper copied from api.js (avoid circular dep issues)
function getEntitlements(tier) {
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

  const result = {};
  for (const [feature, config] of Object.entries(FEATURES)) {
    const val = config[tier];
    result[feature] = val !== undefined ? val : false;
  }
  return result;
}

// ─── EXPORTS ───

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export {
  getAuthUser,
  handleSendLink,
  handleVerify,
  handleMe,
  handleLogout,
  handleUserTier,
};
