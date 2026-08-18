# Firestore Inventory — 2026-08-18

Read-only reconciliation. No writes/deletes performed. Owner-installed credentials only.

| Collection | Doc count | Last modified (heuristic) | Sample doc IDs |
|---|---|---|---|
| analytics_events | 9 | 2026-08-12T15:53:39.716Z | 1iiPyMW93SLtyNAlY3Gm, 9FqHrI2D06s2F0NA39VE, TeqUDsKno12d6F6ZSqDg, YrD6IPxFnaxHPQwKncHn, k0dwrKMgzsGO2XWAnAxf |
| automation_logs | 765 | 2026-08-13T01:50:49.906Z | gsc-auto-submit_2026-08-13T01-50-49-905Z, imap_2026-08-09T12-50-41-243Z, imap_2026-08-09T13-00-41-311Z, imap_2026-08-09T |
| content | 60 | unknown | --pycache---create-facebook-campaign-cpython-312-pyc, --pycache---generate-email-sequence-cpython-312-pyc, --pycache---g |
| documents | 2 | unknown | nursing-leads-master, outreach-templates |
| email_funnel | 2 | unknown | nurture-sequence-md, post-purchase-sequence-md |
| gsc_submissions | 1 | 2026-08-13T01:50:48.384Z | run_2026-08-13T01-50-35-749Z |
| landing | 68 | unknown | -force-redeploy, -gitignore, -vercel-README-txt, -vercel-project-json, 404-html |
| leads | 53 | unknown | --kennedylyons--already-in-tier-1-, --obioma-care---nursing-nclex-leads-database, -asknursealice, -emmamaryrn, -jayceeca |
| marketing | 8 | unknown | README-md, backlink-outreach-email-templates-md, backlink-outreach-prospects-csv, batch-6-growth-plan-md, email-campaign |
| products | 15 | unknown | README-md, case-walkthroughs-md, case-walkthroughs-pdf, clinical-day-planner-md, clinical-day-planner-pdf |
| public | 174 | unknown | 404-html, ab-dashboard-html, ab-test-js, apple-touch-icon-png, assets-logo-email-png |
| social_posts | 25 | 2026-08-12T12:33:54.310Z | instagram_trap-001-potassium_2026-08-13T12:00:00Z, instagram_trap-002-abcs_2026-08-14T12:00:00Z, instagram_trap-003-dele |
| social_videos | 6 | 2026-08-12T13:15:54.714Z | promo-landing-v1, trap-001-potassium, trap-002-abcs, trap-003-delegation, trap-004-sata |
| users | 3 | 2026-08-01T00:10:37.859Z | O5TnKqL1ML8D32qT9QVm, aN31YbKVK3OYJYC0wcWl, zo2OJODRvWvTsNwoofoS |

## Field previews (first 5 docs, first 8 fields)

### analytics_events
- `1iiPyMW93SLtyNAlY3Gm`: {"event":"checkout_initiated","timestamp":"2026-08-09T00:19:39.784Z","tier":"core","email":"null"}
- `9FqHrI2D06s2F0NA39VE`: {"event":"checkout_initiated","timestamp":"2026-08-12T15:53:39.716Z","tier":"core","email":"null"}
- `TeqUDsKno12d6F6ZSqDg`: {"event":"checkout_initiated","timestamp":"2026-08-08T23:57:42.206Z","tier":"core","email":"test@example.com"}
- `YrD6IPxFnaxHPQwKncHn`: {"event":"checkout_initiated","timestamp":"2026-08-10T01:17:35.963Z","tier":"complete","email":"null"}
- `k0dwrKMgzsGO2XWAnAxf`: {"event":"checkout_initiated","timestamp":"2026-08-09T21:39:47.275Z","tier":"complete","email":"null"}

