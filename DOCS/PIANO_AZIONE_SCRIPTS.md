# PIANO AZIONE SNELLIMENTO - CARTELLA `scripts/`

**Data Piano:** 27 settembre 2025 - 14:27  
**Cartella Target:** `/scripts/`  
**Risparmio Totale Stimato:** 19.1 KB (-13.8%)

---

## 🎯 AZIONI PROPOSTE

### **AZ-001** | Eliminazione Script Orfano `chat-commands.js`
- **Tipo:** REMOVE
- **File:** `/scripts/chat-commands.js` (4.508 bytes)
- **Motivazione:** 0 occorrenze nel codice attivo, nessun comando npm, nessuna chiamata
- **Rischio:** **BASSO** - Nessun riferimento funzionale verificato
- **Risparmio:** 4.5 KB
- **Rollback:** Ripristino da backup pre-operazione
- **Beneficio:** Riduzione confusione, meno file da mantenere

### **AZ-002** | Eliminazione Script Orfano `populate-db.ts`
- **Tipo:** REMOVE
- **File:** `/scripts/populate-db.ts` (3.018 bytes)
- **Motivazione:** 0 occorrenze nel codice attivo, utility non referenziata
- **Rischio:** **BASSO** - Nessun riferimento funzionale verificato
- **Risparmio:** 3.0 KB
- **Rollback:** Ripristino da backup pre-operazione
- **Beneficio:** Cleanup script obsoleti, riduzione manutenzione

### **AZ-003** | Eliminazione Chain Backup Legacy `commit-and-backup.sh`
- **Tipo:** REMOVE
- **File:** `/scripts/commit-and-backup.sh` (1.846 bytes)
- **Motivazione:** 0 occorrenze, sostituito da auto-commit.js + backup-system.js
- **Rischio:** **BASSO** - Script wrapper non utilizzato
- **Risparmio:** 1.8 KB
- **Rollback:** Ripristino da backup pre-operazione
- **Beneficio:** Semplificazione architettura, rimozione ridondanza

### **AZ-004** | Eliminazione Dipendenza Legacy `backup-auto.sh`
- **Tipo:** REMOVE
- **File:** `/scripts/backup-auto.sh` (4.116 bytes)
- **Motivazione:** Dipendenza di commit-and-backup.sh (orfano), sostituito da backup-system.js
- **Rischio:** **BASSO** - Dipendenza di script non utilizzato
- **Risparmio:** 4.1 KB
- **Rollback:** Ripristino da backup pre-operazione
- **Beneficio:** Unificazione sistema backup su backup-system.js

### **AZ-005** | Eliminazione Dipendenza Legacy `git-commit-safe.sh`
- **Tipo:** REMOVE
- **File:** `/scripts/git-commit-safe.sh` (4.575 bytes)
- **Motivazione:** Dipendenza di commit-and-backup.sh (orfano), sostituito da auto-commit.js
- **Rischio:** **BASSO** - Dipendenza di script non utilizzato
- **Risparmio:** 4.6 KB
- **Rollback:** Ripristino da backup pre-operazione
- **Beneficio:** Unificazione sistema commit su auto-commit.js

### **AZ-006** | Ottimizzazione Performance `project-diagnose.js`
- **Tipo:** REFINE
- **File:** `/scripts/project-diagnose.js` (13.885 bytes)
- **Motivazione:** Script lento, possibile ottimizzazione cache e parallelizzazione
- **Rischio:** **MEDIO** - Modifica logica esistente
- **Risparmio:** Tempo esecuzione (-30-50% stimato)
- **Rollback:** Backup versione originale
- **Beneficio:** Performance migliorate per diagnosi progetto

### **AZ-007** | Condivisione Utility `project-info.js` + `project-diagnose.js`
- **Tipo:** REFINE
- **File:** `/scripts/project-info.js`, `/scripts/project-diagnose.js`
- **Motivazione:** Codice duplicato per analisi file, possibile condivisione
- **Rischio:** **MEDIO** - Refactoring cross-script
- **Risparmio:** ~1-2 KB codice duplicato + manutenibilità
- **Rollback:** Backup versioni originali
- **Beneficio:** DRY principle, manutenzione semplificata

