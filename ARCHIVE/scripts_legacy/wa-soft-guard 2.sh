#!/usr/bin/env sh
set -eu

# Cerca pattern WhatsApp nel repo (esclude node_modules, dist, .git, coverage, .recovery)
MATCHES=$(git ls-files | grep -Ev '^(node_modules|dist|coverage|\.recovery)/' | xargs grep -Eni \
  -e 'https://wa\.me/' \
  -e 'api\.whatsapp\.com/send' \
  -e 'whatsapp://send' \
  -e 'intent://send\?text' \
  -e 'whatsapp(Link|Url|Button|ShareButton)' \
  2>/dev/null || true)

if [ -n "$MATCHES" ]; then
  echo "⚠️  WhatsApp patterns trovati:"
  echo "$MATCHES"
  echo ""
  echo "ℹ️  Guardia SOFT: non blocca la CI."
  echo "    - Verifica che la reintroduzione sia intenzionale e allineata a:"
  echo "      • DOCS/PLAYBOOK_RIPRISTINO_WHATSAPP.md"
  echo "      • Feature flag VITE_FEATURE_WHATSAPP"
  echo "    - Se vuoi far fallire la CI quando rileva WhatsApp, setta: REQUIRE_WA_GUARD=fail"
  if [ "${REQUIRE_WA_GUARD:-}" = "fail" ]; then
    echo "❌ REQUIRE_WA_GUARD=fail → blocco CI."
    exit 1
  fi
else
  echo "✅ Nessun pattern WhatsApp rilevato (soft guard)."
fi
