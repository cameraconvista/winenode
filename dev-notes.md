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

## AZIONE: Pulizia chirurgica + modularizzazione completa
