#!/bin/bash
# USUN-AUTOMAT.sh
# Usuwa automatyczne uruchomienie wysyłki (uruchom po wysyłce)

echo "🗑️  Usuwanie automatycznego uruchomienia wysyłki..."
echo ""

# Odładuj zadanie
launchctl unload ~/Library/LaunchAgents/com.customify.mailing.plist 2>/dev/null
echo "✅ Zadanie odładowane"

# Usuń plik
rm ~/Library/LaunchAgents/com.customify.mailing.plist 2>/dev/null
echo "✅ Plik usunięty"

echo ""
echo "✅ Automat został usunięty!"
