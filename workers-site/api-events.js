/**
 * Revenue OS — canonical funnel events (Phase 1).
 *
 * Storage: Cloudflare KV namespace `events`.
 *   evt:<YYYY-MM-DD>:<type>:<uuid>  -> JSON {type, ts, session, tier, guide, page}
 *   cnt:<YYYY-MM-DD>:<type>         -> integer counter (queryable, cheap)
 *
 * Routes:
 *   POST /api/event                public ingestion (beacon-friendly)
 *   GET  /api/operator/metrics     admin-gated raw counters (?days=7|30)
 *   GET  /admin                    admin-gated HTML instrument panel
 */
import { getAuthUser } from './auth.js'

export const EVENT_TYPES = new Set([
  'guide_view',
  'checklist_download',
  'signup_started',
  'signup_completed',
  'assessment_started',
  'assessment_completed',
  'pricing_viewed',
  'checkout_started',
  'checkout_completed',
  'subscription_canceled',
])

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function todayISO(offsetDays = 0) {
  return new Date(Date.now() - offsetDays * 86400000).toISOString().slice(0, 10)
}

/**
 * Record one event. No-op if type not whitelisted or KV binding missing.
 * Returns {key} or null. Never throws — analytics must not break the funnel.
 */
export async function trackEvent(env, type, { session = null, tier = null, guide = null, page = null, ts = null } = {}) {
  try {
    if (!EVENT_TYPES.has(type)) return null
    const kv = env.events
    if (!kv) return null
    const iso = ts || new Date().toISOString()
    const date = iso.slice(0, 10)
    const id = (crypto.randomUUID && crypto.randomUUID()) || Math.random().toString(36).slice(2)
    const key = `evt:${date}:${type}:${id}`
    await kv.put(key, JSON.stringify({ type, ts: iso, session, tier, guide, page }))
    const cntKey = `cnt:${date}:${type}`
    const prev = parseInt((await kv.get(cntKey)) || '0', 10)
    await kv.put(cntKey, String(prev + 1))
    // per-guide counter (drives "top guides" in the digest without CF Web Analytics)
    if (guide) {
      const gKey = `gcnt:${date}:${guide}`
      const gPrev = parseInt((await kv.get(gKey)) || '0', 10)
      await kv.put(gKey, String(gPrev + 1))
    }
    return { key }
  } catch (e) {
    return null
  }
}

export async function routeEvent(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)
  const body = await request.json().catch(() => ({}))
  const { type, ts, session, tier, guide, page } = body
  if (!EVENT_TYPES.has(type)) return jsonResponse({ error: 'Unknown event type' }, 400)
  const r = await trackEvent(env, type, { session, tier, guide, page, ts })
  if (!r) return jsonResponse({ error: 'Events not configured' }, 500)
  return jsonResponse({ ok: true })
}

/** Counts per day per event type, newest first. */
async function getCounts(env, days) {
  const out = {}
  for (let i = days - 1; i >= 0; i--) {
    const d = todayISO(i)
    const row = {}
    for (const t of EVENT_TYPES) {
      row[t] = parseInt((await env.events.get(`cnt:${d}:${t}`)) || '0', 10)
    }
    out[d] = row
  }
  return out
}

/** Top guides by guide_view count over the window (drives the digest). */
async function getTopGuides(env, days, limit = 5) {
  const counts = {}
  for (let i = 0; i < days; i++) {
    const d = todayISO(i)
    const { keys } = await env.events.list({ prefix: `gcnt:${d}:` })
    for (const k of keys) {
      const guide = k.name.split(':')[2]
      counts[guide] = (counts[guide] || 0) + parseInt((await env.events.get(k.name)) || '0', 10)
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([guide, count]) => ({ guide, count }))
}

/** Operator auth: JWT (owner email) OR X-Operator-Key (machine, cron digest). */
async function isOperator(request, env) {
  const user = await getAuthUser(request, env);
  const adminEmail = env.ADMIN_EMAIL;
  if (user && adminEmail && user.email === adminEmail) return true;
  const opKey = env.OPERATOR_API_KEY;
  const header = request.headers.get('x-operator-key');
  return !!(opKey && header && header === opKey);
}

export async function routeOperatorMetrics(request, env) {
  if (!(await isOperator(request, env))) return jsonResponse({ error: 'Unauthorized' }, 401)
  const url = new URL(request.url)
  const days = Math.min(parseInt(url.searchParams.get('days') || '7', 10), 90)
  const [counts, guides] = await Promise.all([
    getCounts(env, days),
    getTopGuides(env, days, parseInt(url.searchParams.get('top') || '5', 10)),
  ])
  return jsonResponse({ counts, guides })
}

/** Digest email delivery — Worker sends via its own Resend secret (never on this box). */
export async function routeOperatorEmail(request, env) {
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)
  if (!(await isOperator(request, env))) return jsonResponse({ error: 'Unauthorized' }, 401)
  const body = await request.json().catch(() => ({}))
  const { subject, text } = body
  if (!subject || !text) return jsonResponse({ error: 'subject and text required' }, 400)
  const resendKey = env.RESEND_API_KEY
  const from = env.FROM_EMAIL || 'ObiomaCare <digest@obiomacare.com>'
  const to = env.ADMIN_EMAIL
  if (!resendKey || !to) return jsonResponse({ error: 'Email not configured' }, 500)
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text }),
  })
  if (!r.ok) return jsonResponse({ error: 'Resend failed', status: r.status }, 502)
  return jsonResponse({ ok: true })
}

