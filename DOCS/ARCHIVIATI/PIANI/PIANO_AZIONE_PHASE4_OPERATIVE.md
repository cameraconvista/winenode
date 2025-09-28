# 🎯 PIANO D'AZIONE FASE 4 OPERATIVE - WINENODE

**Obiettivo:** Completamento configurazione operative per raggiungere maturità enterprise  
**Baseline:** Analisi Fase 3 completata il 28/09/2025  
**Approccio:** Task atomici, rischio controllato, rollback garantito  

---

## 📋 TASK ATOMICI PROPOSTI

### 🔴 CATEGORIA: HUSKY (Priorità CRITICA)

#### **H001 - Configurazione Pre-commit Hook**
- **ID:** H001
- **Categoria:** HUSKY  
- **Rischio:** BASSO
- **Tempo:** S (15-20 min)
- **Dipendenze:** Nessuna
- **Rollback:** `git checkout .husky/pre-commit` + `rm .husky/pre-commit`

**Descrizione:** Collegare script esistente `pre-commit-check.js` a Husky hook
**Azioni:**
1. Creare `.husky/pre-commit` con chiamata a `npm run pre-commit`
2. Testare hook con commit dummy
3. Verificare blocco su file >800 righe e errori ESLint

**Deliverable:** Hook pre-commit attivo con quality gate

---

#### **H002 - Configurazione Pre-push Hook**  
- **ID:** H002
- **Categoria:** HUSKY
- **Rischio:** BASSO  
- **Tempo:** S (10-15 min)
- **Dipendenze:** H001
- **Rollback:** `rm .husky/pre-push`

**Descrizione:** Hook pre-push leggero per verifiche rapide
**Azioni:**
1. Creare `.husky/pre-push` con `npm run typecheck`
2. Evitare build completa (già in CI)
3. Testare con push dummy

**Deliverable:** Hook pre-push con typecheck rapido

---

#### **H003 - Cross-Platform Compatibility**
- **ID:** H003  
- **Categoria:** HUSKY
- **Rischio:** MEDIO
- **Tempo:** M (30-40 min)
- **Dipendenze:** H001, H002
- **Rollback:** Restore backup hooks

**Descrizione:** Garantire compatibilità Windows/macOS/Linux
**Azioni:**
1. Testare shebang `#!/usr/bin/env sh` in hooks
2. Verificare CRLF/LF handling
3. Aggiungere fallback per ambienti CI

**Deliverable:** Hooks funzionanti su tutti gli OS

---

### 🚀 CATEGORIA: WORKFLOWS (Priorità ALTA)

#### **W001 - Setup Node.js e Cache**
- **ID:** W001
- **Categoria:** WORKFLOWS
- **Rischio:** BASSO
- **Tempo:** S (20-25 min)  
- **Dipendenze:** Nessuna
- **Rollback:** `git checkout .github/workflows/ci.yml`

**Descrizione:** Aggiungere setup Node.js standard con cache
**Azioni:**
1. Aggiungere step `actions/setup-node@v4` con cache npm
2. Pin Node.js version (da package.json engines o .nvmrc)
3. Configurare `npm ci` per install deterministico

**Deliverable:** Setup Node.js ottimizzato con cache

---

#### **W002 - Job Lint e TypeCheck**
- **ID:** W002
- **Categoria:** WORKFLOWS  
- **Rischio:** BASSO
- **Tempo:** S (15-20 min)
- **Dipendenze:** W001
- **Rollback:** Rimozione job aggiunti

**Descrizione:** Aggiungere job standard per quality check
**Azioni:**
1. Job `lint`: `npm run lint` con output annotazioni
2. Job `typecheck`: `npm run typecheck` 
3. Parallelizzare con `db-migrations-guard`

**Deliverable:** Quality gates automatici in CI

---

#### **W003 - Job Build e Test**
- **ID:** W003
- **Categoria:** WORKFLOWS
- **Rischio:** MEDIO
- **Tempo:** M (25-35 min)
- **Dipendenze:** W002  
- **Rollback:** Rimozione job build/test

**Descrizione:** Verifica build e test suite
**Azioni:**
1. Job `build`: `npm run build` con cache dist/
2. Job `test`: `npm run test:ci` se presente
3. Upload artifacts build per debug

**Deliverable:** Verifica build completa in CI

---

#### **W004 - Bundle Size Guard (Opzionale)**
- **ID:** W004
- **Categoria:** WORKFLOWS
- **Rischio:** BASSO
- **Tempo:** L (45-60 min)
- **Dipendenze:** W003
- **Rollback:** Rimozione job bundle-guard

**Descrizione:** Monitoraggio dimensioni bundle
**Azioni:**
1. Script analisi bundle size con soglie
2. Commento automatico PR con delta size
3. Configurazione soglie warning/error

**Deliverable:** Controllo automatico dimensioni bundle

---

### 🛡️ CATEGORIA: RECOVERY (Priorità MEDIA)

#### **R001 - Retention Policy Snapshots**
- **ID:** R001
- **Categoria:** RECOVERY
- **Rischio:** BASSO  
- **Tempo:** S (20-25 min)
- **Dipendenze:** Nessuna
- **Rollback:** Restore `recovery-system.cjs` originale

**Descrizione:** Implementare rotazione automatica snapshots
**Azioni:**
1. Aggiungere logica rotazione max 5 snapshots
2. Cleanup automatico snapshots obsoleti >30 giorni
3. Logging operazioni cleanup

**Deliverable:** Recovery system con retention automatica

---

#### **R002 - Recovery README**
- **ID:** R002
- **Categoria:** RECOVERY
- **Rischio:** BASSO
- **Tempo:** S (15-20 min)  
- **Dipendenze:** R001
- **Rollback:** `rm .recovery/README.md`

