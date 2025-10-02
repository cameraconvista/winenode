# 02 - SISTEMA BACKUP WINENODE

**Sintesi Executive**: Sistema backup automatico enterprise-grade con compressione tar.gz, rotazione intelligente max 3 copie, esclusioni ottimizzate e procedure sicure di ripristino con verifica integrità.

## 🔄 OVERVIEW SISTEMA

**Script Principale**: `/scripts/backup-system.js` (425 righe, 11KB)
**Directory Target**: `/Backup_Automatico/`
**Formato Naming**: `backup_ddMMyyyy_HHmm.tar.gz`
**Rotazione**: Automatica, max 3 copie (elimina i più vecchi)
**Compressione**: tar.gz per ottimizzazione spazio

## 📋 COMANDI NPM DISPONIBILI

| Comando | Funzione | Descrizione |
|---------|----------|-------------|
| `npm run backup` | `create` | Crea nuovo backup completo |
| `npm run backup:list` | `list` | Lista backup esistenti con dettagli |
| `npm run backup:restore` | `restore` | Avvia procedura ripristino guidata |
| `npm run restore-confirm` | `restore-confirm` | Conferma ripristino dopo anteprima |

## 🚫 ESCLUSIONI AUTOMATICHE

```javascript
const EXCLUDED_PATTERNS = [
    'node_modules',      // Dependencies (ricostruibili)
    '.git',              // Repository Git
    'dist',              // Build artifacts
    '.DS_Store',         // macOS metadata
    '*.log',             // File di log
    '.env',              // Credenziali sensibili
    '.env.*',            // Varianti environment
    'Backup_Automatico', // Evita backup ricorsivi
    'attached_assets',   // Asset temporanei
    '*.tmp', '*.temp',   // File temporanei
    '.cache',            // Cache directories
    '.vscode', '.idea'   // IDE configurations
];
```

## 🔒 PROCEDURA BACKUP SICURA

### 1. Creazione Backup
```bash
npm run backup
```

**Processo**:
1. Verifica directory `/Backup_Automatico/`
2. Genera timestamp italiano (ddMMyyyy_HHmm)
3. Crea archivio tar.gz con esclusioni
4. Applica rotazione (mantiene max 3)
5. Logging operazioni con timestamp

### 2. Rotazione Automatica
- **Trigger**: Ad ogni nuovo backup
- **Policy**: Mantiene solo i 3 backup più recenti
- **Ordinamento**: Per timestamp nel filename
- **Sicurezza**: Verifica esistenza prima eliminazione

### 3. Verifica Integrità
```bash
npm run backup:list
```

**Output Esempio**:
```
📦 BACKUP DISPONIBILI (3/3):
1. backup_28092025_0406.tar.gz (512 KB) - 28/09/2025 04:06
2. backup_27092025_1530.tar.gz (498 KB) - 27/09/2025 15:30  
3. backup_26092025_0900.tar.gz (501 KB) - 26/09/2025 09:00
```

## 🔄 PROCEDURA RIPRISTINO

### Fase 1: Anteprima Sicura
```bash
npm run backup:restore
```

**Processo**:
1. Lista backup disponibili
2. Selezione backup da ripristinare
3. **ANTEPRIMA OBBLIGATORIA**: Mostra contenuto archivio
4. Richiede conferma esplicita
5. Genera comando `restore-confirm` con token

### Fase 2: Conferma Ripristino
```bash
npm run restore-confirm
```

**Sicurezza**:
- Backup corrente prima del ripristino
- Estrazione controllata con sovrascrittura
- Verifica post-ripristino
- Log completo operazioni

## 📊 CARATTERISTICHE TECNICHE

### Performance
- **Compressione**: ~50-70% riduzione dimensioni
- **Velocità**: ~2-5 secondi per backup completo
- **Dimensione media**: 500KB per progetto WineNode
- **Esclusioni**: ~95% riduzione file processati

### Logging
```javascript
// Formato timestamp italiano
function getItalianTimestamp() {
    const now = new Date();
    return now.toLocaleString('it-IT', {
        timeZone: 'Europe/Rome',
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}
```

### Sicurezza
- **Esclusione credenziali**: `.env*` automaticamente esclusi
- **Backup pre-ripristino**: Protezione da perdite accidentali
- **Anteprima obbligatoria**: Prevenzione errori umani
- **Verifica integrità**: Controllo archivi corrotti

## 🔄 DIFFERENZE CON RECOVERY SYSTEM

| Aspetto | Backup System | Recovery System |
|---------|---------------|-----------------|
| **Scopo** | Backup completi progetto | Snapshots incrementali |
| **Frequenza** | Manuale/pre-operazioni | Automatico/continuo |
| **Formato** | tar.gz compresso | Directory snapshots |
| **Rotazione** | 3 backup fissi | Policy configurabile |
| **Ripristino** | Procedura guidata | Rollback automatico |

## 🎯 BEST PRACTICES

### Quando Eseguire Backup
- **Prima modifiche critiche**: Refactoring, migrazioni DB
- **Pre-deploy**: Rilasci in produzione
- **Milestone**: Completamento fasi sviluppo
- **Manutenzione**: Update dependencies maggiori

### Monitoraggio Spazio
```bash
# Verifica dimensioni backup
du -sh Backup_Automatico/
```

### Recovery Rapido
```bash
# Backup + lista in un comando
npm run backup && npm run backup:list
```

---

**Riferimenti**: 
- Script: `/scripts/backup-system.js`
- Recovery: `/scripts/recovery-system.cjs`
- CI Bundle Guard: `/scripts/bundle-guard.js`
