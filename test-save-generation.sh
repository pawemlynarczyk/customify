#!/bin/bash

# 🧪 SKRYPT TESTOWY: Zapis Generacji AI w Vercel Blob Storage

echo "🧪 TEST: Zapis Generacji AI w Vercel Blob Storage"
echo "=================================================="
echo ""

# Kolory
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# URL endpointu
BASE_URL="https://customify-s56o.vercel.app"

# TEST 1: Sprawdź konfigurację
echo "✅ TEST 1: Sprawdź konfigurację Vercel Blob Storage"
echo "---------------------------------------------------"
response=$(curl -s "${BASE_URL}/api/test-save-generation")
echo "$response" | jq '.'
echo ""

if echo "$response" | jq -e '.tests.blobConfigured == true' > /dev/null; then
    echo -e "${GREEN}✅ Vercel Blob Storage jest skonfigurowany${NC}"
else
    echo -e "${RED}❌ Vercel Blob Storage NIE jest skonfigurowany${NC}"
    echo "   Sprawdź czy customify_READ_WRITE_TOKEN jest w Vercel Dashboard"
    exit 1
fi

echo ""
echo ""

# TEST 2: Test zapisu generacji (ręcznie)
echo "✅ TEST 2: Test zapisu generacji (ręcznie)"
echo "-------------------------------------------"

# Generuj unikalny customerId i email
CUSTOMER_ID="test-$(date +%s)"
EMAIL="test-${CUSTOMER_ID}@example.com"

payload=$(cat <<EOF
{
  "customerId": "${CUSTOMER_ID}",
  "email": "${EMAIL}",
  "imageUrl": "https://example.com/test-image.jpg",
  "style": "pixar",
  "productType": "other"
}
EOF
)

echo "📤 Wysyłam request:"
echo "$payload" | jq '.'
echo ""

response=$(curl -s -X POST "${BASE_URL}/api/save-generation" \
  -H "Content-Type: application/json" \
  -d "$payload")

echo "📥 Otrzymano response:"
echo "$response" | jq '.'
echo ""

if echo "$response" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✅ Generacja została zapisana${NC}"
    GENERATION_ID=$(echo "$response" | jq -r '.generationId')
    BLOB_PATH=$(echo "$response" | jq -r '.blobPath')
    echo "   Generation ID: ${GENERATION_ID}"
    echo "   Blob Path: ${BLOB_PATH}"
else
    echo -e "${RED}❌ Błąd zapisu generacji${NC}"
    echo "$response" | jq '.error'
    exit 1
fi

echo ""
echo ""

# TEST 3: Test zapisu wielu generacji
echo "✅ TEST 3: Test zapisu wielu generacji"
echo "--------------------------------------"

for i in {1..3}; do
    echo "📤 Generacja $i/3..."
    
    payload=$(cat <<EOF
{
  "customerId": "${CUSTOMER_ID}",
  "email": "${EMAIL}",
  "imageUrl": "https://example.com/test-image-${i}.jpg",
  "style": "pixar",
  "productType": "other"
}
EOF
)
    
    response=$(curl -s -X POST "${BASE_URL}/api/save-generation" \
      -H "Content-Type: application/json" \
      -d "$payload")
    
    if echo "$response" | jq -e '.success == true' > /dev/null; then
        TOTAL=$(echo "$response" | jq -r '.totalGenerations')
        echo -e "   ${GREEN}✅ Generacja $i zapisana (total: $TOTAL)${NC}"
    else
        echo -e "   ${RED}❌ Błąd zapisu generacji $i${NC}"
    fi
    
    sleep 1
done

echo ""
echo ""

# TEST 4: Test zapisu dla niezalogowanych (email)
echo "✅ TEST 4: Test zapisu dla niezalogowanych (email)"
echo "--------------------------------------------------"

EMAIL_ONLY="test-email-$(date +%s)@example.com"

payload=$(cat <<EOF
{
  "email": "${EMAIL_ONLY}",
  "imageUrl": "https://example.com/test-image-email.jpg",
  "style": "boho",
  "productType": "other"
}
EOF
)

echo "📤 Wysyłam request (tylko email):"
echo "$payload" | jq '.'
echo ""

response=$(curl -s -X POST "${BASE_URL}/api/save-generation" \
  -H "Content-Type: application/json" \
  -d "$payload")

echo "📥 Otrzymano response:"
echo "$response" | jq '.'
echo ""

if echo "$response" | jq -e '.success == true' > /dev/null; then
    echo -e "${GREEN}✅ Generacja została zapisana (email tylko)${NC}"
    BLOB_PATH=$(echo "$response" | jq -r '.blobPath')
    echo "   Blob Path: ${BLOB_PATH}"
else
    echo -e "${RED}❌ Błąd zapisu generacji (email tylko)${NC}"
    echo "$response" | jq '.error'
fi

echo ""
echo ""

# PODSUMOWANIE
echo "=================================================="
echo "🎉 TEST ZAKOŃCZONY"
echo "=================================================="
echo ""
echo "📊 Sprawdź wyniki w Vercel Dashboard:"
echo "   1. Storage → Blob → customify/generations/"
echo "   2. Functions → save-generation → Logs"
echo "   3. Functions → transform → Logs"
echo ""
echo "✅ Testowane:"
echo "   - Konfiguracja Vercel Blob Storage"
echo "   - Zapis generacji (customerId)"
echo "   - Zapis wielu generacji"
echo "   - Zapis generacji (email tylko)"
echo ""

