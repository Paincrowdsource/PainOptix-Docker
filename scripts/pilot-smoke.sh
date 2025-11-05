#!/bin/bash
# ============================================================================
# PainOptix Pilot Pricing Smoke Test (LIVE)
# Tests both comprehensive AND enhanced tiers
# ============================================================================

set -euo pipefail

# Check required environment variables
if [ -z "${STRIPE_SK:-}" ]; then
    echo "❌ Error: STRIPE_SK environment variable is required"
    echo "Usage: export STRIPE_SK=sk_live_... && BASE_URL=https://painoptix.com ./scripts/pilot-smoke.sh"
    exit 1
fi

BASE_URL="${BASE_URL:-https://painoptix.com}"
TIMESTAMP=$(date +%s)

echo ""
echo "==================================================================="
echo "PILOT PRICING SMOKE TEST"
echo "Target: $BASE_URL"
echo "==================================================================="
echo ""

# ============================================================================
# Flow A1: Homepage Pilot - Comprehensive Tier ($5 expected)
# ============================================================================

echo 'Flow A1: Homepage Pilot → Comprehensive ($5 expected)'
echo "-------------------------------------------------------------------"
EMAIL_A1="smoke+a1-comp-$TIMESTAMP@painoptix.com"

ASSESSMENT_A1=$(curl -s -X POST "$BASE_URL/api/assessment" \
  -H "Content-Type: application/json" \
  -d "{\"responses\":[{\"questionId\":\"pain_location\",\"question\":\"Where is your pain?\",\"answer\":\"lower_back\"},{\"questionId\":\"duration\",\"question\":\"Duration?\",\"answer\":\"3-6 months\"}],\"contactMethod\":\"email\",\"email\":\"$EMAIL_A1\",\"phoneNumber\":\"0000000000\",\"name\":\"Smoke A1 Comp\",\"initialPainScore\":7,\"referrerSource\":\"homepage_pilot\"}" \
  | grep -o '"assessmentId":"[^"]*"' | cut -d'"' -f4)

echo "✅ Assessment: $ASSESSMENT_A1"

SESSION_URL_A1=$(curl -s -X POST "$BASE_URL/api/create-checkout" \
  -H "Content-Type: application/json" \
  -H "Cookie: pilot=1" \
  -d "{\"assessmentId\":\"$ASSESSMENT_A1\",\"source\":\"homepage_pilot\",\"tier\":\"comprehensive\",\"priceId\":\"monograph\",\"tierPrice\":500}" \
  | grep -o '"url":"[^"]*"' | cut -d'"' -f4)

SESSION_ID_A1=$(echo "$SESSION_URL_A1" | grep -o 'cs_[^#]*')
echo "✅ Session: $SESSION_ID_A1"

sleep 2

STRIPE_A1=$(curl -s -X GET "https://api.stripe.com/v1/checkout/sessions/$SESSION_ID_A1" -u "$STRIPE_SK:")

AMOUNT_A1=$(echo "$STRIPE_A1" | grep -o '"amount_total": [0-9]*' | cut -d' ' -f2)
STRATEGY_A1=$(echo "$STRIPE_A1" | grep -o '"price_strategy": "[^"]*"' | cut -d'"' -f4)
PILOT_COOKIE_A1=$(echo "$STRIPE_A1" | grep -o '"pilot_cookie": "[^"]*"' | cut -d'"' -f4)

echo ""

# ============================================================================
# Flow A2: Homepage Pilot - Enhanced Tier ($5 expected)
# ============================================================================

echo 'Flow A2: Homepage Pilot → Enhanced ($5 expected)'
echo "-------------------------------------------------------------------"
EMAIL_A2="smoke+a2-enh-$TIMESTAMP@painoptix.com"

ASSESSMENT_A2=$(curl -s -X POST "$BASE_URL/api/assessment" \
  -H "Content-Type: application/json" \
  -d "{\"responses\":[{\"questionId\":\"pain_location\",\"question\":\"Where is your pain?\",\"answer\":\"lower_back\"},{\"questionId\":\"duration\",\"question\":\"Duration?\",\"answer\":\"3-6 months\"}],\"contactMethod\":\"email\",\"email\":\"$EMAIL_A2\",\"phoneNumber\":\"0000000000\",\"name\":\"Smoke A2 Enh\",\"initialPainScore\":7,\"referrerSource\":\"homepage_pilot\"}" \
  | grep -o '"assessmentId":"[^"]*"' | cut -d'"' -f4)

