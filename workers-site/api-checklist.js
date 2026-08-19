/**
 * Revenue OS Phase 2 — email capture & nurture (Resend).
 * Fences (owner): checklist email-gated; 5-email sequence E0/E2/E4/E7/E10;
 * CAN-SPAM compliant unsubscribe; no purchased lists; TEST-MODE sends to
 * owner only until sequence copy approved email-by-email.
 *
 * Storage: KV `events` namespace is canonical for sequence state:
 *   seq:<email> -> { email, firstName, step (0..4), created, lastSent, nextAt }
 */
import { getBinding } from './api-events.js'
import { SEQUENCE } from './email-copy.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Test-mode guard: when NURTURE_TEST_MODE=1, ONLY the owner inbox receives nurture emails. */
function isTestMode(env) {
  return getBinding(env, 'NURTURE_TEST_MODE') === '1'
}
function isOwner(env, email) {
  const admin = getBinding(env, 'ADMIN_EMAIL')
  return !!admin && admin.toLowerCase() === String(email).toLowerCase()
}

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

async function resend(env, path, method = 'GET', body = null) {
  const key = getBinding(env, 'RESEND_API_KEY')
  if (!key) throw new Error('RESEND_API_KEY not configured')
  const r = await fetch('https://api.resend.com' + path, {
    method,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await r.text()
  let data = null
  try { data = JSON.parse(text) } catch (e) {}
  return { status: r.status, data }
}

async function ensureAudience(env) {
  const explicit = getBinding(env, 'CHECKLIST_AUDIENCE_ID')
  if (explicit) return explicit
  // find or create the "checklist" audience
  const list = await resend(env, '/audiences')
  const existing = list.data && list.data.data && list.data.data.find(a => a.name === 'checklist')
  if (existing) return existing.id
  const created = await resend(env, '/audiences', 'POST', { name: 'checklist' })
  if ((created.status === 200 || created.status === 201) && created.data && created.data.id) return created.data.id
  throw new Error('Could not ensure checklist audience: ' + created.status)
}

async function addContact(env, audienceId, email, firstName) {
  const r = await resend(env, `/audiences/${audienceId}/contacts`, 'POST', {
    email,
    first_name: firstName || '',
    unsubscribed: false,
  })
  if (r.status !== 200 && r.status !== 201) throw new Error('Contact add failed: ' + r.status)
  return r.data
}

async function removeContact(env, audienceId, email) {
  try {
    // Resend: find contact id then delete
    const lookup = await resend(env, `/audiences/${audienceId}/contacts?email=${encodeURIComponent(email)}`)
    const contact = lookup.data && (lookup.data.data || lookup.data)
    const id = contact && (contact.id || contact.data?.id)
    if (id) await resend(env, `/contacts/${id}`, 'DELETE')
  } catch (e) {
    // best-effort; suppression flag still set below
  }
}

async function sendEmail(env, to, subject, text) {
  const from = getBinding(env, 'FROM_EMAIL') || 'Nnamdi Okorafor, RN — Obioma <hello@obiomacare.com>'
  const r = await resend(env, '/emails', 'POST', { from, to, subject, text })
  return r
}

function storeKey(env, email) { return `seq:${email.toLowerCase().trim()}` }

async function getSeq(env, email) {
  const raw = await getBinding(env, 'events').get(storeKey(env, email))
  return raw ? JSON.parse(raw) : null
}
async function putSeq(env, email, record) {
  await getBinding(env, 'events').put(storeKey(env, email), JSON.stringify(record))
}

/** POST /api/lead-magnet — email-gated checklist download. */
export async function routeLeadMagnet(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)
  const body = await request.json().catch(() => ({}))
  const email = String(body.email || '').trim().toLowerCase()
  const firstName = String(body.first_name || '').trim()
  if (!EMAIL_RE.test(email)) return jsonResponse({ error: 'Valid email required' }, 400)

  // TEST-MODE FENCE: before owner copy approval + activation, only the owner
  // inbox can receive nurture emails. Real subscribers get a polite 403.
  if (isTestMode(env) && !isOwner(env, email)) {
    return jsonResponse({ ok: true, message: 'Checklist is in test mode — signups will open soon.' }, 403)
  }

  try {
    const audienceId = await ensureAudience(env)
    await addContact(env, audienceId, email, firstName)

    const now = Date.now()
    const record = {
      email,
      firstName,
      step: 0,
      created: new Date(now).toISOString(),
      lastSent: new Date(now).toISOString(),
      nextAt: new Date(now + 2 * 86400000).toISOString(), // E2 at day 2
      source: body.source || 'nclex-checklist',
    }
    await putSeq(env, email, record)

    // E0 — instant delivery
    const e0 = SEQUENCE[0]
    const text = e0.body({ ...record, unsubUrl: unsubUrl(env, email, await signUnsubToken(env, email)) })
    const sent = await sendEmail(env, email, e0.subject, text)
    if (sent.status !== 200) {
      return jsonResponse({ error: 'Email send failed' }, 502)
    }

    // funnel event
    const { trackEvent } = await import('./api-events.js')
    await trackEvent(env, 'checklist_download', { session: email, guide: 'free-nclex-checklist' })

    const downloadUrl = 'https://obiomacare.com/free-nclex-checklist.html'
    return jsonResponse({ ok: true, downloadUrl, message: 'Checklist sent — check your inbox (and spam folder).' })
  } catch (e) {
    return jsonResponse({ error: 'Lead magnet failed', detail: e.message }, 500)
  }
}

/**
 * Signed unsubscribe token — HMAC-SHA256(email, JWT_SECRET). Prevents
 * scanner/prefetch GETs from unsubscribing anyone: bare GET renders a confirm
 * page; only an explicit POST with a valid token executes the unsubscribe.
 */
async function signUnsubToken(env, email) {
  const secret = getBinding(env, 'JWT_SECRET') || 'unsubscribe-fallback-secret'
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(email))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function verifyUnsubToken(env, email, token) {
  if (!token || !email) return false
  const expect = await signUnsubToken(env, email)
  if (token.length !== expect.length) return false
  let diff = 0
  for (let i = 0; i < token.length; i++) diff |= token.charCodeAt(i) ^ expect.charCodeAt(i)
  return diff === 0
}

function unsubUrl(env, email, token) {
  return 'https://obiomacare.com/api/unsubscribe?email=' + encodeURIComponent(email) + '&t=' + token
}

function confirmPage(email, token) {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unsubscribe from Obioma</title>
<style>body{font-family:system-ui,sans-serif;background:#0b1f3a;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
.card{background:#12294a;border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:36px;max-width:420px;text-align:center}
h1{font-size:1.4rem;margin:0 0 12px}p{color:rgba(255,255,255,.75);line-height:1.5;margin:0 0 24px}
button{background:#ff6b4a;color:#fff;border:0;border-radius:8px;padding:12px 22px;font-size:1rem;font-weight:600;cursor:pointer}
a{color:rgba(255,255,255,.7);display:block;margin-top:14px;font-size:.9rem}</style></head><body>
<div class="card"><h1>Unsubscribe from Obioma emails?</h1>
<p>You're about to stop receiving the NCLEX Study Checklist and nurture emails from Obioma. You can re-subscribe anytime at obiomacare.com.</p>
<form method="POST" action="/api/unsubscribe"><input type="hidden" name="email" value="${encodeURIComponent(email)}"><input type="hidden" name="t" value="${token}"><button type="submit">Yes, unsubscribe me</button></form>
<a href="/">Keep my subscription</a></div></body></html>`
}

/** GET /api/unsubscribe?email=...&t=... — confirm page (NO side effects).
 *  POST /api/unsubscribe (email+t) — executes unsubscribe (scanner-safe). */
export async function routeUnsubscribe(request, env) {
  const url = new URL(request.url)
  const email = String(url.searchParams.get('email') || '').trim().toLowerCase()
  const token = String(url.searchParams.get('t') || '')
  if (!EMAIL_RE.test(email)) {
    return new Response('Missing or invalid email. Use the unsubscribe link from the email.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  if (request.method === 'POST') {
    const body = await request.formData().catch(() => new FormData())
    const postEmail = String((body.get('email') || email) || '').trim().toLowerCase()
    const postToken = String(body.get('t') || token || '')
    if (!EMAIL_RE.test(postEmail) || !(await verifyUnsubToken(env, postEmail, postToken))) {
      return new Response('Invalid unsubscribe link.', { status: 400, headers: { 'Content-Type': 'text/plain' } })
    }
    try {
      const audienceId = await ensureAudience(env)
      await removeContact(env, audienceId, postEmail)
    } catch (e) { /* best effort */ }
    try { await getBinding(env, 'events').put(`suppress:${postEmail}`, '1') } catch (e) {}
    return new Response(
      'You have been unsubscribed from Obioma emails. You will not receive any further messages.\n\n— Obioma',
      { status: 200, headers: { 'Content-Type': 'text/plain' } },
    )
  }

  // GET: verify token, render confirm page. Bare GET (no/invalid token) = 400, no side effects.
  if (!(await verifyUnsubToken(env, email, token))) {
    return new Response('Invalid unsubscribe link. Use the link from the email.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
  return new Response(confirmPage(email, token), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

/** POST /api/operator/process-sequence — daily sweep for due nurture emails (operator-key gated). */
export async function routeProcessSequence(request, env) {
  const opKey = getBinding(env, 'OPERATOR_API_KEY')
  const header = request.headers.get('x-operator-key')
  if (!(opKey && header && header === opKey)) return jsonResponse({ error: 'Unauthorized' }, 401)

  const kv = getBinding(env, 'events')
  const now = Date.now()
  const processed = []
  const { keys } = await kv.list({ prefix: 'seq:' })
  for (const k of keys) {
    try {
      const record = JSON.parse(await kv.get(k.name))
      if (!record || record.step >= SEQUENCE.length) continue
      if (record.suppressed || (await kv.get(`suppress:${record.email}`))) continue
      // TEST-MODE FENCE: only owner inbox advances the sequence pre-activation
      if (isTestMode(env) && !isOwner(env, record.email)) continue
      if (new Date(record.nextAt).getTime() > now) continue

      const stepIdx = record.step + 1 // send next email
      const step = SEQUENCE[stepIdx]
      const text = step.body({ ...record, unsubUrl: unsubUrl(env, record.email, await signUnsubToken(env, record.email)) })
      const sent = await sendEmail(env, record.email, step.subject, text)
      record.step = stepIdx
      record.lastSent = new Date(now).toISOString()
      if (stepIdx < SEQUENCE.length - 1) {
        const days = SEQUENCE[stepIdx + 1].day - step.day
        record.nextAt = new Date(now + days * 86400000).toISOString()
      } else {
        record.nextAt = null // sequence complete
      }
      await kv.put(k.name, JSON.stringify(record))
      processed.push({ email: record.email, sent: step.key, status: sent.status })
    } catch (e) {
      processed.push({ key: k.name, error: e.message })
    }
  }
  return jsonResponse({ ok: true, processed })
}
