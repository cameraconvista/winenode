# DIAGNOSI LAMPO - REFAC CHIRURGICO

## FLUSSO ATTUALE CONFERMATO:
a) Click "Nuovo Ordine" da Carrello → apre OrdineModal (solo Step 1: selezione fornitore)
b) Dopo selezione fornitore → navigate('/orders/create?supplier=ID') → CreateOrderPage

## SPRECHI IN OrdineModal.tsx (610 righe):
- Step 2-4 (linee 152-611): MAI RAGGIUNTI - codice morto 85%
- Import inutili: useWines, useOrdini
- State inutili: ordineQuantities, ordineMode, ordineData, selectedFornitoreId
- Errori TS: w.ordineMinimo, w.unitaOrdine (proprietà inesistenti)
- Props non usate: onFornitoreSelezionato

## REFACTORING CHIRURGICO COMPLETATO ✅

### FASI 0-5 COMPLETATE:
✅ FASE 0: Backup + Tag (orders-refac-start-20250924-0235)
✅ FASE 1: Diagnosi lampo completata
✅ FASE 2: NewOrderModal pulito (610→100 righe, -83% codice morto)
✅ FASE 3: Struttura modulare creata (src/features/orders/)
✅ FASE 4: Store orderDraft + useOrderDraft hook (Zustand)
✅ FASE 5: Componenti modulari integrati in CreateOrderPage

### COMPONENTI CREATI:
- NewOrderModal.tsx (solo selezione fornitore)
- SupplierSelect.tsx (select riusabile)
- WineRow.tsx (riga vino + controlli)
- QuantityControl.tsx (pulsanti +/- isolati)
- OrderTotalsBar.tsx (sub-summary)
- orderDraft.store.ts (state centralizzato)
- useOrderDraft.ts (API hook)

### RISULTATI:
- Codice ridotto: 610→100 righe (-83%)
- Errori TypeScript: Risolti
- Performance: +Zustand, -hook inutilizzati
- Modularità: Componenti riusabili
- Flusso utente: Identico e funzionante
