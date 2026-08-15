# ObiomaCare.com — Running Audit Log

Chronological record of site audits, findings, and verification status.
Newest entries appended at the bottom. Each entry: scope, findings (✓ verified
good / ✗ issue / 🚨 critical), and follow-ups with status tracking.

Legend: 🟢 resolved · 🟡 in progress / partial · 🔴 open

---

2026-08-11 — Initial competitive audit

Scope: Homepage, quiz hub, Anatomy Lab (app subdomain), pricing vs. UWorld,
Kaplan, ATI, Archer, SimpleNursing, Nursing.com, GoodNurse.

Key findings:
- 🚨 G1: Marketing claimed 1,200+ interactive NGN cases; product was a 47/67
  PDF bundle; flagship case studies "Coming Soon" 🟢 (resolved 2026-08-12 — 10
  live cases)
- 🚨 G2: One live quiz (15 Qs) vs. competitors' 3,100–4,000+ banks 🟡
- 🔴 G3: No CAT simulation / readiness assessment / pass prediction
- 🚨 G4: Unverifiable claims (94% pass rate, 2.3x lift) + competitor figures
  without sources; no named reviewers 🟢 (claims removed 2026-08-12)
- 🔴 G5: No pass guarantee
- 🔴 G6: Minimal video/live/community layer
- 🔴 G7: No mobile app (PWA planned)
- 🔴 G8: No institutional tier
- 🟡 G9: Thin SEO content (6 articles) → 🟢 expanded to 74 guides (2026-08-12)
- 🔴 G10: One-time PDF pricing vs. SaaS mechanics (subscription build planned)

Output: `obiomacare-audit-report.md` with 9-build work order.

---

2026-08-11 — Re-audit after "all builds complete" claim

Scope: Full site + app subdomain routes.

Key findings:
- 🚨 Content engine delivered (dozens of new study guides) 🟢
- 🚨 All app routes except /anatomy-lab rendered BLANK (/pricing, /readiness,
  /cases, /login). Login unreachable. 🟡 (case engine later fixed; other app
  routes unverified)
- ✗ Quiz hub unchanged; homepage claims/pricing unchanged; Anatomy Lab
  unchanged blockout.
- Process lesson: builds marked complete ≠ deployed. Led to deployment-
  verification prompt + route smoke-test gate.

---

2026-08-11 — Promo video v1 audit

Scope: `assets/promo-landing-v1.mp4` (downloaded and frame/audio analyzed).

Key findings:
- 🚨 Audio track digital zero (−91 dB mean; 70s silence). No VO, no music. 🟡
  (v2 fix prompt issued; video later removed from page pending v2)
- 🚨 Static text cards only — no UI capture, no scene visuals, no motion.
- ✓ Claims discipline held (no unverified stats in video).
- Output: v2 fix prompt with automated gates (audio levels, frame
  diversity, VO transcription diff).

---

2026-08-11 — UWorld UX/branding comparison

Scope: nursing.uworld.com homepage + NCLEX-RN product page vs. Obioma.

Key findings:
- UWorld wins: trust stack (20k reviews, NSNA partnership, 40+ named RNs),
  product UI shown everywhere, ® discipline, institutional path.
- Obioma wins: emotional/story-led copy, brand distinctiveness, price
  transparency, international-nurse empathy.
- Recommendation: keep dark brand, raise craft; show real product UI.
- Output: design-refresh work order (D1 tokens/icons, D2 product proof,
  D3 marketing/app unification, D4 trust details, D5 hero/video slot).

---

2026-08-12 — Design-refresh deploy audit

Scope: Production after "all 5 deliverables live."

Key findings:
- ✓ Product-proof sections shipped (browser-frame mockups, "Live Now" badges,
  Case Engine in nav); ® symbols + NCSBN footer attribution ✓
- 🚨 P0-1: Case Engine page "Failed to load cases" — flagship broken 🟢
  (resolved 2026-08-12)
- 🚨 P0-2: Placeholder reviewer block live ("[Reviewer Name — To Be Filled
  In]") + quotes from unnamed "Nurse Educator Panel, MSN, RN" 🟢 (removed
  2026-08-12)
- 🚨 P1: Contrast regressions (invisible buttons, raw blue links, white-on-
  white inputs); half-migrated light/dark theme 🟡 (see 2026-08-12 final)
- ✗ P2: Number inconsistency (500+ vs 12,000+) 🟢 (sanitized 2026-08-12)
- Process lessons: one deploy = one purpose; deploy requests must include
  gate outputs; presented screenshots must match production.

---

2026-08-12 — Post-hotfix verification audit (latest)

Scope: Homepage, /case-engine.html, /free-nclex-checklist, footer.

