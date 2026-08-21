# OER Source Registry — Pre-Vetted Sourcing (2026-08-20)

Status: **DRAFT — awaiting owner approval.** License column is BINDING.
Ambiguous license = treat as copyrighted (never ingest). URL verification
status noted per row; rows marked `bot-blocked` exist but block the sandbox's
curl UA — verify in a browser at ingest and record.

| Source | License | What we take | Notes | licenseEvidence |
|---|---|---|---|---|
| OpenRN (openrn.org — Pharmacology 2e, Skills 2e, Fundamentals, Mental Health, Management) | CC BY 4.0 | NGN-style case studies, clinical scenarios, H5P activities, rationales | Primary source. Peer-reviewed by nursing faculty, aligned to current NCLEX-RN test plan. Attribution line required. | https://openrn.org/ + per-book front-matter license (verified at ingest) + https://creativecommons.org/licenses/by/4.0/legalcode |
| OpenStax Anatomy & Physiology 2e | CC BY 4.0 | A&P facts, figures (as redraw reference), review questions | Feeds guides + hotspot-drill anatomy metadata. | https://openstax.org/details/books/anatomy-and-physiology-2e (200) |
| LibreTexts Nursing / Medicine | CC BY-NC-SA (verify per-book; some vary) | Supplementary explanations | NC clause = attribution + noncommercial-use check: we sell subscriptions, so use for FREE guide content only, never gated/paid items. Verify each book's license before ingest; record it. | https://med.libretexts.org/ (200) + per-book footer license (verified at ingest) |
| OER Commons (nursing hubs) | Varies per item (CC BY / CC BY-SA common) | Case scenarios, lesson plans | Per-item license verification mandatory. Skip anything NC for paid content. | https://www.oercommons.org/ (403 bot-blocked — verify in browser; per-item metadata recorded at ingest) |
| CDC / AHRQ / NIH / MedlinePlus | Public domain (17 U.S.C. §105) | Sepsis bundles, infection control, stroke algorithms, patient-education handouts, lab-value references | Caveat: third-party figures embedded in CDC pages may be copyrighted — authored text/tables only. | CDC https://www.cdc.gov/other/agency-material.html (403 bot-blocked) · MedlinePlus https://medlineplus.gov/copyright.html (200) · AHRQ https://www.ahrq.gov/policy/electronic/accessibility/index.html (403 bot-blocked) · NIH https://www.nih.gov/about-nih/what-we-do/nih-facts |
| NCSBN public test plans & NGN public materials | Public documents (fair reference) | Test-plan category weights, CJMM structure | Reference for item categorization only. Never reproduce proprietary sample items verbatim. | https://www.ncsbn.org/ (200) + test-plan PDF path verified at ingest |
| Gray's Anatomy 1918 (Bartleby / archive.org) | Public domain | Anatomy plates for the animated-vintage social/content lane | Style test lane per Phase 3 discussion. | https://www.bartleby.com/lit-hub/anatomy-of-the-human-body/ (403 bot-blocked — verify in browser) |

## Hard exclusions (binding)

- No commercial prep content (UWorld / Archer / Kaplan / Quizlet / etc.)
- **No StatPearls** — © StatPearls Publishing; NCBI Bookshelf hosting is an access
  statement, not a license. Never ingest — link-out only.
- No nursing-creator social content
- No "found online" assets
- Ambiguous license = treat as copyrighted

## Attribution rules

- CC BY items render **"Adapted from {source} (CC BY 4.0)"** at the item/case
  level (attribution slot in the item template).
- LibreTexts/NC-licensed material: **free surfaces only** — never gated/paid items.
- US-gov/PD items: source note in the ledger (no UI line needed).
- LICENSES.md: one ledger row per batch (source, chapter, license,
  licenseEvidence URL, item count, attribution text rendered).

## Ingest-time rule (owner directive 2026-08-20, standing)

Any source whose `licenseEvidence` URL **cannot be fetched and eyeballed at
ingest** is **flagged to the owner before its content is used**. Bot-blocked
(403 from the sandbox) is fine — the page exists and the owner can eyeball it
in a browser. Unverified is not: no license statement actually seen = no
ingest. Content-host reachability is part of the same check: if the chapter
text cannot be fetched from the sandbox, the owner provides it (browser
export / PDF) or the batch waits.
