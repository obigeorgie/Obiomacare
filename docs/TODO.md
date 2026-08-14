# TODO.md — Obioma Care

*Last updated: 2026-08-11*

## ✅ Completed

### Critical Infrastructure
- [x] Stripe checkout + webhook (live mode)
- [x] GA4 + FB Pixel tracking
- [x] Firestore lead/user management
- [x] **Cloudflare Workers deployment** (replaced Vercel 2026-08-15)
- [x] Email nurture cron (daily 10 AM UTC)
- [x] Promo codes: TEST99, LAUNCH50, NURSE20

### Content (74 articles live)
- [x] Phase 1: Lab values, pharmacology, NGN, body systems, specialty nursing
- [x] Phase 2: Fundamentals, nutrition, professional issues
- [x] Batch 5: 8 new guides (electrolyte mnemonics, drug levels, cardiac enzymes, matrix grid, CJMM, vital signs, legal/ethical, safety/fall prevention)
- [x] Batch 6: 5 new guides (types of shock, ABG interpretation, OB labor stages, EKG interpretation, pediatric milestones)
- [x] Care plan template library (10 examples + NANDA reference)
- [x] All articles have product CTAs
- [x] All articles have case studies or interactive questions
- [x] Internal link audit complete (0 generic links)
- [x] BreadcrumbList schema on 73 pages
- [x] Article schema on 8 key pages

### SEO
- [x] Sitemap: 80+ URLs including case-engine, quiz, downloads
- [x] Meta descriptions on all 74 content pages
- [x] Alt tags on all images
- [x] Cross-linking between related articles
- [x] Redirects for merged/deprecated content

### Trust & Compliance
- [x] Unsubstantiated claims replaced with verified stats
- [x] Product schema + Review structured data
- [x] Privacy policy + Terms pages
- [x] 30-day guarantee clearly stated

### Interactive Features
- [x] NGN Case Engine: 10 clinical judgment cases
- [x] Quiz system: lab-values quiz live
- [x] 12+ downloadable cheat sheets / quick references

---

## 🔄 In Progress / Blocked

| Task | Status | Blocker |
|------|--------|---------|
| Stripe E2E test purchase | Blocked | Live mode only; needs real payment or test keys |
| GSC automated submission | Working | Use `sc-domain:obiomacare.com` format; URL indexing requires explicit per-URL ownership |
| GA4 analytics review | Blocked | No Data API credentials configured |

---

## 📋 Next Up

### High Priority
- [ ] **GSC access fix** — Add `masterygraph-sitemap@masterygraph-gsc.iam.gserviceaccount.com` as Owner in GSC
- [ ] **Stripe test mode** — Set up test keys for safe E2E verification
- [ ] **Analytics dashboard** — Set up GA4 Data API access for programmatic reporting

### Medium Priority
- [x] **Content gap analysis** — 12 opportunities identified, 9 guides published (~120K words)
- [ ] **Backlink outreach** — In progress: templates drafted, prospect research begun
- [ ] **Social content calendar** — Schedule posts from `social-schedule.json`
- [ ] **A/B test pricing page** — Test headline/CTA variants

### Low Priority
- [ ] **Redis for delivery tokens** — Replace in-memory storage
- [ ] **Unit tests for API** — Automated endpoint testing
- [ ] **User dashboard** — Download history, progress tracking

---

## 🐛 Known Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| `app.obiomacare.com` routes to Vercel | **Medium** | DNS CNAME points to `cname.vercel-dns.com`. Needs Cloudflare DNS toggle to Proxied (orange cloud) or CNAME deletion + A record. |
| Cloudflare email obfuscation 404s | Low | `cdn-cgi/l/email-protection` returns 404 to crawlers; works for JS-enabled users |
| In-memory delivery tokens | Low | Lost on deploy; low impact for digital downloads |
| No automated tests | Low | Manual testing only; stable for 2+ weeks |

---

## 📊 Current Metrics

| Metric | Value |
|--------|-------|
| Content pages | 74 |
| Downloadable resources | 12+ |
| Interactive NGN cases | 10 |
| Leads in Firestore | 53 |
| Promo codes active | 3 |
| Email sequences | 2 (nurture + post-purchase) |
