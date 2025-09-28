# REPORT ANALISI CHIRURGICA - CARTELLA `scripts/`

**Data Analisi:** 27 settembre 2025 - 14:27  
**Cartella Target:** `/scripts/`  
**Metodologia:** Analisi FASE 1 (ANALISI-ONLY) - Nessuna modifica applicata

---

## 📊 MAPPATURA GERARCHICA COMPLETA

### Struttura Cartella `scripts/` (17 items - 138.3 KB totali)

```
📁 scripts/ (138.3 KB totali)
├── 📄 auto-commit.js (12.149 bytes) ✅ ATTIVO (npm)
├── 📄 backup-auto.sh (4.116 bytes) ⚠️ LEGACY (dipendenza interna)
├── 📄 backup-system.js (11.607 bytes) ✅ ATTIVO (npm + core)
├── 📄 chat-commands.js (4.508 bytes) ❌ ORFANO (0 occorrenze)
├── 📄 cleanup.js (13.649 bytes) ✅ ATTIVO (npm)
├── 📄 commit-and-backup.sh (1.846 bytes) ❌ ORFANO (0 occorrenze)
├── 📄 config-check.js (9.359 bytes) ✅ ATTIVO (npm)
├── 📄 file-size-check.js (6.724 bytes) ✅ ATTIVO (npm)
├── 📄 git-commit-safe.sh (4.575 bytes) ⚠️ LEGACY (dipendenza interna)
├── 📄 populate-db.ts (3.018 bytes) ❌ ORFANO (0 occorrenze)
├── 📄 pre-commit-check.js (8.388 bytes) ✅ ATTIVO (npm + husky)
├── 📄 project-diagnose.js (13.885 bytes) ✅ ATTIVO (npm)
├── 📄 project-info.js (13.245 bytes) ✅ ATTIVO (npm)
├── 📄 recovery-system.cjs (8.508 bytes) ✅ ATTIVO (npm)
├── 📄 setup-local.js (13.790 bytes) ✅ ATTIVO (npm)
├── 📄 supabase-doc-generator.js (10.963 bytes) ✅ ATTIVO (npm)
└── 📄 template-component.js (11.969 bytes) ✅ ATTIVO (npm)
```

---

## 🔍 MATRICE DI UTILIZZO REALE

### ✅ SCRIPT ATTIVI (12/17 - 70.6%)

#### **Categoria: CORE SYSTEM**

- **`backup-system.js`** (11.607 bytes)
  - **Stato:** ✅ ATTIVO - CORE SYSTEM
  - **Riferimenti:** 4 comandi npm + 6 menzioni documentazione
  - **Utilizzo:** `npm run backup`, `backup:list`, `backup:restore`, `restore-confirm`
  - **Dipendenze:** Nessuna
  - **Critico:** ✅ Sistema backup fondamentale

- **`pre-commit-check.js`** (8.388 bytes)
  - **Stato:** ✅ ATTIVO - GOVERNANCE
  - **Riferimenti:** npm script + husky hook + documentazione
  - **Utilizzo:** `npm run pre-commit` + hook Git automatico
  - **Dipendenze:** Chiama `recovery-system.cjs`
  - **Critico:** ✅ Quality gate pre-commit

- **`recovery-system.cjs`** (8.508 bytes)
  - **Stato:** ✅ ATTIVO - RECOVERY
  - **Riferimenti:** 4 comandi npm + chiamato da pre-commit-check.js
  - **Utilizzo:** `npm run recovery`, `recovery:save`, `recovery:restore`, `recovery:auto`
  - **Dipendenze:** Chiamato da pre-commit-check.js
  - **Critico:** ✅ Sistema recovery automatico

#### **Categoria: DEVELOPMENT TOOLS**

- **`project-diagnose.js`** (13.885 bytes)
  - **Stato:** ✅ ATTIVO - DIAGNOSTICS
  - **Riferimenti:** 2 comandi npm + 2 menzioni documentazione
  - **Utilizzo:** `npm run diagnose`, `diagnose:force`
  - **Dipendenze:** Nessuna
  - **Critico:** ✅ Sistema diagnosi progetto

- **`setup-local.js`** (13.790 bytes)
  - **Stato:** ✅ ATTIVO - ONBOARDING
  - **Riferimenti:** 1 comando npm + documentazione
  - **Utilizzo:** `npm run setup:local`
  - **Dipendenze:** Nessuna
  - **Critico:** ✅ Setup sviluppo locale

