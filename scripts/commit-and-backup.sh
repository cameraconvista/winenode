#!/bin/bash

# ============================================
# COMMIT E BACKUP AUTOMATICO - WINENODE
# Esegue commit sicuro + backup automatico
# ============================================

set -e  # Exit on any error

COMMIT_MESSAGE="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🚀 WINENODE - COMMIT E BACKUP AUTOMATICO${NC}"
echo "=================================================="

# Check if commit message is provided
if [ -z "$COMMIT_MESSAGE" ]; then
    echo -e "${RED}❌ Errore: Messaggio commit richiesto${NC}"
    echo "Uso: ./commit-and-backup.sh \"Messaggio commit\""
    exit 1
fi

# Step 1: Execute safe commit
echo -e "${BLUE}📝 FASE 1: COMMIT SICURO${NC}"
echo "--------------------------------------------------"

if "$SCRIPT_DIR/git-commit-safe.sh" "$COMMIT_MESSAGE"; then
    echo -e "${GREEN}✅ Commit completato con successo${NC}"
else
    echo -e "${RED}❌ Commit fallito - interrompo processo${NC}"
    exit 1
fi

echo ""

# Step 2: Execute automatic backup
echo -e "${BLUE}💾 FASE 2: BACKUP AUTOMATICO${NC}"
echo "--------------------------------------------------"

if "$SCRIPT_DIR/backup-auto.sh"; then
    echo -e "${GREEN}✅ Backup completato con successo${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Backup fallito ma commit riuscito${NC}"
    echo -e "${YELLOW}   Il codice è stato salvato su GitHub${NC}"
fi

echo ""
echo "=================================================="
echo -e "${PURPLE}🎉 PROCESSO COMPLETATO!${NC}"
echo -e "${GREEN}✅ Commit: Eseguito e pushato su GitHub${NC}"
echo -e "${GREEN}✅ Backup: Creato localmente${NC}"
echo -e "${BLUE}📊 Il tuo progetto WineNode è al sicuro! 🍷${NC}"

exit 0
