# REPORT ANALISI TECNICA - CARTELLA SHARED/

**Data Analisi:** 2025-09-28  
**Perimetro:** `/shared/` (1 file TypeScript)  
**Obiettivo:** Analisi tecnica completa per preparazione FASE 2 ottimizzazione

---

## 1. OVERVIEW

La cartella `shared/` contiene il layer di schema condiviso del progetto WineNode:
- **Totale file:** 1 (.ts)
- **Dimensione totale:** 1.31 KB
- **Tecnologie:** Drizzle ORM, PostgreSQL schema definitions
- **Pattern:** Schema-first approach con type inference

---

## 2. MAPPA GERARCHICA CON PESI

```
shared/ (1.31 KB totali)
└── schema.ts          1.31 KB  (100%)
```

**Statistiche dimensioni:**
- Media: 1.31 KB (1 file)
- Mediana: 1.31 KB
- Soglia oversized: N/A (singolo file)
- **File oversized:** Nessuno (sotto qualsiasi soglia ragionevole)

---

## 3. MATRICE DIPENDENZE

### 3.1 Dipendenze Interne (shared → shared)
**NESSUNA** - Un solo file presente

### 3.2 Dipendenze Esterne NPM
| File | Package | Elementi Importati | Occorrenze |
|------|---------|-------------------|------------|
| schema.ts | drizzle-orm/pg-core | pgTable, serial, integer, decimal, varchar, timestamp | 6 |

### 3.3 Dipendenze IN (chi importa da shared/)

#### Server → Shared
| File Sorgente | Elementi Importati | Occorrenze |
|---------------|-------------------|------------|
| server/db.ts | * as schema | 1 |
| server/storage.ts | wines, googleSheetLinks, Wine, InsertWine, GoogleSheetLink, InsertGoogleSheetLink | 6 |
| server/routes/wines.ts | ⚠️ Ambiguo (indiretto via storage) | - |

#### Src → Shared  
**NESSUNA DIRETTA** - Frontend non importa direttamente da shared/

### 3.4 Utilizzo Tipi Shared nel Progetto
| Tipo | Occorrenze Totali | File Coinvolti |
|------|------------------|----------------|
| Wine | 35 file | server/ + src/ (via compatibility layer) |
| InsertWine | 18 file | Principalmente server/ |
| GoogleSheetLink | 4 file | server/ + src/lib/ |
| InsertGoogleSheetLink | 4 file | server/ |

---

## 4. ALLINEAMENTO TIPI & NAMING

### 4.1 Incongruenze Critiche Rilevate

