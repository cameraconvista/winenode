# PIANO AZIONE PHASE2 - HOUSEKEEPING DOCS/

**Basato su:** REPORT_PHASE1_HOUSEKEEPING.md  
**Modalità:** Azioni concrete con backup atomici  
**Vincoli:** Zero regressioni, rollback garantito per ogni task

---

## 📋 TASK OVERVIEW

| ID | Categoria | File Target | Rischio | Tempo | Dipendenze |
|----|-----------|-------------|---------|-------|------------|
| T001 | ARCHIVIA | 6 file LEGACY | Basso | M | Nessuna |
| T002 | ARCHIVIA | 8 file STALE | Basso | M | T001 |
| T003 | NORMALIZZA | Prefissi nomenclature | Medio | L | T001,T002 |
| T004 | ELIMINA | 1 file ORPHAN | Basso | S | T001 |
| T005 | UNISCI | Mock data consolidation | Medio | M | T002 |
| T006 | NORMALIZZA | README DOCS/ | Basso | S | T003 |

**Legenda Tempo**: S=Short (<30min), M=Medium (30-60min), L=Long (>60min)

---

## 🗂️ T001 - ARCHIVIAZIONE LEGACY FILES

### Obiettivo
Spostare 6 file LEGACY in struttura archiviata ordinata

### File Target
```
DOCS/WINENODE_DOCUMENTAZIONE_COMPLETA.md → DOCS/ARCHIVIATI/2025/20250926__WINENODE_DOCUMENTAZIONE_COMPLETA.md
DOCS/WINENODE_REPORTS_CONSOLIDATI.md → DOCS/ARCHIVIATI/2025/20250926__WINENODE_REPORTS_CONSOLIDATI.md
DOCS/REPORT_STRUTTURA_PROGETTO.txt → DOCS/ARCHIVIATI/2025/20250926__REPORT_STRUTTURA_PROGETTO.txt
DOCS/REPORT_MODALE_MODIFICA_QUANTITA.txt → DOCS/ARCHIVIATI/2025/20250926__REPORT_MODALE_MODIFICA_QUANTITA.txt
DOCS/SRC_AUDIT_SUMMARY.md → DOCS/ARCHIVIATI/2025/20250928__SRC_AUDIT_SUMMARY.md
DOCS/TODO_SUPABASE.md → DOCS/ARCHIVIATI/2025/20250928__TODO_SUPABASE.md
```

### Azioni Atomiche
1. `mkdir -p DOCS/ARCHIVIATI/2025`
2. `mv` con rinomina prefisso data per ogni file
3. Verifica integrità post-spostamento

### Rollback Plan
```bash
# Ripristino da backup
tar -xzf backup_housekeeping_PHASE2_T001.tar.gz
# O spostamento manuale inverso
mv DOCS/ARCHIVIATI/2025/20250926__WINENODE_*.md DOCS/
```

### Rischio: **BASSO**
- File già identificati come superati
- Contenuto preservato in archivio
- Nessun riferimento attivo nel codice

---

## 🗂️ T002 - ARCHIVIAZIONE STALE FILES

### Obiettivo
Spostare 8 file STALE (>90gg) in archivio con preservazione

### File Target
```
DOCS/CHANGELOG.md → DOCS/ARCHIVIATI/2025/20250923__CHANGELOG.md
DOCS/mock/ → DOCS/ARCHIVIATI/LEGACY/mock_data/
DOCS/schema_changes/ → DOCS/ARCHIVIATI/LEGACY/schema_changes/
DOCS/reports/crea-ordine-fix-changelog.md → DOCS/ARCHIVIATI/2025/20250924__crea-ordine-fix-changelog.md
```

### Azioni Atomiche
1. `mkdir -p DOCS/ARCHIVIATI/LEGACY/{mock_data,schema_changes}`
2. Spostamento directory complete con struttura
3. Rinomina file singoli con prefisso data

### Rollback Plan
```bash
# Ripristino strutture directory
mv DOCS/ARCHIVIATI/LEGACY/mock_data DOCS/mock
mv DOCS/ARCHIVIATI/LEGACY/schema_changes DOCS/schema_changes
```

### Rischio: **BASSO**
- File informativi ma non critici
- Preservazione completa in archivio
- Mock data potrebbe servire per test futuri

---

## 🏷️ T003 - NORMALIZZAZIONE NOMENCLATURE

### Obiettivo
Uniformare prefissi per coerenza documentale

### Pattern Target
```
REPORT_* → Mantenere (già coerente)
PIANO_AZIONE_* → Mantenere (già coerente)  
LOG_* → Mantenere (già coerente)
PLAYBOOK_* → Mantenere (già coerente)
```

### Azioni Atomiche
1. Verifica pattern esistenti
2. Identificazione eccezioni
3. Rinomina file non conformi (se presenti)

### Rollback Plan
```bash
# Git reset per rinomina files
git checkout HEAD -- DOCS/
```

### Rischio: **MEDIO**
- Potenziali riferimenti in script
- Necessaria verifica cross-reference
- Impatto su link interni

---

## 🗑️ T004 - ELIMINAZIONE ORPHAN FILES

