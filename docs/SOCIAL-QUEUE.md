# Phase 3.5 — Approved-Only Publishing Queue (DORMANT)

Status: **built, dormant.** Not one post will be taken until ALL activation
preconditions below hold AND the owner gives an explicit "activate" go.
Rule 15: no unreviewed content is ever published; owner-approved content MAY
auto-post through this queue; per-asset approval recorded; instant halt on
owner command.

## Activation preconditions (ALL must hold)

1. **Factory proof**: at least one full batch (3 shorts) manually reviewed,
   rendered, and manually posted by the owner via the Phase 3 flow.
2. **Queue gate demonstration**: enqueue of an unreviewed SCRIPT refused (the
   review unit is the script JSON — captions + CTA link — not the media
   ledger). Evidence produced 2026-08-20: reviewed-image + unreviewed-script
   → REFUSED; publish-time flip → SKIPPED (see report). Re-run at activation.
3. **Kill switch demonstrated**: owner command (or file flag) halts the queue
   and dequeues everything pending. Local evidence produced 2026-08-20.
4. **Platform tokens installed owner-side only** (rule #12): TikTok Content
   Posting API, IG/FB Graph API, YouTube Data API — owner creates the apps,
   owner installs tokens (`TIKTOK_ACCESS_TOKEN`, `INSTAGRAM_ACCESS_TOKEN`,
   `YOUTUBE_ACCESS_TOKEN` in the environment). Nothing via chat.

## Queue mechanics

- **Source of truth**: `content/social/queue.json` — every entry references a
  **script JSON** (`content/social/scripts/*.json`) whose review record shows
  `reviewed` by **Nnamdi Okorafor, RN** (script + per-platform captions + CTA
  link are the review unit — a reviewed image is NOT a reviewed post).
- **Double verification**: the script's reviewStatus/reviewer/reviewedAt is
  re-checked AT PUBLISH TIME, not just at enqueue. If the script flipped to
  unreviewed, the post is SKIPPED (demonstrated: accepted entry + script
  flipped pending → skip).
- **Depth**: ≤ 5 days of content. No evergreen auto-scheduling beyond the
  current approved batch.
- **UTM + captions**: every post carries the UTM-tagged link; per-platform
  caption variants live in the script JSON and are part of what gets reviewed.
- **Rate**: max 1 post/day/platform regardless of approved backlog.
- **Failure posture**: any API error/token expiry/platform rejection → post
  skipped + logged; auth-related failures notified immediately; all failures
  surface in the Monday digest. Never retry-storm (single attempt only).

## Owner review UX (weekly labor ≈ one message)

Batch-approval message: table of asset IDs + one-line descriptions + preview
links. Owner replies `approve 1,2,4` style. That's it.

## Non-goals (restated)

No paid boosting via API · no auto-replies/DMs · no engagement automation ·
no cross-posting identical captions (platform-specific captions only).

## Files

- `content/social/queue.json` — queue state (committed source of truth)
- `content/social/scripts/*.json` — per-asset script JSON (captions + UTM link)
- `content/social/state.json` — last-post-per-platform (rate limiting)
- `content/social/log.json` — publish/skip/halt log (last 200)
- `content/social/KILL` — kill-switch file: presence halts + dequeues
- `scripts/social-enqueue.js` — enqueue with the review gate
- `scripts/social-queue.js` — processor (dry-run available), run by the daily
  Hermes cron once activated

## Kill switch

- Owner command to Atlas: "halt the queue" → create `content/social/KILL` (or
  set `killSwitch: true` in queue.json) → processor halts instantly + dequeues
  all pending entries (status `halted`) + logs the action.
