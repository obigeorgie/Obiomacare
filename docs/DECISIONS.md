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

*Last updated: 2026-08-07*
