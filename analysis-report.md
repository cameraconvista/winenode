# ANALISI CHIRURGICA - OrdineModal.tsx

## 📊 METRICHE ATTUALI
- **Righe totali**: 610 linee
- **Funzione attuale**: Solo selezione fornitore (Step 1)
- **Codice utilizzato**: ~15% del totale
- **Codice obsoleto**: ~85% del totale

## 🔍 ANALISI DETTAGLIATA

### IMPORTS UTILIZZATI ✅
- `useEffect, useState` - NECESSARI
- `useNavigate` - NECESSARIO per navigazione
- `useSuppliers` - NECESSARIO per lista fornitori

### IMPORTS OBSOLETI ❌
- `useWines` - NON UTILIZZATO (era per Step 2-4)
- `useOrdini` - NON UTILIZZATO (era per salvataggio)

### STATE UTILIZZATO ✅
- `selectedFornitore` - NECESSARIO per selezione
- `step` - NECESSARIO (ma solo "fornitore")

### STATE OBSOLETO ❌
- `selectedFornitoreId` - NON UTILIZZATO
- `ordineQuantities` - NON UTILIZZATO (era per Step 2)
- `ordineMode` - NON UTILIZZATO (era per Step 2)
- `ordineData` - NON UTILIZZATO (era per Step 3-4)

### CODICE FUNZIONANTE (Step 1) ✅
- Linee 85-149: Selezione fornitore
- Funzione `handleAvanti()`: Navigazione corretta

### CODICE OBSOLETO (Step 2-4) ❌
- Linee 152-401: Step "vini" - MAI RAGGIUNTO
- Linee 404-481: Step "riassunto" - MAI RAGGIUNTO  
- Linee 484-611: Step "successo" - MAI RAGGIUNTO

## 🚨 PROBLEMI IDENTIFICATI

### ERRORI TYPESCRIPT
- `w.ordineMinimo` - Proprietà non esistente su WineType
- `w.unitaOrdine` - Proprietà non esistente su WineType
- Riferimenti a proprietà inesistenti nel codice obsoleto

### CODICE MORTO
- 85% del file non viene mai eseguito
- Logica completa di gestione ordini duplicata
- Hook inutilizzati che rallentano il componente

### INCONSISTENZE
- Props `onFornitoreSelezionato` non utilizzata
- Step system progettato per 4 fasi, usato solo per 1

## 💡 PIANO DI PULIZIA CHIRURGICA

### FASE 1: RIMOZIONE SICURA
1. Rimuovere imports inutilizzati
2. Rimuovere state obsoleto
3. Rimuovere Step 2-4 (linee 152-611)
4. Rimuovere props non utilizzate

### FASE 2: SEMPLIFICAZIONE
1. Eliminare sistema step (solo fornitore)
2. Semplificare logica di reset
3. Ottimizzare rendering

### FASE 3: MODULARIZZAZIONE
1. Creare `SupplierSelector` component
2. Mantenere solo logica modale base
3. Separare logica di navigazione

## 📈 RISULTATO ATTESO
- **Riduzione**: Da 610 a ~100 linee (-83%)
- **Performance**: Eliminazione hook inutilizzati
- **Manutenibilità**: Codice pulito e focalizzato
- **Sicurezza**: Zero impatto su funzionalità esistenti

## ⚠️ RISCHI MITIGATI
- Backup completo eseguito
- Analisi pre-intervento completata
- Mantenimento funzionalità critiche
- Test incrementale durante pulizia
