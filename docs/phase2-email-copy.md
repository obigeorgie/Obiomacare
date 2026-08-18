# Phase 2 — Nurture Sequence Copy (DRAFT for Owner Approval)

Status: **NOT activated.** Owner approves each email individually before any send
beyond test-mode (owner inbox only). All emails: plain-text-first, one CTA each,
real unsubscribe link, CAN-SPAM footer. No purchased lists, no fake urgency.

**CAN-SPAM footer (all emails):**
> Nnamdi Okorafor, RN — Founder, Obioma Care
>
> ObiomaCare · [Mailing address — owner fills before activation]
> You're getting this because you signed up for the free NCLEX Study Checklist.
> Unsubscribe anytime: https://obiomacare.com/api/unsubscribe?email=<subscriber>

---

## E0 — instant (on signup)
**Subject:** Your free NCLEX Study Checklist (and what Obioma is)

> Hi {firstName},
>
> Here's your free NCLEX Study Checklist — the 4-week structure we built:
>
> https://obiomacare.com/free-nclex-checklist.html
>
> It covers the foundation diagnostic, targeted deep-dives on your weak domains, timed practice blocks, and test-day prep.
>
> Quick intro to Obioma: we're a nursing-education team building NCLEX prep around clinical judgment — realistic NGN case studies, a CAT-style readiness check, and honest guidance. No hype, no "pass in 30 days" promises. If a number isn't true, we don't say it.
>
> You'll get a short email every few days with a study tip or a free tool. Unsubscribe anytime — no hard feelings.
>
> [CAN-SPAM footer]
>
> CTA: Open the checklist

## E2 — day 2
**Subject:** Clinical judgment beats memorization (try a free case)

> Hi {firstName},
>
> Most NCLEX prep teaches you facts. The NGN rewards something else: what you DO when the facts change.
>
> A patient with a potassium of 5.8 and peaked T-waves — knowing the normal range is not the question. Knowing what to do first is.
>
> Try one of our real NGN case studies — free, no account needed:
>
> https://obiomacare.com/case-engine.html
>
> One case, about 10 minutes. You might notice the difference between "knowing" and "thinking like a nurse."
>
> [CAN-SPAM footer]
>
> CTA: Try a free case study

## E4 — day 4
**Subject:** Where do you actually stand? (free readiness check)

> Hi {firstName},
>
> Guessing where you stand on the NCLEX is a plan for test-day surprises.
>
> Our readiness assessment is a CAT-style adaptive check — it adjusts to your answers and gives you an honest estimate band, not a magic "probability of passing" number (we don't do fake percentages).
>
> It's free to take:
>
> https://obiomacare.com/readiness
>
> About 20 questions. You'll see where you are, your weak categories, and what to work on next.
>
> [CAN-SPAM footer]
>
> CTA: Take the free readiness check

## E7 — day 7
**Subject:** What the paid plan adds (no upsell tricks)

> Hi {firstName},
>
> Straight answer on what the paid plan adds — nothing hidden:
>
> • Unlimited readiness assessments (free tier is limited)
> • Full answer breakdowns with rationale on every case
> • Spaced repetition for the content you actually miss
> • A growing bank of NGN case studies (10 live now, more every week)
>
> That's the list. No "limited-time" pressure, no countdown clocks, no fake scarcity. If it helps, great — if not, the free tools keep working.
>
> Plans and honest pricing:
>
> https://obiomacare.com/pricing
>
> [CAN-SPAM footer]
>
> CTA: See the plans

## E10 — day 10
**Subject:** One last honest note on the annual plan

> Hi {firstName},
>
> If you're still deciding: the annual plan is the best value per month, and you can cancel anytime — no hoops, no retention scripts.
>
> We'd rather you stay because the cases help than because you forgot to cancel.
>
> Start with a month if you want to try it first — same features, cancel anytime:
>
> https://obiomacare.com/pricing
>
> Either way, thanks for reading. That's the end of this sequence — no more emails unless you want them or we have something genuinely useful.
>
> [CAN-SPAM footer]
>
> CTA: Start the annual plan

---

## Mechanics (built, parked at deploy gate)
- `/api/lead-magnet` (POST): validates email → ensures Resend `checklist` audience → adds contact → stores sequence state in KV (`seq:<email>`) → sends E0 → returns `{ok, downloadUrl}` (page shows inline link + inbox message)
- `/api/unsubscribe` (GET): one-click — removes contact from audience + KV suppression flag
- `/api/operator/process-sequence` (POST, operator-key): daily sweep — sends due E2/E4/E7/E10, advances state
- Daily sweep job: Hermes cron → calls the processor endpoint
- Honest framing per directive: "Get the checklist + occasional study tips. Unsubscribe anytime." — page copy updated to match

## Approve email-by-email
Reply with per-email verdicts (e.g., "E0 ok, E2 ok, E4 ok, E7 ok, E10 ok" or edits). Sends stay test-mode (your inbox only) until you approve + fill the mailing address.
