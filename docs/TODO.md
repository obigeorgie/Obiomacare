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
- [x] **PWA support** — manifest.json, service worker, offline cache (G7)

---

## 🔄 In Progress / Blocked

| Task | Status | Blocker |
|------|--------|---------|
| Stripe E2E test purchase | Blocked | Live mode only; needs real payment or test keys |
| GSC automated submission | Working | Use `sc-domain:obiomacare.com` format; URL indexing requires explicit per-URL ownership |
| GA4 analytics review | Blocked | No Data API credentials configured |
| **R2 bucket + /media/* route** | ✅ Done | Bucket created, route wired, 5 diagrams uploaded |
| **First 5 anatomical diagrams** | ✅ Done | All 5 reviewed, embedded, CI gate active |
| **Sequence emails (E0/E2/E4/E7/E10) branded HTML** | ✅ Deployed 2026-08-21 (worker version 110) | E2 verified styled in owner inbox; text fallback kept (multipart/alternative) |
| **Pre-live gate (2026-08-21)** | ✅ Passed + deployed (cd3bac9) | 97/97 URLs 200; contrast ≥4.5:1 (coral → #c53030, grays → #64748b); sitemap /free-framework/ fix; RUM beacon on 94 pages |

---

## 📋 Next Up

### High Priority
- [ ] **GSC access fix** — Add `masterygraph-sitemap@masterygraph-gsc.iam.gserviceaccount.com` as Owner in GSC
- [ ] **Stripe test mode** — Set up test keys for safe E2E verification
- [ ] **Analytics dashboard** — Set up GA4 Data API access for programmatic reporting
- [x] **R2 media pipeline** — ✅ Complete: bucket created, `/media/*` route wired, 5 diagrams reviewed + embedded, CI gate active
- [ ] **Visual content tranche 2 (15 remaining diagrams)** — See Visual Content Backlog below
- [ ] **Neuro diagram composition rebalance** — Crop dead space on left half (non-blocking from v2 review)
- [ ] **GI absorption-icon anchoring** — Move "Fat" icon from transverse colon to small intestine (non-blocking from v2 review)

### Medium Priority
- [x] **Content gap analysis** — 12 opportunities identified, 9 guides published (~120K words)
- [ ] **Backlink outreach** — In progress: templates drafted, prospect research begun
- [ ] **Social content calendar** — Schedule posts from `social-schedule.json`
- [ ] **A/B test pricing page** — Test headline/CTA variants
- [ ] **Visual content blockout (15 remaining diagrams)** — See Visual Content Backlog below

### Low Priority
- [ ] **Redirects for retired app routes** — `/pricing`, `/cases`, `/login`, `/readiness`, `/anatomy-lab` currently 404. Map to working pages or add wrangler redirects.
- [ ] **Redis for delivery tokens** — Replace in-memory storage
- [ ] **Unit tests for API** — Automated endpoint testing
- [ ] **User dashboard** — Download history, progress tracking

---

## 🐛 Known Issues

| Issue | Severity | Notes |
|-------|----------|-------|
| Cloudflare email obfuscation 404s | Low | `cdn-cgi/l/email-protection` returns 404 to crawlers; works for JS-enabled users |
| In-memory delivery tokens | Low | Lost on deploy; low impact for digital downloads |
| No automated tests | Low | Manual testing only; stable for 2+ weeks |
| Express API not on Worker | Medium | API endpoints (`/api/*`, `/tutor/*`) return 404 from Worker. Needs separate architecture decision. |
| 8 content files are Markdown, not valid HTML | Medium | `nclex-emergency-drugs`, `nclex-fluids-electrolytes-deep-dive`, `nclex-mechanical-ventilation`, `nclex-ob-labor-stages`, `nclex-pediatric-milestones`, `nclex-prioritization-frameworks`, `nclex-trauma-nursing`, `nclex-wound-care-pressure-injuries` — missing `<!DOCTYPE html>`, PWA meta not injected. Convert to proper HTML format. |

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
| Visual diagrams (blockout) | 5 reviewed + embedded |
| Visual diagrams (backlog) | 15 planned — see Visual Content Backlog below |

---

## 🎨 Visual Content Backlog

Blockout pass approved: 5 core system diagrams (cardiovascular, respiratory, neuro, renal, GI). 
Remaining 15 descoped to backlog:

| # | System/Topic | Target Guide | Priority |
|---|-------------|--------------|----------|
| 1 | Musculoskeletal system | nclex-musculoskeletal-disorders-deep-dive | P2 |
| 2 | Integumentary / skin layers | nclex-burns-integumentary-disorders | P2 |
| 3 | Wound healing stages | nclex-burns-wound-care-deep-dive | P2 |
| 4 | Hematopoiesis & blood cell types | nclex-hematology-disorders | P2 |
| 5 | Eye anatomy (cross-section) | nclex-sensory-disorders | P2 |
| 6 | Ear anatomy (cross-section) | nclex-sensory-disorders | P2 |
| 7 | Female reproductive system | nclex-maternity-study-guide | P2 |
| 8 | Fetal circulation | nclex-obstetric-complications | P2 |
| 9 | Labor stages diagram | nclex-ob-labor-stages | P2 |
| 10 | Pediatric growth milestones chart | nclex-pediatric-milestones | P2 |
| 11 | Congenital heart defects (cyanotic vs acyanotic) | nclex-pediatric-cardiac-congenital | P3 |
| 12 | Mental health medication mechanisms | nclex-psychiatric-medications | P3 |
| 13 | Emergency drug algorithm flowchart | nclex-emergency-drugs | P3 |
| 14 | ABG interpretation diagram (ROME method) | nclex-abg-interpretation | P3 |
| 15 | EKG waveform with intervals labeled | nclex-ekg-interpretation | P3 |

*Status: All entries pending R2 pipeline completion and blockout review gate.*