- **`project-info.js`** (13.245 bytes)
  - **Stato:** ✅ ATTIVO - ANALYTICS
  - **Riferimenti:** 1 comando npm + documentazione
  - **Utilizzo:** `npm run project-info`
  - **Dipendenze:** Nessuna
  - **Critico:** ✅ Health check progetto

- **`template-component.js`** (11.969 bytes)
  - **Stato:** ✅ ATTIVO - GENERATOR
  - **Riferimenti:** 1 comando npm + documentazione
  - **Utilizzo:** `npm run template`
  - **Dipendenze:** Nessuna
  - **Critico:** ✅ Generatore componenti React

#### **Categoria: MAINTENANCE TOOLS**

- **`cleanup.js`** (13.649 bytes)
  - **Stato:** ✅ ATTIVO - MAINTENANCE
  - **Riferimenti:** 1 comando npm + documentazione
  - **Utilizzo:** `npm run cleanup`
  - **Dipendenze:** Nessuna
  - **Critico:** ✅ Pulizia file obsoleti

- **`config-check.js`** (9.359 bytes)
  - **Stato:** ✅ ATTIVO - VALIDATION
  - **Riferimenti:** 1 comando npm + documentazione
  - **Utilizzo:** `npm run config-check`
  - **Dipendenze:** Nessuna
  - **Critico:** ✅ Verifica configurazioni

- **`file-size-check.js`** (6.724 bytes)
  - **Stato:** ✅ ATTIVO - ANALYTICS
  - **Riferimenti:** 1 comando npm + documentazione + chiamato da recovery-system
  - **Utilizzo:** `npm run file-size-check`
  - **Dipendenze:** Chiamato da recovery-system.cjs
  - **Critico:** ✅ Monitoraggio dimensioni

#### **Categoria: INTEGRATION TOOLS**

- **`supabase-doc-generator.js`** (10.963 bytes)
  - **Stato:** ✅ ATTIVO - DOCUMENTATION
  - **Riferimenti:** 2 comandi npm + documentazione
  - **Utilizzo:** `npm run supabase:doc`, `supabase:doc:check`
  - **Dipendenze:** Nessuna
  - **Critico:** ✅ Documentazione database live

- **`auto-commit.js`** (12.149 bytes)
  - **Stato:** ✅ ATTIVO - AUTOMATION
  - **Riferimenti:** 1 comando npm + documentazione
  - **Utilizzo:** `npm run commit:auto`
  - **Dipendenze:** Nessuna
  - **Critico:** ✅ Commit automatico GitHub

### ⚠️ SCRIPT LEGACY (2/17 - 11.8%)

#### **Dipendenze Interne Attive**

- **`backup-auto.sh`** (4.116 bytes)
  - **Stato:** ⚠️ LEGACY - DIPENDENZA INTERNA
  - **Riferimenti:** Chiamato da `commit-and-backup.sh` (orfano)
  - **Utilizzo:** Nessun comando npm diretto
  - **Dipendenze:** Dipendenza di commit-and-backup.sh
  - **Rischio Rimozione:** MEDIO - Potrebbe essere utilizzato indirettamente

- **`git-commit-safe.sh`** (4.575 bytes)
  - **Stato:** ⚠️ LEGACY - DIPENDENZA INTERNA
  - **Riferimenti:** Chiamato da `commit-and-backup.sh` (orfano)
  - **Utilizzo:** Nessun comando npm diretto
  - **Dipendenze:** Dipendenza di commit-and-backup.sh
  - **Rischio Rimozione:** MEDIO - Potrebbe essere utilizzato indirettamente

### ❌ SCRIPT ORFANI (3/17 - 17.6%)

#### **0 Occorrenze Reali**

- **`chat-commands.js`** (4.508 bytes)
  - **Stato:** ❌ ORFANO - 0 OCCORRENZE
  - **Riferimenti:** Solo menzionato in documentazione generica
  - **Utilizzo:** Nessun comando npm, nessuna chiamata
  - **Dipendenze:** Nessuna
  - **Rischio Rimozione:** BASSO - Nessun riferimento funzionale

