#!/bin/bash
# Obioma Care — Comprehensive End-to-End Audit
# Run: bash e2e-audit.sh

echo "========================================"
echo "  OBIOMA CARE — END-TO-END AUDIT"
echo "  $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo "========================================"
echo ""

PASS=0
FAIL=0
WARN=0

test_pass() { echo "  ✅ PASS: $1"; PASS=$((PASS+1)); }
test_fail() { echo "  ❌ FAIL: $1"; FAIL=$((FAIL+1)); }
test_warn() { echo "  ⚠️  WARN: $1"; WARN=$((WARN+1)); }

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "═══════════════════════════════════════"
echo " 1. WEBSITE ENDPOINTS"
echo "═══════════════════════════════════════"

for url in \
  "https://obiomacare.com/" \
  "https://obiomacare.com/index.html" \
  "https://obiomacare.com/free-nclex-checklist.html" \
  "https://app.obiomacare.com/" \
  "https://app.obiomacare.com/anatomy-lab"
do
  status=$(curl -s -o /dev/null -w "%{http_code}" -L "$url" 2>/dev/null)
  if [ "$status" = "200" ]; then
    test_pass "$url (HTTP $status)"
  else
    test_fail "$url (HTTP $status)"
  fi
done

echo ""
echo "═══════════════════════════════════════"
echo " 2. API ENDPOINTS"
echo "═══════════════════════════════════════"

