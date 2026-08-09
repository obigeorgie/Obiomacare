# IMAP Email Polling Setup

## Overview
Instead of relying on Hostinger webhooks (which don't exist), we poll the Hostinger IMAP inbox every 10 minutes for unread emails containing "TUTORING".

## Required Environment Variables

Add these to your Vercel project:

```
IMAP_USER=admin@obiomacare.com
IMAP_PASS=your-email-password
IMAP_HOST=imap.hostinger.com
IMAP_PORT=993
```

## How to Get Your Email Password

1. Log into https://mail.hostinger.com
2. Go to **Settings → Account**
3. Copy or reset your password
4. Paste it into Vercel environment variables as `IMAP_PASS`

## What the Cron Does

Every 10 minutes (`*/10 * * * *`):

1. Connects to Hostinger IMAP
2. Searches for **unread** emails
3. Checks if subject or body contains "TUTORING" (case-insensitive)
4. If found:
   - Logs to Firestore `tutoring_interests`
   - Sends auto-reply to student
   - Sends notification to `admin@obiomacare.com`
   - Marks email as **read**
5. If not found: marks as read anyway (no action needed)

## Security Note

The IMAP password is stored in Vercel environment variables (encrypted at rest). Never commit it to Git.

## Testing

1. Send an email to `admin@obiomacare.com` with subject "TUTORING test"
2. Wait up to 10 minutes, or manually trigger:
   ```bash
   curl https://obiomacare.com/api/cron/imap \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```
3. Check Firestore `tutoring_interests` collection
4. Check your admin inbox for notification

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "IMAP not configured" | Set `IMAP_PASS` in Vercel env |
| Connection refused | Check `IMAP_HOST` is `imap.hostinger.com` |
| Auth failed | Reset password in Hostinger, update `IMAP_PASS` |
| Emails not found | Make sure emails are unread (not already opened) |

## Vercel Cron Limitations

**Important:** Vercel Hobby plan allows:
- **1 cron job** maximum
- **Once per day** maximum frequency

For 10-minute polling, you have two options:

### Option 1: Upgrade to Vercel Pro
- $20/month
- Unlimited cron jobs
- Configurable schedules

### Option 2: External Cron Service (Free)
Use **cron-job.org** (free):

1. Sign up at https://cron-job.org
2. Create job: `GET https://obiomacare.com/api/cron/imap`
3. Add header: `Authorization: Bearer YOUR_CRON_SECRET`
4. Set schedule: Every 10 minutes
5. Done

### Option 3: Manual Trigger (Testing)
Call the endpoint manually when needed:
```bash
curl https://obiomacare.com/api/cron/imap \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## Recommended Setup

For launch, use **Option 2 (cron-job.org)** — it's free and works immediately. Upgrade to Vercel Pro later if you want everything in one platform.
