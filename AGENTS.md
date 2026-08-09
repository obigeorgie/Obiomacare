# AGENTS.md — Obioma Care Project Agent Guide

This file is the **source of truth** for AI agents working on the Obioma Care project. Chat history is unreliable — this file is not.

---

## 🚀 New Session Protocol

**Before doing anything else**, complete these steps:

1. **Read `AGENTS.md`** (this file) — rules override chat history
2. **Read `docs/TODO.md`** — what's done / what's next
3. **Read `docs/DECISIONS.md`** — settled decisions, do not re-litigate
4. **Read `docs/links.md`** — canonical URLs, endpoints, dashboards
5. **Run the health check** (see below) and report results
6. **Summarize back** in under 10 lines: stack, priorities, health results, first task

If anything contradicts what you find in the repo, **flag it** instead of guessing.

---

## 📋 Project Overview

**Obioma Care** is a nursing education platform focused on NCLEX Clinical Judgment preparation.

- **Landing site**: Static HTML pages (Vercel) — lead magnets, content, checkout
- **API**: Express server (Vercel Functions) — Stripe, email, Firestore, tutor
- **Content**: 64+ NCLEX study guides with NGN case studies
- **Products**: Digital downloads (Core $47, Complete $67)

---

## 🛠️ Stack

| Layer | Technology |
|-------|-----------|
| Hosting | Vercel (serverless functions) |
| Frontend | Static HTML/CSS/JS |
| Backend | Node.js + Express |
| Database | Firebase Firestore |
| Auth | Stripe Checkout sessions + in-house tokens |
| Payments | Stripe (live keys) |
| Email | Hostinger SMTP + Resend fallback |
| Analytics | GA4 + FB Pixel + Vercel Web Analytics |
| CI/CD | GitHub Actions → Vercel |

---

## ⚠️ Critical Rules

| Rule | Detail |
|------|--------|
| **No deploys without explicit approval** | Always ask before `vercel --prod` |
| **Medical content needs citations** | Source citation + nurse-review status |
| **Secrets never in chat/code/logs** | `.env` and `firebase-service-account.json` are gitignored |
| **Stripe keys live in Vercel env vars only** | Never hardcode |
| **Update docs at session end** | `docs/TODO.md`, `docs/DECISIONS.md` if decisions made |

---

## 🏥 Health Check

Run this at the start of every session:

```bash
cd obioma-care

# 1. API health
curl -s https://obiomacare.com/api/health | python3 -m json.tool
# Expected: {"status":"ok","stripe":true,"email":true,"firebase":true}

# 2. Build test
npm run build
# Expected: ✅ Build complete: 64 content files + landing assets → public/

# 3. Verify key pages
curl -s -o /dev/null -w "%{http_code}" https://obiomacare.com/              # 200
curl -s -o /dev/null -w "%{http_code}" https://obiomacare.com/api/health    # 200
curl -s -o /dev/null -w "%{http_code}" https://obiomacare.com/sitemap.xml  # 200
```

---

## ⌨️ Quick Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | Build static site → `public/` |
| `vercel --prod` | Deploy to production |
| `vercel dev` | Local dev server |
| `vercel logs` | Check production logs |
| `npm start` | Local Express API server |
| `node scripts/check-firestore.js` | Verify Firestore connection |

---

## 🔧 Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Stripe webhook 400/500 | `STRIPE_WEBHOOK_SECRET` mismatch | Check Vercel env vars match Stripe dashboard |
| Build fails with missing files | `landing/content/` copy in build script | Remove stale copy, ensure source files exist |
| Emails not sending | Hostinger SMTP blocked/credentials wrong | Check `SMTP_USER`/`SMTP_PASS` in Vercel env |
| Firestore permission denied | Service account key missing/invalid | Verify `firebase-service-account.json` exists and is valid |
| Analytics not showing data | Scripts not in HTML | Check `_vercel/insights/script.js` in page `<head>` |
| Old app links in content | Stale `dist/` or missed replacements | Search for `app.obiomacare.com` in `content/` |
| Deploy takes forever | Large `node_modules` or build cache | `vercel --force` to skip cache |

---

## 📝 Session Log

At the **end of every session**, append to `docs/SESSION-LOG.md`:

```markdown
## YYYY-MM-DD HH:MM
- **Task**: [what you worked on]
- **Files modified**: [list]
- **Commits**: [hash] — [message]
- **Deployed**: yes/no
- **Blockers**: [any issues encountered]
- **Next**: [what the next session should do]
```

---

## 📁 Project Structure

