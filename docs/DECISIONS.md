# DECISIONS.md — Obioma Care

**Settled decisions. Do not re-litigate without new information.**

---

## Architecture

### 1. Static Site + Serverless API
**Decision**: Use static HTML for content, Express API for dynamic functions.
**Rationale**: Vercel's serverless functions are perfect for Stripe webhooks, email, and Firestore. Static HTML is fast, cacheable, and SEO-friendly.
**Date**: 2026-07-23

### 2. Firebase Firestore for Data
**Decision**: Use Firestore for leads, users, and automation logs.
**Rationale**: Serverless-native, scales automatically, integrates with Firebase Auth if needed later.
**Date**: 2026-07-23

### 3. Hostinger SMTP for Email
**Decision**: Use Hostinger SMTP (not SendGrid/Resend) for transactional and nurture emails.
**Rationale**: Already set up with `admin@obiomacare.com`. Resend is configured as fallback.
**Date**: 2026-07-23

---

## Product

### 4. Two-Tier Pricing
**Decision**: Core ($47) and Complete ($67) only. No subscription.
**Rationale**: Simple one-time purchase reduces friction. Core = essential framework. Complete = everything.
**Date**: 2026-07-23

### 5. TEST99 Promo for E2E Testing
**Decision**: Keep `TEST99` promo code (98% off) for testing.
**Rationale**: Allows real Stripe flow testing without spending $47 each time.
**Date**: 2026-08-07

---

## Content

### 6. 64+ Content Pages Strategy
**Decision**: Publish comprehensive NCLEX guides as individual HTML pages.
**Rationale**: Each page targets specific long-tail keywords. Combined they create topical authority.
**Date**: 2026-08-01

### 7. No CMS
**Decision**: Content is hand-written HTML, not a CMS.
**Rationale**: Full control over SEO, schema markup, and page speed. Trade-off: harder to update.
**Date**: 2026-07-23

---

## Marketing

### 8. GA4 + FB Pixel + Vercel Analytics
**Decision**: Run all three analytics platforms simultaneously.
**Rationale**: GA4 for SEO/content analysis, FB Pixel for ad retargeting, Vercel for performance.
**Date**: 2026-08-07

### 9. Lead Magnet → Nurture → Purchase Funnel
**Decision**: Free checklist → 5-day email nurture → paid product.
**Rationale**: Low-friction entry, builds trust before asking for money.
**Date**: 2026-07-23

---

## Deploy

### 12. Cloudflare Workers as Primary Hosting
**Decision**: Use Cloudflare Workers (`obiomacare-site`) as the production hosting platform.
**Rationale**: Workers are always-on, globally distributed, and don't require secrets for deployment beyond a single API token. Vercel pipeline was failing due to missing GitHub Action secrets.
**Date**: 2026-08-15

**Deploy command**:
```bash
export CLOUDFLARE_API_TOKEN=<token>
npm run build
wrangler deploy
```

**Rollback**:
```bash
wrangler rollback <version-id>   # from wrangler deployments list
```

**Active routes**:
- `obiomacare.com/*` → Worker
- `www.obiomacare.com/*` → Worker
- `app.obiomacare.com/*` → Worker (pending DNS CNAME fix)
- `obiomacare-site.empathycollection.workers.dev` → Worker (staging)

