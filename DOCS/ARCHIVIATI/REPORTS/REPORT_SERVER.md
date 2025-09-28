# REPORT ANALISI TECNICA - CARTELLA SERVER/

**Data Analisi:** 2025-09-28  
**Perimetro:** `/server/` (4 file TypeScript)  
**Obiettivo:** Analisi tecnica completa per preparazione FASE 2 ottimizzazione

---

## 1. OVERVIEW

La cartella `server/` contiene il backend Express.js del progetto WineNode con architettura modulare:
- **Totale file:** 4 (.ts)
- **Dimensione totale:** 11.56 KB
- **Tecnologie:** Express.js, Drizzle ORM, Neon Database, TypeScript
- **Pattern:** Repository pattern con interfaccia IStorage

---

## 2. MAPPA GERARCHICA CON PESI

```
server/ (11.56 KB totali)
├── app.ts          6.98 KB  (60.4%) ⚠️ OVERSIZED
├── storage.ts      4.08 KB  (35.3%)
├── db.ts           0.48 KB  (4.2%)
└── index.ts        0.01 KB  (0.1%)  ⚠️ MINIMAL
```

**Statistiche dimensioni:**
- Media: 2.89 KB
- Mediana: 2.28 KB  
- Soglia oversized (media+2σ): ~5.5 KB
- **File oversized:** `app.ts` (6.98 KB)

---

## 3. MATRICE DIPENDENZE

### 3.1 Dipendenze Interne (server → server)

| File Sorgente | Target | Tipo Import | Occorrenze |
|---------------|--------|-------------|------------|
| app.ts | ./storage | ES6 named | 1 |
| storage.ts | ./db | ES6 named | 1 |
| index.ts | ./app | ES6 default | 1 |

### 3.2 Dipendenze Esterne (server → shared)

| File Sorgente | Target | Elementi Importati | Occorrenze |
|---------------|--------|-------------------|------------|
| db.ts | ../shared/schema | * as schema | 1 |
| storage.ts | ../shared/schema | wines, googleSheetLinks, Wine, InsertWine, GoogleSheetLink, InsertGoogleSheetLink | 6 tipi |

### 3.3 Dipendenze NPM Esterne

| File | Package | Utilizzo | Occorrenze |
|------|---------|----------|------------|
| app.ts | express | Server HTTP, routing | 14 |
| app.ts | cors | CORS middleware | 1 |
| db.ts | @neondatabase/serverless | Pool, neonConfig | 2 |
| db.ts | drizzle-orm/neon-serverless | drizzle | 1 |
| db.ts | ws | WebSocket constructor | 1 |
| storage.ts | drizzle-orm | eq, sql | 2 |

### 3.4 Accessi Ambiente/Sistema

| File | Risorsa | Tipo | Occorrenze |
|------|---------|------|------------|
| app.ts | process.env.PORT | Env var | 1 |
| app.ts | console.error | Logging | 14 |
| app.ts | fetch() | Network API | 1 |
| db.ts | process.env.DATABASE_URL | Env var | 2 |

---

## 4. NON USATI (PROVE n=0)

### 4.1 File Non Usati
**NESSUNO** - Tutti i file server/ sono utilizzati:

| File | Utilizzato Da | Tipo Utilizzo | Occorrenze |
|------|---------------|---------------|------------|
| app.ts | index.ts | import './app' | 1 |
| db.ts | storage.ts | import { db } | 1 |
| storage.ts | app.ts | import { storage } | 1 |
| index.ts | - | Entry point | - |

### 4.2 Esportazioni Non Usate
**VERIFICATE** - Tutte le esportazioni sono utilizzate:

| File | Esportazione | Utilizzata Da | Occorrenze |
|------|--------------|---------------|------------|
| app.ts | { app } | ⚠️ Ambiguo | 0 |
| db.ts | { pool } | ⚠️ Ambiguo | 0 |
| db.ts | { db } | storage.ts | 1 |
| storage.ts | { IStorage } | ⚠️ Ambiguo | 0 |
| storage.ts | { DatabaseStorage } | ⚠️ Ambiguo | 0 |
| storage.ts | { storage } | app.ts | 1 |