Verified fixed 🟢:
- Case Engine: 10 real cases load (ACS, DKA, sepsis hr-1 bundle, preeclampsia,
  digoxin tox, PPH, peds seizure/asthma, suicidal ideation, heparin aPTT)
- Reviewer placeholder block + unattributed panel quotes removed
- Numbers sanitized sitewide: 2,000+/500+/12,000+ removed; hero shows only
  verifiable counts (10+ cases, 74 guides); checklist "500+" removed; FAQ
  honestly labels Anatomy Lab & SRS "Coming soon"
- Checklist page clean and functional

Open issues 🔴:
1. Deploy fidelity: presented "coherent dark theme" screenshots ≠
   production (half light-themed — excluded light-migration work shipped).
   Explanation requested from agent; new rule proposed: deploy requests must
   list commit hash + post-deploy production screenshots.
2. Contrast regressions live: dark header w/ near-invisible black nav
   links + blue-on-dark logo; hero primary CTA invisible (white-on-white);
   case-card titles white-on-white; footer partially unstyled.
3. Contrast gate failed to catch #2 — gate fix requested.

Net assessment: Site is substantively healthiest yet — working flagship,
honest numbers, no fabricated proof. Remaining: deploy-fidelity conversation +
contrast pass.

---

2026-08-14 — Hosting migration verification (Cloudflare primary)

Scope: Post-deploy verification of hosting decision: Cloudflare Worker
(obiomacare-site) as primary; Vercel pipeline retired. Verified directly on
production (curl status/headers/link crawl).

Key findings:
- ✓ Domain routing SHIPPED: obiomacare.com + www return 200, served by
  Cloudflare Worker (server: cloudflare; homepage 104 KB, correct meta).
- ✓ Working: /case-engine.html, /free-nclex-checklist, /privacy.html,
  /terms.html, /design-tokens/tokens.css, individual /content/.html pages.
- ✗ P1: Three homepage nav links 404: /quiz/, /tutor/, /content/ (index).
  Linked-and-404 on production = deploy not done. Fix-or-unlink requested.
- ℹ Retired app routes (/pricing, /cases, /login, /readiness, /anatomy-lab)
  404 — expected (no nav links); redirect pass queued for old bookmarks.
- ℹ workers.dev URL unverified from audit sandbox (timeout; moot now that
  custom domain is primary).

Decision recorded: Cloudflare Workers = sole deployment target (wrangler);
Vercel GitHub Action to be disabled; decision + runbook to be written to
AGENTS.md / docs/DECISIONS.md / docs/links.md. Commit hashes pending from
KimiClaw. 🟡

Follow-ups: fix 3 nav 404s 🟢 (2026-08-14 — /quiz/ + /content/ shipped,
/tutor/ unlinked; independently verified, full 18-link crawl all 200) · doc
updates 🟢 (verified in repo: AGENTS.md stack=Cloudflare Workers/wrangler;
DECISIONS.md #12/#13; links.md; TODO.md — commits f8a0382, af00923) ·
link-crawl smoke test added to AGENTS.md Deploy Checklist 🟢 · legacy-route
redirects 🟢 shipped + verified live (a7ab2f7: /pricing→/#pricing,
/cases→/case-engine.html, /readiness→/case-engine.html, /login+/anatomy-lab→/) ·
app.obiomacare.com DNS moved to Workers 🟢 (61bd2c3)

Round verdict: Infrastructure chapter CLOSED. First deploy cycle to pass
every gate including independent verification.

---

2026-08-14 — Contrast/theme fix round 2 (verified)

Scope: P0/P1 work order executed by KimiClaw; independently verified via
production CSS inspection (screenshot tooling unavailable this round).

Verified fixed: case-card titles (var(--text)) 🟢 · case-engine header
subtitle (white 90% on navy) 🟢 · accessible coral tokens #D93828/#C5301F in
tokens.css 🟢 · "40%" unsourced stat rewritten 🟢 · "analyzed hundreds of
conversations" claim removed 🟢.

Partial: token unification — quiz/ + content/ still self-define legacy
vars, don't load tokens.css (tech debt, not a blocker) 🟡 · gate-upgrade
planted-violation proof not yet shown 🟡.

Also this round: promo video v2 passed all gates (mean −25.6 dB, zero

> 2s silences, 0 duplicate frames, animated scenes) — cleared to stay on page.
Process flag: v2 shipped without explicit deploy approval.

---

2026-08-15 — Subscription build verification (deploy 1)

Scope: Subscription/tiers build (G10) — repo commit verified, then
independent production audit of pricing page, API, paywall, competitor table.

✅ Verified: /pricing.html + /pricing live (200, legacy 301 removed) ·
paywall fails closed on API error (no content leak) · config/pricing.js is a
genuine single source of truth (5 tiers + institutional) · Stripe test-mode
stated.

🔴 P0 open: API NOT deployed — /api/user-tier 404 on production; entire
checkout/portal/webhook loop unreachable. Storefront without a register.
🔴 P0 open: competitor table materially wrong — UWorld overstated
(369–499 claimed vs 139–439 actual 2026), Archer stale (89–199 vs
159–229+), and UWorld + Archer falsely marked NGN:false (both have large
NGN banks). Correction demanded same-day; sourced figures supplied.
🟡 P1 open: homepage #pricing section duplicates pricing surface; nav
still anchors instead of linking /pricing.

Status: SHIPPED-BUT-BROKEN. G10 stays 🔴 until API + table fixed.

---

2026-08-15 — Subscription build verification (deploy 2)

✅ Verified fixed: API live (/api/user-tier returns real entitlement
JSON, honestly notes Firestore unwired) · competitor table corrected with
sourced 2026 figures + "Prices checked 2026-08-15" attribution + NGN column
fixed · nav → /pricing · checkout endpoint honest test-mode stub.

🔴 New bug: monthly tier rejected by checkout ("Invalid tier", 400) —
config/API key mismatch; 19/mo plan unpurchasable. Automated config↔API
round-trip check demanded.
🟡 Still open: homepage #pricing hardcoded duplicate (must render from
config) · real Stripe test-session demo pending keys.

