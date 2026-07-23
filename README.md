# Obioma Care — Clinical Judgment Mastery System

**High-ticket digital product for nursing students and new grads.**  
Built from 10+ years of ER and oncology experience. NGN NCLEX-focused.

---

## 🎯 Product Overview

| Tier | Price | Contents |
|------|-------|----------|
| **Core System** | $47 | 4 PDF guides + worksheets |
| **Complete Mastery** | $67 | Everything + 5 video walkthroughs |

**Margin**: ~90% after platform fees  
**Delivery**: Instant digital (PDF + video links)  
**Target**: Nursing students, NCLEX repeaters, new grads

---

## 🚀 Quick Start

```bash
# Clone and setup
git clone <repo-url>
cd obioma-care

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Run locally
npm run dev

# Deploy
./deploy.sh
```

---

## 📁 Project Structure

```
obioma-care/
├── landing/              # Sales pages
│   ├── index.html        # Main sales page
│   └── free-framework.html # Lead magnet capture
│
├── products/             # Product content (source files)
│   ├── ngn-framework.md
│   ├── prioritization-trees.md
│   ├── case-walkthroughs.md
│   ├── sbar-templates.md
│   ├── survival-guide.md
│   ├── clinical-day-planner.md
│   └── video-scripts.md
│
├── ai-ugc/               # Content generation
│   ├── generate.js       # AI content generator
│   └── content-library.md # Pre-made content pack
│
├── email-funnel/         # Email automation
│   └── nurture-sequence.md # 7-email sequence
│
├── server.js             # Backend (Stripe + Resend)
├── package.json
├── vercel.json           # Deployment config
└── deploy.sh             # Deployment script
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Static HTML/CSS (no framework needed) |
| Backend | Node.js + Express |
| Payments | Stripe Checkout |
| Email | Resend |
| Hosting | Vercel |
| Domain | obiomacare.com |

---

## 🔧 Configuration

### Required Environment Variables

```env
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
```

### Stripe Setup

1. Create products in Stripe Dashboard:
   - Core System: $47
   - Complete Mastery: $67

2. Set up webhook endpoint:
   - URL: `https://obiomacare.com/api/webhook`
   - Events: `checkout.session.completed`

3. Copy webhook signing secret to `.env`

### Resend Setup

1. Verify domain `obiomacare.com`
2. Copy API key to `.env`
3. Update `from` address in `server.js`

---

## 📦 Product Content

All product content is written in Markdown and ready for PDF conversion.

### Conversion Options

```bash
# Option 1: md-to-pdf (npm)
npm install -g md-to-pdf
md-to-pdf products/ngn-framework.md

# Option 2: Pandoc
pandoc products/ngn-framework.md -o ngn-framework.pdf

# Option 3: Canva/Google Docs
# Copy/paste and design
```

---

## 🤖 AI UGC Automation

Generate social media content automatically:

```bash
# Generate 5 social posts
node ai-ugc/generate.js --type=post --topic=prioritization --count=5

# Generate ad creatives
node ai-ugc/generate.js --type=ad --count=3

# Generate 30-day content calendar
node ai-ugc/generate.js --type=calendar --count=30
```

---

## 📧 Email Funnel

### Lead Magnet Flow

1. Visitor lands on `free-framework.html`
2. Enters email → receives free NGN framework
3. Enters 7-email nurture sequence
4. Pitches Complete System on Day 7

### Purchase Flow

1. Customer clicks "Get Complete System"
2. Stripe Checkout session created
3. Payment completed
4. Webhook triggers email delivery
5. Customer receives download link (24h expiry)

---

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| Launch day sales | 10+ |
| Week 1 sales | 30+ |
| Email captures (week 1) | 100+ |
| Landing page conversion | >2% |
| Refund rate | <5% |

---

## 🗓️ Launch Timeline

| Day | Task |
|-----|------|
| 1-2 | Finalize PDFs, record videos |
| 3 | Deploy, test checkout, set up webhooks |
| 4 | **LAUNCH** — post on social, email list |
| 5-14 | Daily content, engagement, optimization |
| 15 | Review metrics, plan next phase |

---

## 🔄 Future Roadmap

- [ ] ANCC-approved CE versions ($50-150/course)
- [ ] Mobile app for quick reference
- [ ] Community/forum access
- [ ] Monthly live Q&A calls
- [ ] Affiliate program
- [ ] Additional specialty modules (ICU, peds, OB)

---

## 📄 License

© 2026 Obioma Care. All rights reserved.

---

Built with 💙 by Nnamdi Okorafor, RN
