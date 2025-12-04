#!/bin/bash
# run-sentry-check.sh - Uruchom sprawdzanie błędów Sentry
# Automatycznie ładuje zmienne z .env.local jeśli istnieje

cd "$(dirname "$0")"

# Załaduj zmienne z .env.local jeśli istnieje
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Sprawdź czy zmienne są ustawione
if [ -z "$SENTRY_AUTH_TOKEN" ] || [ -z "$SENTRY_ORG" ]; then
  echo "❌ Błąd: Ustaw SENTRY_AUTH_TOKEN i SENTRY_ORG"
  echo "Możesz je dodać do .env.local lub eksportować przed uruchomieniem"
  echo ""
  echo "Przykład:"
  echo "  echo 'SENTRY_AUTH_TOKEN=token' >> .env.local"
  echo "  echo 'SENTRY_ORG=org-slug' >> .env.local"
  exit 1
fi

# Uruchom sprawdzanie
node check-sentry-errors.js
