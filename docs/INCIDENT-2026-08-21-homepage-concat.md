# INCIDENT-2026-08-21 — Homepage shipped as 4 concatenated documents (P0)

**Severity:** P0 (production homepage served 4 concatenated full documents:
4 `<body>` / 4 `</html>` / 1 `<!DOCTYPE>` — ~3.3× weight, 4 revenue-beacon
injections, raw CSS below the fold).

**Reported by:** Owner (Nnamdi) — 2026-08-21.
**Diagnosed / fixed:** Atlas — 2026-08-21.

---

## Timeline

| Time (UTC) | Event |
|---|---|
| ~13:00 | Dirty-tree homepage rework (Free Lead Magnet, Anatomy Lab, FAQ, guides preview, email capture) committed as `e1a5ed5` after content-level review. **Structural integrity was NOT gate-checked.** |
| 13:0x | Consent-injection build ran against the 4-copy source; consent banner injected into the first `<body>` only; build propagated all 4 copies. |
| 13:1x | Deployed (`7.16s` upload). Post-deploy checks passed: 21/21 link crawl, bank 752, banner present — **top-viewport + link checks insufficient; none checked document-count/weight.** |
| 16:1x | Owner reports P0: `curl / | grep -c '<body'` = 4. |

## Root cause

`landing/index.html` (the SOURCE) contained **4 concatenated full documents**
(101KB complete doc + 3× identical 77KB duplicate tails, each starting with
a CSS tail `/* Reviewed By Block */`). The duplication was introduced in the
uncommitted dirty-tree work (the homepage rework) — an editor appended the
document 3 extra times into the same file. The build faithfully propagated
the source; production served all 4 copies.

**Why the miss:** the consent gate (93 banners), footer gate, media gate,
link crawl, and bank-count gate all passed because none of them validated
**document structure** (1 doctype/body/html) or **per-page weight**. The
rework review checked content (claims, placeholders) but not structure.

## Fix

1. **Restored single-copy `landing/index.html`** by extracting the first
   complete document (ends at its `</html>`) — the rework content is fully
   preserved (Lead Magnet, Anatomy, FAQ, pricing teaser, guides preview,
   email capture); the 3 duplicate tails removed.
2. **New structural gates (build-time):**
   - `scripts/html-structure-gate.js` — build FAILS if any page has ≠1
     doctype / `<body>` / `</body>` / `<html>` / `</html>`. Wired into
     `scripts/build.js`. (This gate would have caught the P0 instantly.)
   - `scripts/page-weight-gate.js` — per-page **historical baseline**
     (`scripts/page-weight-baseline.json`, committed deliberately; seeded
     2026-08-21 from the verified single-copy build). Build FAILS if any
     page exceeds baseline × 1.35. Baseline updates are deliberate (seed
     script `scripts/page-weight-baseline-seed.js`).
3. **New post-deploy check (rule #10 extension):**
   - `scripts/post-deploy-scroll-check.sh` — live-page check: 1 body /
     doctype / html, CSS in `<head>`, below-fold content markers present,
     optional headless-browser rendered-height measure.
4. **Re-deployed** and verified: `curl / | grep -c '<body'` = **1**; built
   index 103,791 B (was 328,089 B).

## Verification (post-deploy)

- `curl -s https://obiomacare.com/ | grep -c '<body'` → **1** ✅
- `curl -s https://obiomacare.com/ | grep -c '</html>'` → **1** ✅
- Homepage weight: **~103 KB** (was ~329 KB) ✅
- Structure gate: 134/134 pages single-copy ✅
- Weight gate: 134/134 pages within baseline × 1.35 ✅
- Scroll check: PASSED (body=1, doctype=1, CSS in head, below-fold content) ✅
- Link crawl: 0 broken ✅
- Bank: 752 unchanged ✅

## Process lessons

1. **Content review ≠ structural review.** Committing a dirty tree requires
   document-integrity validation (1 doctype/body/html), not just claim/
   placeholder scans.
2. **Gates must be structural + historical.** Self-referential checks
   (compare a page against itself) cannot catch duplication; a committed
   per-page baseline can.
3. **Post-deploy verification must include a rendered scroll / weight /
   structure check** — top-viewport + link-crawl checks are insufficient.

## Permanent safeguards

- `html-structure-gate.js` + `page-weight-gate.js` wired into every build
  (fail = no deploy).
- `post-deploy-scroll-check.sh` part of the deploy checklist (rule #10).
- Commit rule for the future: **no commit of a dirty tree without running
  the structure gate on the result first.**