### **AZ-008** | Cache Ottimizzazione `file-size-check.js`
- **Tipo:** REFINE
- **File:** `/scripts/file-size-check.js`
- **Motivazione:** Chiamato da recovery-system e pre-commit, possibile cache risultati
- **Rischio:** **BASSO** - Aggiunta cache semplice
- **Risparmio:** Tempo esecuzione pre-commit (-20-30% stimato)
- **Rollback:** Rimozione cache, ripristino logica originale
- **Beneficio:** Pre-commit più veloce, migliore dev experience

---

## 📋 MATRICE ESECUZIONE

### Priorità ALTA (Esecuzione Immediata Raccomandata)
- **AZ-001** ✅ Eliminazione `chat-commands.js`
- **AZ-002** ✅ Eliminazione `populate-db.ts`
- **AZ-003** ✅ Eliminazione `commit-and-backup.sh`
- **AZ-004** ✅ Eliminazione `backup-auto.sh`
- **AZ-005** ✅ Eliminazione `git-commit-safe.sh`

### Priorità MEDIA (Esecuzione Opzionale)
- **AZ-006** ⚠️ Ottimizzazione `project-diagnose.js`
- **AZ-008** ⚠️ Cache `file-size-check.js`

### Priorità BASSA (Valutazione Futura)
- **AZ-007** ⏸️ Refactoring utility condivise

---

## 🛡️ PROTOCOLLO SICUREZZA

### Pre-Esecuzione
1. **Backup Automatico:** `backup_YYYYMMDD_HHMM.tar.gz` in `Backup_Automatico/`
2. **Verifica Git:** Status pulito, nessuna modifica pending
3. **Test NPM:** Verifica tutti i comandi npm funzionanti

### Durante Esecuzione
1. **Eliminazioni:** `rm` definitivo (no archiviazione)
2. **Ottimizzazioni:** Backup versione originale prima modifica
3. **Log Dettagliato:** Ogni azione in `DOCS/LOG_SCRIPTS.txt`

### Post-Esecuzione
1. **Test NPM:** Verifica tutti i comandi npm ancora funzionanti
2. **Test Build:** `npm run build` successful
3. **Test Quality:** `npm run lint` e `npm run typecheck` successful
4. **Commit Atomico:** Messaggio descrittivo con ID azioni

---

## 📊 IMPATTO PREVISTO PER ID

| ID | Azione | File | Risparmio | Rischio | Test Richiesti |
|---|---|---|---|---|---|
| AZ-001 | Elimina | chat-commands.js | 4.5 KB | BASSO | NPM scripts |
| AZ-002 | Elimina | populate-db.ts | 3.0 KB | BASSO | NPM scripts |
| AZ-003 | Elimina | commit-and-backup.sh | 1.8 KB | BASSO | NPM scripts |
| AZ-004 | Elimina | backup-auto.sh | 4.1 KB | BASSO | NPM scripts |
| AZ-005 | Elimina | git-commit-safe.sh | 4.6 KB | BASSO | NPM scripts |
| AZ-006 | Ottimizza | project-diagnose.js | ~Tempo | MEDIO | Diagnose test |
| AZ-007 | Refactor | project-info + diagnose | ~1-2 KB | MEDIO | Info + Diagnose |
| AZ-008 | Cache | file-size-check.js | ~Tempo | BASSO | Pre-commit test |

### Totale Risparmio
- **Solo Eliminazioni (AZ-001→005):** 18.0 KB garantiti
- **Con Ottimizzazioni (AZ-006→008):** ~20 KB + performance
- **Beneficio Tempo:** -30-50% diagnose, -20-30% pre-commit

---

## 🔧 COMANDI ESECUZIONE

### Script Interno Generato
```bash
# FASE 2: ESECUZIONE SELETTIVA (solo dopo approvazione)
# Esempio per ID approvati: AZ-001,AZ-002,AZ-003,AZ-004,AZ-005

# Backup automatico
npm run backup

# Eliminazioni (ID approvati)
rm "/Users/liam/Documents/winenode_main/scripts/chat-commands.js"        # AZ-001
rm "/Users/liam/Documents/winenode_main/scripts/populate-db.ts"          # AZ-002
rm "/Users/liam/Documents/winenode_main/scripts/commit-and-backup.sh"    # AZ-003
rm "/Users/liam/Documents/winenode_main/scripts/backup-auto.sh"          # AZ-004
rm "/Users/liam/Documents/winenode_main/scripts/git-commit-safe.sh"      # AZ-005

# Test NPM scripts
npm run diagnose
npm run project-info
npm run backup:list
npm run config-check

# Test build
npm run build
npm run lint
npm run typecheck

# Commit
git add -A
git commit -m "chore(scripts): snellimento chirurgico, rimozione script orfani e chain legacy (AZ-001→005) - 18KB risparmiati"
```

