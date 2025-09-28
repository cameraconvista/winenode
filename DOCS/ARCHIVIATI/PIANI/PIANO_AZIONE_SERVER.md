# PIANO AZIONE OTTIMIZZAZIONE - CARTELLA SERVER/

**Basato su:** REPORT_SERVER.md  
**Target:** Ottimizzazione architettura, performance, manutenibilità  
**Approccio:** Modulare, zero regressioni, impatto misurato

---

## AZIONI PROPOSTE

### S-01: Estrai Router Wines API
**Descrizione:** Sposta tutti gli endpoint `/api/wines/*` da app.ts a `server/routes/wines.ts`  
**Motivazione:** app.ts oversized (6.98KB), separazione responsabilità, modularità  
**Rischio:** BASSO (spostamento senza logica changes)  
**Impatto:** MEDIO (cold start, manutenibilità)  
**Rollback:** Riporta endpoint in app.ts, rimuovi file routes/wines.ts  
**Prove:** `npm run build && npm run typecheck` verdi

### S-02: Estrai Router Google Sheets API  
**Descrizione:** Sposta endpoint `/api/google-sheet*` e `/api/import-google-sheet` a `server/routes/googleSheets.ts`  
**Motivazione:** Logica complessa (60 righe), responsabilità distinta da wines  
**Rischio:** BASSO (spostamento puro)  
**Impatto:** MEDIO (separazione concerns, testabilità)  
**Rollback:** Riporta endpoint in app.ts, rimuovi file routes/googleSheets.ts  
**Prove:** `npm run build && npm run typecheck` verdi

### S-03: Centralizza Error Handling Middleware
**Descrizione:** Crea `server/middleware/errorHandler.ts` per sostituire 14 blocchi try/catch ripetitivi  
**Motivazione:** DRY principle, 14 pattern identici rilevati  
**Rischio:** MEDIO (cambio logica error handling)  
**Impatto:** ALTO (manutenibilità, consistenza errori)  
**Rollback:** Ripristina try/catch individuali, rimuovi middleware  
**Prove:** `npm run build && npm run typecheck && test error scenarios` verdi

### S-04: Crea Google Sheets Service Layer
**Descrizione:** Estrai logica CSV parsing e import da app.ts a `server/services/googleSheetsService.ts`  
**Motivazione:** 60 righe business logic in controller, testabilità  
**Rischio:** MEDIO (estrazione logica complessa)  
**Impatto:** ALTO (testabilità, riusabilità, separazione)  
**Rollback:** Riporta logica in app.ts, rimuovi service  
**Prove:** `npm run build && npm run typecheck && test import functionality` verdi

### S-05: Allinea Nomenclatura Tipi (supplier/fornitore)
**Descrizione:** Standardizza su "supplier" in tutto il progetto (server + frontend)  
**Motivazione:** Disallineamento critico: server usa "supplier", frontend "fornitore"  
**Rischio:** ALTO (breaking change, 27 file frontend coinvolti)  
**Impatto:** ALTO (consistenza, manutenibilità)  
**Rollback:** Ripristina "fornitore" nel frontend, mantieni mapping  
**Prove:** `npm run build && npm run typecheck && npm run test` verdi

### S-06: Aggiungi ESLint Config Node Environment
**Descrizione:** Configura ESLint per `env: { node: true }` sui file server/  
**Motivazione:** Warning potenziali su process, console, global  
**Rischio:** BASSO (solo configurazione)  
**Impatto:** BASSO (qualità codice, warning cleanup)  
**Rollback:** Rimuovi configurazione node env da ESLint  
**Prove:** `npm run lint` verde, zero warning server/

### S-07: Aggiungi Validazione Environment Variables
**Descrizione:** Crea `server/config/env.ts` per validare DATABASE_URL, PORT con schema  
**Motivazione:** Mancante validazione env vars, error handling startup  
**Rischio:** BASSO (aggiunta feature)  
**Impatto:** MEDIO (robustezza, debugging)  
**Rollback:** Rimuovi validazione, mantieni process.env diretto  
**Prove:** `npm run build && test invalid env scenarios` verdi