### automation_logs
- `gsc-auto-submit_2026-08-13T01-50-49-905Z`: {"job":"gsc-auto-submit","status":"partial","details":"[object]","timestamp":"2026-08-13T01:50:49.906Z"}
- `imap_2026-08-09T12-50-41-243Z`: {"job":"imap-poll","status":"success","checked":"0","found":"0"}
- `imap_2026-08-09T13-00-41-311Z`: {"job":"imap-poll","status":"success","checked":"0","found":"0"}
- `imap_2026-08-09T13-10-41-670Z`: {"job":"imap-poll","status":"success","checked":"0","found":"0"}
- `imap_2026-08-09T13-20-41-205Z`: {"job":"imap-poll","status":"success","checked":"0","found":"0"}

### content
- `--pycache---create-facebook-campaign-cpython-312-pyc`: {"filename":"create_facebook_campaign.cpython-312.pyc","path":"__pycache__/create_facebook_campaign.cpython-312.pyc","content":"null","contentType":"binary"}
- `--pycache---generate-email-sequence-cpython-312-pyc`: {"filename":"generate_email_sequence.cpython-312.pyc","path":"__pycache__/generate_email_sequence.cpython-312.pyc","content":"null","contentType":"binary"}
- `--pycache---generate-nursing-content-cpython-312-pyc`: {"filename":"generate_nursing_content.cpython-312.pyc","path":"__pycache__/generate_nursing_content.cpython-312.pyc","content":"null","contentType":"binary"}
- `create-facebook-campaign-py`: {"filename":"create_facebook_campaign.py","path":"create_facebook_campaign.py","content":"null","contentType":"binary"}
- `email-sequence-json`: {"filename":"email-sequence.json","path":"email-sequence.json","content":"[\n  {\n    \"day\": 0,\n    \"subject\": \"Your NCLEX Checklist + t","contentType":"text"}

### documents
- `nursing-leads-master`: {"filename":"nursing-leads-master.md","collection":"leads","content":"# Obioma Care - Nursing/NCLEX Leads Database\n# Compiled: 202","contentType":"markdown"}
- `outreach-templates`: {"filename":"outreach-templates.md","collection":"leads","content":"# Email Outreach Templates for Obioma Care\n\n---\n\n## Template","contentType":"markdown"}

### email_funnel
- `nurture-sequence-md`: {"filename":"nurture-sequence.md","path":"nurture-sequence.md","content":"# Email Nurture Sequence: Lead Magnet → Sale\n\n## Sequence Ov","contentType":"text"}
- `post-purchase-sequence-md`: {"filename":"post-purchase-sequence.md","path":"post-purchase-sequence.md","content":"# Post-Purchase Email Sequence: Day 1, 3, 7\n\n## Sequence Ove","contentType":"text"}

### gsc_submissions
- `run_2026-08-13T01-50-35-749Z`: {"analytics":"[object]","sitemapStatus":"[array]","sitemapUrl":"https://obiomacare.com/sitemap.xml","siteUrl":"sc-domain:obiomacare.com"}

