# Hostinger Email Automation Setup

## What You Need

1. **Mailbox Resource ID** from Hostinger (looks like `AC1a2b3c4d5e6f7g`)
2. **API Token** (already set in Vercel: `HOSTINGER_EMAIL_TOKEN`)

## Step 1: Get Your Mailbox ID

1. Log into https://mail.hostinger.com
2. Go to **Settings → API** or **Developer**
3. Copy the **Mailbox Resource ID**

## Step 2: Set Environment Variable

```bash
export HOSTINGER_MAILBOX_ID=your-mailbox-id-here
```

## Step 3: Run Setup Script

```bash
node scripts/setup-hostinger-webhook.js
```

This creates a webhook that forwards ALL emails to `https://obiomacare.com/api/email-webhook`.

## Step 4: Save the Webhook Secret

The script will output a **webhook secret**. Save it in Vercel:

```
HOSTINGER_WEBHOOK_SECRET=the-secret-from-output
```

## What Happens Next

When any email arrives at `admin@obiomacare.com`:

1. Hostinger forwards it to `/api/email-webhook`
2. Our code detects if it contains "TUTORING"
3. If yes: logs to Firestore + auto-replies + notifies you
4. If no: logs and ignores

## Manual Alternative (No API)

If the API doesn't work, set up forwarding manually:

1. Hostinger Webmail → Settings → Forwarding
2. Forward ALL emails to: `https://obiomacare.com/api/email-webhook`
3. Add header: `X-Hostinger-Token: your-token`

## Testing

Send a test email to `admin@obiomacare.com` with subject "TUTORING test" and verify:
- It appears in Firestore `tutoring_interests`
- You get the admin notification
- The sender gets an auto-reply
