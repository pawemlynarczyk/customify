#!/bin/bash
# Szybkie sprawdzenie maili

echo "📧 Sprawdzam maile z Resend..."
echo ""

# Sprawdź przez Vercel logs - szukaj Resend ID
echo "=== MAILE Z 27.11.2025 ==="
vercel logs customify-s56o.vercel.app --since 7d 2>&1 | grep "2025-11-27" | grep -E "Resend ID|Email wysłany pomyślnie" | wc -l

echo ""
echo "=== MAILE Z DZISIAJ ==="
vercel logs customify-s56o.vercel.app --since 24h 2>&1 | grep -E "Resend ID|Email wysłany pomyślnie" | wc -l

echo ""
echo "=== OSTATNIE 5 MAILI Z 27.11 ==="
vercel logs customify-s56o.vercel.app --since 7d 2>&1 | grep "2025-11-27" | grep "Resend ID" | tail -5



