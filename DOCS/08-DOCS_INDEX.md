# 08 - DOCS INDEX WINENODE

**Sintesi Executive**: Indice ragionato completo della documentazione WineNode, organizzato per file informativi numerati (01-08), documentazione storica e archivi legacy, con link interni e note sui contenuti archiviati.

## 📚 FILE INFORMATIVI NUMERATI (01-08)

### **[01-STRUTTURA_PROGETTO.md](./01-STRUTTURA_PROGETTO.md)**
**Contenuto**: Mappa completa architettura modulare WineNode
- 🏗️ Stack tecnologico (React 18 + TypeScript + Vite + Supabase)
- 📁 Directory principali (/src/, /server/, /scripts/, /DOCS/)
- 🔧 File configurazione root (package.json, vite.config.ts, etc.)
- 📋 Convenzioni naming (PascalCase, kebab-case, camelCase)
- 🎯 Guidelines sviluppatori e workflow
- 📊 Metriche progetto (200 file, 13 componenti, 15 script)

### **[02-SISTEMA_BACKUP.md](./02-SISTEMA_BACKUP.md)**
**Contenuto**: Sistema backup automatico enterprise-grade
- 🔄 Script principale `/scripts/backup-system.js` (425 righe)
- 📦 Formato naming `backup_ddMMyyyy_HHmm.tar.gz`
- 🔄 Rotazione automatica max 3 copie
- 🚫 Esclusioni intelligenti (node_modules, .git, .env)
- 🔒 Procedura ripristino sicura con anteprima
- 📊 Performance (500KB media, 2-5s esecuzione)

### **[03-PIPELINE_CI_CD.md](./03-PIPELINE_CI_CD.md)**
**Contenuto**: Pipeline CI/CD enterprise-grade completa
- 🚀 GitHub Actions workflow (5 job sequenziali)
- 🔒 Husky hooks cross-platform (pre-commit, pre-push)
- 🛡️ Quality gates automatici (lint, typecheck, build, test)
- 📊 Bundle size guard con baseline monitoring
- 🔍 Database migrations guard per compliance
- 📈 Performance (2-3 minuti pipeline completa)

### **[04-SUPABASE_SCHEMA.md](./04-SUPABASE_SCHEMA.md)**
**Contenuto**: Schema database PostgreSQL semplificato
- 🗄️ Configurazione senza autenticazione (RLS disabilitato)
- 📊 5 tabelle principali (tipologie, fornitori, vini, giacenza, ordini)
- ⚠️ Check constraints rigorosi (stati ordini, giacenza non negativa)
- 🔗 Integrazione Google Sheets automatica
- 🛡️ CI migrations guard e procedure rollback
- 📈 Indici performance per query ottimizzate

### **[05-SCRIPTS_UTILITY.md](./05-SCRIPTS_UTILITY.md)**
**Contenuto**: Ecosystem completo 15 script enterprise-grade
- 📦 Categorizzazione funzionale (backup, diagnostica, manutenzione)
- 🔧 41 alias npm organizzati per categoria
- 📋 Naming convention kebab-case uniforme
- 🔍 Script diagnostica (project-diagnose.js, file-size-check.js)
- ⚙️ Setup automatizzato (setup-local.js, template-component.js)
- 🔗 Integrazione CI/CD (bundle-guard.js, wa-soft-guard.sh)

### **[06-REPORT_QUALITÀ.md](./06-REPORT_QUALITÀ.md)**
**Contenuto**: Cronologia progressi qualità e audit completo
- 📈 Score progression 65/100 → 95/100 (Fase 3 → Attuale)
- 🎯 Obiettivi raggiunti (lint zero, TypeScript zero, build stabile)
- 📊 Metriche qualità dettagliate (code, architecture, DevOps)
- 🔄 Metodologia step-by-step applicata
- 📋 Audit completo settembre 2025
- 🎉 Risultati finali enterprise-ready

### **[07-PLAYBOOK_OPERATIVI.md](./07-PLAYBOOK_OPERATIVI.md)**
**Contenuto**: Raccolta completa playbook operativi
- 🔄 Playbook Recovery System (snapshots, rollback)
- 📱 Playbook Ripristino WhatsApp (feature flag, compliance)
- 🔧 Playbook Manutenzione Periodica (settimanale, mensile, trimestrale)
- 🚨 Playbook Procedure Emergenza (build failure, DB corruption)
- 📋 Checklist manutenzione e contatti emergenza

