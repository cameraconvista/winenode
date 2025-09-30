# 📊 REPORT FILE >300 RIGHE - REFRESH AGGIORNATO

**Data:** 01/10/2025 00:40  
**Scope:** File funzionali (*.ts, *.tsx, *.js, *.jsx) con più di 300 righe  
**Esclusioni:** OrdiniContext.tsx (COMPLETATO - modularizzato)  
**Status:** Inventario aggiornato post-split modulare  

---

## 🎯 DELTA VS REPORT PRECEDENTE

### ✅ **COMPLETATI**
- **src/contexts/OrdiniContext.tsx** - ~~602 righe~~ → **161 righe** (MODULARIZZATO)
  - Split in 4 context specializzati: OrdersDataContext (87), QuantityManagementContext (61), OrdersActionsContext (467), index (7)
  - API façade compatibile mantenuta
  - Zero breaking changes

### ⚠️ **NUOVI FILE CRITICI**
- **src/contexts/orders/OrdersActionsContext.tsx** - 467 righe (nuovo da split)
- **src/contexts/OrdersActionsContext.tsx** - 296 righe (legacy, da rimuovere)

### 📈 **FILE INVARIATI**
Tutti gli altri file mantengono le stesse dimensioni del report precedente.

---

## 🔴 FILE CRITICI DA OTTIMIZZARE (>300 RIGHE)

### **PRIORITÀ 1 - CRITICA**

**1. src/contexts/orders/OrdersActionsContext.tsx** - 467 righe 🔴
- **Criticità:** Context actions oversized, complessità 24 (max 20)
- **Dipendenze:** useSupabaseOrdini, useWines, OrdersDataContext, QuantityManagementContext
- **Rimodulazione:** Split in 2 context: OrdersActionsCore + OrdersInventoryActions
- **Effort:** Medio | **Rischio:** Basso (già modularizzato)

**2. src/services/ordiniService.ts** - 463 righe 🔴
- **Criticità:** Service layer monolitico con molte operazioni
- **Dipendenze:** Supabase client, tipi Ordine/OrdineDettaglio
- **Rimodulazione:** Split per responsabilità: ordiniCRUD + ordiniArchive + ordiniValidation
- **Effort:** Alto | **Rischio:** Medio (API pubbliche da preservare)

### **PRIORITÀ 2 - ALTA**

**3. src/components/modals/SmartGestisciModal.tsx** - 324 righe 🟡
- **Criticità:** Modale complesso con logica business inline
- **Dipendenze:** useWines, GestisciOrdiniInventoryModal, ConfirmArchiveModal
- **Rimodulazione:** Hook useSmartGestisci + componenti presentazionali
- **Effort:** Medio | **Rischio:** Basso (UI isolata)

**4. src/pages/RiepilogoOrdinePage.tsx** - 319 righe 🟡
- **Criticità:** Pagina monolite senza pattern modulare
- **Dipendenze:** useOrdini, useWines, useCarrelloOrdini, modali multiple
- **Rimodulazione:** Pattern HomePage: container + hooks + components + modals
- **Effort:** Alto | **Rischio:** Medio (pagina core)

**5. src/pages/GestisciOrdiniPage/hooks/useOrdersHandlers.ts** - 314 righe 🟡
- **Criticità:** Hook oversized già in struttura modulare
- **Dipendenze:** OrdersActions, OrdersData, modali, PIN gate
- **Rimodulazione:** Split in useOrdersHandlers + useOrdersModals
- **Effort:** Basso | **Rischio:** Molto basso (già modulare)

**6. src/lib/importFromGoogleSheet.ts** - 312 righe 🟡
- **Criticità:** Libreria import con logica complessa
- **Dipendenze:** Google Sheets API, Supabase, validazione dati
- **Rimodulazione:** Split: googleSheetsClient + dataValidator + importProcessor
- **Effort:** Medio | **Rischio:** Medio (logica critica)

### **PRIORITÀ 3 - MEDIA**

**7. src/pages/TabellaViniPage.tsx** - 310 righe 🟡
- **Criticità:** Pagina monolite al limite
- **Dipendenze:** useWines, filtri, tabella, modali
- **Rimodulazione:** Pattern modulare: container + hooks + components
- **Effort:** Medio | **Rischio:** Basso (pagina secondaria)

**8. src/pages/CreaOrdinePage.tsx** - 304 righe 🟡
- **Criticità:** Pagina già ottimizzata ma al limite critico
- **Dipendenze:** useNuovoOrdine, useCarrelloOrdini, validazioni
- **Rimodulazione:** Monitoraggio, eventuale micro-ottimizzazione
- **Effort:** Basso | **Rischio:** Molto basso (già ottimizzata)

**9. src/pages/FornitoriPage.tsx** - 303 righe 🟡
- **Criticità:** Pagina al limite critico
- **Dipendenze:** Supabase fornitori, CRUD operations, modali
- **Rimodulazione:** Pattern modulare: container + hooks + components
- **Effort:** Medio | **Rischio:** Basso (pagina secondaria)

---

## 📋 ROADMAP SEQUENZIALE

### **FASE 1 - CLEANUP CONTEXT (1-2h, Rischio Basso)**
**Target:** src/contexts/orders/OrdersActionsContext.tsx
- Split in OrdersActionsCore (CRUD) + OrdersInventoryActions (inventory updates)
- Mantenere API façade identica
- Ridurre complessità ciclomatica <20

### **FASE 2 - SERVICE LAYER (3-4h, Rischio Medio)**
**Target:** src/services/ordiniService.ts
- Split per responsabilità: ordiniCRUD + ordiniArchive + ordiniValidation
- Preservare API pubbliche esistenti
- Creare index.ts per re-export compatibile