### Ottimizzazioni (se approvate)
```bash
# Ottimizzazioni performance (esempio AZ-006,008)
# Backup versioni originali
cp scripts/project-diagnose.js scripts/project-diagnose.js.backup
cp scripts/file-size-check.js scripts/file-size-check.js.backup

# Applicare ottimizzazioni
# [Implementazione specifica per ogni script]

# Test funzionalità
npm run diagnose
npm run file-size-check
npm run pre-commit
```

---

## ✅ CHECKLIST APPROVAZIONE

### Prima dell'Esecuzione
- [ ] Backup automatico completato
- [ ] NPM scripts test successful
- [ ] Git status pulito
- [ ] ID azioni selezionati e approvati

### Durante l'Esecuzione  
- [ ] Log dettagliato attivo
- [ ] Ogni azione tracciata con timestamp
- [ ] Errori gestiti e loggati

### Dopo l'Esecuzione
- [ ] NPM scripts test successful
- [ ] Build test completato
- [ ] Lint + typecheck successful
- [ ] Commit atomico eseguito
- [ ] Log finale generato

---

## 🚨 ROLLBACK PROCEDURE

### In Caso di Problemi
1. **Stop immediato** esecuzione azioni rimanenti
2. **Ripristino da backup:** `npm run backup:restore`
3. **Verifica NPM scripts** funzionanti
4. **Report problema** in `DOCS/LOG_SCRIPTS.txt`

### File Rollback Specifici
- **AZ-001:** Ripristina `chat-commands.js` da backup
- **AZ-002:** Ripristina `populate-db.ts` da backup
- **AZ-003:** Ripristina `commit-and-backup.sh` da backup
- **AZ-004:** Ripristina `backup-auto.sh` da backup
- **AZ-005:** Ripristina `git-commit-safe.sh` da backup
- **AZ-006,007,008:** Ripristina versioni .backup

---

## 📈 BENEFICI ATTESI

### Immediati (Post AZ-001→005)
- **Riduzione complessità:** -5 script da mantenere
- **Cleanup architettura:** Rimozione chain legacy
- **Riduzione confusione:** Meno file nella cartella scripts/
- **Spazio disco:** -18 KB

### A Medio Termine (Post AZ-006→008)
- **Performance:** Diagnosi e pre-commit più veloci
- **Manutenibilità:** Codice condiviso, meno duplicazione
- **Dev Experience:** Workflow più fluidi

### A Lungo Termine
- **Onboarding:** Meno script da comprendere per nuovi sviluppatori
- **Stabilità:** Meno punti di fallimento potenziali
- **Evoluzione:** Architettura più pulita per future estensioni

---

## 🎯 AZIONI ESEGUITE (FASE 2)

### ESECUZIONE COMPLETATA - 27/09/2025 14:34

**ID APPROVATI ED ESEGUITI:**
- ✅ **AZ-001** | Eliminato `chat-commands.js` (4.5KB risparmiati)
- ✅ **AZ-002** | Eliminato `populate-db.ts` (3.0KB risparmiati)  
- ✅ **AZ-003** | Eliminato `commit-and-backup.sh` (1.8KB risparmiati)
- ✅ **AZ-004** | Eliminato `backup-auto.sh` (4.1KB risparmiati)
- ✅ **AZ-005** | Eliminato `git-commit-safe.sh` (4.6KB risparmiati)

**RISULTATI:**
- **Risparmio totale:** 18.0KB (-13.1% cartella scripts/)
- **Script rimanenti:** 12/17 (tutti funzionanti)
- **Build test:** ✅ SUCCESSO (4.30s, 0 errori)
- **Test workflow:** ✅ Tutti i comandi npm verificati
- **Verifiche sicurezza:** ✅ Nessun riferimento rotto
- **Backup pre-operazione:** `backup_27092025_143422.tar.gz` (658.8KB)

**IMPATTO FUNZIONALE:** Zero impatto negativo, tutti gli script attivi preservati

**LOG DETTAGLIATO:** Vedi `DOCS/LOG_SCRIPTS.txt`

---

**Piano Azione generato automaticamente - ESECUZIONE COMPLETATA**  
**Stato:** FASE 2 completata con successo per ID AZ-001→005
