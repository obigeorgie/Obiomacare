#!/usr/bin/env bash
# Obioma Care — Pre-Report Check Script
# Run before every status report. A BLOCKED result means no ✅ claims.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

EXIT_CODE=0

echo "=========================================="
echo "  Obioma Pre-Report Check"
echo "=========================================="
echo ""

# 1. Uncommitted changes
echo "--- 1. Git Status ---"
if git diff --quiet && git diff --cached --quiet; then
    echo "OK: Working tree clean (no uncommitted changes)"
else
    echo "BLOCKED: Uncommitted changes detected"
    git status --short
    EXIT_CODE=1
fi
echo ""

# 2. Unpushed commits
echo "--- 2. Unpushed Commits (git log origin/main..HEAD) ---"
UNPUSHED=$(git log origin/main..HEAD --oneline 2>/dev/null || true)
if [ -z "$UNPUSHED" ]; then
    echo "OK: No unpushed commits (local main == origin/main)"
else
    echo "BLOCKED: Unpushed commits detected"
    echo "$UNPUSHED"
    EXIT_CODE=1
fi
echo ""

# 3. Build check
echo "--- 3. Build Check ---"
if [ -d "public" ] && [ -f "public/index.html" ] && [ -f "public/manifest.json" ] && [ -f "public/sw.js" ]; then
    echo "OK: public/ has index.html, manifest.json, sw.js"
else
    echo "BLOCKED: Build output missing key files in public/"
    EXIT_CODE=1
fi
echo ""

# 4. Summary
echo "=========================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo "RESULT: OK — Safe to report ✅"
else
    echo "RESULT: BLOCKED — Do not claim completion. Fix issues first."
fi
echo "=========================================="

exit $EXIT_CODE
