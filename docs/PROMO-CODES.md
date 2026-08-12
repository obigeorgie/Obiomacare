# Promo Code Strategy

## Overview
Promo codes are **NOT** displayed on the landing page. They are reserved for specific channels to track attribution and reward different audience segments.

---

## Active Codes

| Code | Discount | Channel | Purpose | Expires |
|------|----------|---------|---------|---------|
| LAUNCH50 | 50% off | Email (non-buyers) | Win-back after nurture sequence | 2026-09-30 |
| NURSE20 | 20% off | Partner/Referral | Student ambassadors, nursing school partners | 2026-12-31 |
| YTNCLEX | 25% off | YouTube Ads | Track YouTube ad conversions | 2026-09-30 |
| FBNURSE | 25% off | Facebook/Instagram Ads | Track Meta ad conversions | 2026-09-30 |
| EMAIL25 | 25% off | Lead magnet follow-up | First-time email subscribers | 2026-12-31 |

---

## Channel Usage

### Email Sequences
- **Nurture sequence (Day 16+)**: Send LAUNCH50 to non-buyers who opened emails but didn't purchase
- **Abandoned cart**: Send EMAIL25 if checkout initiated but not completed within 24h
- **Re-engagement (90 days)**: Send NURSE20 to lapsed subscribers

### Ad Campaigns
- **YouTube pre-roll**: Use YTNCLEX in video CTA
- **Facebook/Instagram**: Use FBNURSE in ad creative
- **Google Search**: Use generic EMAIL25 for search traffic

### Partner/Referral
- **Nursing school partnerships**: Bulk codes with NURSE20
- **Student ambassadors**: Unique codes tracked per ambassador
- **Influencer collaborations**: Unique codes per influencer

---

## Lead Magnet Flow

```
Landing page (no codes visible)
    ↓
Free NGN Framework download (email capture)
    ↓
Nurture sequence (7 emails, no codes)
    ↓
[If no purchase after Day 14]
    ↓
Win-back email with LAUNCH50 (50% off)
    ↓
[If still no purchase after 30 days]
    ↓
Re-engagement with NURSE20 (20% off)
```

---

## Tracking

All promo codes are validated via `/api/validate-promo` and stored in Stripe metadata for attribution tracking.

### Metrics to watch:
- Redemption rate by channel
- Revenue per code
- Time from code receipt to purchase
- Refund rate by code (watch for low-quality traffic)
