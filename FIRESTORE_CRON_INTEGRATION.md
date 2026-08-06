# Firestore Integration for Cron Jobs — Complete ✅

All automation scripts in the obioma-care project now store their results in Firestore. This document summarizes the changes.

---

## Updated Scripts

### 1. `automation/gsc-auto-submit.js`
**Purpose:** Auto-submits URLs to Google Search Console
**Firestore Collections:**
- `gsc_submissions` — Stores each URL submission attempt with success/failure status
- `automation_logs` — Run-level logging

### 2. `content-nursing/schedule-posts.js`
**Purpose:** Schedules social media posts via Postiz API
**Firestore Collections:**
- `scheduled_posts` — Each post with platform, content, and scheduled date
- `postiz_runs` — Run summary with total/success/failed counts
- `automation_logs` — Run-level logging

### 3. `ai-ugc/generate.js`
**Purpose:** Generates AI content for social media
**Firestore Collections:**
- `ai_generated_content` — Each generated post with raw and cleaned content
- `automation_logs` — Run-level logging

### 4. `server.js`
**Purpose:** Main Express server (subscribers, email logs)
**Firestore Collections:**
- `subscribers` — Email subscriber records with payment status
- `email_logs` — Payment confirmation emails sent

### 5. `api/index.js` & `api/tutor.js`
**Purpose:** API endpoints for leads and tutoring
**Firestore Collections:**
- `leads` — Newsletter/tutoring leads
- `email_logs` — Welcome/confirmation emails

### 6. `content-nursing/generate_nursing_content.py`
**Purpose:** Generates nursing content schedule
**Firestore Collections:**
- `content_schedules` — Full schedule with `run_{timestamp}` and `latest` documents

### 7. `content-nursing/generate_email_sequence.py`
**Purpose:** Generates email nurture sequences
**Firestore Collections:**
- `email_sequences` — Full sequence with `run_{timestamp}` and `latest` documents

### 8. `content-nursing/create_facebook_campaign.py`
**Purpose:** Creates Facebook ad campaigns
**Firestore Collections:**
- `facebook_campaigns` — Campaign details with `run_{timestamp}` and `latest` documents

### 9. `scripts/create_lab_values_image.py`
**Purpose:** Generates NCLEX lab values infographic
**Firestore Collections:**
- `generated_images` — Metadata for generated images

### 10. `scripts/create_shareable_image.py`
**Purpose:** Generates NCLEX priority cheat sheet
**Firestore Collections:**
- `generated_images` — Metadata for generated images

### 11. `content-nursing/upload-media.js`
**Purpose:** Uploads media and schedules posts with images/videos
**Firestore Collections:**
- `media_uploads` — Each upload attempt with success/failure status
- `media_upload_runs` — Run summary
- `automation_logs` — Run-level logging

---

## Firestore Collections Reference

| Collection | Description |
|------------|-------------|
| `automation_logs` | General run logs for all scripts |
| `gsc_submissions` | Google Search Console URL submissions |
| `scheduled_posts` | Postiz scheduled posts |
| `postiz_runs` | Batch scheduling run summaries |
| `ai_generated_content` | AI-generated social media content |
| `content_schedules` | Nursing content calendar schedules |
| `email_sequences` | Email nurture sequences |
| `facebook_campaigns` | Facebook ad campaign data |
| `generated_images` | Metadata for generated images |
| `media_uploads` | Media upload attempts |
| `media_upload_runs` | Batch upload run summaries |
| `subscribers` | Email subscribers |
| `email_logs` | Sent email records |
| `leads` | Newsletter/tutoring leads |

---

## Helper Library

**`lib/firestore-helper.js`**
- `initFirestore()` — Initialize Firestore client
- `storeLog(scriptName, status, data)` — Store automation log
- `storeDocument(collection, docId, data)` — Store any document
- `storeBatch(collection, docs)` — Batch store documents

---

## Python Scripts Setup

Python scripts use a virtual environment:
```bash
# Venv location
/root/.openclaw/workspace/obioma-care/venv

# Required package
firebase-admin
```

Scripts inject the venv path at runtime:
```python
import sys
venv_site = '/root/.openclaw/workspace/obioma-care/venv/lib/python3.12/site-packages'
if venv_site not in sys.path:
    sys.path.insert(0, venv_site)
```

---

## Verification

Run the verification script to confirm all collections exist:
```bash
node scripts/verify-cron-firestore.js
```

---

## Notes

- All scripts retain local JSON file outputs for backward compatibility
- Firestore stores both timestamped run documents and `latest` reference documents
- Each script uses unique Firestore app names to avoid initialization conflicts
- The project uses Firebase project ID: `kindred-x5pbk`