### S-08: Rimuovi Export Non Utilizzati
**Descrizione:** Rimuovi `export { app }`, `export { pool }`, `export { IStorage, DatabaseStorage }`  
**Motivazione:** 4 export con 0 occorrenze esterne rilevate  
**Rischio:** MEDIO (possibili import nascosti)  
**Impatto:** BASSO (bundle size, API surface)  
**Rollback:** Ripristina export rimossi  
**Prove:** `npm run build && npm run typecheck` verdi, nessun import error

### S-09: Aggiungi Health Check Endpoint
**Descrizione:** Crea `GET /api/health` per monitoring database connectivity  
**Motivazione:** Mancante endpoint per health check, monitoring  
**Rischio:** BASSO (aggiunta feature)  
**Impatto:** MEDIO (operabilità, monitoring)  
**Rollback:** Rimuovi endpoint /api/health  
**Prove:** `npm run build && test health endpoint` verdi

### S-10: Ottimizza index.ts Entry Point
**Descrizione:** Espandi index.ts (15B) con proper server startup, graceful shutdown  
**Motivazione:** Entry point minimale, mancante lifecycle management  
**Rischio:** MEDIO (cambio startup logic)  
**Impatto:** MEDIO (robustezza, operabilità)  
**Rollback:** Ripristina `import './app'` semplice  
**Prove:** `npm run build && test server startup/shutdown` verdi

---

## CHECKLIST FASE 2

**Sequenza Ordinata Esecuzione:**

### FASE 2A - Preparazione (Rischio Basso)
1. **S-06** - ESLint Node Environment  
2. **S-07** - Validazione Environment Variables
3. **S-09** - Health Check Endpoint

### FASE 2B - Refactoring Modulare (Rischio Medio)  
4. **S-01** - Router Wines API
5. **S-02** - Router Google Sheets API  
6. **S-04** - Google Sheets Service Layer
7. **S-03** - Error Handling Middleware

### FASE 2C - Ottimizzazioni (Rischio Alto)
8. **S-10** - Entry Point Ottimizzato
9. **S-08** - Rimozione Export Non Usati  
10. **S-05** - Allineamento Nomenclatura (ULTIMO)

---

## CRITERI SUCCESSO

### Pre-Condizioni
- ✅ Backup progetto completato
- ✅ Branch feature/server-optimization creato
- ✅ Test suite funzionante

### Post-Condizioni Ogni Azione
- ✅ `npm run build` verde
- ✅ `npm run typecheck` verde  
- ✅ `npm run lint` verde
- ✅ `npm run test` verde (se esistenti)
- ✅ Server avvio senza errori
- ✅ API endpoints funzionanti

### Metriche Target
- **Bundle size:** Riduzione ≥10% app.ts
- **Cold start:** Miglioramento ≥5% (qualitativo)
- **Manutenibilità:** File <500 righe ciascuno
- **Test coverage:** Mantenimento 100% esistente

---

## NOTE IMPLEMENTAZIONE

### Priorità Esecuzione
1. **ALTA:** S-01, S-02, S-04 (modularità)
2. **MEDIA:** S-03, S-07, S-09 (robustezza)  
3. **BASSA:** S-05, S-06, S-08, S-10 (polish)

### Rollback Strategy
- Ogni azione ha rollback specifico documentato
- Branch feature permette git revert rapido
- Backup automatico pre-FASE 2

### Validazione Continua
- Test dopo ogni azione (non batch)
- Commit atomici per rollback granulare
- Monitoring health check durante refactoring

---

**STATO:** Piano pronto per approvazione ed esecuzione FASE 2  
**NEXT:** Attendere conferma USER per avvio implementazione
