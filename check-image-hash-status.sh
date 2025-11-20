#!/bin/bash

echo "🔍 Sprawdzam status IMAGE HASH LIMIT..."
echo ""

# Sprawdź najnowsze logi
echo "📋 Ostatnie logi z IMAGE-HASH:"
vercel logs customify-s56o.vercel.app 2>/dev/null | grep "IMAGE-HASH" | tail -5

echo ""
echo "---"
echo ""

# Sprawdź czy feature jest włączona
if vercel logs customify-s56o.vercel.app 2>/dev/null | grep -q "Feature enabled"; then
    echo "✅ Feature WŁĄCZONA (ENABLE_IMAGE_HASH_LIMIT=true)"
elif vercel logs customify-s56o.vercel.app 2>/dev/null | grep -q "Feature disabled"; then
    echo "⚪ Feature WYŁĄCZONA (ENABLE_IMAGE_HASH_LIMIT=false/undefined)"
else
    echo "❓ Brak logów IMAGE-HASH - sprawdź czy był request do /api/transform"
fi

echo ""
echo "---"
echo ""
echo "💡 Aby zobaczyć live logi:"
echo "   vercel logs customify-s56o.vercel.app --follow | grep IMAGE-HASH"