**PROBLEMA PRINCIPALE: Disallineamento supplier/fornitore**
- **Schema shared/**: Usa `supplier` (inglese)
- **Frontend src/**: Usa `fornitore` (italiano) - 27 file coinvolti
- **Server**: Usa `supplier` (coerente con schema) - 14 file coinvolti

### 4.2 Analisi Impatto Naming

| Termine | Contesto | File Coinvolti | Rischio Breaking Change |
|---------|----------|----------------|------------------------|
| supplier | shared/schema.ts | 1 | ALTO (schema database) |
| supplier | server/ | 14 | MEDIO (compatibility layer esistente) |
| fornitore | src/ | 27 | ALTO (frontend completo) |

### 4.3 Duplicazioni Tipi

**NESSUNA DUPLICAZIONE DIRETTA** rilevata in shared/
- Tipi Wine/InsertWine: Generati automaticamente da Drizzle
- Tipi GoogleSheetLink: Generati automaticamente da Drizzle
- **Pattern corretto**: Single source of truth via schema inference

---

## 5. NON USATI (PROVE n=0)

### 5.1 File Non Usati
**NESSUNO** - L'unico file è utilizzato:

| File | Utilizzato Da | Tipo Utilizzo | Occorrenze |
|------|---------------|---------------|------------|
| schema.ts | server/db.ts | import * as schema | 1 |
| schema.ts | server/storage.ts | import named exports | 6 |

### 5.2 Export Non Usati
**TUTTI GLI EXPORT SONO UTILIZZATI:**

| Export | Utilizzato Da | Occorrenze |
|--------|---------------|------------|
| wines | server/storage.ts | 1 |
| googleSheetLinks | server/storage.ts | 1 |
| Wine | server/storage.ts + routes | 35+ (indiretto) |
| InsertWine | server/storage.ts + routes | 18+ (indiretto) |
| GoogleSheetLink | server/storage.ts + routes | 4+ |
| InsertGoogleSheetLink | server/storage.ts | 4+ |

**⚠️ Ambiguo**: Conteggi indiretti difficili da tracciare completamente

---

## 6. DUPLICATI/NEAR-DUPLICATES

**NESSUNO RILEVATO**

| Criterio | Risultato |
|----------|-----------|
| Hash identico | 0 file (singolo file) |
| Size ±2% | N/A (singolo file) |
| Struttura simile | N/A (singolo file) |

**Motivazione:** Cartella con un solo file, impossibili duplicazioni interne.

---

## 7. OVERSIZED & QUICK WINS

### 7.1 File Oversized
**NESSUNO** - schema.ts (1.31 KB) è ben dimensionato

### 7.2 Quick Wins Identificati

**SH-01: Normalizzazione Naming supplier/fornitore**
- **Problema**: Disallineamento terminologia
- **Impatto**: ALTO (consistenza, manutenibilità)
- **Approccio**: Standardizzazione su un termine unico

**SH-02: Aggiunta Validazioni Schema**
- **Problema**: Schema minimalista senza constraints
- **Impatto**: MEDIO (data integrity, validazione)
- **Approccio**: Aggiunta check constraints, enum types

**SH-03: Documentazione Tipi**
- **Problema**: Mancanza JSDoc sui tipi esportati
- **Impatto**: BASSO (developer experience)
- **Approccio**: Aggiunta commenti descrittivi

### 7.3 Stima Impatto Build/DX

| Azione | Impatto Build | Impatto DX | Priorità |
|--------|---------------|------------|----------|
| Normalizzazione naming | ALTO | ALTO | CRITICA |
| Validazioni schema | BASSO | MEDIO | MEDIA |
| Documentazione | BASSO | MEDIO | BASSA |

---

## 8. ALLEGATO PROVE

### 8.1 Snapshot Ricerche Import

```bash
# Ricerca import da shared/ nel server
grep -r "from.*shared" server/ --include="*.ts"
# Risultato: 2 file (db.ts, storage.ts)

# Ricerca import da shared/ nel frontend  
grep -r "from.*shared" src/ --include="*.ts" --include="*.tsx"
# Risultato: 0 occorrenze

# Ricerca utilizzo tipi Wine
grep -r "Wine" . --include="*.ts" --include="*.tsx" | wc -l
# Risultato: 35 file coinvolti
```

### 8.2 Verifica Export Utilizzati

```bash
# Verifica wines table usage
grep -r "wines" server/ --include="*.ts"
# Risultato: 1 occorrenza (storage.ts)

# Verifica googleSheetLinks usage  
grep -r "googleSheetLinks" server/ --include="*.ts"
# Risultato: 1 occorrenza (storage.ts)

# Verifica tipi Wine/InsertWine
grep -r "Wine\|InsertWine" server/ --include="*.ts"
# Risultato: Multiple occorrenze in storage.ts, routes/
```

### 8.3 Conteggi Naming Disallineamento

- **supplier**: 14 file in src/ + schema.ts
- **fornitore**: 27 file in src/ 
- **Overlap**: 0 (terminologie mutuamente esclusive per contesto)

---

**CONCLUSIONI:** Cartella shared/ ben strutturata ma con criticità naming che richiede normalizzazione per consistenza progetto.
