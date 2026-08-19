/**
 * Contact form (P1, 2026-08-18) — POST /api/contact.
 * Honeypot + basic rate limit (5/hour per email+IP, KV) + Resend delivery to
 * the owner (ADMIN_EMAIL). Same pattern as the digest — no new secrets.
 * Honeypot submissions silently succeed (classic bot behavior) and are dropped.
 */
import { getBinding } from './api-events.js'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const RATE_LIMIT = 5
const RATE_TTL_SECONDS = 3600

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export async function routeContact(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  const body = await request.json().catch(() => ({}))
  // Honeypot: bots fill the hidden "website" field — silently drop.
  if (body.website && String(body.website).trim().length > 0) {
    return jsonResponse({ ok: true })
  }

  const name = String(body.name || '').trim()
  const email = String(body.email || '').trim().toLowerCase()
  const message = String(body.message || '').trim()

  if (!EMAIL_RE.test(email)) return jsonResponse({ error: 'Valid email required' }, 400)
  if (name.length < 2 || name.length > 100) return jsonResponse({ error: 'Name must be 2–100 characters' }, 400)
  if (message.length < 10 || message.length > 5000) return jsonResponse({ error: 'Message must be 10–5000 characters' }, 400)

  const kv = getBinding(env, 'events')
  if (kv) {
    const ip = request.headers.get('cf-connecting-ip') || 'unknown'
    const rlKey = `contact:${email}:${ip}`
    const cnt = parseInt((await kv.get(rlKey)) || '0', 10)
    if (cnt >= RATE_LIMIT) {
      return jsonResponse({ error: 'Too many submissions from this address. Try again later.' }, 429)
    }
    await kv.put(rlKey, String(cnt + 1), { expirationTtl: RATE_TTL_SECONDS })
  }

  const resendKey = getBinding(env, 'RESEND_API_KEY')
  const to = getBinding(env, 'ADMIN_EMAIL')
  if (!resendKey || !to) return jsonResponse({ error: 'Contact not configured' }, 500)

  const from = getBinding(env, 'FROM_EMAIL') || 'Nnamdi Okorafor, RN — Obioma <hello@obiomacare.com>'
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      reply_to: email,
      subject: `Contact form: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}\n\n—\nSent from https://obiomacare.com/contact.html`,
    }),
  })

  if (r.status !== 200 && r.status !== 201) {
    return jsonResponse({ error: 'Message send failed' }, 502)
  }
  return jsonResponse({ ok: true })
}
