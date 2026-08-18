#!/usr/bin/env bash
# Phase 2 — daily nurture-sequence sweep.
# Calls the Worker's operator-gated processor; prints ONLY when emails were sent
# (watchdog pattern — silent when nothing processed).
set -euo pipefail
BASE="${DIGEST_BASE:-https://obiomacare.com}"
if [ -z "${OPERATOR_API_KEY:-}" ]; then
  echo '{"error":"OPERATOR_API_KEY not set"}'
  exit 0
fi
RESP=$(curl -s -m 30 -X POST -H "x-operator-key: $OPERATOR_API_KEY" -H "Content-Type: application/json" -d '{}' "$BASE/api/operator/process-sequence")
if [ -z "$RESP" ]; then exit 0; fi
COUNT=$(printf '%s' "$RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('processed',[])))" 2>/dev/null || echo 0)
if [ "$COUNT" != "0" ]; then
  printf 'Nurture sequence sweep (%s emails sent): %s\n' "$COUNT" "$RESP"
fi