**Descrizione:** Documentare scopo e utilizzo recovery system
**Azioni:**
1. Creare `.recovery/README.md` con purpose e comandi
2. Esempi utilizzo per rollback rapidi
3. Policy retention e best practices

**Deliverable:** Documentazione recovery system

---

### 📜 CATEGORIA: SCRIPTS (Priorità MEDIA)

#### **S001 - Deprecazione Script Duplicati**
- **ID:** S001
- **Categoria:** SCRIPTS
- **Rischio:** BASSO
- **Tempo:** S (10-15 min)
- **Dipendenze:** Nessuna  
- **Rollback:** `git checkout scripts/backup.js package.json`

**Descrizione:** Rimuovere script legacy duplicati
**Azioni:**
1. Deprecare `backup.js` (sostituito da `backup-system.js`)
2. Rimuovere `npm run backup:full` da package.json
3. Aggiungere commento deprecation in backup.js

**Deliverable:** Scripts ecosystem pulito senza duplicati

---

#### **S002 - Unificazione Naming Convention**
- **ID:** S002  
- **Categoria:** SCRIPTS
- **Rischio:** BASSO
- **Tempo:** S (15-20 min)
- **Dipendenze:** S001
- **Rollback:** Restore package.json originale

**Descrizione:** Standardizzare naming script npm
**Azioni:**
1. Verificare consistency pattern `categoria:azione`
2. Aggiungere descrizioni mancanti in package.json
3. Ordinare script per categoria logica

**Deliverable:** Package.json con naming consistente

---

### ⚙️ CATEGORIA: ROOT (Priorità ALTA)

#### **RT001 - Node.js Version Pinning**
- **ID:** RT001
- **Categoria:** ROOT
- **Rischio:** BASSO
- **Tempo:** S (10-15 min)
- **Dipendenze:** Nessuna
- **Rollback:** `rm .nvmrc`

**Descrizione:** Aggiungere .nvmrc per consistency versione Node.js
**Azioni:**
1. Creare `.nvmrc` con versione corrente Node.js
2. Aggiornare README con istruzioni `nvm use`
3. Aggiornare CI per usare versione da .nvmrc

**Deliverable:** Versione Node.js pinned e documentata

---

#### **RT002 - Editor Configuration**
- **ID:** RT002
- **Categoria:** ROOT  
- **Rischio:** BASSO
- **Tempo:** S (15-20 min)
- **Dipendenze:** Nessuna
- **Rollback:** `rm .editorconfig`

**Descrizione:** Aggiungere .editorconfig per team consistency
**Azioni:**
1. Creare `.editorconfig` con indent, EOL, charset
2. Configurazione per .ts, .tsx, .js, .json, .md
3. Trim trailing whitespace e final newline

**Deliverable:** Consistency editor configurata

---

#### **RT003 - Git Attributes**
- **ID:** RT003
- **Categoria:** ROOT
- **Rischio:** BASSO  
- **Tempo:** S (10-15 min)
- **Dipendenze:** Nessuna
- **Rollback:** `rm .gitattributes`

**Descrizione:** Aggiungere .gitattributes per EOL e diff rules  
**Azioni:**
1. Configurare EOL handling per file text
2. Diff rules per .md, .sql, .json
3. Binary handling per assets

**Deliverable:** Git attributes configurati

---

#### **RT004 - GitIgnore Enhancement**
- **ID:** RT004
- **Categoria:** ROOT
- **Rischio:** BASSO
- **Tempo:** S (10-15 min)  
- **Dipendenze:** Nessuna
- **Rollback:** `git checkout .gitignore`

**Descrizione:** Migliorare copertura .gitignore
**Azioni:**
1. Aggiungere `Backup_Automatico/*.tar`
2. Aggiungere `coverage/`, `.nyc_output/`
3. Aggiungere `.recovery/snapshots/*`

**Deliverable:** GitIgnore completo e aggiornato

---

## 📊 SEQUENZA ESECUZIONE CONSIGLIATA

### **FASE 4A - Foundation (Settimana 1)**
1. RT001 - Node.js Version Pinning
2. RT002 - Editor Configuration  
3. RT003 - Git Attributes
4. RT004 - GitIgnore Enhancement

### **FASE 4B - Quality Gates (Settimana 2)**  
1. H001 - Configurazione Pre-commit Hook
2. H002 - Configurazione Pre-push Hook
3. W001 - Setup Node.js e Cache
4. W002 - Job Lint e TypeCheck

### **FASE 4C - CI/CD Complete (Settimana 3)**
1. W003 - Job Build e Test
2. H003 - Cross-Platform Compatibility
3. S001 - Deprecazione Script Duplicati
4. S002 - Unificazione Naming Convention

### **FASE 4D - Enhancement (Settimana 4)**
1. R001 - Retention Policy Snapshots
2. R002 - Recovery README
3. W004 - Bundle Size Guard (Opzionale)

---

## ✅ QUALITY GATE FINALE

**Criteri Completamento Fase 4:**
- ✅ Husky hooks attivi e testati (H001, H002, H003)
- ✅ CI pipeline completa con tutti i job standard (W001, W002, W003)  
- ✅ Team standards configurati (.nvmrc, .editorconfig, .gitattributes)
- ✅ Scripts ecosystem pulito e consistente (S001, S002)
- ✅ Recovery system con retention policy (R001, R002)
- ✅ Documentazione aggiornata per tutti i cambiamenti

**Score Target:** 95/100 (da attuale 65/100)  
**Tempo Stimato Totale:** 6-8 ore distribuite su 2-4 settimane  
**Rischio Complessivo:** BASSO (task atomici con rollback garantito)
