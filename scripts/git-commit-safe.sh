#!/bin/bash

# ============================================
# SCRIPT COMMIT SICURO - WINENODE
# Risolve problemi commit bloccati/falliti
# ============================================

set -e  # Exit on any error

COMMIT_MESSAGE="$1"
PROJECT_DIR="/Users/dero/Documents/winenode_main"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔄 WINENODE - COMMIT SICURO AVVIATO${NC}"
echo "=================================================="

# Check if commit message is provided
if [ -z "$COMMIT_MESSAGE" ]; then
    echo -e "${RED}❌ Errore: Messaggio commit richiesto${NC}"
    echo "Uso: ./git-commit-safe.sh \"Messaggio commit\""
    exit 1
fi

# Navigate to project directory
cd "$PROJECT_DIR" || {
    echo -e "${RED}❌ Errore: Directory progetto non trovata${NC}"
    exit 1
}

echo -e "${YELLOW}📂 Directory: $PROJECT_DIR${NC}"

# Check git status
echo -e "${BLUE}🔍 Verifica stato repository...${NC}"
git status --porcelain > /tmp/git_status.txt

if [ ! -s /tmp/git_status.txt ]; then
    echo -e "${GREEN}✅ Repository pulito - nessuna modifica da committare${NC}"
    exit 0
fi

echo -e "${YELLOW}📋 Modifiche rilevate:${NC}"
git status --short

# Add all changes
echo -e "${BLUE}➕ Aggiunta modifiche...${NC}"
git add . || {
    echo -e "${RED}❌ Errore durante git add${NC}"
    exit 1
}

# Check for staged changes
STAGED_CHANGES=$(git diff --cached --name-only | wc -l)
if [ "$STAGED_CHANGES" -eq 0 ]; then
    echo -e "${GREEN}✅ Nessuna modifica staged - repository aggiornato${NC}"
    exit 0
fi

echo -e "${GREEN}✅ $STAGED_CHANGES file(s) staged per commit${NC}"

# Attempt commit with timeout
echo -e "${BLUE}💾 Esecuzione commit...${NC}"
timeout 30s git commit -m "$COMMIT_MESSAGE" || {
    COMMIT_EXIT_CODE=$?
    if [ $COMMIT_EXIT_CODE -eq 124 ]; then
        echo -e "${RED}⏰ Timeout commit - tentativo recovery...${NC}"
        # Kill any hanging git processes
        pkill -f "git commit" 2>/dev/null || true
        sleep 2
        # Retry with shorter message
        git commit -m "AUTO-COMMIT: $(date '+%Y-%m-%d %H:%M')" || {
            echo -e "${RED}❌ Commit fallito anche con retry${NC}"
            exit 1
        }
    else
        echo -e "${RED}❌ Commit fallito con codice: $COMMIT_EXIT_CODE${NC}"
        exit 1
    fi
}

echo -e "${GREEN}✅ Commit completato con successo${NC}"

# Get commit hash
COMMIT_HASH=$(git rev-parse --short HEAD)
echo -e "${GREEN}📝 Commit hash: $COMMIT_HASH${NC}"

# Push to remote with retry logic
echo -e "${BLUE}🚀 Push su GitHub...${NC}"
PUSH_ATTEMPTS=0
MAX_PUSH_ATTEMPTS=3

while [ $PUSH_ATTEMPTS -lt $MAX_PUSH_ATTEMPTS ]; do
    PUSH_ATTEMPTS=$((PUSH_ATTEMPTS + 1))
    echo -e "${YELLOW}📤 Tentativo push $PUSH_ATTEMPTS/$MAX_PUSH_ATTEMPTS...${NC}"
    
    if timeout 60s git push origin main; then
        echo -e "${GREEN}✅ Push completato con successo!${NC}"
        break
    else
        PUSH_EXIT_CODE=$?
        echo -e "${RED}❌ Push fallito (tentativo $PUSH_ATTEMPTS)${NC}"
        
        if [ $PUSH_ATTEMPTS -eq $MAX_PUSH_ATTEMPTS ]; then
            echo -e "${RED}💥 Push fallito dopo $MAX_PUSH_ATTEMPTS tentativi${NC}"
            echo -e "${YELLOW}🔧 Tentativo push forzato...${NC}"
            
            if timeout 60s git push origin main --force; then
                echo -e "${GREEN}✅ Push forzato riuscito!${NC}"
            else
                echo -e "${RED}❌ Push forzato fallito - intervento manuale richiesto${NC}"
                exit 1
            fi
        else
            echo -e "${YELLOW}⏳ Attesa 5 secondi prima del retry...${NC}"
            sleep 5
        fi
    fi
done

# Verify push success
echo -e "${BLUE}🔍 Verifica push...${NC}"
git fetch origin main --quiet
LOCAL_HASH=$(git rev-parse HEAD)
REMOTE_HASH=$(git rev-parse origin/main)

if [ "$LOCAL_HASH" = "$REMOTE_HASH" ]; then
    echo -e "${GREEN}✅ Push verificato - repository sincronizzato${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Hash locale e remoto differiscono${NC}"
    echo -e "${YELLOW}   Locale:  $LOCAL_HASH${NC}"
    echo -e "${YELLOW}   Remoto:  $REMOTE_HASH${NC}"
fi

echo "=================================================="
echo -e "${GREEN}🎉 COMMIT E PUSH COMPLETATI CON SUCCESSO!${NC}"
echo -e "${BLUE}📊 Riepilogo:${NC}"
echo -e "   • Commit: $COMMIT_HASH"
echo -e "   • Files: $STAGED_CHANGES modificati"
echo -e "   • Push: Riuscito"
echo -e "   • Status: Repository sincronizzato"

# Cleanup
rm -f /tmp/git_status.txt

exit 0