# Health check
health=$(curl -s https://obiomacare.com/api/health 2>/dev/null)
if echo "$health" | grep -q '"status":"ok"'; then
  test_pass "/api/health responds with ok"
  echo "    Stripe: $(echo $health | python3 -c "import sys,json; print(json.load(sys.stdin)['stripe'])" 2>/dev/null)"
  echo "    Email: $(echo $health | python3 -c "import sys,json; print(json.load(sys.stdin)['email'])" 2>/dev/null)"
  echo "    Firebase: $(echo $health | python3 -c "import sys,json; print(json.load(sys.stdin)['firebase'])" 2>/dev/null)"
else
  test_fail "/api/health not responding correctly"
fi

# Debug files
debug=$(curl -s https://obiomacare.com/api/debug/files 2>/dev/null)
if echo "$debug" | grep -q '"hasFirebaseJson":true'; then
  test_pass "Firebase service account present"
else
  test_fail "Firebase service account missing"
fi

echo ""
echo "═══════════════════════════════════════"
echo " 3. STRIPE INTEGRATION"
echo "═══════════════════════════════════════"

# Test checkout creation (no actual charge)
checkout=$(curl -s -X POST https://obiomacare.com/api/create-checkout \
  -H "Content-Type: application/json" \
  -d '{"tier":"core","email":"test@obiomacare.com"}' 2>/dev/null)
if echo "$checkout" | grep -q "stripe.com"; then
  test_pass "Stripe checkout session created"
else
  test_fail "Stripe checkout failed: $checkout"
fi

# Test promo code validation
promo=$(curl -s -X POST https://obiomacare.com/api/validate-promo \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST99"}' 2>/dev/null)
if echo "$promo" | grep -q '"valid":true'; then
  test_pass "Promo code validation works"
else
  test_fail "Promo code validation failed"
fi

echo ""
echo "═══════════════════════════════════════"
echo " 4. EMAIL SYSTEM"
echo "═══════════════════════════════════════"

# Test lead magnet (sends welcome email)
lead=$(curl -s -X POST https://obiomacare.com/api/lead-magnet \
  -H "Content-Type: application/json" \
  -H "Origin: https://obiomacare.com" \
  -d '{"email":"audit-test-$(date +%s)@obiomacare.com","firstName":"Audit"}' 2>/dev/null)
if echo "$lead" | grep -q '"success":true'; then
  test_pass "Lead magnet endpoint responds"
else
  test_fail "Lead magnet failed: $lead"
fi

# Verify SMTP config from health check
if echo "$health" | grep -q '"email":true'; then
  test_pass "SMTP email transport configured"
else
  test_fail "SMTP email not configured"
fi

echo ""
echo "═══════════════════════════════════════"
echo " 5. PDF PRODUCT FILES"
echo "═══════════════════════════════════════"

PDFS=(
  "products/NGN-Clinical-Judgment-Framework.pdf"
  "products/Prioritization-Decision-Trees.pdf"
  "products/Real-Case-Walkthroughs.pdf"
  "products/SBAR-Templates.pdf"
  "products/First-Year-Survival-Guide.pdf"
  "products/Clinical-Day-Planner.pdf"
)

for pdf in "${PDFS[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" -I "https://obiomacare.com/$pdf" 2>/dev/null)
  type=$(curl -s -o /dev/null -w "%{content_type}" -I "https://obiomacare.com/$pdf" 2>/dev/null | tr -d '\r')
  if [ "$status" = "200" ] && echo "$type" | grep -q "pdf"; then
    test_pass "$pdf ($type)"
  else
    test_fail "$pdf (HTTP $status, $type)"
  fi
done

echo ""
echo "═══════════════════════════════════════"
echo " 6. BRAND ASSETS"
echo "═══════════════════════════════════════"

ASSETS=(
  "assets/logo-icon.svg:image/svg+xml"
  "assets/logo-full.svg:image/svg+xml"
  "assets/logo-email.png:image/png"
  "assets/logo.svg:image/svg+xml"
  "apple-touch-icon.png:image/png"
  "icon-192.png:image/png"
  "icon-512.png:image/png"
  "favicon.svg:image/svg+xml"
)

for asset in "${ASSETS[@]}"; do
  path="${asset%%:*}"
  expected="${asset##*:}"
  status=$(curl -s -o /dev/null -w "%{http_code}" -I "https://obiomacare.com/$path" 2>/dev/null)
  type=$(curl -s -o /dev/null -w "%{content_type}" -I "https://obiomacare.com/$path" 2>/dev/null | tr -d '\r')
  if [ "$status" = "200" ] && echo "$type" | grep -q "$expected"; then
    test_pass "$path ($type)"
  else
    test_warn "$path (HTTP $status, got $type, expected $expected)"
  fi
done

echo ""
echo "═══════════════════════════════════════"
echo " 7. SEO & SITEMAP"
echo "═══════════════════════════════════════"

# Sitemap
sitemap=$(curl -s https://obiomacare.com/sitemap.xml 2>/dev/null)
if echo "$sitemap" | grep -q "urlset"; then
  count=$(echo "$sitemap" | grep -c "<loc>")
  test_pass "Sitemap valid ($count URLs)"
else
  test_fail "Sitemap missing or invalid"
fi

# Robots.txt
robots=$(curl -s https://obiomacare.com/robots.txt 2>/dev/null)
if echo "$robots" | grep -q "Sitemap"; then
  test_pass "robots.txt present"
else
  test_warn "robots.txt missing"
fi

# Meta tags on landing page
meta=$(curl -s https://obiomacare.com/ 2>/dev/null)
if echo "$meta" | grep -q "og:title"; then
  test_pass "Open Graph meta tags present"
else
  test_warn "Open Graph tags missing"
fi

if echo "$meta" | grep -q "application/ld+json"; then
  test_pass "JSON-LD schema present"
else
  test_warn "JSON-LD schema missing"
fi

echo ""
echo "═══════════════════════════════════════"
echo " 8. SECURITY"
echo "═══════════════════════════════════════"

# Check for exposed .env
env_resp=$(curl -s https://obiomacare.com/.env 2>/dev/null | head -1)
if echo "$env_resp" | grep -q "DOCTYPE"; then
  test_pass ".env protected (returns HTML fallback, not actual file)"
else
  test_warn ".env may be exposed"
fi

# Check for exposed .git
git_resp=$(curl -s https://obiomacare.com/.git/HEAD 2>/dev/null | head -1)
if echo "$git_resp" | grep -q "DOCTYPE"; then
  test_pass ".git protected (returns HTML fallback, not actual file)"
else
  test_warn ".git may be exposed"
fi

echo ""
echo "═══════════════════════════════════════"
echo " 9. GITHUB REPOSITORY"
echo "═══════════════════════════════════════"

gh_status=$(curl -s -o /dev/null -w "%{http_code}" https://github.com/obigeorgie/obiomacare-frontend 2>/dev/null)
if [ "$gh_status" = "200" ]; then
  test_pass "GitHub repo accessible"
else
  test_warn "GitHub repo check failed (HTTP $gh_status)"
fi

echo ""
echo "═══════════════════════════════════════"
echo " 10. CONTENT PAGES"
echo "═══════════════════════════════════════"

CONTENT_PAGES=(
  "content/nclex-clinical-judgment-5-steps.html"
  "content/nclex-priority-abcde-method.html"
  "content/nclex-2-week-study-plan-complete.html"
  "content/nclex-30-day-study-plan.html"
  "content/nclex-delegation-assignment-guide.html"
  "content/why-nursing-students-struggle-nclex-next-gen.html"
  "content/nclex-anxiety-management.html"
  "content/obioma-vs-uworld-vs-archer.html"
)

for page in "${CONTENT_PAGES[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" -L "https://obiomacare.com/$page" 2>/dev/null)
  if [ "$status" = "200" ]; then
    test_pass "$page"
  else
    test_warn "$page (HTTP $status)"
  fi
done

echo ""
echo "═══════════════════════════════════════"
echo " AUDIT SUMMARY"
echo "═══════════════════════════════════════"
echo "  ✅ Passed: $PASS"
echo "  ❌ Failed: $FAIL"
echo "  ⚠️  Warnings: $WARN"
echo ""

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL CRITICAL CHECKS PASSED${NC}"
else
  echo -e "${RED}⚠️  $FAIL CRITICAL ISSUES FOUND${NC}"
fi

echo ""
echo "========================================"