```
obioma-care/
├── api/                  # Express API (Vercel serverless)
│   ├── index.js         # Main API entry (~1100 lines)
│   └── tutor.js         # AI tutor module
├── content/             # 64 NCLEX study guides (HTML)
├── landing/             # Landing pages (HTML)
│   ├── index.html       # Homepage
│   ├── success.html     # Post-purchase
│   ├── free-nclex-checklist.html
│   ├── privacy.html
│   └── terms.html
├── lib/                 # Shared helpers
│   └── firestore-helper.js
├── scripts/             # Build + utility scripts
│   ├── build.js
│   └── check-firestore.js
├── public/              # Build output (Vercel serves this)
├── products/            # PDF deliverables
├── research/            # Competitive research
├── docs/                # Project documentation
│   ├── TODO.md
│   ├── DECISIONS.md
│   ├── links.md
│   └── SESSION-LOG.md
└── vercel.json          # Vercel config + routes + crons
```

---

## 🔑 Key Identifiers

| Resource | Value |
|----------|-------|
| **Firebase Project** | `kindred-x5pbk` |
| **GA4 ID** | `G-922HP9B76M` |
| **FB Pixel ID** | `1045171501242922` |
| **Vercel Project** | `prj_8ehbHaJEcI9vlxLb0VVdihCxixZZ` |
| **Vercel Org** | `team_zQK0ygIpqt6DgFz5Dolfdoe3` |
| **Brand Email** | `admin@obiomacare.com` |
| **Domain** | `obiomacare.com` |
| **Repo** | `https://github.com/obigeorgie/Obiomacare.git` |

---

## 🎯 Active Priorities (from docs/TODO.md)

1. **Submit sitemap to Google Search Console**
2. **Real Stripe test purchase** with `TEST99` promo
3. **Add GitHub Action secrets**: `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
4. **Batch 4 content**: Fundamentals, Fluids/Electrolytes, Mechanical Ventilation, Trauma
5. **Verify GA4/FB Pixel** receive real purchase events

---

## 📞 Emergency Contacts

| Issue | What to Check |
|-------|--------------|
| Site down | Vercel dashboard → deployment status |
| Payments broken | Stripe dashboard → webhooks → recent events |
| Emails down | Hostinger email settings + SMTP logs |
| Database issues | Firebase console → Firestore → usage |

---

*Last updated: 2026-08-10*

---

## 📅 Recent Work Summary (2026-08-09 → 08-10)

### 🩺 Deep Site Audit + Fixes
- **Fixed 67 broken internal links** across 33 content files (was causing 404s)
- **Removed 2 wrong-project links** (children's education content in NCLEX guides)
- **Fixed 9 redirect chains** in `vercel.json` pointing to non-existent pages
- **Added 22 new server-side redirects** for common broken URLs
- **Added JSON-LD schema** to 3 files missing it
- **Added OG + Twitter card meta tags** to `content/index.html`
- **Fixed OG image branding** — `obioma-seo.png` now matches front page (dark navy + coral)

### 💰 Conversion Optimization
- **Added product CTAs to all 58 content pages** missing them
- **100% of 66 content pages now link to paid product** (was 12%)
- CTA block: "Master Clinical Judgment for the NCLEX → Get Complete Mastery — $67"

### 📚 Content Enhancement
- **Added NGN-style case studies to 29 pages** that had none
- Each case study includes: clinical scenario, NCLEX question, detailed rationale, reveal toggle
- Topics: bow-tie, burns, cardiac devices, community health, cultural competence, genetics, gerontology, GI surgery, lab values, leadership, medications, musculoskeletal, neurodegenerative, NICU, fundamentals, informatics, nutrition, oncology (2), orthopedics, palliative, perioperative, ethics, rehab, renal, EBP, sensory, therapeutic communication, wound care

### 📊 Current Site Health
| Metric | Status |
|--------|--------|
| Broken internal links | 0 ✅ |
| Pages with product CTA | 66/66 (100%) ✅ |
| Pages with case studies | 66/66 (100%) ✅ |
| Pages with schema | 66/66 (100%) ✅ |
| Pages with GA4 + FB Pixel | 66/66 (100%) ✅ |
| Titles >70 chars | 23 (cosmetic, low priority) |

### 🏷️ Commits
- `724867c` — feat: add NGN-style case studies to 29 content pages
- `931e44c` — feat: add product CTAs to all 58 content pages
- `f01f8a4` — audit: fix 67 broken links, 9 redirect chains, missing schema, OG image
- `430fe70` — fix: OG image now matches front page branding
