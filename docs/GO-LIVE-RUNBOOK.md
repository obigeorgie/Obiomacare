# GO-LIVE RUNBOOK — Obioma (Revenue OS Phase 4)

**Status:** DRAFT (2026-08-19) — dormant. Execute ONLY on explicit owner command.
Owner-only execution for every key step (rule #12). All other rules apply.

---

## 0. What this runbook is

Deliberate transition from TEST MODE to LIVE payments. Nothing in this file
activates anything by itself — each phase is gated on an explicit owner "go".

---

## 1. BLOCKING GATES (must all pass before Phase B)

- [ ] **GATE A — Offer integrity (P1 work order):** pricing-page features vs
      live pages — **every bullet on the pricing page resolves to a real,
      linked feature**. No "Coming soon" rows, no features that don't exist
      (3D Anatomy Lab, Exclusive webinars, Community access are REMOVED —
      they may return only when built). Verify: crawl every pricing feature
      bullet → each links to a live page or is an existing capability.
- [ ] **GATE B — Trial copy rule:** ONE trial rule stated consistently
      (monthly = 7 days, annual = 14 days) across pricing, homepage, FAQ,
      checkout, and emails.
- [ ] **GATE C — Refund policy:** terms.html states the refund policy
      verbatim as on the pricing FAQ; refund contact = contact form
      (support@ mailbox not used).
- [ ] **GATE D — Trial reminder:** `customer.subscription.trial_will_end`
      webhook → Resend reminder (implemented 2026-08-19; verify live with a
      test subscription in test mode before go-live).
- [ ] **GATE E — Test cycle:** nurture E0–E10 owner test cycle complete and
      judged; sequence copy approved email-by-email; mailing address provided
      (CAN-SPAM) — or owner accepted the no-address risk.
- [ ] **GATE F — Verification debt:** magic-link delivery proof closed; all
      pending media review closed (none pending); sitewide claim scan clean
      (no unverifiable stats).

## 2. Phase A — Pre-flight (owner)

1. Confirm all BLOCKING GATES above.
2. Confirm `NURTURE_TEST_MODE=1` still set (test-only sends) — flip to live
   only as a separate explicit decision AFTER go-live.
3. Backup: `wrangler deployments list` — record current version ID (rollback
   target).

## 3. Phase B — Live key installation (OWNER ONLY, rule #12)

1. In the Stripe dashboard: enable LIVE mode; confirm the account is verified.
2. Owner installs by hand, directly into the Worker environment (dashboard or
   `wrangler secret put` run by the owner):
   - `STRIPE_SECRET_KEY` (live sk_live_…)
   - `STRIPE_PUBLISHABLE_KEY` (live pk_live_…)
   - `STRIPE_WEBHOOK_SECRET` (live whsec_…)
   - Rotate/confirm `OPERATOR_API_KEY`, `ADMIN_EMAIL`, `RESEND_API_KEY`.
3. Create the LIVE webhook endpoint in Stripe dashboard:
   `https://obiomacare.com/api/webhook` + events:
   `checkout.session.completed`, `invoice.payment_failed`,
   `customer.subscription.deleted`, `customer.subscription.trial_will_end`.
4. Agent NEVER sees or handles the live keys (rule #12). If a live key
   appears in chat/logs/repo — treat as burned, rotate, incident log.

## 4. Phase C — Live verification (owner + agent evidence)

1. `curl https://obiomacare.com/api/health` → mode must read `live` (or
   verify via a test checkout that the session URL is `checkout.stripe.com/c/pay/...`).
2. **1 real test purchase** with the owner's card (smallest plan): full flow
   checkout → webhook → entitlement update → receipt.
3. **Refund path test**: issue a refund in Stripe dashboard; verify the
   customer-facing refund copy matches the FAQ (7-day / 14-day); verify no
   entitlement glitch.
4. **Trial path test**: create a trial subscription (test customer); verify
   `trial_will_end` webhook fires → reminder email lands.
5. **Unsubscribe test**: confirm-page flow on a real recipient.
6. Post-deploy verification per rule #10 (full link crawl) + offer-integrity
   crawl (GATE A).

## 5. Phase D — Rollback plan

1. **Rollback deploy:** `wrangler rollback <version-id>` (Phase A target).
2. **Disable live payments:** owner deletes/revokes the live `STRIPE_SECRET_KEY`
   secret → all checkout attempts fail closed (no charges).
3. **Restore test mode:** owner reinstalls test keys; `STRIPE_WEBHOOK_SECRET`
   back to test; re-run Phase C checks.
4. **Emergency contact:** owner is the only decision-maker for refunds/credits
   (no agent-initiated refunds).

## 6. Post-go-live checklist (first 7 days)

- [ ] Daily heartbeat (site + API).
- [ ] First Monday digest: baseline live-week numbers (Revenue OS Phase 1).
- [ ] Watch: bounce rate, spam complaints, refund requests — weekly digest.
- [ ] No unreviewed content published; owner-approved content MAY auto-post via
      the Phase 3.5 queue (per-asset approval, instant halt); no pricing changes
      without line-item approval.

---
*Draft 2026-08-19 — pending owner review; dormant until explicit "go live".*
