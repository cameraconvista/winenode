# ANALISI DEPENDENCIES - WINENODE

**Data:** 2025-09-29  
**Strumenti:** madge, dependency-cruiser, analisi manuale  
**Scope:** Diagnosi completa dipendenze e grafi import

---

## 🔴 PROBLEMI CRITICI IDENTIFICATI

### 1. CIRCULAR DEPENDENCY RILEVATA
```
contexts/OrdiniContext.tsx → hooks/useSupabaseOrdini.ts
```

**Impatto:** Potenziali problemi di inizializzazione, bundle splitting inefficiente, rischio di memory leaks.

**Causa:** Il context degli ordini importa l'hook Supabase che potrebbe re-importare il context.

**Raccomandazione chirurgica:**
- Estrarre logica condivisa in un service layer separato
- Implementare dependency injection pattern
- Utilizzare eventi/observer pattern per disaccoppiare

---

## 📊 ANALISI GRAFI IMPORT

### Top 15 Moduli per Dipendenze (Hub Analysis)
```
15 pages/HomePage.tsx          ⚠️  Hub critico - troppi import
13 App.tsx                     ⚠️  Entry point sovraccarico
12 pages/GestisciOrdiniPage.tsx ⚠️  Pagina complessa
11 index.css                   ✅  CSS globale normale
6  SmartGestisciModal*.tsx     ⚠️  Modali duplicate
5  pages/RiepilogoOrdinePage.tsx ✅  Accettabile
4  hooks/useWineData*.ts       ⚠️  Hook duplicati
4  pages/FornitoriPage.tsx     ✅  Accettabile
```

### 🚨 HUB ANOMALI (>10 dipendenze)
1. **HomePage.tsx (15 deps)** - Potenziale God Component
2. **App.tsx (13 deps)** - Entry point sovraccarico
3. **GestisciOrdiniPage.tsx (12 deps)** - Pagina monolitica

---

## 🔍 DEEP IMPORT ANALYSIS

### Import Problematici Rilevati
```typescript
// ❌ Deep import non sicuri
~icons/ph/shopping-cart-light     // 4 unresolved imports
~icons/ph/funnel-light
~icons/ph/bell-light  
~icons/ph/magnifying-glass-light
```

**Problema:** Import di icone non risolti correttamente dal bundler.

**Soluzione:** Configurare correttamente unplugin-icons o sostituire con Lucide React.

---

## 📁 MODULI ORPHAN (0 dipendenze)

### File Completamente Isolati (47 file)
```
✅ SICURI DA MANTENERE:
- styles/*.css (file di stile)
- config/constants.ts (configurazione)
- lib/supabase.ts (client database)
- vite-env.d.ts (types Vite)

⚠️  CANDIDATI RIMOZIONE:
- components/IntroPage.tsx
- components/QuantityPicker.tsx  
- hooks/useColumnResize.ts
- hooks/useFirstLaunch.ts
- pages/TabellaViniPage.tsx
- test/setup*.ts
```

---

## 🔗 CROSS-LAYER IMPORT VIOLATIONS

### Violazioni Architetturali Rilevate
```typescript
// ❌ Pages che importano direttamente da lib/
pages/HomePage.tsx → lib/supabase.ts
pages/ManualWineInsertPage.tsx → lib/googleSheets.ts

// ✅ DOVREBBE ESSERE:
pages/ → hooks/ → services/ → lib/
```

**Raccomandazione:** Implementare layer di astrazione con custom hooks.

---

## 📈 METRICHE COMPLESSITÀ

### Distribuzione Dipendenze
- **0 deps:** 47 file (49%) - Molti orphan
- **1-3 deps:** 35 file (36%) - Normale
- **4-9 deps:** 12 file (13%) - Accettabile  
- **10+ deps:** 3 file (3%) - ⚠️ Critico

### Indici di Accoppiamento
- **Afferent Coupling (Ca):** HomePage.tsx = 15 (troppo alto)
- **Efferent Coupling (Ce):** Molti file = 0 (orphan problem)
- **Instability (I):** Ce/(Ca+Ce) - Da calcolare per refactor

---

## 🎯 QUICK WINS IDENTIFICATI

### 1. Risoluzione Circular Dependency
**Tempo:** 2-3h  
**Rischio:** Basso  
**Beneficio:** Eliminazione warning, migliore tree-shaking

### 2. Consolidamento Icon Imports  
**Tempo:** 1h  
**Rischio:** Molto basso  
**Beneficio:** Bundle size ridotto, import risolti

### 3. Estrazione Service Layer
**Tempo:** 4-6h  
**Rischio:** Medio  
**Beneficio:** Architettura più pulita, testabilità

---

## 📋 MATRICE DECISIONALE

| File/Pattern | Strumento | Sicurezza Rimozione | Azione |
|--------------|-----------|-------------------|---------|
| `**/\* 2.tsx` | madge+unimported | ✅ Alta | RIMUOVI |
| `test/setup*.ts` | madge+ts-prune | ✅ Alta | RIMUOVI |
| `hooks/useColumnResize.ts` | madge+unimported | ⚠️ Media | VERIFICA |
| `pages/TabellaViniPage.tsx` | madge+unimported | ⚠️ Media | VERIFICA |
| Circular deps | madge | ❌ Critico | RISOLVI |

---

## 🛠️ PIANO INTERVENTI CHIRURGICI

### Fase 1: Pulizia Sicura (1-2h)
1. Rimuovere file `* 2.tsx` duplicati
2. Eliminare `test/setup*.ts` non utilizzati  
3. Configurare unplugin-icons correttamente

### Fase 2: Risoluzione Circular (2-3h)
1. Analizzare dipendenza OrdiniContext ↔ useSupabaseOrdini
2. Estrarre service layer condiviso
3. Implementare dependency injection

### Fase 3: Refactor Architetturale (4-6h)
1. Ridurre dipendenze HomePage.tsx (15→8)
2. Implementare layer pattern pages→hooks→services→lib
3. Consolidare modali duplicate

---

## 📊 BASELINE METRICHE

### Pre-Intervento
- **Circular Dependencies:** 1
- **Unresolved Imports:** 4  
- **Orphan Files:** 47
- **God Components:** 3
- **Bundle Chunks:** 28

### Target Post-Intervento
- **Circular Dependencies:** 0
- **Unresolved Imports:** 0
- **Orphan Files:** <30
- **God Components:** 0  
- **Bundle Chunks:** <25

---

## ⚠️ RISCHI E MITIGAZIONI

### Rischi Identificati
1. **Breaking Changes:** Refactor circular dependency
2. **Import Errors:** Rimozione file utilizzati dinamicamente
3. **Performance Regression:** Cambio architettura

### Mitigazioni
1. **Test Coverage:** E2E smoke test prima/dopo
2. **Rollback Plan:** Git branch + feature flags
3. **Incremental Approach:** Un file alla volta
4. **Validation:** Build + TypeScript check ogni step

---

**NEXT STEPS:** Procedere con analisi unused code per validazione incrociata prima degli interventi.