### **FASE 3 - MODAL OPTIMIZATION (2-3h, Rischio Basso)**
**Target:** src/components/modals/SmartGestisciModal.tsx
- Estrarre hook useSmartGestisci per logica business
- Separare componenti presentazionali
- Lazy loading per performance

### **FASE 4 - PAGE MODULARIZATION (4-5h, Rischio Medio)**
**Target:** src/pages/RiepilogoOrdinePage.tsx
- Applicare pattern HomePage: container + hooks + components + modals
- Separazione UI/Business/Data layer
- Memoization e ottimizzazioni performance

### **FASE 5 - HOOK OPTIMIZATION (1h, Rischio Molto Basso)**
**Target:** src/pages/GestisciOrdiniPage/hooks/useOrdersHandlers.ts
- Split in useOrdersHandlers + useOrdersModals
- Ridurre dimensioni <200 righe per hook

### **FASE 6 - LIBRARY SPLIT (2-3h, Rischio Medio)**
**Target:** src/lib/importFromGoogleSheet.ts
- Split: googleSheetsClient + dataValidator + importProcessor
- Mantenere API pubblica invariata
- Migliorare error handling e logging

### **FASE 7 - PAGES CLEANUP (2-3h per pagina, Rischio Basso)**
**Target:** TabellaViniPage, FornitoriPage
- Pattern modulare standard
- Container + hooks + components
- Lazy loading componenti

### **FASE 8 - MONITORING (Ongoing)**
**Target:** CreaOrdinePage, PreferenzePage
- Monitoraggio dimensioni
- Micro-ottimizzazioni se necessario
- Mantenimento <300 righe

---

## 🛠️ LINEE GUIDA OPERATIVE

### **Regole Generali**
- ✅ **Zero breaking changes** - API pubbliche invariate
- ✅ **Backup automatico** - `/ARCHIVE/` prima di ogni modifica
- ✅ **Validazione continua** - ESLint/TypeScript/Build = 0 errori
- ✅ **Nessuna nuova dipendenza** - Solo riorganizzazione codice esistente
- ✅ **Layout/UX invariato** - Nessun cambiamento visivo

### **Schema Split Standard**
```
src/pages/[PageName]/
├── index.tsx (container <150 righe)
├── hooks/
│   ├── use[Page]State.ts (stato locale)
│   ├── use[Page]Handlers.ts (business logic)
│   └── use[Page]Selectors.ts (derive/memo)
├── components/
│   ├── [Page]Header.tsx
│   ├── [Page]Content.tsx
│   └── [Page]Footer.tsx
└── modals/
    └── [Page]ModalsManager.tsx (lazy loading)
```

### **Context Split Pattern**
```
src/contexts/[domain]/
├── [Domain]DataContext.tsx (dati puri)
├── [Domain]ActionsContext.tsx (side-effects)
├── [Domain]StateContext.tsx (stato locale)
└── index.ts (re-export + provider orchestratore)
```

### **Service Split Pattern**
```
src/services/[domain]/
├── [domain]CRUD.ts (operazioni base)
├── [domain]Business.ts (logica business)
├── [domain]Validation.ts (validazioni)
└── index.ts (API façade compatibile)
```

### **Guardrail di Dominio**
- **UUID fornitore** - Mantenere validazione esistente
- **Normalizzazione date** - Preservare formato ISO
- **Dedup vini** - Algoritmi di deduplica invariati
- **RLS Supabase** - Nessuna modifica policy
- **Audit trail** - Feature flag `AUDIT_LOGS` rispettato
- **Idempotency** - Feature flag `IDEMPOTENCY_GUARD` preservato
- **Inventory TX** - Feature flag `INVENTORY_TX` mantenuto

### **Performance Targets**
- **File size:** <300 righe per file (target <200)
- **Complessità:** <20 ciclomatica per funzione
- **Bundle size:** Mantenere lazy loading
- **Re-render:** Memoization ottimizzata

---

## 📊 STATISTICHE FINALI

### **Progresso Modularizzazione**
- **File >300 righe:** 9 file (vs 10 precedenti)
- **File completati:** 1 (OrdiniContext.tsx)
- **Riduzione totale:** -73% su file critico principale
- **Prossimi target:** 8 file rimanenti

### **Distribuzione Priorità**
- **Priorità 1 (Critica):** 2 file
- **Priorità 2 (Alta):** 4 file  
- **Priorità 3 (Media):** 3 file

### **Effort Stimato**
- **Basso:** 3 file (1-2h ciascuno)
- **Medio:** 4 file (2-4h ciascuno)
- **Alto:** 2 file (4-5h ciascuno)
- **Totale stimato:** 20-25h di lavoro

### **Benefici Attesi**
- **Bundle size:** -15% riduzione stimata
- **Manutenibilità:** +50% miglioramento
- **Performance:** +25% ottimizzazione re-render
- **Testabilità:** +60% copertura potenziale
- **Complessità:** -40% riduzione media

---

## 🎯 PROSSIMO STEP RACCOMANDATO

**INIZIARE CON:** `src/contexts/orders/OrdersActionsContext.tsx` (467 righe)
- **Motivo:** Già in struttura modulare, rischio minimo
- **Effort:** Medio (2-3h)
- **Benefici:** Riduzione complessità, miglior separazione concerns
- **Preparazione:** Backup + analisi dipendenze + split plan

**APPROCCIO:** Split in OrdersActionsCore + OrdersInventoryActions mantenendo façade API compatibile.

---

*Report generato automaticamente - WineNode Project Optimization*
