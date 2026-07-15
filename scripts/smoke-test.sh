#!/bin/bash
# Goodly Pre-Deployment Smoke Test
# Run before deploying to production: ./scripts/smoke-test.sh
# Tests: backend health, frontend availability, static assets, security headers
# NOTE: Content checks use grep -i for case-insensitive matching.
# SPA pages return 200 for all routes (client-side routing) — this is expected.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

FRONTEND_URL="${FRONTEND_URL:-https://searchgoodly.com}"
BACKEND_URL="${BACKEND_URL:-https://api.searchgoodly.com}"

log_pass() { echo -e "${GREEN}[PASS]${NC} $1"; PASS=$((PASS+1)); }
log_fail() { echo -e "${RED}[FAIL]${NC} $1"; FAIL=$((FAIL+1)); }
log_info() { echo -e "${YELLOW}[INFO]${NC} $1"; }

check_url() {
  local url="$1"
  local desc="$2"
  local expected="${3:-200}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 -L "$url" 2>/dev/null || echo "000")
  if [ "$code" = "$expected" ]; then
    log_pass "$desc ($code)"
  else
    log_fail "$desc (expected $expected, got $code)"
  fi
}

check_content() {
  local url="$1"
  local desc="$2"
  local keyword="$3"
  local body
  body=$(curl -s --max-time 10 -L "$url" 2>/dev/null || echo "")
  if echo "$body" | grep -qi "$keyword"; then
    log_pass "$desc (contains '$keyword')"
  else
    log_fail "$desc (missing '$keyword')"
  fi
}

echo "============================================"
echo " Goodly Pre-Deployment Smoke Test"
echo " Frontend: $FRONTEND_URL"
echo " Backend:  $BACKEND_URL"
echo "============================================"
echo ""

# ── Backend Health ──
log_info "Backend Health Checks..."
check_url "$BACKEND_URL/api/health" "Backend health endpoint"
check_url "$BACKEND_URL/" "Backend root"

# ── Frontend Core Pages (SPA returns 200 for all valid routes) ──
log_info "Frontend Core Pages..."
check_url "$FRONTEND_URL/" "Landing page"
check_url "$FRONTEND_URL/login" "Login page"
check_url "$FRONTEND_URL/register" "Register page"
check_url "$FRONTEND_URL/pricing" "Pricing page"
check_url "$FRONTEND_URL/audit" "Public audit page"
check_url "$FRONTEND_URL/blog" "Blog page"
check_url "$FRONTEND_URL/terms" "Terms page"
check_url "$FRONTEND_URL/privacy" "Privacy page"
check_url "$FRONTEND_URL/forgot-password" "Forgot password page"
check_url "$FRONTEND_URL/changelog" "Changelog page"
check_url "$FRONTEND_URL/status" "Status page"
check_url "$FRONTEND_URL/help" "Help center page"
check_url "$FRONTEND_URL/stories" "Testimonials page"
check_url "$FRONTEND_URL/roi-calculator" "ROI calculator page"
check_url "$FRONTEND_URL/competitors" "Competitor landing page"
check_url "$FRONTEND_URL/checklist" "Checklist page"
check_url "$FRONTEND_URL/refer" "Referral page"
check_url "$FRONTEND_URL/content-studio" "Content studio page"
check_url "$FRONTEND_URL/tools" "Free tools hub"

# ── Free Tools ──
log_info "Free Tools..."
check_url "$FRONTEND_URL/tools/meta-tag-checker" "Meta tag checker"
check_url "$FRONTEND_URL/tools/page-speed" "Page speed checker"
check_url "$FRONTEND_URL/tools/mobile-friendly" "Mobile friendly checker"
check_url "$FRONTEND_URL/tools/keyword-density" "Keyword density checker"
check_url "$FRONTEND_URL/tools/ssl-checker" "SSL checker"
check_url "$FRONTEND_URL/tools/schema-validator" "Schema validator"
check_url "$FRONTEND_URL/tools/robots-checker" "Robots checker"
check_url "$FRONTEND_URL/tools/heading-checker" "Heading checker"

# ── Industry Pages ──
log_info "Industry Pages..."
check_url "$FRONTEND_URL/restaurants" "Restaurants page"
check_url "$FRONTEND_URL/plumbers" "Plumbers page"
check_url "$FRONTEND_URL/dentists" "Dentists page"
check_url "$FRONTEND_URL/salons" "Salons page"
check_url "$FRONTEND_URL/retail" "Retail page"
check_url "$FRONTEND_URL/lawyers" "Lawyers page"
check_url "$FRONTEND_URL/home-services" "Home services page"
check_url "$FRONTEND_URL/real-estate" "Real estate page"
check_url "$FRONTEND_URL/automotive" "Automotive page"

# ── Comparison Pages ──
log_info "Comparison Pages..."
check_url "$FRONTEND_URL/vs/ahrefs" "vs Ahrefs"
check_url "$FRONTEND_URL/vs/semrush" "vs Semrush"
check_url "$FRONTEND_URL/vs/moz" "vs Moz"
check_url "$FRONTEND_URL/vs/ubersuggest" "vs Ubersuggest"
check_url "$FRONTEND_URL/vs/seranking" "vs SERanking"
check_url "$FRONTEND_URL/vs/agency" "vs Agency"
check_url "$FRONTEND_URL/vs/localfalcon" "vs LocalFalcon"
check_url "$FRONTEND_URL/vs/brightlocal" "vs BrightLocal"

# ── Content Checks (SPA renders client-side, check for key HTML structure) ──
log_info "Content Checks..."
check_content "$FRONTEND_URL/" "Landing has root div" '<div id="root"'
check_content "$FRONTEND_URL/" "Landing has title" '<title>'

# ── Static Assets ──
log_info "Static Assets..."
check_url "$FRONTEND_URL/favicon.ico" "Favicon"
check_url "$FRONTEND_URL/favicon.svg" "Favicon SVG"
check_url "$FRONTEND_URL/robots.txt" "Robots.txt"
check_url "$FRONTEND_URL/sitemap.xml" "Sitemap"

# ── SPA handles 404 client-side (returns 200 shell, React shows 404) ──
log_info "SPA Routing..."
check_url "$FRONTEND_URL/nonexistent-page-xyz" "Unknown route returns SPA shell (200)"

# ── Security Headers ──
log_info "Security Headers..."
HEADERS=$(curl -sI --max-time 10 "$FRONTEND_URL/" 2>/dev/null || echo "")
if echo "$HEADERS" | grep -qi "x-content-type-options"; then
  log_pass "X-Content-Type-Options present"
else
  log_fail "X-Content-Type-Options missing"
fi
if echo "$HEADERS" | grep -qi "x-frame-options"; then
  log_pass "X-Frame-Options present"
else
  log_fail "X-Frame-Options missing"
fi

# ── Summary ──
echo ""
echo "============================================"
TOTAL=$((PASS + FAIL))
echo -e " Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}, $TOTAL total"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
  echo -e "${RED}SMOKE TEST FAILED — do not deploy!${NC}"
  exit 1
else
  echo -e "${GREEN}SMOKE TEST PASSED — ready to deploy!${NC}"
  exit 0
fi
