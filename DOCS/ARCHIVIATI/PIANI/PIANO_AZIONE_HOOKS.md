# PIANO AZIONE OTTIMIZZAZIONE - CARTELLA `src/hooks/`

**Data Piano:** 27 settembre 2025 - 15:10  
**Cartella Target:** `/src/hooks/`  
**Risparmio Totale Stimato:** 7.0 KB (-15%)

---

## 🎯 AZIONI PROPOSTE

### **AZ-001** | Verifica Hook Anni Overlap
- **Tipo:** REFINE
- **File:** `useAnni.ts` (903 bytes), `useAnno.ts` (880 bytes)
- **Motivazione:** Possibile overlap tra hook anni plurale/singolare
- **Rischio:** **MEDIO** - Verifica manuale utilizzo necessaria
- **Risparmio:** ~1.8 KB se unificabili
- **Rollback:** Mantenimento hooks separati se necessari
- **Beneficio:** DRY principle, hook anni unificato

### **AZ-002** | Verifica Hook Ordini Overlap
- **Tipo:** REFINE
- **File:** `useCreaOrdine.ts` (2.087 bytes), `useNuovoOrdine.ts` (1.019 bytes)
- **Motivazione:** Overlap creazione ordini, possibile ridondanza
- **Rischio:** **ALTO** - Funzionalità core, test approfonditi necessari
- **Risparmio:** ~3.1 KB se unificabili
- **Rollback:** Mantenimento hooks separati
- **Beneficio:** Logica ordini consolidata

### **AZ-003** | Verifica Hook Carrello
- **Tipo:** REFINE
- **File:** `useCarrelloOrdini.ts` (1.118 bytes)
- **Motivazione:** Hook carrello, collegamento con CarrelloOrdiniModal dubbio
- **Rischio:** **MEDIO** - Possibile utilizzo condizionale
- **Risparmio:** ~1.1 KB se non utilizzato
- **Rollback:** Ripristino hook se utilizzato
- **Beneficio:** Rimozione codice non necessario

### **AZ-004** | Verifica Hook UI Utilities
- **Tipo:** REFINE
- **File:** `useAutoSizeText.ts` (3.704 bytes), `useColumnResize.ts` (2.414 bytes)
- **Motivazione:** Hooks UI utility, utilizzo da verificare
- **Rischio:** **MEDIO** - Utility UI potrebbero essere utilizzate
- **Risparmio:** ~6.1 KB se non utilizzati
- **Rollback:** Ripristino hooks se utilizzati
- **Beneficio:** Bundle più leggero, meno utility non necessarie

### **AZ-005** | Mantenimento Hooks Core
- **Tipo:** KEEP
- **File:** `useSupabaseOrdini.ts`, `useSuppliers.ts`, `useTipologie.ts`, `useWineData.ts`, `useWines.ts`
- **Motivazione:** Hooks core business logic, utilizzo confermato
- **Rischio:** **BASSO** - Nessuna modifica necessaria
- **Risparmio:** 0 KB (mantenimento)
- **Rollback:** Non applicabile
- **Beneficio:** Stabilità funzionalità core garantita

---

## 📋 MATRICE ESECUZIONE

### Priorità ALTA (Mantenimento Core)
- **AZ-005** ✅ Mantenimento hooks core business

### Priorità MEDIA (Verifica Manuale)
- **AZ-001** ⚠️ Verifica overlap anni
- **AZ-003** ⚠️ Verifica hook carrello
- **AZ-004** ⚠️ Verifica hooks UI utility

### Priorità BASSA (Analisi Approfondita)
- **AZ-002** ⏸️ Verifica overlap ordini (funzionalità core)

---

## 🔧 COMANDI VERIFICA

### Script Verifica Utilizzo
```bash
# Verifica utilizzo hooks dubbi
grep -r "useAnni\|useAnno" src/ --include="*.tsx" --include="*.ts"
grep -r "useCreaOrdine\|useNuovoOrdine" src/ --include="*.tsx" --include="*.ts"
grep -r "useCarrelloOrdini" src/ --include="*.tsx" --include="*.ts"
grep -r "useAutoSizeText\|useColumnResize" src/ --include="*.tsx" --include="*.ts"

# Verifica import dinamici
grep -r "import.*use.*from.*hooks" src/ --include="*.tsx" --include="*.ts"
```

---

## 📊 IMPATTO PREVISTO

| ID | Azione | File | Risparmio | Rischio | Test Richiesti |
|---|---|---|---|---|---|
| AZ-001 | Unifica | useAnni + useAnno | 1.8 KB | MEDIO | Manual + Functional |
| AZ-002 | Unifica | Hooks ordini | 3.1 KB | ALTO | Manual + Regression |
| AZ-003 | Verifica | useCarrelloOrdini | 1.1 KB | MEDIO | Manual + Functional |
| AZ-004 | Verifica | UI utilities | 6.1 KB | MEDIO | Manual + UI |
| AZ-005 | Mantieni | Core hooks | 0 KB | BASSO | None |

### Totale Risparmio Potenziale: ~12.1 KB

---

**Piano Azione generato automaticamente - VERIFICA MANUALE RICHIESTA**