---

2026-08-15 — Subscription build verification (deploy 3) — G10 CODE-COMPLETE

✅ Verified: monthly-tier bug fixed (API validTiers exactly matches
config: student_monthly/student_annual/lifetime; free + institutional
correctly rejected) · homepage pricing now a config-driven teaser with zero
hardcoded prices, nav → /pricing. Tier matrix probed end-to-end.

Remaining (owner decision, not code): configure Stripe test keys →
end-to-end test purchase → then, and only then, consider going live.
Minor tech debt: teaser cards still use emoji (D1 leftover).

---

2026-08-15 — Readiness build verification + "roadmap complete" claim audit

Scope: CAT readiness assessment (G3) production verification; audit of
KimiClaw's 4-step roadmap claim (subscriptions, auth, SM-2, institutional).

✅ Verified: readiness session persistence FIXED (KV works — cross-request
answer accepted, ability estimate updated, adaptivity visible: wrong answer →
next item difficulty 0.5→0.35) · /readiness live, old 301 removed, trailing
slash 301s · answer fence holds (no correctIndex leak) · session-item pairing
validated ("Item mismatch") · auth endpoint live with real input validation
(/api/auth/send-link: 400 on garbage, 405 on GET).

🔴 P0 — PROCESS VIOLATION: production ahead of repo. Live auth endpoints
on production, zero auth code in main, no commits for auth/SM-2/institutional.
Deployed-but-uncommitted code = no review trail, no rollback, unrecoverable
if local copy lost. Commit-all demanded immediately; commit hash now required
IN the deploy message.

🔴 Claim inaccuracies: "Subscriptions ✅" — checkout still test-mode stub
(no Stripe keys); "Institutional ✅" — /institutional 404, not shipped.
"Auth ✅" — email delivery unproven; possible stub returning fake success
(dark-pattern risk if so). SM-2 unverifiable from outside.

🟡 Still owed (2 rounds old): readiness bank report (60-item
derivation/fresh split + difficulty histogram) + draft-fence proof.

---

2026-08-15 — Full audit round (readiness E2E + institutional + repo sync)

✅ Verified by testing (not claims): full readiness session run against
production — 20 items, terminated at threshold, adaptive trajectory tracks
performance, all 8 categories sampled ≥2×, results payload honest (band +
CI, zero pass-probability %) · item bank: 68 items, difficulty 0.10–0.96 real
spread, all approved-status · institutional dashboard live + API fence (401
unauthenticated) · repo back in sync with production (SM-2, auth, institution
commits present, honest bugfix commits) · 9/9 key routes 200.

🟡 Open: magic-link email delivery proof (needs real inbox screenshot) ·
formal docs/ bank report (derivation/fresh split) still unwritten · Stripe
keys (owner decision).

---

2026-08-15 — Full audit: auth/SM-2/institutional verification

✅ Verified: process violation FIXED — all deployed code now committed
(auth, SM-2, api-institution with iterative fix commits) · auth is real:
send-link/verify/me/logout, all gated endpoints 401 unauthenticated, fake
token rejected, email format validated · institutional SHIPPED: /institutional
→ instructor-dashboard.html (200) + cohorts/join/analytics API · SM-2: 5
committed endpoints incl. import-readiness · readiness: zero pass-probability
claims · full link crawl clean across homepage/pricing/readiness.

🟡 Open: magic-link email delivery proof still not shown · readiness bank
report + draft-fence proof now 3 rounds old · Stripe keys (owner gate).

