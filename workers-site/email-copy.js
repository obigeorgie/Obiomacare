/**
 * Revenue OS Phase 2 — email sequence copy.
 * DRAFT for owner review (2026-08-18). NOT activated until owner approves
 * each email individually. Plain-text-first, one CTA each, honest framing,
 * CAN-SPAM footer with real unsubscribe link.
 *
 * OWNER DECISION 2026-08-18: no physical mailing address in emails —
 * email is the only point of contact. Compliance risk accepted by owner;
 * revisit before live activation.
 */
const BASE = 'https://obiomacare.com'

function footer(email) {
  return [
    '',
    '—',
    'Nnamdi Okorafor, RN — Founder, Obioma Care',
    "You're getting this because you signed up for the free NCLEX Study Checklist.",
    'Unsubscribe anytime: ' + BASE + '/api/unsubscribe?email=' + encodeURIComponent(email),
  ].join('\n')
}

export const SEQUENCE = [
  {
    key: 'E0',
    day: 0,
    subject: 'Your free NCLEX Study Checklist (and what Obioma is)',
    body: (v) => [
      `Hi${v.firstName ? ' ' + v.firstName : ''},`,
      '',
      `Here's your free NCLEX Study Checklist — the 4-week structure we built:`,
      '',
      BASE + '/free-nclex-checklist.html',
      '',
      `It covers the foundation diagnostic, targeted deep-dives on your weak domains, timed practice blocks, and test-day prep.`,
      '',
      `Quick intro to Obioma: we're a nursing-education team building NCLEX prep around clinical judgment — realistic NGN case studies, a CAT-style readiness check, and honest guidance. No hype, no "pass in 30 days" promises. If a number isn't true, we don't say it.`,
      '',
      `You'll get a short email every few days with a study tip or a free tool. Unsubscribe anytime — no hard feelings.`,
      footer(v.email),
    ].join('\n'),
    cta: 'Open the checklist',
  },
  {
    key: 'E2',
    day: 2,
    subject: 'Clinical judgment beats memorization (try a free case)',
    body: (v) => [
      `Hi${v.firstName ? ' ' + v.firstName : ''},`,
      '',
      `Most NCLEX prep teaches you facts. The NGN rewards something else: what you DO when the facts change.`,
      '',
      `A patient with a potassium of 5.8 and peaked T-waves — knowing the normal range is not the question. Knowing what to do first is.`,
      '',
      `Try one of our real NGN case studies — free, no account needed:`,
      '',
      BASE + '/case-engine.html',
      '',
      `One case, about 10 minutes. You might notice the difference between "knowing" and "thinking like a nurse."`,
      footer(v.email),
    ].join('\n'),
    cta: 'Try a free case study',
  },
  {
    key: 'E4',
    day: 4,
    subject: 'Where do you actually stand? (free readiness check)',
    body: (v) => [
      `Hi${v.firstName ? ' ' + v.firstName : ''},`,
      '',
      `Guessing where you stand on the NCLEX is a plan for test-day surprises.`,
      '',
      `Our readiness assessment is a CAT-style adaptive check — it adjusts to your answers and gives you an honest estimate band, not a magic "probability of passing" number (we don't do fake percentages).`,
      '',
      `It's free to take:`,
      '',
      BASE + '/readiness',
      '',
      `About 20 questions. You'll see where you are, your weak categories, and what to work on next.`,
      footer(v.email),
    ].join('\n'),
    cta: 'Take the free readiness check',
  },
  {
    key: 'E7',
    day: 7,
    subject: 'What the paid plan adds (no upsell tricks)',
    body: (v) => [
      `Hi${v.firstName ? ' ' + v.firstName : ''},`,
      '',
      `Straight answer on what the paid plan adds — nothing hidden:`,
      '',
      `• Unlimited readiness assessments (free tier is limited)`,
      `• Full answer breakdowns with rationale on every case`,
      `• Spaced repetition for the content you actually miss`,
      `• A growing bank of NGN case studies (10 live now, more every week)`,
      '',
      `That's the list. No "limited-time" pressure, no countdown clocks, no fake scarcity. If it helps, great — if not, the free tools keep working.`,
      '',
      `Plans and honest pricing:`,
      '',
      BASE + '/pricing',
      footer(v.email),
    ].join('\n'),
    cta: 'See the plans',
  },
  {
    key: 'E10',
    day: 10,
    subject: 'One last honest note on the annual plan',
    body: (v) => [
      `Hi${v.firstName ? ' ' + v.firstName : ''},`,
      '',
      `If you're still deciding: the annual plan is the best value per month, and you can cancel anytime — no hoops, no retention scripts.`,
      '',
      `We'd rather you stay because the cases help than because you forgot to cancel.`,
      '',
      `Start with a month if you want to try it first — same features, cancel anytime:`,
      '',
      BASE + '/pricing',
      '',
      `Either way, thanks for reading. That's the end of this sequence — no more emails unless you want them or we have something genuinely useful.`,
      footer(v.email),
    ].join('\n'),
    cta: 'Start the annual plan',
  },
]