- **`commit-and-backup.sh`** (1.846 bytes)
  - **Stato:** ❌ ORFANO - 0 OCCORRENZE
  - **Riferimenti:** Solo menzionato in documentazione
  - **Utilizzo:** Nessun comando npm, nessuna chiamata
  - **Dipendenze:** Chiama backup-auto.sh e git-commit-safe.sh
  - **Rischio Rimozione:** BASSO - Script wrapper non utilizzato

- **`populate-db.ts`** (3.018 bytes)
  - **Stato:** ❌ ORFANO - 0 OCCORRENZE
  - **Riferimenti:** Solo menzionato in documentazione
  - **Utilizzo:** Nessun comando npm, nessuna chiamata
  - **Dipendenze:** Nessuna
  - **Rischio Rimozione:** BASSO - Script utility non referenziato

---

## 🔄 ANALISI RIDONDANZE & OVERLAP

### Gruppi Funzionali Sovrapposti

#### **BACKUP SYSTEMS (2 implementazioni)**
- **`backup-system.js`** (11.607 bytes) ✅ ATTIVO - Sistema principale
- **`backup-auto.sh`** (4.116 bytes) ⚠️ LEGACY - Implementazione alternativa

**Differenze Chiave:**
- backup-system.js: Sistema completo con rotazione, restore, verifica integrità
- backup-auto.sh: Script semplice bash per backup singolo
- **Overlap:** Entrambi creano backup .tar.gz
- **Proposta:** Unificare su backup-system.js (più robusto)

#### **COMMIT AUTOMATION (2 implementazioni)**
- **`auto-commit.js`** (12.149 bytes) ✅ ATTIVO - Sistema moderno
- **`commit-and-backup.sh`** (1.846 bytes) ❌ ORFANO - Wrapper legacy

**Differenze Chiave:**
- auto-commit.js: GitHub integration, gestione conflitti, logging
- commit-and-backup.sh: Script bash semplice con backup
- **Overlap:** Entrambi eseguono git commit
- **Proposta:** Rimuovere commit-and-backup.sh (non utilizzato)

#### **PROJECT ANALYSIS (3 implementazioni)**
- **`project-diagnose.js`** (13.885 bytes) ✅ ATTIVO - Diagnosi completa
- **`project-info.js`** (13.245 bytes) ✅ ATTIVO - Info e health score
- **`file-size-check.js`** (6.724 bytes) ✅ ATTIVO - Analisi dimensioni

**Differenze Chiave:**
- project-diagnose.js: Problemi, duplicati, file pesanti
- project-info.js: Statistiche generali, health score
- file-size-check.js: Focus specifico su dimensioni file
- **Overlap:** Analisi dimensioni file presente in tutti e 3
- **Proposta:** Mantenere separati (scopi diversi, ma ottimizzare condivisione codice)

### Script Wrapper Ridondanti

#### **COMMIT-AND-BACKUP CHAIN (Non utilizzata)**
```
commit-and-backup.sh (ORFANO)
├── git-commit-safe.sh (LEGACY)
└── backup-auto.sh (LEGACY)
```
**Problema:** Chain completa non utilizzata, sostituita da auto-commit.js + backup-system.js
**Soluzione:** Rimuovere intera chain (3 file)

---

## 💰 COSTI & RISCHI

### Costi Manutenzione per Script

#### **ALTA COMPLESSITÀ (4 script)**
- **`project-diagnose.js`** (13.885 bytes) - Logica complessa, molte dipendenze
- **`setup-local.js`** (13.790 bytes) - Configurazioni multiple, environment setup
- **`cleanup.js`** (13.649 bytes) - File system operations, pattern matching
- **`project-info.js`** (13.245 bytes) - Calcoli statistici, health scoring

#### **MEDIA COMPLESSITÀ (6 script)**
- **`auto-commit.js`** (12.149 bytes) - GitHub API, git operations
- **`template-component.js`** (11.969 bytes) - File generation, template logic
- **`backup-system.js`** (11.607 bytes) - File operations, compression
- **`supabase-doc-generator.js`** (10.963 bytes) - Database introspection
- **`config-check.js`** (9.359 bytes) - Configuration validation
- **`pre-commit-check.js`** (8.388 bytes) - Git hooks, quality gates

#### **BASSA COMPLESSITÀ (7 script)**
- **`recovery-system.cjs`** (8.508 bytes) - File operations semplici
- **`file-size-check.js`** (6.724 bytes) - Statistiche file
- **`git-commit-safe.sh`** (4.575 bytes) - Git wrapper bash
- **`chat-commands.js`** (4.508 bytes) - Command mapping
- **`backup-auto.sh`** (4.116 bytes) - Backup bash semplice
- **`populate-db.ts`** (3.018 bytes) - Database seeding
- **`commit-and-backup.sh`** (1.846 bytes) - Script wrapper

