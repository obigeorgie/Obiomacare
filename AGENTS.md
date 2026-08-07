# AGENTS.md — Obioma Care Project Agent Guide

This file is the **source of truth** for AI agents working on the Obioma Care project. Chat history is unreliable — this file is not.

## Project Overview

**Obioma Care** is a nursing education platform focused on NCLEX Clinical Judgment preparation. It consists of:
- **Landing site**: Static HTML pages (Vercel) — lead magnets, content, checkout
- **API**: Express server (Vercel Functions) — Stripe, email, Firestore, tutor
- **Content**: 64+ NCLEX study guides
- **Products**: Digital downloads (Core $47, Complete $67)

## Stack

| Layer | Technology |
|-------|-----------|
| Hosting | Vercel (serverless functions) |
| Frontend | Static HTML/CSS/JS |
| Backend | Node.js + Express |
| Database | Firebase Firestore |
| Payments | Stripe (live keys) |
| Email | Hostinger SMTP |
| Analytics | GA4 + FB Pixel + Vercel Web Analytics |
| CI/CD | GitHub Actions → Vercel |

## Critical Rules

### ⚠️ Deployment
- **Nothing deploys without explicit user approval**
- Production URL: `https://obiomacare.com`
- Deploy via: `vercel --prod` or GitHub Actions

### ⚠️ Secrets
- Secrets NEVER appear in chat, code, or logs
- `.env` and `firebase-service-account.json` are gitignored
- Stripe keys, SMTP passwords live in Vercel env vars only

### ⚠️ Medical Content
- All nursing/medical content requires source citation
- Content marked with nurse-review status
- Never fabricate clinical information

## Project Structure

```
obioma-care/
├── api/                  # Express API (Vercel serverless)
│   ├── index.js         # Main API entry
│   └── tutor.js         # AI tutor module
├── content/             # 64 NCLEX study guides
├── landing/             # Landing pages
│   ├── index.html       # Homepage
│   ├── success.html     # Post-purchase
│   ├── free-nclex-checklist.html
│   └── ...
├── lib/                 # Shared helpers
│   └── firestore-helper.js
├── scripts/             # Build + utility scripts
├── public/              # Build output (Vercel serves this)
├── products/            # PDF deliverables
├── docs/                # Project documentation
└── vercel.json          # Vercel config + routes + crons
```

## Health Check

Run before any session:

```bash
cd obioma-care
# API health
curl -s https://obiomacare.com/api/health
# Expected: {"status":"ok","stripe":true,"email":true,"firebase":true}

# Build test
npm run build

# Verify key pages
curl -s -o /dev/null -w "%{http_code}" https://obiomacare.com/
curl -s -o /dev/null -w "%{http_code}" https://obiomacare.com/api/health
```

## Key Contacts

- **Brand email**: admin@obiomacare.com
- **Domain**: obiomacare.com
- **Repo**: https://github.com/obigeorgie/Obiomacare.git

## Session End Protocol

At end of session:
1. Update `docs/TODO.md` with what was done
2. Update `docs/DECISIONS.md` if any decisions were made
3. Commit all changes with descriptive messages
4. Push to `master:main`