echo "✅ Assessment: $ASSESSMENT_A2"

SESSION_URL_A2=$(curl -s -X POST "$BASE_URL/api/create-checkout" \
  -H "Content-Type: application/json" \
  -H "Cookie: pilot=1" \
  -d "{\"assessmentId\":\"$ASSESSMENT_A2\",\"source\":\"homepage_pilot\",\"tier\":\"enhanced\",\"priceId\":\"enhanced\",\"tierPrice\":500}" \
  | grep -o '"url":"[^"]*"' | cut -d'"' -f4)

SESSION_ID_A2=$(echo "$SESSION_URL_A2" | grep -o 'cs_[^#]*')
echo "✅ Session: $SESSION_ID_A2"

sleep 2

STRIPE_A2=$(curl -s -X GET "https://api.stripe.com/v1/checkout/sessions/$SESSION_ID_A2" -u "$STRIPE_SK:")

AMOUNT_A2=$(echo "$STRIPE_A2" | grep -o '"amount_total": [0-9]*' | cut -d' ' -f2)
STRATEGY_A2=$(echo "$STRIPE_A2" | grep -o '"price_strategy": "[^"]*"' | cut -d'"' -f4)
PILOT_COOKIE_A2=$(echo "$STRIPE_A2" | grep -o '"pilot_cookie": "[^"]*"' | cut -d'"' -f4)

echo ""

# ============================================================================
# Flow B1: Direct Link - Comprehensive Tier ($20 expected)
# ============================================================================

echo 'Flow B1: Direct Link → Comprehensive ($20 expected)'
echo "-------------------------------------------------------------------"
EMAIL_B1="smoke+b1-comp-$TIMESTAMP@painoptix.com"

ASSESSMENT_B1=$(curl -s -X POST "$BASE_URL/api/assessment" \
  -H "Content-Type: application/json" \
  -d "{\"responses\":[{\"questionId\":\"pain_location\",\"question\":\"Where is your pain?\",\"answer\":\"lower_back\"},{\"questionId\":\"duration\",\"question\":\"Duration?\",\"answer\":\"3-6 months\"}],\"contactMethod\":\"email\",\"email\":\"$EMAIL_B1\",\"phoneNumber\":\"0000000000\",\"name\":\"Smoke B1 Comp\",\"initialPainScore\":7,\"referrerSource\":\"direct\"}" \
  | grep -o '"assessmentId":"[^"]*"' | cut -d'"' -f4)

echo "✅ Assessment: $ASSESSMENT_B1"

SESSION_URL_B1=$(curl -s -X POST "$BASE_URL/api/create-checkout" \
  -H "Content-Type: application/json" \
  -d "{\"assessmentId\":\"$ASSESSMENT_B1\",\"source\":\"direct\",\"tier\":\"comprehensive\",\"priceId\":\"monograph\",\"tierPrice\":2000}" \
  | grep -o '"url":"[^"]*"' | cut -d'"' -f4)

SESSION_ID_B1=$(echo "$SESSION_URL_B1" | grep -o 'cs_[^#]*')
echo "✅ Session: $SESSION_ID_B1"

sleep 2

STRIPE_B1=$(curl -s -X GET "https://api.stripe.com/v1/checkout/sessions/$SESSION_ID_B1" -u "$STRIPE_SK:")

AMOUNT_B1=$(echo "$STRIPE_B1" | grep -o '"amount_total": [0-9]*' | cut -d' ' -f2)
STRATEGY_B1=$(echo "$STRIPE_B1" | grep -o '"price_strategy": "[^"]*"' | cut -d'"' -f4)
PILOT_COOKIE_B1=$(echo "$STRIPE_B1" | grep -o '"pilot_cookie": "[^"]*"' | cut -d'"' -f4)

echo ""

# ============================================================================
# Flow B2: Direct Link - Enhanced Tier ($20 expected)
# ============================================================================

echo 'Flow B2: Direct Link → Enhanced ($20 expected)'
echo "-------------------------------------------------------------------"
EMAIL_B2="smoke+b2-enh-$TIMESTAMP@painoptix.com"