### **[08-DOCS_INDEX.md](./08-DOCS_INDEX.md)** *(questo file)*
**Contenuto**: Indice ragionato documentazione completa
- 📚 File informativi numerati con descrizioni
- 📂 Documentazione storica organizzata
- 🗃️ Archivi legacy e file archiviati
- 🔗 Link interni e riferimenti incrociati

## 📂 DOCUMENTAZIONE STORICA

### **Report Analisi per Area**
- **[REPORT_COMPONENTS.md](./REPORT_COMPONENTS.md)** - Analisi componenti React (13 attivi)
- **[REPORT_HOOKS.md](./REPORT_HOOKS.md)** - Custom hooks specializzati (13 hook)
- **[REPORT_PAGES.md](./REPORT_PAGES.md)** - Pagine routing principali (10 pagine)
- **[REPORT_SCRIPTS.md](./REPORT_SCRIPTS.md)** - Ecosystem script utility (15 script)
- **[REPORT_SERVER.md](./REPORT_SERVER.md)** - Backend services Express (11 items)
- **[REPORT_SHARED.md](./REPORT_SHARED.md)** - Shared schemas e utilities (5 items)
- **[REPORT_STYLES.md](./REPORT_STYLES.md)** - Sistema CSS e temi
- **[REPORT_PUBLIC.md](./REPORT_PUBLIC.md)** - Assets pubblici e PWA

### **Piani Azione Implementati**
- **[PIANO_AZIONE_PHASE4_OPERATIVE.md](./PIANO_AZIONE_PHASE4_OPERATIVE.md)** - 20 task atomici Fase 4
- **[PIANO_AZIONE_COMPONENTS.md](./PIANO_AZIONE_COMPONENTS.md)** - Refactoring componenti
- **[PIANO_AZIONE_HOOKS.md](./PIANO_AZIONE_HOOKS.md)** - Ottimizzazione custom hooks
- **[PIANO_AZIONE_SCRIPTS.md](./PIANO_AZIONE_SCRIPTS.md)** - Ecosystem script utility
- **[PIANO_AZIONE_STYLES.md](./PIANO_AZIONE_STYLES.md)** - Sistema CSS modulare

### **Report Fasi Operative**
- **[REPORT_PHASE3_OPERATIVE.md](./REPORT_PHASE3_OPERATIVE.md)** - Analisi Fase 3 (65/100)
- **[REPORT_PHASE1_HOUSEKEEPING.md](./REPORT_PHASE1_HOUSEKEEPING.md)** - Housekeeping iniziale
- **[REPORT_ULTIMA_MODIFICA.md](./REPORT_ULTIMA_MODIFICA.md)** - Cronologia modifiche

## 🗃️ ARCHIVI E METADATA

### **Metadata Strutturati**
- **[META_PHASE3_OPERATIVE.json](./META_PHASE3_OPERATIVE.json)** - Inventario JSON Fase 3 (306 righe)
- **[META_HOUSEKEEPING_PHASE1.json](./META_HOUSEKEEPING_PHASE1.json)** - Metadata housekeeping

### **Playbook Specializzati**
- **[PLAYBOOK_MIGRAZIONI.md](./PLAYBOOK_MIGRAZIONI.md)** - Database migrations (160 righe)
- **[PLAYBOOK_RIPRISTINO_WHATSAPP.md](./PLAYBOOK_RIPRISTINO_WHATSAPP.md)** - WhatsApp feature (50 righe)

### **Database e Schema**
- **[SCHEMA_UNICO.sql](./SCHEMA_UNICO.sql)** - Schema consolidato (204 righe)
- **[DB_MIGRATIONS_SCRIPTS.sql](./DB_MIGRATIONS_SCRIPTS.sql)** - Script migrazioni
- **[DB_MIGRATION_GUIDE.md](./DB_MIGRATION_GUIDE.md)** - Guida amministratore
- **[DIAGNOSTICO_SUPABASE_SQL.sql](../DIAGNOSTICO_SUPABASE_SQL.sql)** - Diagnostica DB

