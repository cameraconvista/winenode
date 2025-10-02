# 08 - DOCS INDEX WINENODE

**Sintesi Executive**: Indice ragionato completo della documentazione WineNode, organizzato per file informativi numerati (01-08), documentazione storica e archivi legacy, con link interni e note sui contenuti archiviati.

## 📚 DOCUMENTI ATTIVI (01-08)

### **File Informativi Numerati**
- **[01-STRUTTURA_PROGETTO.md](./01-STRUTTURA_PROGETTO.md)** - Mappa architettura modulare completa
- **[02-SISTEMA_BACKUP.md](./02-SISTEMA_BACKUP.md)** - Sistema backup enterprise-grade
- **[03-PIPELINE_CI_CD.md](./03-PIPELINE_CI_CD.md)** - Pipeline CI/CD con 5 job sequenziali
- **[04-SUPABASE_SCHEMA.md](./04-SUPABASE_SCHEMA.md)** - Schema DB semplificato senza auth
- **[05-SCRIPTS_UTILITY.md](./05-SCRIPTS_UTILITY.md)** - Ecosystem 15 script + 41 alias npm
- **[06-REPORT_QUALITÀ.md](./06-REPORT_QUALITÀ.md)** - Progressi qualità 65/100 → 95/100
- **[07-PLAYBOOK_OPERATIVI.md](./07-PLAYBOOK_OPERATIVI.md)** - Recovery, WhatsApp, manutenzione
- **[08-DOCS_INDEX.md](./08-DOCS_INDEX.md)** - Indice documentazione (questo file)

### **Documenti Core Attivi**
- **[PLAYBOOK_MIGRAZIONI.md](./PLAYBOOK_MIGRAZIONI.md)** - Database migrations playbook
- **[PLAYBOOK_RIPRISTINO_WHATSAPP.md](./PLAYBOOK_RIPRISTINO_WHATSAPP.md)** - WhatsApp feature restoration
- **[SCHEMA_UNICO.sql](./SCHEMA_UNICO.sql)** - Schema database consolidato
- **[DB_MIGRATIONS_SCRIPTS.sql](./DB_MIGRATIONS_SCRIPTS.sql)** - Script migrazioni SQL
- **[DB_MIGRATION_GUIDE.md](./DB_MIGRATION_GUIDE.md)** - Guida amministratore DB
- **[REPORT_ULTIMA_MODIFICA.md](./REPORT_ULTIMA_MODIFICA.md)** - Cronologia modifiche
- **[COMMIT_LOG.md](./COMMIT_LOG.md)** - Log commit automatici
- **[BUNDLE_BASELINE.json](./BUNDLE_BASELINE.json)** - Baseline bundle size
- **[README.md](./README.md)** - Documentazione principale DOCS/

## 🗄️ ARCHIVIO STORICO

### **[ARCHIVIATI/LOGS/](./ARCHIVIATI/LOGS/)** - Log Storici Ottimizzazione
**Contenuto**: 12 file LOG_*.txt con cronologie dettagliate
- LOG_DB_MIGRATIONS.txt, LOG_ESLINT_ZERO.txt, LOG_QUALITY_PASS.txt
- LOG_SCRIPTS.txt, LOG_STYLES_OPT.txt, LOG_*_PHASE2.txt
- **Scopo**: Tracciabilità progressi per audit e rollback

### **[ARCHIVIATI/REPORTS/](./ARCHIVIATI/REPORTS/)** - Report Dettagliati per Area
**Contenuto**: 14 file REPORT_*.md con analisi comprehensive
- REPORT_COMPONENTS.md, REPORT_HOOKS.md, REPORT_SCRIPTS.md
- REPORT_PHASE3_OPERATIVE.md, REPORT_DIAGNOSTICA_QUERY.md
- **Scopo**: Analisi storiche per area funzionale del progetto

### **[ARCHIVIATI/PIANI/](./ARCHIVIATI/PIANI/)** - Piani Operativi Fasi
**Contenuto**: 13 file PIANO_AZIONE_*.md implementati
- PIANO_AZIONE_PHASE4_OPERATIVE.md, PIANO_AZIONE_COMPONENTS.md
- PIANO_AZIONE_HOOKS.md, PIANO_AZIONE_SCRIPTS.md
- **Scopo**: Roadmap e task atomici delle fasi di sviluppo

### **[ARCHIVIATI/META/](./ARCHIVIATI/META/)** - Inventari JSON Generati
**Contenuto**: 2 file META_*.json strutturati
- META_PHASE3_OPERATIVE.json, META_HOUSEKEEPING_PHASE1.json
- **Scopo**: Metadata e inventari automatici per analisi

### **[ARCHIVIATI/ALTRO/](./ARCHIVIATI/ALTRO/)** - Materiali Vari
**Contenuto**: File verifiche, dubbi e audit specializzati
- VERIFICA_COMPONENTS_DUBBI.md, VERIFICA_HOOKS_DUBBI.md
- AUDIT/ (directory con audit WhatsApp)
- **Scopo**: Materiali di supporto e verifiche puntuali

## 📝 NOTA IMPORTANTE

**I documenti attivi sono la fonte primaria**. L'archivio conserva la storia per audit e rollback. Per consultazioni operative utilizzare sempre i file numerati 01-08 e i documenti core attivi.

## 🔗 NAVIGAZIONE RAPIDA

### **File Informativi (01-08)**
```
01 → Struttura    → 02 → Backup      → 03 → CI/CD
 ↓                 ↓                  ↓
04 → Supabase     → 05 → Scripts     → 06 → Qualità
 ↓                 ↓                  ↓
07 → Playbook     → 08 → Index (qui)
```

### **Archivio per Categoria**
- **LOGS/**: Cronologie ottimizzazioni e progressi
- **REPORTS/**: Analisi dettagliate per area funzionale  
- **PIANI/**: Roadmap e task atomici implementati
- **META/**: Inventari JSON e metadata strutturati
- **ALTRO/**: Verifiche, dubbi e audit specializzati

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

**Statistiche Post-Archiviazione**:
- **File attivi**: 17 (8 numerati + 9 core)
- **File archiviati**: 48 (organizzati in 5 categorie)
- **Struttura**: Snella e navigabile
- **Storico**: Conservato e accessibile per audit

**Repository documentale ottimizzato**: Solo file essenziali attivi + archivio storico ordinato
