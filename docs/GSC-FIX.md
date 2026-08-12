# GSC (Google Search Console) Fix Instructions

## Problem
The automated sitemap submission is failing because the service account doesn't have Owner permissions in Google Search Console.

## Error
```
Error: 403 - Forbidden
User does not have sufficient permission for site 'sc-domain:obiomacare.com'.
```

## Solution — Add Service Account as Owner

### Step 1: Get the Service Account Email

The service account email is:
```
masterygraph-sitemap@masterygraph-gsc.iam.gserviceaccount.com
```

### Step 2: Go to Google Search Console

1. Visit: https://search.google.com/search-console
2. Sign in with the Google account that currently owns `obiomacare.com`
3. Select the property: `obiomacare.com` (or `sc-domain:obiomacare.com`)

### Step 3: Add the Service Account

1. In the left sidebar, click **Settings**
2. Click **Users and Permissions**
3. Click the **Add User** button (blue button in top right)
4. Enter the service account email:
   ```
   masterygraph-sitemap@masterygraph-gsc.iam.gserviceaccount.com
   ```
5. Set permission level to **Owner** (NOT "Full" or "Restricted")
6. Click **Add**

### Step 4: Verify the Service Account Works

Wait 5-10 minutes for permissions to propagate, then test:

```bash
# From the project directory
node scripts/submit-sitemap.js
```

Or manually submit the sitemap:

```bash
curl -X POST \
  "https://www.googleapis.com/webmasters/v3/sites/sc-domain%3Aobiomacare.com/sitemaps" \
  -H "Authorization: Bearer $(gcloud auth application-default print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{"sitemapUrl": "https://obiomacare.com/sitemap.xml"}'
```

### Step 5: Verify in GSC

1. Go to **Sitemaps** in the left sidebar
2. You should see `https://obiomacare.com/sitemap.xml` listed
3. Check the **Status** column — it should show "Success" or "Couldn't fetch" (which resolves on next crawl)
4. Check **Last read** date to confirm recent submission

---

## Alternative: Manual Sitemap Submission (Immediate)

If you can't add the service account right now, submit the sitemap manually:

1. Go to https://search.google.com/search-console
2. Select your property
3. Click **Sitemaps** in the left sidebar
4. Enter `https://obiomacare.com/sitemap.xml`
5. Click **Submit**

This works immediately but isn't automated. The service account method is preferred for ongoing submissions.

---

## What This Fixes

Once the service account has Owner permissions:

- ✅ Automated sitemap submissions will work
- ✅ URL indexing requests can be sent programmatically
- ✅ Search performance data can be fetched via API
- ✅ No more 403 Forbidden errors

---

## Notes

- **Owner vs Full permission:** The API requires Owner level for sitemap submission. "Full" permission is not sufficient.
- **Domain property vs URL prefix:** The code uses `sc-domain:obiomacare.com` (domain property). Make sure this exact property exists in your GSC. If you only have a URL prefix property (`https://obiomacare.com/`), the service account needs to be added there instead.
- **Propagation time:** Permission changes can take 5-10 minutes to propagate through Google's systems.

---

## Post-Fix Verification Checklist

- [ ] Service account added as Owner in GSC
- [ ] Sitemap submission returns 200 OK
- [ ] Sitemap appears in GSC Sitemaps report
- [ ] URLs from sitemap are discovered and indexed
- [ ] Automated cron job runs successfully

---

*Last updated: 2026-08-13*
