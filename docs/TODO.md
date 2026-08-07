# TODO.md — Obioma Care

## ✅ Completed (2026-08-07)

### Critical Fixes
- [x] Fixed `FROM_EMAIL`/`BRAND_COLORS` hoisting bug in Stripe webhook
- [x] Added missing `jsonwebtoken` dependency
- [x] Fixed broken `/landing/` links across 8 content files
- [x] Created `public/privacy.html` and `public/terms.html`
- [x] Removed stale `dist/api/` directory
- [x] Deduplicated `.gitignore`
- [x] Regenerated sitemap with 69 URLs

### API Endpoints
- [x] `POST /api/newsletter` — subscribe endpoint
- [x] `POST /api/contact` — contact form
- [x] `POST /api/validate-promo` — promo code validation
- [x] `POST /api/create-checkout` — Stripe checkout creation

### Analytics & Tracking
- [x] Added GA4 (`G-922HP9B76M`) to all 64 content + 7 landing pages
- [x] Added Facebook Pixel (`1045171501242922`) to all pages
- [x] Created `/success.html` with purchase event tracking
- [x] Connected Vercel Web Analytics + Speed Insights

### Firestore
- [x] Webhook updates lead with `purchased`, `tier`, `stripeCustomerId`
- [x] Webhook updates user tier on purchase
- [x] Cron nurture endpoint logs to `automation_logs`
- [x] Deleted stale `landing` + `public` collections (152 docs)

### Cleanup
- [x] Removed old MasteryGraph app artifacts (`dist/`, dead API stubs)
- [x] Replaced `app.obiomacare.com` links in 40 content files
- [x] Removed dead Vercel routes for old app

### CI/CD
- [x] Created GitHub Actions workflows (deploy.yml, ci.yml)
- [x] Pushed 47 commits to `https://github.com/obigeorgie/Obiomacare.git`

---

## 🔄 In Progress

- [ ] Verify Stripe end-to-end with real `TEST99` purchase
- [ ] Add GitHub Action secrets: `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

---

## 📋 Next Up

### High Priority
- [ ] Submit sitemap to Google Search Console
- [ ] Real Stripe test purchase (verify email delivery + download)
- [ ] Verify GA4/FB Pixel receive real purchase events

### Medium Priority
- [ ] Batch 4 content creation:
  - [ ] NCLEX Fundamentals deep-dive
  - [ ] Fluids & Electrolytes comprehensive guide
  - [ ] Mechanical Ventilation guide
  - [ ] Trauma Nursing guide
- [ ] Add more promo codes (beyond TEST99)
- [ ] Set up email nurture sequence monitoring

### Low Priority
- [ ] Add unit tests for API endpoints
- [ ] Implement Redis for delivery tokens (currently in-memory)
- [ ] Add user dashboard for download history
- [ ] A/B test pricing page variants

---

## 🐛 Known Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| In-memory delivery tokens | Medium | Lost on deploy; use Redis in production |
| No automated tests | Low | Manual testing only |
| 3 users have `tier: "none"` | Low | Pre-existing accounts; will update on next purchase |

---

*Last updated: 2026-08-07*