ASSESSMENT_B2=$(curl -s -X POST "$BASE_URL/api/assessment" \
  -H "Content-Type: application/json" \
  -d "{\"responses\":[{\"questionId\":\"pain_location\",\"question\":\"Where is your pain?\",\"answer\":\"lower_back\"},{\"questionId\":\"duration\",\"question\":\"Duration?\",\"answer\":\"3-6 months\"}],\"contactMethod\":\"email\",\"email\":\"$EMAIL_B2\",\"phoneNumber\":\"0000000000\",\"name\":\"Smoke B2 Enh\",\"initialPainScore\":7,\"referrerSource\":\"direct\"}" \
  | grep -o '"assessmentId":"[^"]*"' | cut -d'"' -f4)

echo "✅ Assessment: $ASSESSMENT_B2"

SESSION_URL_B2=$(curl -s -X POST "$BASE_URL/api/create-checkout" \
  -H "Content-Type: application/json" \
  -d "{\"assessmentId\":\"$ASSESSMENT_B2\",\"source\":\"direct\",\"tier\":\"enhanced\",\"priceId\":\"enhanced\",\"tierPrice\":2000}" \
  | grep -o '"url":"[^"]*"' | cut -d'"' -f4)

SESSION_ID_B2=$(echo "$SESSION_URL_B2" | grep -o 'cs_[^#]*')
echo "✅ Session: $SESSION_ID_B2"

sleep 2

STRIPE_B2=$(curl -s -X GET "https://api.stripe.com/v1/checkout/sessions/$SESSION_ID_B2" -u "$STRIPE_SK:")

AMOUNT_B2=$(echo "$STRIPE_B2" | grep -o '"amount_total": [0-9]*' | cut -d' ' -f2)
STRATEGY_B2=$(echo "$STRIPE_B2" | grep -o '"price_strategy": "[^"]*"' | cut -d'"' -f4)
PILOT_COOKIE_B2=$(echo "$STRIPE_B2" | grep -o '"pilot_cookie": "[^"]*"' | cut -d'"' -f4)

echo ""

# ============================================================================
# Validation
# ============================================================================

echo "==================================================================="
echo "RESULTS"
echo "==================================================================="
echo ""
echo "A1 (Pilot/Comp): \$$((AMOUNT_A1 / 100)) | strategy=$STRATEGY_A1 | cookie=$PILOT_COOKIE_A1"
echo "A2 (Pilot/Enh):  \$$((AMOUNT_A2 / 100)) | strategy=$STRATEGY_A2 | cookie=$PILOT_COOKIE_A2"
echo "B1 (Direct/Comp): \$$((AMOUNT_B1 / 100)) | strategy=$STRATEGY_B1 | cookie=$PILOT_COOKIE_B1"
echo "B2 (Direct/Enh):  \$$((AMOUNT_B2 / 100)) | strategy=$STRATEGY_B2 | cookie=$PILOT_COOKIE_B2"
echo ""

FAILED=0

[ "$AMOUNT_A1" = "500" ] && [ "$STRATEGY_A1" = "pilot" ] && [ "$PILOT_COOKIE_A1" = "1" ] || { echo "❌ A1 failed"; FAILED=1; }
[ "$AMOUNT_A2" = "500" ] && [ "$STRATEGY_A2" = "pilot" ] && [ "$PILOT_COOKIE_A2" = "1" ] || { echo "❌ A2 failed"; FAILED=1; }
[ "$AMOUNT_B1" = "2000" ] && [ "$STRATEGY_B1" = "standard" ] && [ "$PILOT_COOKIE_B1" = "0" ] || { echo "❌ B1 failed"; FAILED=1; }
[ "$AMOUNT_B2" = "2000" ] && [ "$STRATEGY_B2" = "standard" ] && [ "$PILOT_COOKIE_B2" = "0" ] || { echo "❌ B2 failed"; FAILED=1; }

if [ $FAILED -eq 1 ]; then
    echo "❌ SMOKE TEST FAILED"
    exit 1
else
    echo "✅ SMOKE TEST PASSED"
    echo ""
    echo "Session IDs:"
    echo "  A1: $SESSION_ID_A1"
    echo "  A2: $SESSION_ID_A2"
    echo "  B1: $SESSION_ID_B1"
    echo "  B2: $SESSION_ID_B2"
    exit 0
fi
