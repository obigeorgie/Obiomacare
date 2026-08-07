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
- [x] Added GA4 (`G-922HP9B76M`) to all 67 content + 7 landing pages
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
- [x] Pushed 50 commits to `https://github.com/obigeorgie/Obiomacare.git`

## ✅ Completed (2026-08-08)

### Documentation
- [x] Created `AGENTS.md` — project agent guide with health check, commands, troubleshooting
- [x] Created `docs/TODO.md` — task tracking
- [x] Created `docs/DECISIONS.md` — 11 settled architectural decisions
- [x] Created `docs/links.md` — canonical URLs, endpoints, dashboards
- [x] Created `docs/SESSION-LOG.md` — session history
- [x] Created `KIMICLAW-BOOTSTRAP.md` — session bootstrap prompt
- [x] Updated `.env.example` — comprehensive environment variables

### Batch 4 Content (COMPLETED)
- [x] `nclex-fluids-electrolytes-master.html` (14.7 KB) — Osmolality, acid-base, IV calculations, electrolyte emergencies, NGN case study
- [x] `nclex-mechanical-ventilation-master.html` (13.6 KB) — Vent modes, ARDS, PEEP, weaning, ETT care, alarms, NGN case study
- [x] `nclex-trauma-nursing-master.html` (13.9 KB) — ABCDE triage, shock, burns, spinal injury, head trauma, NGN case study
- [x] Sitemap updated to 69 URLs

### Stripe Test (PARTIALLY VERIFIED)
- [x] TEST99 promo code validates correctly
- [x] Checkout URL generates successfully
- [x] Success page exists with GA4 + FB Pixel purchase tracking
- [x] Download PDFs accessible
- [x] Webhook handler configured for `checkout.session.completed`
- [x] API health check passes (stripe: true)
- [ ] **PENDING**: Actual payment completion (requires real card)

---

## 🔄 In Progress

- [ ] Add GitHub Action secrets: `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`

---

## 📋 Next Up

### High Priority (Requires Manual Action)
- [ ] **Submit sitemap to Google Search Console** — Go to https://search.google.com/search-console, add property `obiomacare.com`, submit sitemap URL: `https://obiomacare.com/sitemap.xml`
- [ ] **Real Stripe test purchase** — Use code `TEST99` at checkout, pay ~$0.94, verify email arrives with download link, confirm Firestore lead updated
- [ ] **Verify GA4/FB Pixel receive real purchase events** — Check GA4 Real-Time reports and FB Events Manager after test purchase

### Medium Priority
- [ ] Add more promo codes (beyond TEST99)
- [ ] Set up email nurture sequence monitoring
- [ ] Create Batch 5 content (see content-roadmap.md)

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

*Last updated: 2026-08-08*
