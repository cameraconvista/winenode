# DIAGNOSI PAGINA "CREA ORDINE" - 24/09/2025

## 🔍 PROBLEMI IDENTIFICATI:

### 1. OVERLAY/BACKDROP RESIDUO
- **CarrelloModal** ha overlay `fixed inset-0 z-40` che rimane in DOM
- Usa `visibility: hidden` invece di unmount completo
- Potenziale interferenza con touch events su CreateOrderPage

### 2. QUANTITÀ (+/−) NON FUNZIONANTI
- Store Zustand: ✅ Logica corretta (setQuantity, getQuantity)
- Hook useOrderDraft: ✅ handleQuantityChange implementato
- WineRow: ✅ Props passate correttamente a QuantityControl
- **PROBLEMA**: Possibile re-render o selector non ottimale

### 3. TOGGLE BOTTIGLIE/CARTONI
- Store: ✅ getUnit/setQuantity supportano unità
- Hook: ⚠️ handleUnitChange resetta quantità a 0 (comportamento confuso)
- **PROBLEMA**: Reset quantità non intuitivo per utente

### 4. SUBMIT "CONFERMA ORDINE"
- **PROBLEMA**: handleConfirmOrder usa console.log + navigate('/') immediato
- Manca: await API call, try/catch, gestione errori
- Redirect automatico senza conferma successo

## 🎯 PRIORITÀ FIX:
1. Rimuovere overlay CarrelloModal residuo
2. Verificare re-render quantità (selectors Zustand)
3. Migliorare UX toggle unità (mantenere quantità)
4. Implementare submit robusto con API + error handling
