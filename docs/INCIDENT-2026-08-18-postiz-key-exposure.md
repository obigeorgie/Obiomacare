# INCIDENT — 2026-08-18: Postiz API Key Publicly Exposed in Git History

**Classification:** Credential exposure (dead-key containment; no live-data breach evidenced)

## Timeline

- **Introduced:** commit `e74405d` — hardcoded Postiz API key committed into public repo files.
- **Exposed window:** `e74405d` → `526b6ca` (public repo `obigeorgie/Obiomacare`).
- **Contained:** `526b6ca` — scrubbed the key from 4 content-nursing scripts (env ref). **Residual found and fixed 2026-08-18:** 4 more scripts still carried the literal (`scripts/schedule-threads.js`, `scripts/schedule-x-posts.js`, `scripts/test-postiz.js`, `scripts/test-postiz-schedule.js`) — all patched to `process.env.POSTIZ_API_KEY`; repo-wide scan confirms zero `pos_` literals remain on main.
- **Key status:** ROTATED by owner (new value installed in this environment only; old value dead).

## Decisions

1. **Rotation neutralizes the exposure.** The dead key cannot authenticate to Postiz.
2. **Git-history scrub SKIPPED — deliberate, documented.** Force-push history rewrite on a live public repo is not worth the disruption once the key is dead. Future repo hygiene: no secrets in code, ever (standing rules #12/#13).
3. **No evidence of unauthorized use** — no Postiz-side anomaly reported; key was used only by the schedulers.

## Rules reinforced

- Secrets owner-installed only (env / deploy environment). Never literals in committed code.
- New key lives in this environment as `POSTIZ_API_KEY`; schedulers read it from env.

## Status: CLOSED (2026-08-18) — key rotated, literals scrubbed, history rewrite declined by decision.
