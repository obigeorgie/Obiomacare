# Analytics Audit Report — Obioma Care
**Date:** 2026-08-09
**Site:** https://obiomacare.com

---

## 📊 Analytics Configuration Status

### 1. Google Analytics 4 (GA4)
| Check | Status | Detail |
|-------|--------|--------|
| Tracking ID | ✅ | `G-922HP9B76M` |
| Homepage | ✅ | Script present + config |
| Content pages | ✅ | Script present on all checked |
| Success page | ✅ | Script present |
| Purchase event | ✅ | `gtag('event', 'purchase')` on success |
| Begin checkout | ✅ | `gtag('event', 'begin_checkout')` on CTA click |
| Lead gen | ✅ | `gtag('event', 'generate_lead')` on email capture |

**Events tracked:**
- `page_view` — all pages
- `begin_checkout` — when user clicks purchase CTA
- `purchase` — on success page (with value $47/$67)
- `generate_lead` — on email newsletter signup

---

### 2. Facebook Pixel
| Check | Status | Detail |
|-------|--------|--------|
| Pixel ID | ✅ | `1045171501242922` |
| Homepage | ✅ | `fbq('track', 'PageView')` |
| Content pages | ✅ | Script present |
| Success page | ✅ | Script present |
| Purchase | ✅ | `fbq('track', 'Purchase')` with value |
| InitiateCheckout | ✅ | `fbq('track', 'InitiateCheckout')` |
| Lead | ✅ | `fbq('track', 'Lead')` on email capture |

---

### 3. Vercel Web Analytics
| Check | Status | Detail |
|-------|--------|--------|
| Insights script | ✅ | `/_vercel/insights/script.js` |
| Speed Insights | ✅ | `/_vercel/speed-insights/script.js` |
| Dashboard | ⚠️ | Requires Vercel login to view |

---

## 🔍 Data Available (What I Can Verify)

### Firestore Collections
| Collection | Records | Notes |
|------------|---------|-------|
| `leads` | 53 | Marketing/outreach leads (not web signups) |
| `users` | 3 | Pre-existing accounts |
| `email_funnel` | 1 | Nurture sequence document |
| `automation_logs` | 0 | No cron runs logged yet |

### Key Finding: No Web Analytics Data Stored
- No server-side analytics collection
- No event logging to Firestore
- No UTM tracking stored
- No conversion data available without dashboard access

---

## ⚠️ Gaps & Recommendations

### 1. No Dashboard Access (Expected)
**GA4, FB Events Manager, Vercel Analytics** all require login credentials.

**To check your actual traffic:**
- **GA4:** https://analytics.google.com → Property: `obiomacare.com`
- **FB Events Manager:** https://business.facebook.com/events_manager
- **Vercel Analytics:** https://vercel.com/obigeorgies-projects/obioma-care/analytics

### 2. Missing Events
| Missing Event | Where | Priority |
|---------------|-------|----------|
| `add_to_cart` | Pricing page | Medium |
| `view_item` | Product pages | Medium |
| `contact` | Contact form submit | Low |
| `newsletter_signup` | Newsletter endpoint | Low |

### 3. UTM Tracking
UTM parameters are defined in social posts but **not validated** anywhere:
- `utm_source=twitter&utm_medium=social&utm_campaign=batch6`
- Same for Instagram, LinkedIn, Facebook

**Fix:** Add UTM parameter parsing to capture source in Firestore leads.

### 4. No Server-Side Analytics
Currently all tracking is client-side (JavaScript). If users block scripts, tracking is lost.

**Fix:** Log key events server-side (checkout creation, purchase webhook).

---

## 📈 What to Check in Dashboards

### GA4 Real-Time
1. Go to https://analytics.google.com
2. Select property `G-922HP9B76M`
3. Click "Realtime" in left sidebar
4. You should see active users when you visit the site

### FB Events Manager
1. Go to https://business.facebook.com/events_manager
2. Select Pixel `1045171501242922`
3. Check "Test Events" tab
4. Visit your site — events should appear in real-time

### Vercel Analytics
1. Go to https://vercel.com → Projects → obioma-care → Analytics tab
2. Check page views, Core Web Vitals, visitor geography

---

## 🎯 Action Items

| Priority | Action |
|----------|--------|
| **HIGH** | Verify GA4 is receiving data (visit site, check Real-Time) |
| **HIGH** | Verify FB Pixel is firing (visit site, check Events Manager) |
| **MEDIUM** | Add `view_item` and `add_to_cart` events |
| **MEDIUM** | Parse UTM params and store in Firestore |
| **LOW** | Add server-side event logging |

---

*All tracking codes are correctly installed. The next step is verifying data flow in the actual dashboards.*
