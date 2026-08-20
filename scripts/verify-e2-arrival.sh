#!/usr/bin/env bash
# E2 arrival verification (2026-08-21) — one-shot cron job.
# Reports the KV step transition (step:0 -> step:1) + Resend E2 line +
# last sweep output. Delivered verbatim by the no_agent cron job.
set -euo pipefail
cd /data/workspace/obiomacare
set -a; source /data/.hermes/profiles/atlas/secrets.env 2>/dev/null || true; set +a
echo "=== E2 ARRIVAL CHECK $(date -u '+%Y-%m-%d %H:%M:%S UTC') ==="
echo
echo "--- KV sequence state (expect step:1 if E2 processed) ---"
npx -y wrangler@latest kv key get "seq:admin@obiomacare.com" --namespace-id="086045e4c2324add985328ec7e793d4f" --remote 2>&1 | grep -vE "^🪵|^$|--" | head -2
echo
echo "--- Resend log (last 8 to admin) ---"
curl -s -m 20 -H "x-operator-key: $OPERATOR_API_KEY" "https://obiomacare.com/api/operator/email-status?limit=8" | python3 -c "
import sys, json
for e in json.load(sys.stdin).get('items', []):
    if 'admin@obiomacare.com' in str(e.get('to')):
        print(f\"{e.get('created_at','')[:19]} | {e.get('last_event','?'):12} | {e.get('subject','')[:55]}\")
" 2>/dev/null || echo "(status endpoint unavailable)"
echo
echo "--- last sweep run output ---"
ls -t /data/profiles/atlas/cron/output/b9103651f5bb/*.md 2>/dev/null | head -1 | xargs cat 2>/dev/null | head -10 || echo "(no sweep output)"
