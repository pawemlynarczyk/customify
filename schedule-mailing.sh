#!/bin/bash
# schedule-mailing.sh
# Automatyczne uruchomienie wysyłki maili o 18:00

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Uruchamianie masowej wysyłki maili walentynkowych..."
echo "📅 Data: $(date)"
echo "⏰ Godzina: $(date +%H:%M)"
echo ""

node send-bulk-walentynki.js

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Wysyłka zakończona pomyślnie!"
else
    echo ""
    echo "❌ Wysyłka zakończona z błędami (kod: $EXIT_CODE)"
fi

exit $EXIT_CODE