### landing
- `-force-redeploy`: {"filename":".force-redeploy","path":".force-redeploy","content":"null","contentType":"binary"}
- `-gitignore`: {"filename":".gitignore","path":".gitignore","content":"null","contentType":"binary"}
- `-vercel-README-txt`: {"filename":"README.txt","path":".vercel/README.txt","content":"> Why do I have a folder named \".vercel\" in my project?\nThe ","contentType":"text"}
- `-vercel-project-json`: {"filename":"project.json","path":".vercel/project.json","content":"{\"projectId\":\"prj_RLaRkwmrgKgDtVCxZEuyf5NCJSuR\",\"orgId\":\"tea","contentType":"text"}
- `404-html`: {"filename":"404.html","path":"404.html","content":"<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"U","contentType":"text"}

### leads
- `--kennedylyons--already-in-tier-1-`: {"youtube":"null","website":"null","rawText":"@_kennedylyons (already in Tier 1)\n\n","social":"null"}
- `--obioma-care---nursing-nclex-leads-database`: {"youtube":"null","website":"null","rawText":"# Obioma Care - Nursing/NCLEX Leads Database\n# Compiled: 202","social":"null"}
- `-asknursealice`: {"youtube":"null","website":"null","rawText":"@asknursealice\n- **Focus:** ER NP, fitness, advocacy\n\n","social":"null"}
- `-emmamaryrn`: {"youtube":"null","website":"null","rawText":"@emmamaryrn\n- **Focus:** Pediatric ICU, NCLEX tips\n\n---\n\n## ","social":"null"}
- `-jayceecabasi`: {"youtube":"null","website":"null","rawText":"@jayceecabasi\n- **Focus:** Neuro Trauma ICU, wellness\n\n","social":"null"}

### marketing
- `README-md`: {"filename":"README.md","path":"README.md","content":"# Batch 6 Marketing & Growth Package\n\nComplete marketing mat","contentType":"text"}
- `backlink-outreach-email-templates-md`: {"filename":"email-templates.md","path":"backlink-outreach/email-templates.md","content":"# Backlink Outreach Email Campaign\n# Send via Hostinger SMTP","contentType":"text"}
- `backlink-outreach-prospects-csv`: {"filename":"prospects.csv","path":"backlink-outreach/prospects.csv","content":"null","contentType":"binary"}
- `batch-6-growth-plan-md`: {"filename":"batch-6-growth-plan.md","path":"batch-6-growth-plan.md","content":"# Social Media Posts — Batch 6 NCLEX Study Guides\n\n## Twitte","contentType":"text"}
- `email-campaigns-batch-6-announcement-html`: {"filename":"batch-6-announcement.html","path":"email-campaigns/batch-6-announcement.html","content":"<!DOCTYPE html>\n<html>\n<head>\n<meta charset=\"UTF-8\">\n<meta n","contentType":"text"}

### products
- `README-md`: {"filename":"README.md","path":"README.md","content":"# Obioma Care — Complete Product Package\n\n## What's Included","contentType":"text"}
- `case-walkthroughs-md`: {"filename":"case-walkthroughs.md","path":"case-walkthroughs.md","content":"# Real Case Walkthroughs\n## From ER and Oncology: What the E","contentType":"text"}
- `case-walkthroughs-pdf`: {"filename":"case-walkthroughs.pdf","path":"case-walkthroughs.pdf","content":"Binary file (.pdf) - 156195 bytes","contentType":"binary"}
- `clinical-day-planner-md`: {"filename":"clinical-day-planner.md","path":"clinical-day-planner.md","content":"# Clinical Day Planner\n## Printable Daily Organization Tool\n","contentType":"text"}
- `clinical-day-planner-pdf`: {"filename":"clinical-day-planner.pdf","path":"clinical-day-planner.pdf","content":"Binary file (.pdf) - 127899 bytes","contentType":"binary"}

### public
- `404-html`: {"filename":"404.html","path":"404.html","content":"<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"U","contentType":"text"}
- `ab-dashboard-html`: {"filename":"ab-dashboard.html","path":"ab-dashboard.html","content":"<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"U","contentType":"text"}
- `ab-test-js`: {"filename":"ab_test.js","path":"ab_test.js","content":"/**\n * Obioma A/B Testing Engine\n * Lightweight client-side ","contentType":"text"}
- `apple-touch-icon-png`: {"filename":"apple-touch-icon.png","path":"apple-touch-icon.png","content":"Binary file (.png) - 1704 bytes","contentType":"binary"}
- `assets-logo-email-png`: {"filename":"logo-email.png","path":"assets/logo-email.png","content":"Binary file (.png) - 10367 bytes","contentType":"binary"}

### social_posts
- `instagram_trap-001-potassium_2026-08-13T12:00:00Z`: {"createdAt":"2026-08-12T12:33:37.373Z","_syncVersion":"1.0","filePath":"/root/.openclaw/workspace/obioma-care/video/out/trap-001-pot","caption":"🚨 NCLEX Trap of the Day: Potassium + Digoxin\n\nThis combo ki"}
- `instagram_trap-002-abcs_2026-08-14T12:00:00Z`: {"createdAt":"2026-08-12T12:33:41.692Z","_syncVersion":"1.0","filePath":"/root/.openclaw/workspace/obioma-care/video/out/trap-002-abc","caption":"🚨 NCLEX Trap of the Day: ABCs\n\nABCs ALWAYS come first. The "}
- `instagram_trap-003-delegation_2026-08-15T12:00:00Z`: {"createdAt":"2026-08-12T12:33:45.931Z","_syncVersion":"1.0","filePath":"/root/.openclaw/workspace/obioma-care/video/out/trap-003-del","caption":"🚨 NCLEX Trap of the Day: Delegation\n\nRN keeps assessment, m"}
- `instagram_trap-004-sata_2026-08-16T12:00:00Z`: {"createdAt":"2026-08-12T12:33:50.062Z","_syncVersion":"1.0","filePath":"/root/.openclaw/workspace/obioma-care/video/out/trap-004-sat","caption":"🚨 NCLEX Trap of the Day: SATA\n\nTreat EACH option as true/fa"}
- `instagram_trap-005-isolation_2026-08-17T12:00:00Z`: {"createdAt":"2026-08-12T12:33:54.310Z","_syncVersion":"1.0","filePath":"/root/.openclaw/workspace/obioma-care/video/out/trap-005-iso","caption":"🚨 NCLEX Trap of the Day: Isolation\n\nAirborne=N95, Droplet=S"}

### social_videos
- `promo-landing-v1`: {"fileName":"promo-landing-v1.mp4","landingPage":"true","format":"16:9","description":"Product demo hybrid: real UI capture + motion graphic callou"}
- `trap-001-potassium`: {"disclosure":"ai-generated, nurse-reviewed","sources":"[array]","caption":"🚨 NCLEX Trap of the Day: Potassium + Digoxin\n\nThis combo ki","uploadStatus":"[object]"}
- `trap-002-abcs`: {"disclosure":"ai-generated, nurse-reviewed","sources":"[array]","caption":"🚨 NCLEX Trap of the Day: ABCs\n\nABCs ALWAYS come first. The ","uploadStatus":"[object]"}
- `trap-003-delegation`: {"disclosure":"ai-generated, nurse-reviewed","sources":"[array]","caption":"🚨 NCLEX Trap of the Day: Delegation\n\nRN keeps assessment, m","uploadStatus":"[object]"}
- `trap-004-sata`: {"disclosure":"ai-generated, nurse-reviewed","sources":"[array]","caption":"🚨 NCLEX Trap of the Day: SATA\n\nTreat EACH option as true/fa","uploadStatus":"[object]"}

### users
- `O5TnKqL1ML8D32qT9QVm`: {"email":"audit_new_1785543037@test.com","name":"New User","password":"$2b$10$oN6DZlohSPFG2GhvUk178uWQw2JrDL5Vt1Kpjb/cIxbeJOIcamuUe","createdAt":"2026-08-01T00:10:37.859Z"}
- `aN31YbKVK3OYJYC0wcWl`: {"email":"audit_1785542121@test.com","name":"Audit User","password":"$2b$10$lxqSUgMhy3sTpNh6hn5KiORd/MFzmNUPlLEoCBBicHWIuOsEy12Wu","createdAt":"2026-07-31T23:55:22.299Z"}
- `zo2OJODRvWvTsNwoofoS`: {"email":"audit_1785542693@test.com","name":"Audit User","password":"$2b$10$7uOnfRkTXFki.XfcUQuPtu35r35Y5llZwc0baSEn1M4WnrblDBxu6","createdAt":"2026-08-01T00:04:54.259Z"}