### **Log e Cronologie**
- **[COMMIT_LOG.md](./COMMIT_LOG.md)** - Cronologia commit automatici
- **[LOG_DB_MIGRATIONS.txt](./LOG_DB_MIGRATIONS.txt)** - Log migrazioni database
- **[LOG_ESLINT_ZERO.txt](./LOG_ESLINT_ZERO.txt)** - Cronologia lint zero
- **[LOG_QUALITY_PASS.txt](./LOG_QUALITY_PASS.txt)** - Quality gates progression
- **[LOG_SCRIPTS.txt](./LOG_SCRIPTS.txt)** - Log script utility
- **[LOG_STYLES_OPT.txt](./LOG_STYLES_OPT.txt)** - Ottimizzazioni CSS

### **Baseline e Configurazioni**
- **[BUNDLE_BASELINE.json](./BUNDLE_BASELINE.json)** - Baseline bundle size (48B)
- **[README.md](./README.md)** - Documentazione principale DOCS/

## 🔗 LINK INTERNI E RIFERIMENTI

### **Navigazione Rapida File Informativi**
```
01 → Struttura    → 02 → Backup      → 03 → CI/CD
 ↓                 ↓                  ↓
04 → Supabase     → 05 → Scripts     → 06 → Qualità
 ↓                 ↓                  ↓
07 → Playbook     → 08 → Index (qui)
```

### **Riferimenti Incrociati Principali**
- **Backup System**: 01→02, 05→02, 07→02
- **CI/CD Pipeline**: 01→03, 05→03, 06→03
- **Scripts Utility**: 01→05, 02→05, 03→05, 07→05
- **Quality Reports**: 03→06, 05→06, 07→06
- **Supabase Schema**: 01→04, 07→04

### **File Esterni Collegati**
- **Root Config**: `/package.json`, `/vite.config.ts`, `/tsconfig.json`
- **CI Workflow**: `/.github/workflows/ci.yml`
- **Scripts Directory**: `/scripts/` (15 file)
- **Husky Hooks**: `/.husky/pre-commit`, `/.husky/pre-push`

## 📋 ARCHIVI LEGACY

### **Directory ARCHIVIATI/** *(se presente)*
**Nota**: Per file storici e legacy non più utilizzati ma conservati per riferimento storico.

**Contenuto Tipico**:
- Schema SQL precedenti
- Configurazioni obsolete
- Report analisi superate
- File duplicati rimossi

### **Convenzione Archiviazione**
- **Prefisso**: `LEGACY_` per file obsoleti
- **Data**: `_YYYYMMDD` per versioning temporale
- **Categoria**: Organizzazione per tipo (sql, config, reports)

## 🎯 UTILIZZO DOCUMENTAZIONE

### **Per Nuovi Sviluppatori**
1. **Start**: `01-STRUTTURA_PROGETTO.md` (overview completo)
2. **Setup**: `05-SCRIPTS_UTILITY.md` → `npm run setup:local`
3. **Development**: `03-PIPELINE_CI_CD.md` (quality gates)
4. **Database**: `04-SUPABASE_SCHEMA.md` (schema e API)

### **Per Manutenzione**
1. **Backup**: `02-SISTEMA_BACKUP.md` + `07-PLAYBOOK_OPERATIVI.md`
2. **Quality**: `06-REPORT_QUALITÀ.md` (metriche e audit)
3. **Scripts**: `05-SCRIPTS_UTILITY.md` (automazioni)
4. **Emergency**: `07-PLAYBOOK_OPERATIVI.md` (procedure emergenza)

### **Per Audit e Review**
1. **Quality Score**: `06-REPORT_QUALITÀ.md`
2. **Architecture**: `01-STRUTTURA_PROGETTO.md`
3. **DevOps**: `03-PIPELINE_CI_CD.md`
4. **Database**: `04-SUPABASE_SCHEMA.md`

---

**Statistiche Documentazione**:
- **File informativi**: 8 numerati (01-08)
- **Report analisi**: 12 per area
- **Piani azione**: 8 implementati
- **Log cronologie**: 10 tracciati
- **Playbook**: 3 operativi
- **Metadata**: 2 strutturati
- **Schema/DB**: 4 file principali

**Totale**: ~60 file documentazione completa e strutturata