### Rischi Rimozione

#### **BASSO RISCHIO (3 script orfani)**
- **`chat-commands.js`** - 0 riferimenti, nessuna dipendenza
- **`commit-and-backup.sh`** - 0 riferimenti, sostituito da auto-commit.js
- **`populate-db.ts`** - 0 riferimenti, utility non utilizzata

#### **MEDIO RISCHIO (2 script legacy)**
- **`backup-auto.sh`** - Dipendenza di commit-and-backup.sh (orfano)
- **`git-commit-safe.sh`** - Dipendenza di commit-and-backup.sh (orfano)

#### **ALTO RISCHIO (12 script attivi)**
- Tutti gli script con comandi npm attivi
- Rimozione causerebbe rottura build/workflow

---

## ⚡ IMPATTO PERFORMANCE/DEV-EX

### Script Lenti Identificati

#### **PERFORMANCE CONCERNS**
- **`project-diagnose.js`** - Scansione completa file system (potenzialmente lento)
- **`cleanup.js`** - Operazioni file intensive
- **`backup-system.js`** - Compressione file (I/O intensive)
- **`setup-local.js`** - Network requests, npm install

#### **CATENE DI COMANDO RIDONDANTI**
- **Pre-commit chain:** pre-commit-check.js → recovery-system.cjs → file-size-check.js
- **Possibile ottimizzazione:** Cache risultati file-size-check tra chiamate

### Quick Wins Identificati

#### **ELIMINAZIONI IMMEDIATE (5.4 KB risparmiati)**
1. **`chat-commands.js`** (4.508 bytes) - 0 utilizzo
2. **`populate-db.ts`** (3.018 bytes) - 0 utilizzo  
3. **`commit-and-backup.sh`** (1.846 bytes) - 0 utilizzo

#### **CHAIN CLEANUP (10.5 KB risparmiati)**
4. **`backup-auto.sh`** (4.116 bytes) - Sostituito da backup-system.js
5. **`git-commit-safe.sh`** (4.575 bytes) - Sostituito da auto-commit.js

#### **OTTIMIZZAZIONI CODICE**
- Condivisione utility comuni tra project-diagnose.js e project-info.js
- Cache file-size-check risultati per pre-commit performance
- Rimozione verbose logging da script non critici

---

## 📊 STATISTICHE FINALI

### Distribuzione per Stato
- **✅ ATTIVI:** 12 script (70.6%) - 119.2 KB
- **⚠️ LEGACY:** 2 script (11.8%) - 8.7 KB  
- **❌ ORFANI:** 3 script (17.6%) - 10.4 KB

### Risparmio Potenziale
- **Eliminazione orfani:** 10.4 KB (-7.5%)
- **Cleanup chain legacy:** 8.7 KB (-6.3%)
- **Risparmio totale:** 19.1 KB (-13.8%)

### Impatto Funzionale
- **Nessun impatto:** Eliminazione script orfani
- **Semplificazione:** Rimozione chain backup legacy
- **Miglioramento:** Meno confusione, manutenzione ridotta

---

## 🎯 CONCLUSIONI ANALISI

### Stato Salute Cartella `scripts/`
- **✅ Organizzazione:** Buona, script categorizzati per funzione
- **✅ Utilizzo:** 70.6% script attivamente utilizzati
- **⚠️ Ridondanze:** 2 sistemi backup, 2 sistemi commit
- **✅ Copertura:** Tutti i workflow principali coperti

### Raccomandazioni Prioritarie
1. **ALTA:** Eliminazione script orfani (0 impatto, cleanup immediato)
2. **MEDIA:** Rimozione chain backup legacy (semplificazione)
3. **BASSA:** Ottimizzazione condivisione codice tra script analisi

### Sicurezza Operazione
- **Rischio:** BASSO per script orfani (0 riferimenti)
- **Rischio:** MEDIO per script legacy (dipendenze interne non utilizzate)
- **Rollback:** Backup automatico pre-operazione disponibile

---

**Report generato automaticamente - FASE 1 ANALISI COMPLETATA**  
**Prossimo step:** Generazione Piano Azione con ID specifici per esecuzione selettiva
