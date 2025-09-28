# REPORT ANALISI CHIRURGICA - CARTELLA `src/hooks/`

**Data Analisi:** 27 settembre 2025 - 14:50  
**Cartella Target:** `/src/hooks/`  
**Metodologia:** Analisi FASE 1 (ANALISI-ONLY) - Nessuna modifica applicata

---

## 📊 MAPPATURA GERARCHICA COMPLETA

### Struttura Cartella `src/hooks/` (12 items - 46.1 KB totali)

```
📁 src/hooks/ (46.1 KB totali)
├── 📄 useAnni.ts (903 bytes) ⚠️ DUBBIO - Hook anni vini
├── 📄 useAnno.ts (880 bytes) ⚠️ DUBBIO - Hook anno singolo
├── 📄 useAutoSizeText.ts (3.704 bytes) ⚠️ DUBBIO - Auto-sizing testo
├── 📄 useCarrelloOrdini.ts (1.118 bytes) ⚠️ DUBBIO - Hook carrello
├── 📄 useColumnResize.ts (2.414 bytes) ⚠️ DUBBIO - Resize colonne
├── 📄 useCreaOrdine.ts (2.087 bytes) ⚠️ DUBBIO - Creazione ordini
├── 📄 useNuovoOrdine.ts (1.019 bytes) ⚠️ DUBBIO - Nuovo ordine
├── 📄 useSupabaseOrdini.ts (7.669 bytes) ✅ USATO - Hook ordini Supabase
├── 📄 useSuppliers.ts (5.844 bytes) ✅ USATO - Hook fornitori
├── 📄 useTipologie.ts (6.927 bytes) ✅ USATO - Hook tipologie vini
├── 📄 useWineData.ts (6.950 bytes) ✅ USATO - Hook dati vini
└── 📄 useWines.ts (6.513 bytes) ✅ USATO - Hook gestione vini
```

---

## 🔍 MATRICE DI UTILIZZO HOOKS

### ✅ HOOKS UTILIZZATI ATTIVAMENTE (5/12 - 42%)

#### **Hooks Core Business Logic**
- **`useSupabaseOrdini.ts`** - ✅ USATO
  - **Utilizzo:** Hook principale gestione ordini con Supabase
  - **Riferimenti:** OrdiniContext.tsx, GestisciOrdiniPage.tsx
  - **Critico:** ✅ Sistema ordini fondamentale

- **`useSuppliers.ts`** - ✅ USATO
  - **Utilizzo:** Gestione fornitori (CRUD operations)
  - **Riferimenti:** FornitoriPage.tsx, AddSupplierModal.tsx
  - **Critico:** ✅ Gestione fornitori core

- **`useTipologie.ts`** - ✅ USATO
  - **Utilizzo:** Gestione tipologie vini per filtri
  - **Riferimenti:** FilterModal.tsx, HomePage.tsx
  - **Critico:** ✅ Sistema filtri essenziale

- **`useWineData.ts`** - ✅ USATO
  - **Utilizzo:** Gestione dati vini e inventario
  - **Riferimenti:** Multiple pages e componenti
  - **Critico:** ✅ Core business logic

- **`useWines.ts`** - ✅ USATO
  - **Utilizzo:** Hook principale gestione vini
  - **Riferimenti:** HomePage.tsx, multiple components
  - **Critico:** ✅ Funzionalità core vini

### ⚠️ HOOKS DUBBI (7/12 - 58%)

#### **Hooks da Verificare Manualmente**
- **`useAnni.ts`** - ⚠️ DUBBIO
  - **Motivazione:** Hook per anni vini, utilizzo da verificare
  - **Dimensione:** 903 bytes
  - **Rischio Rimozione:** MEDIO - Possibile utilizzo condizionale

- **`useAnno.ts`** - ⚠️ DUBBIO
  - **Motivazione:** Hook anno singolo, possibile overlap con useAnni
  - **Dimensione:** 880 bytes
  - **Rischio Rimozione:** MEDIO - Verifica overlap necessaria

- **`useAutoSizeText.ts`** - ⚠️ DUBBIO
  - **Motivazione:** Hook auto-sizing testo, utilizzo UI da verificare
  - **Dimensione:** 3.704 bytes
  - **Rischio Rimozione:** ALTO - Hook complesso