### Obiettivo
Eliminare definitivamente file orfani dopo verifica 100% inutilizzo

### File Target
```
dev-notes/crea-ordine-diagnosi.md → ELIMINAZIONE DEFINITIVA
```

### Prova n=0 (Verifica Inutilizzo)
1. ✅ Nessun riferimento in codice sorgente
2. ✅ Contenuto migrato in DOCS/
3. ✅ Nessun valore storico unico
4. ✅ Confermato ORPHAN da analisi

### Azioni Atomiche
1. Backup specifico file
2. `rm dev-notes/crea-ordine-diagnosi.md`
3. Verifica directory vuota
4. `rmdir dev-notes/` se vuota

### Rollback Plan
```bash
# Ripristino da backup specifico
tar -xzf backup_housekeeping_PHASE2_T004.tar.gz dev-notes/
```

### Rischio: **BASSO**
- File già verificato come orfano
- Contenuto non unico
- Backup specifico garantito

---

## 📁 T005 - CONSOLIDAZIONE MOCK DATA

### Obiettivo
Valutare e consolidare dati mock per test

### Strategia
1. **Analisi utilizzo**: Verificare se mock data usati in test
2. **Consolidazione**: Se utili, spostare in `/test/fixtures/`
3. **Eliminazione**: Se inutili, eliminare definitivamente

### File Target
```
DOCS/mock/*.json → Valutazione caso per caso
```

### Azioni Atomiche
1. Grep search per utilizzo mock data
2. Se usati: `mkdir test/fixtures && mv DOCS/mock/* test/fixtures/`
3. Se inutili: eliminazione con backup

### Rollback Plan
```bash
# Ripristino posizione originale
mv test/fixtures/* DOCS/mock/
```

### Rischio: **MEDIO**
- Possibile utilizzo nascosto in test
- Necessaria verifica approfondita
- Impatto su pipeline CI/CD

---

## 📖 T006 - AGGIORNAMENTO README DOCS/

### Obiettivo
Creare indice navigabile documentazione DOCS/

### Contenuto Target
```markdown
# DOCUMENTAZIONE WINENODE

## 📋 Governance
- COMMIT_LOG.md - Log commit automatici
- LOG_DB_MIGRATIONS.txt - Migrazioni database
- PLAYBOOK_MIGRAZIONI.md - Playbook operativo
- REPORT_ULTIMA_MODIFICA.md - Stato progetto

## 📊 Report Analisi
- REPORT_COMPONENTS.md
- REPORT_HOOKS.md
- [... altri report attivi]

## 📁 Archivio
- ARCHIVIATI/2025/ - Documenti archiviati per anno
- ARCHIVIATI/LEGACY/ - Strutture legacy
```

### Azioni Atomiche
1. `touch DOCS/README.md`
2. Generazione automatica indice
3. Aggiornamento link interni

### Rollback Plan
```bash
# Rimozione README se problematico
rm DOCS/README.md
```

### Rischio: **BASSO**
- File nuovo, nessun impatto esistente
- Solo miglioramento navigazione
- Facilmente reversibile

---

## 🔒 PROTOCOLLI SICUREZZA

### Backup Atomici
```bash
# Prima di ogni task
tar -czf backup_housekeeping_PHASE2_T00X_$(date +%Y%m%d_%H%M).tar.gz DOCS/ dev-notes/
```

### Verifica Integrità
```bash
# Dopo ogni task
find DOCS/ -name "*.md" -exec wc -l {} \; > integrity_check.txt
diff integrity_pre.txt integrity_post.txt
```

### Rollback Completo
```bash
# Emergenza: ripristino stato PHASE1
tar -xzf backup_housekeeping_PHASE1_20250928_0236.tar.gz
```

---

## 📊 METRICHE SUCCESSO

### Quantitative
- **File archiviati**: 14 file (24% del totale)
- **Spazio liberato**: ~150KB da DOCS/ attiva
- **Struttura migliorata**: Directory organizzate per anno

### Qualitative
- **Navigazione**: README con indice strutturato
- **Coerenza**: Nomenclature uniformi
- **Manutenibilità**: Separazione attivo/archivio

---

## ⏱️ TIMELINE ESECUZIONE

### Sessione 1 (60 min)
- T001: Archiviazione LEGACY (20 min)
- T002: Archiviazione STALE (25 min)
- T004: Eliminazione ORPHAN (15 min)

### Sessione 2 (45 min)
- T003: Normalizzazione nomenclature (30 min)
- T006: README DOCS/ (15 min)

### Sessione 3 (30 min)
- T005: Consolidazione mock data (30 min)

**Totale stimato**: 135 minuti (2h 15min)

---

## ✅ QUALITY GATE

La FASE 2 è completata quando:
1. ✅ Tutti i backup atomici creati
2. ✅ Struttura DOCS/ARCHIVIATI/ popolata
3. ✅ File CORE e ACTIVE preservati
4. ✅ README.md con indice funzionante
5. ✅ Zero regressioni verificate
6. ✅ Rollback plan testato

---

**Preparato da**: Cascade AI Assistant  
**Basato su**: REPORT_PHASE1_HOUSEKEEPING.md  
**Approvazione richiesta**: Prima di esecuzione FASE 2
