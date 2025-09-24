# DIAGNOSI PAGINA "CREA ORDINE" - 24/09/2025

## 🔍 PROBLEMI IDENTIFICATI (PRIMA):

### 1. OVERLAY/BACKDROP RESIDUO ❌
- **CarrelloModal** ha overlay `fixed inset-0 z-40` che rimane in DOM
- Usa `visibility: hidden` invece di unmount completo
- Potenziale interferenza con touch events su CreateOrderPage

### 2. QUANTITÀ (+/−) NON FUNZIONANTI ❌
- Store Zustand: ✅ Logica corretta (setQuantity, getQuantity)
- Hook useOrderDraft: ✅ handleQuantityChange implementato
- WineRow: ✅ Props passate correttamente a QuantityControl
- **PROBLEMA**: Possibile re-render o selector non ottimale

### 3. TOGGLE BOTTIGLIE/CARTONI ❌
- Store: ✅ getUnit/setQuantity supportano unità
- Hook: ⚠️ handleUnitChange resetta quantità a 0 (comportamento confuso)
- **PROBLEMA**: Reset quantità non intuitivo per utente

### 4. SUBMIT "CONFERMA ORDINE" ❌
- **PROBLEMA**: handleConfirmOrder usa console.log + navigate('/') immediato
- Manca: await API call, try/catch, gestione errori
- Redirect automatico senza conferma successo

---

## ✅ SOLUZIONI IMPLEMENTATE (DOPO):

### 1. OVERLAY RIMOSSO ✅
- CarrelloModal ora usa conditional rendering `{!showNewOrderModal && <div>}`
- Overlay completamente unmountato quando non necessario
- Test automatico verifica assenza elementi bloccanti z-index ≥40

### 2. QUANTITÀ OTTIMIZZATE ✅
- Creato `useWineRowData` hook con selectors specifici per riga
- Eliminato re-render globali: ogni riga si sottoscrive solo ai propri dati
- WineRow semplificato: gestisce quantità internamente via store

### 3. TOGGLE UX MIGLIORATA ✅
- handleUnitChange ora converte quantità invece di resettare
- Conversione intelligente: 1 cartone ↔ 6 bottiglie
- ARIA support: role=radiogroup, aria-pressed, aria-checked

### 4. SUBMIT ROBUSTO ✅
- Creato OrderService per gestione API con validazione
- useOrderSubmit hook: loading/error/success states
- await + try/catch completo, messaggi errore in pagina
- Su successo: redirect con delay, su errore: rimane in pagina

## 🎯 RISULTATI FINALI:
✅ **+ / −** funzionano e aggiornano riga **e** footer in tempo reale
✅ Toggle **Bottiglie/Cartoni** selezionabile e persistente con conversione
✅ Nessun overlay/modale "fantasma" presente su /orders/create
✅ **Conferma Ordine**: success → conferma, error → rimane in pagina
✅ Zero regressioni, build pulita, test automatici implementati