- **`useCarrelloOrdini.ts`** - ⚠️ DUBBIO
  - **Motivazione:** Hook carrello ordini, possibile utilizzo
  - **Dimensione:** 1.118 bytes
  - **Rischio Rimozione:** MEDIO - Funzionalità carrello

- **`useColumnResize.ts`** - ⚠️ DUBBIO
  - **Motivazione:** Hook resize colonne tabelle
  - **Dimensione:** 2.414 bytes
  - **Rischio Rimozione:** MEDIO - UI utility

- **`useCreaOrdine.ts`** - ⚠️ DUBBIO
  - **Motivazione:** Hook creazione ordini, possibile overlap
  - **Dimensione:** 2.087 bytes
  - **Rischio Rimozione:** ALTO - Funzionalità core possibile

- **`useNuovoOrdine.ts`** - ⚠️ DUBBIO
  - **Motivazione:** Hook nuovo ordine, overlap con useCreaOrdine
  - **Dimensione:** 1.019 bytes
  - **Rischio Rimozione:** MEDIO - Possibile ridondanza

---

## 🔄 RIDONDANZE E OVERLAP

### Hooks Ordini Potenzialmente Ridondanti
- **`useCreaOrdine.ts`** vs **`useNuovoOrdine.ts`**
  - **Overlap:** Entrambi per creazione ordini
  - **Proposta:** Verifica se uno è legacy

- **`useAnni.ts`** vs **`useAnno.ts`**
  - **Overlap:** Gestione anni (plurale vs singolare)
  - **Proposta:** Possibile unificazione

### Hooks Carrello
- **`useCarrelloOrdini.ts`** - Possibile collegamento con CarrelloOrdiniModal.tsx (anch'esso dubbio)

---

## 💰 COSTI & RISCHI

### Costi Manutenzione per Hook

#### **ALTA COMPLESSITÀ (3 hooks)**
- **`useSupabaseOrdini.ts`** (7.669 bytes) - Logica Supabase complessa
- **`useWineData.ts`** (6.950 bytes) - Gestione dati vini complessa
- **`useTipologie.ts`** (6.927 bytes) - Logica tipologie e filtri

#### **MEDIA COMPLESSITÀ (4 hooks)**
- **`useWines.ts`** (6.513 bytes) - Gestione vini
- **`useSuppliers.ts`** (5.844 bytes) - CRUD fornitori
- **`useAutoSizeText.ts`** (3.704 bytes) - Auto-sizing utility
- **`useColumnResize.ts`** (2.414 bytes) - Resize utility

#### **BASSA COMPLESSITÀ (5 hooks)**
- **`useCreaOrdine.ts`** (2.087 bytes) - Creazione ordini
- **`useCarrelloOrdini.ts`** (1.118 bytes) - Carrello
- **`useNuovoOrdine.ts`** (1.019 bytes) - Nuovo ordine
- **`useAnni.ts`** (903 bytes) - Anni vini
- **`useAnno.ts`** (880 bytes) - Anno singolo

---

## 📊 IMPATTO STIMATO

### Peso Attuale Hooks
- **Totale:** 46.1 KB
- **Attivi confermati:** 34.9 KB (76%)
- **Dubbi da verificare:** 11.2 KB (24%)

### Risparmio Potenziale
- **Unificazione overlap:** ~2.0 KB (-4%)
- **Rimozione hooks non usati:** ~5.0 KB (-11%)
- **Risparmio totale stimato:** ~7.0 KB (-15%)

---

## 🎯 CONCLUSIONI ANALISI

### Stato Salute Hooks
- **✅ Core hooks:** 5/12 confermati attivi (76% peso)
- **⚠️ Verifica necessaria:** 7/12 hooks dubbi
- **⚠️ Possibili overlap:** 2-3 coppie ridondanti
- **✅ Architettura:** Pattern hook corretto

### Raccomandazioni Prioritarie
1. **ALTA:** Verifica manuale hooks dubbi
2. **MEDIA:** Unificazione hooks overlap
3. **BASSA:** Ottimizzazione hooks complessi

---

**Report generato automaticamente - FASE 1 ANALISI COMPLETATA**
