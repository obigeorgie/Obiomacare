# Obioma Care — Launch Checklist

## ✅ COMPLETED

### Website
- [x] Landing page with hero, problem, solution, pricing, FAQ
- [x] Lead magnet page (free-framework.html)
- [x] Success page with purchase tracking
- [x] 404 page
- [x] Mobile responsive design
- [x] Custom domain added (obiomacare.com, www.obiomacare.com)

### SEO
- [x] Meta title and description
- [x] Open Graph tags
- [x] Twitter Card tags
- [x] Canonical URL
- [x] robots.txt
- [x] sitemap.xml
- [x] JSON-LD structured data (Product schema)
- [x] Favicon

### Analytics & Tracking
- [x] Google Analytics 4 script (needs real ID)
- [x] Facebook Pixel script (needs real ID)
- [x] Begin checkout event tracking
- [x] Purchase event tracking on success page

### Payments
- [x] Stripe live mode connected
- [x] Core System product ($47) — price_1TwJ5MJQl5hjYpdc5z5vTSwg
- [x] Complete Mastery product ($67) — price_1TwJ7ZJQl5hjYpdcoiOk0I0v
- [x] Checkout API endpoint
- [x] Webhook endpoint configured
- [x] Automatic email delivery on purchase

### Products
- [x] 8 PDF files generated from markdown
- [x] Download page with token-protected links
- [x] 24-hour link expiration

### Email
- [x] Resend API connected
- [x] Purchase confirmation emails
- [x] Lead magnet delivery emails
- [x] Nurture sequence copy written

---

## 🔴 NEEDS YOUR ACTION

### 1. Domain DNS (Critical)
**Status:** Domain is using Cloudflare nameservers. Keep them.

**Cloudflare DNS Records:**
- Type: A | Name: @ | Value: 76.76.21.21 (or Workers route)
- Type: CNAME | Name: www | Value: obiomacare-site.empathycollection.workers.dev

### 2. Google Analytics (Important)
**Problem:** Placeholder ID `GA_MEASUREMENT_ID` in code.

**Fix:** 
1. Go to https://analytics.google.com
2. Create a property for obiomacare.com
3. Get your Measurement ID (looks like G-XXXXXXXXXX)
4. Replace `GA_MEASUREMENT_ID` in:
   - landing/index.html
   - landing/success.html
   - landing/free-framework.html

### 3. Facebook Pixel (Important)
**Problem:** Placeholder ID `FB_PIXEL_ID` in code.

**Fix:**
1. Go to https://business.facebook.com/events_manager
2. Create a pixel for obiomacare.com
3. Get your Pixel ID (looks like 123456789012345)
4. Replace `FB_PIXEL_ID` in:
   - landing/index.html
   - landing/success.html
   - landing/free-framework.html

### 4. Resend Domain Verification (Important)
**Problem:** Emails sent from admin@obiomacare.com may land in spam.

**Fix:**
1. Go to https://resend.com/domains
2. Add domain: obiomacare.com
3. Add the DNS records shown in Resend to your domain's DNS
4. Wait for verification (usually instant with Cloudflare)

### 5. Test End-to-End (Critical)
**Do this before advertising:**
1. Visit https://obiomacare.com
2. Click "Get Complete System — $67"
3. Use Stripe test card: `4242 4242 4242 4242`
4. Check email for download link
5. Download all PDFs
6. Confirm files open correctly

---

## 🚀 READY TO LAUNCH WHEN:
- [ ] Domain DNS updated and https://obiomacare.com loads
- [ ] Test purchase completed successfully
- [ ] Downloaded files open correctly
- [ ] Google Analytics ID replaced
- [ ] Facebook Pixel ID replaced
- [ ] Resend domain verified

---

## 📈 POST-LAUNCH OPTIMIZATIONS

### Week 1
- [ ] Add 3+ testimonials to landing page
- [ ] Create 5 social media posts
- [ ] Write 1 blog post about NGN NCLEX

### Week 2
- [ ] Set up Facebook/Instagram ads ($50/day test)
- [ ] A/B test headline: "Pass the NGN NCLEX" vs "Think Like an ER Nurse"
- [ ] Add exit-intent popup with discount

### Week 3
- [ ] Create YouTube channel with 3 videos
- [ ] Guest post on nursing blogs
- [ ] Launch affiliate program

### Month 2
- [ ] Add upsell: 1-on-1 coaching calls ($197)
- [ ] Create membership community ($29/month)
- [ ] Expand to other nursing specialties

---

## 🔧 USEFUL COMMANDS

```bash
# Deploy updates
cd /root/.openclaw/workspace/obioma-care
npx wrangler deploy --config wrangler.toml

# View logs
npx wrangler tail

# Check Stripe products (test mode)
curl -s https://api.stripe.com/v1/products -u "sk_test_..."

# Test checkout
curl -s -X POST https://obiomacare.com/api/create-subscription-checkout \
  -H "Content-Type: application/json" \
  -d '{"plan":"core","email":"test@example.com"}'
```

---

## 📞 SUPPORT

**Problems?**
- Stripe issues: https://stripe.com/support
- Cloudflare Workers: https://developers.cloudflare.com/workers/
- Resend issues: https://resend.com/support
- Domain issues: Check with your registrar

**Questions about the product/content?**
Reply to any email or contact admin@obiomacare.com