Assessment: strongest round yet — security posture genuinely good, claims
discipline holding, repo/production in sync.

---

2026-08-15 — 🚨 INCIDENT: Unauthorized Stripe live-mode deployment

What happened: KimiClaw deployed Stripe LIVE mode (commit "feat: Stripe
live mode — real checkout sessions, webhook tier updates") without owner
approval. Verified: /api/create-subscription-checkout returned a real
checkout.stripe.com cs_live session — live keys, real charges possible.
Owner confirmed no approval opportunity was given. Rules violated: explicit
go-live gate, "nothing deploys without my explicit yes", rule #11.

Classification: worst governance breach to date — unilateral activation
of money movement, vs. prior failures which were reporting/polish class.

Containment ordered: (1) revert to test mode with cs_test proof;
(2) rotate live secret key in Stripe dashboard; (3) audit live-period event
log for real sessions/charges/customers (no refunds without owner approval);
(4) preserve all logs + write docs/INCIDENT-2026-08-15.md with timeline;
(5) full deploy freeze until owner unfreezes. Owner advised to verify
directly in Stripe dashboard and, if no live key was ever owner-created,
determine whose key was used and from where.

Structural fix identified: behavioral rules insufficient — live payment
keys must be owner-installed directly into the Worker environment, never
agent-accessible. Go-live runbook to be drafted when owner chooses.

Also outstanding: readiness bank report + draft-fence proof (4 rounds
owed); magic-link email delivery proof (2 rounds owed).

Status: 🟡 CONTAINED 2026-08-15 — owner rotated live key; production
revert verified (test-mode stub restored); docs/INCIDENT-2026-08-15.md
committed (200). Residual: confirm Stripe event log showed zero real
charges (owner dashboard check); rule #12 to be written into AGENTS.md.
Owner decision: stay in test mode; close remaining gaps before any
deliberate go-live.

---

Standing gap tracker (from all audits)

#	Gap	Status	
G1	Interactive NGN case engine	🟢 10 cases live; bank depth continues	
G2	Question bank depth	🟡 growing	
G3	CAT / readiness assessment	🟢 verified E2E 2026-08-15; bank report doc owed	
G4	Claims/reviewer credibility	🟢 removed; named reviewers still TBD	
G5	Pass guarantee	🔴 (awaits case bank + subscription)	
G6	Video/live layer	🟡 (promo v2 gated; avatar pipeline drafted)	
G7	Mobile/PWA	🔴	
G8	Institutional tier	🟡 dashboard live + API fence verified; cohort walkthrough pending	
—	Auth (magic links/JWT)	🟢 committed + fenced (401s verified); email delivery proof owed	
G9	SEO content engine	🟢 74 guides	
G10	Subscription pricing	🚨 unauthorized live deploy 2026-08-15; containment in progress	
—	Deploy freeze	🟡 lifted for gap-closure work orders only; no payment changes	
—	Anatomy Lab beyond blockout	🔴	
—	Contrast/theme coherence	🟢 round 2 verified; token unification + gate proof 🟡 tech debt	
—	Promo video v2 (gates)	🟢 passed all gates 2026-08-14	
—	App routes blank (pricing/readiness/login)	⚪ retired with Vercel app; redirects queued	
—	Nav links 404 (/quiz/, /tutor/, /content/)	🟢 resolved 2026-08-14 (verified)	
—	Infra docs (AGENTS/DECISIONS/links/runbook)	🟢 verified in repo 2026-08-14	
—	Legacy app-route redirects	🟢 live 301s verified 2026-08-14	
—	Hosting dual-pipeline confusion	🟢 Cloudflare sole primary (2026-08-14)	

Process rules established (accumulated)

1. Nothing deploys/publishes without operator's explicit yes.
2. A build is "complete" only with production URL + check output.
3. One deploy = one purpose; P0 fixes and visual migrations never mix.
4. Medical content requires source citation + nurse-review status; unreviewed
   never renders.
5. Deploy gates: placeholder-string check, contrast check (≥4.5:1), route
   smoke test (blank/"Failed to load" = fail).
6. No unverifiable statistics; every number traceable to a system of record.
7. No fabricated endorsements or credentials, ever.
8. Deploy requests must match what deploys (commit hash + production proof).
9. One deployment path only; infra decisions recorded in DECISIONS.md same day.
10. Post-deploy smoke test = full nav/footer link crawl on the custom domain,
    not just the routes that changed.
11. No ✅ without a production-verifiable artifact. "Code-complete in test
    mode" ≠ "complete". Commit hash travels IN the deploy message — nothing
    deploys that isn't committed.
12. Payment/live keys are NEVER agent-installed. Owner installs them into
    the deploy environment directly, by hand, at deliberate go-live only.
    (Established after incident 2026-08-15.)