### 13. Vercel Pipeline Retired
**Decision**: Do not maintain Vercel deployment pipeline.
**Rationale**: GitHub Actions workflow `.github/workflows/deploy.yml` has been failing for multiple runs due to missing `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, and `VERCEL_TOKEN` secrets. Cloudflare Workers is now primary.
**Date**: 2026-08-15
**Status**: Workflow file retained in repo but not maintained. Delete when confident Workers is stable.

### 11. Local `master` → Remote `main`
**Decision**: Local `master` branch pushes to remote `main`.
**Rationale**: Remote repo has `main` as default branch. Force-push used to overwrite unrelated history.
**Date**: 2026-08-07

---

*Last updated: 2026-08-18*

---

## Master Directive — 2026-08-18

### 14. Master Directive Registration
**Decision**: The ATLAS persona + ObiomaCare governance bundle (14 process rules, audit log, gap tracker) is registered as the Master Directive. Canonical copy lives at `/data/profiles/atlas/SOUL.md`; this file and `AGENTS.md` are the enforcement copies.
**Rationale**: A single named directive gives every session a stable source of authority. All three copies must stay identical; rule or decision changes update every copy in the same commit.
**Date**: 2026-08-18
**Status**: ACTIVE

---

## Readiness Assessment (G3) — 2026-08-15

### 8. CAT-Style Adaptive Engine (IRT-Lite)
**Decision**: Use a simplified item response theory approach: θ ± 0.15 per response, bounded 0.1–1.0.
**Rationale**: Full IRT requires thousands of responses for calibration. This lite version is explainable, implementable in a Worker, and honest about its limitations.
**Date**: 2026-08-15

### 9. In-Memory Session Store (Temporary)
**Decision**: Store assessment sessions in a JavaScript Map (in-memory).
**Rationale**: Workers are stateless; KV or D1 is needed for production persistence. In-memory is acceptable for initial build and testing. Migration path: replace Map with Cloudflare KV binding.
**Date**: 2026-08-15

### 10. No Pass-Probability Claims
**Decision**: Results show ability estimate + confidence interval + readiness band. Never claim "X% chance of passing NCLEX."
**Rationale**: We do not have outcome data correlating our scores with actual NCLEX pass rates. Any such claim would be unverifiable and potentially harmful.
**Date**: 2026-08-15

### 11. Tier-Based Result Gating
**Decision**: Free tier gets summary (band + strength/weakness flags). Paid tier gets full breakdown (category accuracy %, NCJMM step analysis, history over time).
**Rationale**: Free tier must provide value (honest readiness estimate) while creating upgrade incentive (detailed action plan).
**Date**: 2026-08-15

---

## Revenue OS — 2026-08-18

### 15. Funnel Events Storage: Cloudflare KV
**Decision**: Canonical funnel events stored in KV namespace `events` — raw events as `evt:<date>:<type>:<uuid>` + daily counters `cnt:<date>:<type>`. Firestore deferred (no service-account key on the Worker path today; KV is queryable enough for counters/digest and cheap).
**Rationale**: Existing stack, zero new platforms, sufficient for daily counters + digest; migrate to Firestore/D1 only if analytics needs grow beyond counters.
**Date**: 2026-08-18
**Status**: ACTIVE

### 16. Operator Auth (dashboard + digest)
**Decision**: `/admin`, `/api/operator/metrics`, `/api/operator/email` accept (a) owner JWT session (ADMIN_EMAIL match) or (b) `X-Operator-Key` header matching Worker secret `OPERATOR_API_KEY` (for the scheduled digest). `ADMIN_EMAIL` gates the dashboard; `OPERATOR_API_KEY` is owner-installed in Cloudflare AND this box — never in chat.
**Date**: 2026-08-18
**Status**: ACTIVE

### 17. Firestore is Archive-Only; KV is Canonical
**Decision**: Firebase Firestore is an archive-only store. KV is the canonical system of record for users, entitlements, sessions, and funnel counters. The "Firestore not yet wired" note in /api/user-tier is removed (verified gone from code and production 2026-08-18); it will not be re-added.
**Rationale**: Re-adding Firestore to the entitlement path recreates the two-sources-of-truth problem we consolidated away from (DECISIONS #15). Firestore keeps read-only archival value (leads, automation logs, analytics evidence) and may be decommissioned per the 2026-08-18 end-state plan after line-by-line owner approval of deletions.
**Date**: 2026-08-18
**Status**: ACTIVE

### 18. Worker Consolidation — single deployment target
**Decision**: The duplicate worker `obiomacare` (deployed 2026-08-18T17:26 from a
non-canonical tree) was DELETED. `obiomacare-site` is the sole Worker per
DECISIONS #9. Verified: custom domain unaffected (routes → obiomacare-site),
all bindings (events, users, readiness_sessions, MEDIA_BUCKET, secrets)
confirmed on the surviving worker.
**Date**: 2026-08-18
**Status**: ACTIVE

### 19. Phase 2 Nurture Sequence — architecture
**Decision**: Email capture/nurture runs through the Worker (Resend secret stays
in Cloudflare). `/api/lead-magnet` (POST) = email-gated checklist (ensure
`checklist` audience → add contact → KV `seq:<email>` state → send E0 →
`{ok, downloadUrl}`). `/api/unsubscribe` = one-click (contact delete +
suppression flag). `/api/operator/process-sequence` (operator-key gated) =
daily sweep sending due E2/E4/E7/E10. Sweep triggered by Hermes cron
`b9103651f5bb` (06:00 UTC daily, silent-when-empty).
**Fences**: copy DRAFT at `docs/phase2-email-copy.md` — owner approves
email-by-email before any send beyond owner test inbox; mailing address
owner-filled before activation. Sequence state in KV `events` namespace.
**Date**: 2026-08-18
**Status**: BUILD COMPLETE — parked at deploy gate (rule #1)