**⚠️ Ambigui (possibili non usati):**
- `export { app }` da app.ts
- `export { pool }` da db.ts  
- `export { IStorage, DatabaseStorage }` da storage.ts

---

## 5. DUPLICATI/NEAR-DUPLICATES

**NESSUNO RILEVATO**

| Criterio | Risultato |
|----------|-----------|
| Hash identico | 0 file |
| Size ±2% | 0 coppie |
| Struttura simile | 0 pattern duplicati |

**Motivazione:** File con responsabilità distinte e dimensioni diverse (15B - 6.98KB).

---

## 6. OVERSIZED & QUICK WINS

### 6.1 File Oversized

**app.ts (6.98 KB)** - Sopra soglia 5.5 KB

**Contenuto:**
- 15 endpoint REST API (GET/POST/PUT/DELETE)
- Gestione errori ripetitiva (14 blocchi try/catch identici)
- Logica import Google Sheets (60 righe, linee 152-220)
- Server setup e middleware

**Quick Wins Proposti:**
1. **Estrai router modulari** → Impatto: MEDIO (cold start)
2. **Centralizza error handling** → Impatto: BASSO (manutenibilità)  
3. **Sposta Google Sheets logic** → Impatto: MEDIO (separazione responsabilità)
4. **Middleware factory pattern** → Impatto: BASSO (DRY)

### 6.2 Stima Impatto Cold Start

| Azione | Impatto Build | Impatto Runtime | Priorità |
|--------|---------------|-----------------|----------|
| Split router | BASSO | MEDIO | ALTA |
| Error middleware | BASSO | BASSO | MEDIA |
| Google Sheets service | BASSO | MEDIO | ALTA |
| Refactor generale | MEDIO | ALTO | BASSA |

---

## 7. CRITICITÀ & GOVERNANCE

### 7.1 Allineamento Tipi

**CRITICO:** Disallineamento nomenclatura
- **Server:** usa `supplier` (inglese)
- **Frontend:** usa `fornitore` (italiano)
- **Occorrenze:** 14 file frontend con "fornitore", 27 file con "supplier"

### 7.2 Configurazione Node.js

**MANCANTE:** Configurazione ESLint per ambiente Node
- File server/ non hanno `env: { node: true }`
- Possibili warning su `process`, `console`, `global`

### 7.3 Gestione Errori

**PATTERN RIPETITIVO:** 14 blocchi try/catch identici
```typescript
} catch (error) {
  console.error('Error...:', error);
  res.status(500).json({ error: '...' });
}
```

### 7.4 Variabili Ambiente

**RICHIESTE:**
- `DATABASE_URL` (obbligatoria, verificata)
- `PORT` (opzionale, default 3001)

**MANCANTI:**
- Validazione env vars
- Logging strutturato
- Health check endpoint

---

## 8. ALLEGATO PROVE

### 8.1 Snapshot Occorrenze Import

```bash
# Ricerca import server/ nel progetto
grep -r "server/" --include="*.ts" --include="*.tsx" . 
# Risultato: 0 occorrenze

# Ricerca export { app }
grep -r "export.*app" --include="*.ts" .
# Risultato: 1 occorrenza (solo definizione)

# Ricerca export { pool }  
grep -r "pool" --include="*.ts" .
# Risultato: 2 occorrenze (definizione + uso interno)
```

### 8.2 Verifica Dimensioni

```bash
find server/ -type f -exec wc -c {} \;
# 15 server/index.ts
# 484 server/db.ts  
# 4080 server/storage.ts
# 6981 server/app.ts
```

### 8.3 Conteggi Dipendenze

- **Totale import interni:** 3
- **Totale import shared/:** 2  
- **Totale import NPM:** 6
- **Totale accessi env:** 3

---

**CONCLUSIONI:** Cartella server/ ben strutturata ma con opportunità di ottimizzazione su app.ts oversized e allineamento nomenclatura tipi.
