#!/bin/bash

# ============================================
# BACKUP AUTOMATICO - WINENODE
# Crea backup completo del progetto
# ============================================

set -e  # Exit on any error

PROJECT_DIR="/Users/dero/Documents/winenode_main"
BACKUP_DIR="/Users/dero/Documents/winenode_backups"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_NAME="winenode_backup_$TIMESTAMP"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}💾 WINENODE - BACKUP AUTOMATICO AVVIATO${NC}"
echo "=================================================="

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📂 Directory progetto: $PROJECT_DIR${NC}"
echo -e "${YELLOW}💾 Directory backup: $BACKUP_DIR${NC}"
echo -e "${YELLOW}📦 Nome backup: $BACKUP_NAME${NC}"

# Navigate to project directory
cd "$PROJECT_DIR" || {
    echo -e "${RED}❌ Errore: Directory progetto non trovata${NC}"
    exit 1
}

# Get current git status
echo -e "${BLUE}🔍 Verifica stato Git...${NC}"
GIT_STATUS=$(git status --porcelain | wc -l)
CURRENT_BRANCH=$(git branch --show-current)
LAST_COMMIT=$(git log -1 --format="%h - %s" 2>/dev/null || echo "Nessun commit")

echo -e "${GREEN}   Branch: $CURRENT_BRANCH${NC}"
echo -e "${GREEN}   Ultimo commit: $LAST_COMMIT${NC}"
echo -e "${GREEN}   File modificati: $GIT_STATUS${NC}"

# Create backup archive
echo -e "${BLUE}📦 Creazione backup...${NC}"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME.tar.gz"

# Exclude node_modules, .git, and other unnecessary files
tar -czf "$BACKUP_PATH" \
    --exclude="node_modules" \
    --exclude=".git" \
    --exclude="*.log" \
    --exclude="dist" \
    --exclude="build" \
    --exclude=".DS_Store" \
    --exclude="*.tmp" \
    -C "$(dirname "$PROJECT_DIR")" \
    "$(basename "$PROJECT_DIR")" || {
    echo -e "${RED}❌ Errore durante creazione backup${NC}"
    exit 1
}

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)

echo -e "${GREEN}✅ Backup creato con successo!${NC}"
echo -e "${GREEN}   File: $BACKUP_PATH${NC}"
echo -e "${GREEN}   Dimensione: $BACKUP_SIZE${NC}"

# Create backup info file
INFO_FILE="$BACKUP_DIR/$BACKUP_NAME.info"
cat > "$INFO_FILE" << EOF
WINENODE BACKUP INFO
===================
Data: $(date '+%Y-%m-%d %H:%M:%S')
Progetto: WineNode v1.0.0
Directory: $PROJECT_DIR
Branch Git: $CURRENT_BRANCH
Ultimo commit: $LAST_COMMIT
File modificati: $GIT_STATUS
Dimensione backup: $BACKUP_SIZE
Hash MD5: $(md5 -q "$BACKUP_PATH" 2>/dev/null || echo "N/A")

CONTENUTO BACKUP:
- Codice sorgente completo
- Configurazioni progetto
- Documentazione
- Scripts e assets
- File di configurazione

ESCLUSI:
- node_modules
- .git directory
- File temporanei
- Build artifacts
EOF

echo -e "${GREEN}📄 File info creato: $INFO_FILE${NC}"

# Cleanup old backups (keep last 10)
echo -e "${BLUE}🧹 Pulizia backup vecchi...${NC}"
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/winenode_backup_*.tar.gz 2>/dev/null | wc -l)

if [ "$BACKUP_COUNT" -gt 10 ]; then
    echo -e "${YELLOW}   Trovati $BACKUP_COUNT backup, mantengo i 10 più recenti${NC}"
    ls -1t "$BACKUP_DIR"/winenode_backup_*.tar.gz | tail -n +11 | xargs -r rm -f
    ls -1t "$BACKUP_DIR"/winenode_backup_*.info | tail -n +11 | xargs -r rm -f
    echo -e "${GREEN}   ✅ Backup vecchi rimossi${NC}"
else
    echo -e "${GREEN}   ✅ $BACKUP_COUNT backup totali (sotto il limite)${NC}"
fi

# List recent backups
echo -e "${BLUE}📋 Backup recenti:${NC}"
ls -lt "$BACKUP_DIR"/winenode_backup_*.tar.gz 2>/dev/null | head -5 | while read -r line; do
    echo -e "${YELLOW}   $line${NC}"
done

echo "=================================================="
echo -e "${GREEN}🎉 BACKUP COMPLETATO CON SUCCESSO!${NC}"
echo -e "${BLUE}📊 Riepilogo:${NC}"
echo -e "   • File: $BACKUP_NAME.tar.gz"
echo -e "   • Dimensione: $BACKUP_SIZE"
echo -e "   • Percorso: $BACKUP_DIR"
echo -e "   • Branch: $CURRENT_BRANCH"
echo -e "   • Status: Backup sicuro creato"

exit 0
