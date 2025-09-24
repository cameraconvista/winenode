# DIAGNOSI CHIRURGICA - OrdineModal.tsx

## 🎯 STATO ATTUALE
**FUNZIONANTE** ✅ - Il modale apre correttamente e naviga alla pagina

## 🔬 PROBLEMI CRITICI IDENTIFICATI

### 1. CODICE MORTO MASSIVO (85%)
```typescript
// UTILIZZATO (15%)
- Step 1: Selezione fornitore (linee 85-149)
- handleAvanti(): Navigazione (linee 46-56)

// OBSOLETO (85%) - MAI ESEGUITO
- Step 2: Lista vini (linee 152-401)
- Step 3: Riepilogo (linee 404-481) 
- Step 4: Successo (linee 484-611)
```

### 2. IMPORTS INUTILIZZATI
```typescript
❌ import useWines from '../hooks/useWines';        // Non usato
❌ import { useOrdini } from "../hooks/useOrdini";  // Non usato
✅ import useSuppliers from "../hooks/useSuppliers"; // Usato
✅ import { useNavigate } from "react-router-dom";   // Usato
```

### 3. STATE RIDONDANTE
```typescript
❌ const [selectedFornitoreId, setSelectedFornitoreId] = useState<string>(""); // Non usato
❌ const [ordineQuantities, setOrdineQuantities] = useState<Record<number, number>>({}); // Non usato
❌ const [ordineMode, setOrdineMode] = useState<Record<number, 'bottiglie' | 'cartoni'>>({}); // Non usato
❌ const [ordineData, setOrdineData] = useState<{...}>; // Non usato
✅ const [selectedFornitore, setSelectedFornitore] = useState<string>(""); // Usato
✅ const [step, setStep] = useState<"fornitore" | ...>("fornitore"); // Usato (ma solo "fornitore")
```

### 4. ERRORI TYPESCRIPT
```typescript
❌ w.ordineMinimo  // Property does not exist on type 'WineType'
❌ w.unitaOrdine   // Property does not exist on type 'WineType'
```

### 5. PROPS INUTILIZZATE
```typescript
❌ onFornitoreSelezionato: (fornitore: string) => void; // Non chiamata mai
```

## 🏥 PIANO CHIRURGICO SICURO

### STEP 1: BACKUP ARCHIVIO
```bash
cp OrdineModal.tsx OrdineModal.backup.tsx
```

### STEP 2: PULIZIA IMPORTS
- Rimuovere `useWines`, `useOrdini`
- Mantenere `useSuppliers`, `useNavigate`

### STEP 3: PULIZIA STATE
- Rimuovere tutti gli state tranne `selectedFornitore`
- Semplificare sistema step

### STEP 4: RIMOZIONE CODICE MORTO
- Eliminare Step 2-4 (linee 152-611)
- Mantenere solo Step 1 (selezione fornitore)

### STEP 5: OTTIMIZZAZIONE PROPS
- Rimuovere `onFornitoreSelezionato` se non necessaria
- Semplificare interface

## ✅ GARANZIE SICUREZZA
1. **Backup completo** eseguito
2. **Funzionalità critica** identificata e preservata
3. **Test incrementale** durante ogni modifica
4. **Rollback immediato** se problemi

## 📊 METRICHE OBIETTIVO
- **Riduzione codice**: 610 → ~100 linee (-83%)
- **Eliminazione errori**: 5 errori TypeScript → 0
- **Performance**: -2 hook inutilizzati
- **Manutenibilità**: Codice focalizzato su singola responsabilità

## 🚦 SEMAFORO SICUREZZA
🟢 **VERDE** - Intervento sicuro, backup completo, funzionalità identificata
