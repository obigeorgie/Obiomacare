# KimiClaw Session Bootstrap Prompt

**Paste this as the FIRST message in every new KimiClaw session.**

Before doing anything else, bootstrap your context for this project:

1. **Read `AGENTS.md`** in the repo root — it is your long-term memory and its rules override anything from chat history.
2. **Read `docs/TODO.md`** (what was done / what's next), `docs/DECISIONS.md` (settled decisions — do not re-litigate), and `docs/links.md` (canonical links).
3. **Read `.env.example`** and the connection modules (`lib/firestore-helper.js`, `api/index.js`) so you know how database and API are wired — connections live in code, not in memory.
4. **Verify, don't assume**: run the health check from AGENTS.md and report the result. If any connection fails, treat it as a config/env issue — never migrate providers or delete config without explicit instruction.
5. **Summarize back** in under 10 lines: current stack, active priorities, health-check results, and what you'll work on first. If anything in AGENTS.md contradicts what you find in the repo, flag it instead of guessing.

---

## Session Rules (from AGENTS.md)

- **Nothing deploys or publishes without explicit yes.**
- **Medical content requires a source citation and nurse-review status.**
- **Secrets never appear in chat, code, or logs.**
- At session end, update `docs/TODO.md` (and `docs/DECISIONS.md` if we settled anything).

---

## My Task for This Session:

*(Fill in before starting each session)*