/** Private operator dashboard — plain HTML, auth-gated, owner email only. */
export async function routeAdmin(request, env) {
  const user = await getAuthUser(request, env)
  const adminEmail = env.ADMIN_EMAIL
  if (!user || !adminEmail || user.email !== adminEmail) {
    return new Response('Unauthorized — log in as owner to view the instrument panel.', {
      status: 401,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
  const counts7 = await getCounts(env, 7)
  const counts30 = await getCounts(env, 30)
  const days7 = Object.keys(counts7)
  const days30 = Object.keys(counts30)

  const total = (row) => Object.values(row).reduce((a, b) => a + b, 0)
  const sum7 = {}
  const sum30 = {}
  for (const t of EVENT_TYPES) {
    sum7[t] = days7.reduce((a, d) => a + counts7[d][t], 0)
    sum30[t] = days30.reduce((a, d) => a + counts30[d][t], 0)
  }
  const total7 = Object.values(sum7).reduce((a, b) => a + b, 0)
  const total30 = Object.values(sum30).reduce((a, b) => a + b, 0)

  const funnel = [
    ['guide_view', 'Guide views'],
    ['checklist_download', 'Checklist downloads'],
    ['assessment_started', 'Assessments started'],
    ['assessment_completed', 'Assessments completed'],
    ['checkout_started', 'Checkouts started'],
    ['checkout_completed', 'Checkouts completed'],
  ]
  const funnelRows = funnel
    .map(([key, label], i) => {
      const n = sum7[key]
      const prev = i > 0 ? sum7[funnel[i - 1][0]] : null
      const pct = prev && prev > 0 ? ((n / prev) * 100).toFixed(1) : '—'
      return `<tr><td>${label}</td><td>${n}</td><td>${pct}%</td></tr>`
    })
    .join('\n')

  const dailyRows = days7
    .map((d) => {
      const row = counts7[d]
      const cells = EVENT_TYPES.map((t) => `<td>${row[t]}</td>`).join('')
      return `<tr><td>${d}</td>${cells}</tr>`
    })
    .join('\n')
  const headCells = [...EVENT_TYPES].map((t) => `<th>${t}</th>`).join('')

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Obioma Operator Panel</title>
<style>
  body{font-family:ui-monospace,Menlo,Consolas,monospace;background:#0f172a;color:#e2e8f0;margin:0;padding:24px}
  h1{font-size:1.2rem;color:#FF6B5B} h2{font-size:1rem;margin-top:28px;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em}
  table{border-collapse:collapse;margin-top:8px;font-size:.8rem} th,td{border:1px solid #1e293b;padding:6px 10px;text-align:right}
  th{color:#94a3b8;font-weight:600} td:first-child,th:first-child{text-align:left}
  .total{color:#FF6B5B;font-weight:700} .meta{color:#64748b;font-size:.75rem}
</style></head><body>
<h1>Obioma Operator Panel</h1>
<p class="meta">Revenue OS Phase 1 · 7-day window (${days7[0]} → ${days7[days7.length-1]}) · events: ${total7} (7d) / ${total30} (30d)</p>
<h2>Funnel (7d)</h2>
<table><thead><tr><th>Step</th><th>Count</th><th>Conversion</th></tr></thead><tbody>
${funnelRows}
</tbody></table>
<h2>Events by Day (7d)</h2>
<table><thead><tr><th>date</th>${headCells}<th>total</th></tr></thead><tbody>
${days7.map((d) => `<tr><td>${d}</td>${EVENT_TYPES.map((t) => `<td>${counts7[d][t]}</td>`).join('')}<td class="total">${total(counts7[d])}</td></tr>`).join('\n')}
</tbody></table>
<h2>Event Totals (30d)</h2>
<table><thead><tr><th>event</th><th>7d</th><th>30d</th></tr></thead><tbody>
${[...EVENT_TYPES].map((t) => `<tr><td>${t}</td><td>${sum7[t]}</td><td>${sum30[t]}</td></tr>`).join('\n')}
</tbody></table>
</body></html>`

  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
}
