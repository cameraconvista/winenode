# PIANO AZIONE OTTIMIZZAZIONE - CARTELLA SHARED/

**Basato su:** REPORT_SHARED.md  
**Target:** Normalizzazione naming, validazioni schema, developer experience  
**Approccio:** Chirurgico, zero regressioni, impatto misurato

---

## AZIONI PROPOSTE

### SH-01: Normalizzazione Naming supplier/fornitore
**Descrizione:** Standardizza terminologia su "supplier" in tutto il progetto (shared + server + frontend)  
**Motivazione:** Disallineamento critico: shared/server usa "supplier", frontend usa "fornitore" (27 file)  
**Rischio:** ALTO (breaking change massivo, 27+ file frontend coinvolti)  
**Impatto:** ALTO (consistenza, manutenibilità, eliminazione compatibility layer)  
**Rollback:** Ripristina "fornitore" nel frontend, mantieni compatibility layer server  
**Prove:** `npm run build && npm run typecheck && npm run test` verdi

### SH-02: Aggiunta Enum Types per Wine.type
**Descrizione:** Sostituisci varchar con enum PostgreSQL per wine.type ('rosso','bianco','bollicine','rosato')  
**Motivazione:** Schema attuale permette valori non validi, mancanza type safety database-level  
**Rischio:** MEDIO (migrazione database, possibili valori esistenti non conformi)  
**Impatto:** MEDIO (data integrity, type safety, validazione automatica)  
**Rollback:** Ripristina varchar, rimuovi constraint enum  
**Prove:** `npm run build && npm run typecheck && test database operations` verdi

### SH-03: Aggiunta Validazioni Schema Avanzate
**Descrizione:** Aggiungi check constraints per price > 0, inventory >= 0, minStock >= 0  
**Motivazione:** Schema attuale permette valori negativi illogici per business logic  
**Rischio:** MEDIO (migrazione database, possibili dati esistenti non conformi)  
**Impatto:** MEDIO (data integrity, business rules enforcement)  
**Rollback:** Rimuovi check constraints aggiunti  
**Prove:** `npm run build && test edge cases with negative values` verdi

### SH-04: Separazione Schema in Moduli
**Descrizione:** Spezza schema.ts in wines.schema.ts e googleSheets.schema.ts  
**Motivazione:** Singolo file cresce, separazione concerns per scalabilità  
**Rischio:** BASSO (refactoring import paths)  
**Impatto:** BASSO (organizzazione, scalabilità futura)  
**Rollback:** Riconsolida in schema.ts unico, aggiorna import  
**Prove:** `npm run build && npm run typecheck` verdi

### SH-05: Aggiunta JSDoc Documentazione Tipi
**Descrizione:** Documenta tutti i tipi esportati con JSDoc comments descrittivi  
**Motivazione:** Mancanza documentazione per developer experience  
**Rischio:** BASSO (solo aggiunta commenti)  
**Impatto:** BASSO (developer experience, IDE intellisense)  
**Rollback:** Rimuovi commenti JSDoc aggiunti  
**Prove:** `npm run build && npm run typecheck` verdi

### SH-06: Aggiunta Indici Database Performance
**Descrizione:** Aggiungi indici su wine.supplier, wine.type, wine.userId per query performance  
**Motivazione:** Query frequenti su questi campi senza ottimizzazione  
**Rischio:** BASSO (solo aggiunta indici, nessun breaking change)  
**Impatto:** MEDIO (performance query, scalabilità)  
**Rollback:** Rimuovi indici creati  
**Prove:** `npm run build && test query performance` verdi

### SH-07: Migrazione a Drizzle Kit Latest
**Descrizione:** Aggiorna Drizzle ORM e kit alla versione più recente disponibile  
**Motivazione:** Possibili miglioramenti performance e nuove features  
**Rischio:** MEDIO (breaking changes potenziali in Drizzle API)  
**Impatto:** BASSO (features, performance marginale)  
**Rollback:** Ripristina versione Drizzle precedente  
**Prove:** `npm run build && npm run typecheck && test all database operations` verdi

### SH-08: Aggiunta Schema Validation Runtime
**Descrizione:** Integra Zod per validazione runtime dei tipi Wine/InsertWine  
**Motivazione:** Type safety solo compile-time, mancanza validazione runtime  
**Rischio:** MEDIO (aggiunta dependency, possibili performance impact)  
**Impatto:** ALTO (type safety runtime, error handling migliorato)  
**Rollback:** Rimuovi Zod, ripristina validazione manuale  
**Prove:** `npm run build && test invalid data scenarios` verdi

---

## CHECKLIST FASE 2

**Sequenza Ordinata Esecuzione:**

### FASE 2A - Preparazione (Rischio Basso)
1. **SH-05** - JSDoc Documentazione Tipi
2. **SH-06** - Indici Database Performance  
3. **SH-07** - Migrazione Drizzle Kit Latest

### FASE 2B - Validazioni e Constraints (Rischio Medio)
4. **SH-02** - Enum Types per Wine.type
5. **SH-03** - Validazioni Schema Avanzate
6. **SH-08** - Schema Validation Runtime

### FASE 2C - Refactoring Strutturale (Rischio Alto)
7. **SH-04** - Separazione Schema in Moduli
8. **SH-01** - Normalizzazione Naming (ULTIMO - massimo impatto)

---

## CRITERI SUCCESSO

### Pre-Condizioni
- ✅ Backup database completato
- ✅ Branch feature/shared-optimization creato
- ✅ Test suite database funzionante

### Post-Condizioni Ogni Azione
- ✅ `npm run build` verde
- ✅ `npm run typecheck` verde  
- ✅ `npm run lint` verde
- ✅ Database operations funzionanti
- ✅ Frontend/server comunicazione invariata

### Metriche Target
- **Type Safety**: Validazione runtime + compile-time
- **Performance**: Query ottimizzate con indici
- **Consistenza**: Terminologia unificata progetto
- **Manutenibilità**: Schema modulare e documentato

---

## NOTE IMPLEMENTAZIONE

### Priorità Esecuzione
1. **CRITICA:** SH-01 (naming consistency)
2. **ALTA:** SH-02, SH-03, SH-08 (validazioni)  
3. **MEDIA:** SH-05, SH-06 (DX e performance)
4. **BASSA:** SH-04, SH-07 (refactoring e upgrade)

### Rollback Strategy
- Ogni azione ha rollback specifico documentato
- Branch feature permette git revert rapido
- Backup database pre-FASE 2 obbligatorio

### Validazione Continua
- Test dopo ogni azione (non batch)
- Commit atomici per rollback granulare
- Verifica frontend/server integration ad ogni step

### Considerazioni Speciali

**SH-01 (Naming):** Richiede coordinamento con team frontend
**SH-02/SH-03:** Necessaria migrazione database production
**SH-08:** Valutare impatto performance su operazioni critiche

---

**STATO:** Piano pronto per approvazione ed esecuzione FASE 2  
**NEXT:** Attendere conferma USER per avvio implementazione

**NOTA CRITICA:** SH-01 ha impatto massimo - considerare implementazione graduale o feature flag per rollback sicuro
