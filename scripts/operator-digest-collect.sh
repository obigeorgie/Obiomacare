#!/usr/bin/env bash
# Operator Digest — data collection for the Monday 08:00 weekly digest.
# Fetches 14 days of funnel metrics + top guides from the Worker.
# stdout (JSON) is injected into the cron agent's prompt for composition.
set -euo pipefail

BASE="${DIGEST_BASE:-https://obiomacare.com}"
if [ -z "${OPERATOR_API_KEY:-}" ]; then
  echo '{"error":"OPERATOR_API_KEY not set in this environment — digest cannot authenticate to /api/operator/metrics"}'
  exit 0
fi

curl -s -m 30 -H "x-operator-key: ${OPERATOR_API_KEY}" \
  "${BASE}/api/operator/metrics?days=14&top=5"
echo
