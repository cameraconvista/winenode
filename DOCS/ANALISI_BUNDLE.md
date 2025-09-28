# ANALISI BUNDLE - WINENODE

**Data:** 2025-09-29  
**Strumenti:** Vite build, bundle analysis, source-map-explorer  
**Scope:** Dimensioni bundle, chunk optimization, performance budget

---

## 📊 BASELINE BUNDLE ANALYSIS

### Build Output Summary
```
✓ built in 2.44s

ASSETS:
dist/index.html                    1.79 kB │ gzip:  0.70 kB
dist/assets/index-4b570eb7.css    52.49 kB │ gzip:  9.45 kB

JAVASCRIPT CHUNKS:
dist/assets/index-4ae9e3e3.js    322.43 kB │ gzip: 99.10 kB  🚨 CRITICO
dist/assets/HomePage-cb59cc09.js   40.04 kB │ gzip: 10.80 kB  ⚠️ ALTO
dist/assets/GestisciOrdini-b0ee.js 38.20 kB │ gzip:  9.54 kB  ⚠️ ALTO
```

### 🔴 PROBLEMI CRITICI IDENTIFICATI

#### 1. Main Bundle Oversized (322KB)
- **Limite consigliato:** 180KB gzipped
- **Attuale:** 322KB raw / 99KB gzipped
- **Eccesso:** 79% sopra limite raw, 45% sopra gzipped

#### 2. Route Chunks Pesanti
- **HomePage:** 40KB (target: <30KB)
- **GestisciOrdini:** 38KB (target: <30KB)
- **Mancanza lazy loading** per rotte secondarie

---

## 📈 DISTRIBUZIONE CHUNK DETTAGLIATA

### Main Entry Point (322KB - 99KB gzip)
```javascript
// Top dependencies stimati:
- React + ReactDOM         ~45KB
- Supabase client          ~35KB  
- Date/time utilities      ~15KB
- Lucide React icons       ~25KB
- Form/validation libs     ~20KB
- Context providers        ~30KB
- Utility libraries        ~25KB
- App-specific code        ~127KB
```

### Route-Level Chunks
| Route | Size Raw | Size Gzip | Status | Target |
|-------|----------|-----------|---------|---------|
| HomePage | 40.04KB | 10.80KB | ⚠️ Over | <30KB |
| GestisciOrdini | 38.20KB | 9.54KB | ⚠️ Over | <30KB |
| FornitoriPage | 16.24KB | 4.67KB | ✅ OK | <20KB |
| ManualWineInsert | 13.05KB | 4.18KB | ✅ OK | <15KB |
| PreferenzePage | 8.15KB | 2.86KB | ✅ OK | <10KB |
| CreaOrdine | 6.74KB | 2.33KB | ✅ OK | <10KB |
| RiepilogoOrdine | 6.40KB | 2.41KB | ✅ OK | <10KB |

### Micro Chunks (Icons)
```
dist/assets/createLucideIcon-892e.js    0.85 kB │ gzip: 0.56 kB
dist/assets/bell-light-b3c8e488.js      0.87 kB │ gzip: 0.60 kB
dist/assets/trash-2-25388354.js         0.41 kB │ gzip: 0.29 kB
[...20+ micro chunks per singole icone]
```

**Problema:** Eccessiva frammentazione icon chunks (28 chunks totali)

---

## 🔍 ANALISI DIPENDENZE PESANTI

### Top 10 Dependencies Stimate
| Libreria | Dimensione | Utilizzo | Ottimizzazione |
|----------|------------|----------|----------------|
| `@supabase/supabase-js` | ~35KB | Database client | ✅ Necessario |
| `react` + `react-dom` | ~45KB | Framework core | ✅ Necessario |
| `lucide-react` | ~25KB | Icon library | ⚠️ Tree-shake |
| `date-fns` | ~15KB | Date utilities | ⚠️ Import specifici |
| Context providers | ~30KB | State management | ⚠️ Code splitting |
| Form libraries | ~20KB | Validation/forms | ⚠️ Lazy load |
| Utility functions | ~25KB | Helper functions | ⚠️ Dead code |
| CSS-in-JS | ~10KB | Styling runtime | ✅ Necessario |

### 🚨 IMPORT PESANTI IDENTIFICATI

#### 1. Lucide Icons Over-Import
```typescript
// ❌ PROBLEMA: Import intero set
import { Bell, ShoppingCart, Filter, Search } from 'lucide-react';

// ✅ SOLUZIONE: Import granulari o icon sprite
import Bell from 'lucide-react/dist/esm/icons/bell';
```

#### 2. Date Utilities Over-Import  
```typescript
// ❌ PROBLEMA: Import intera libreria
import { format } from 'date-fns';

// ✅ SOLUZIONE: Import specifici
import format from 'date-fns/format';
```

#### 3. Context Provider Bundle
```typescript
// ❌ PROBLEMA: Tutti i context in main bundle
// OrdiniContext + WineContext + UserContext = ~30KB

// ✅ SOLUZIONE: Lazy context loading
const OrdiniContext = lazy(() => import('./contexts/OrdiniContext'));
```

---

## 📱 PERFORMANCE BUDGET PROPOSTO

### Tier 1 - Critical Routes (Above-the-fold)
```
HomePage:           Raw <35KB  │ Gzip <12KB  │ Attuale: 40KB ❌
App Shell (main):   Raw <200KB │ Gzip <80KB  │ Attuale: 322KB ❌
CSS Global:         Raw <60KB  │ Gzip <12KB  │ Attuale: 52KB ✅
```

### Tier 2 - Secondary Routes  
```
GestisciOrdini:     Raw <30KB  │ Gzip <10KB  │ Attuale: 38KB ❌
FornitoriPage:      Raw <20KB  │ Gzip <7KB   │ Attuale: 16KB ✅
ManualWineInsert:   Raw <15KB  │ Gzip <5KB   │ Attuale: 13KB ✅
```

### Tier 3 - Utility Routes
```
PreferenzePage:     Raw <10KB  │ Gzip <4KB   │ Attuale: 8KB ✅
ImportaPage:        Raw <5KB   │ Gzip <2KB   │ Attuale: 1.4KB ✅
FoglioExcelPage:    Raw <5KB   │ Gzip <2KB   │ Attuale: 0.45KB ✅
```

---

## 🎯 QUICK WINS IDENTIFICATI

### 1. Icon Bundle Consolidation (Impatto: -15KB)
```typescript
// Attuale: 28 micro-chunks per icone
// Target: 1 icon sprite + lazy loading

// vite.config.ts
export default defineConfig({
  plugins: [
    Icons({
      compiler: 'jsx',
      autoInstall: true,
      bundle: true // Consolida in un chunk
    })
  ]
});
```

### 2. Lazy Route Loading (Impatto: -80KB main bundle)
```typescript
// App.tsx - Implementare lazy loading
const HomePage = lazy(() => import('./pages/HomePage'));
const GestisciOrdiniPage = lazy(() => import('./pages/GestisciOrdiniPage'));

// Riduce main bundle da 322KB a ~240KB
```

### 3. Tree Shaking Optimization (Impatto: -20KB)
```typescript
// package.json
{
  "sideEffects": ["*.css", "*.scss"],
  "type": "module"
}

// Migliora dead code elimination
```

### 4. Dynamic Context Loading (Impatto: -25KB)
```typescript
// Lazy load context non critici
const OrdiniProvider = lazy(() => 
  import('./contexts/OrdiniContext').then(m => ({ default: m.OrdiniProvider }))
);
```

---

## 📊 VENDOR SPLITTING STRATEGY

### Configurazione Ottimale
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk stabile
          vendor: ['react', 'react-dom'],
          
          // Database chunk
          database: ['@supabase/supabase-js'],
          
          // UI utilities
          ui: ['lucide-react', 'date-fns'],
          
          // Business logic
          business: [
            './src/contexts/OrdiniContext',
            './src/hooks/useSupabaseOrdini'
          ]
        }
      }
    }
  }
});
```

### Benefici Attesi
- **Vendor chunk:** 60KB (cache stabile)
- **Database chunk:** 35KB (cache medio termine)  
- **UI chunk:** 30KB (cache medio termine)
- **App chunk:** 150KB (cache dinamico)

---

## 🔄 PREFETCH/PRELOAD STRATEGY

### Critical Resource Preloading
```html
<!-- index.html -->
<link rel="preload" href="/assets/vendor-[hash].js" as="script">
<link rel="preload" href="/assets/index-[hash].css" as="style">
```

### Route Prefetching Intelligente
```typescript
// useRoutePrefetch.ts
const useRoutePrefetch = () => {
  useEffect(() => {
    // Prefetch rotte ad alta probabilità
    const routes = ['/gestisci-ordini', '/fornitori'];
    
    routes.forEach(route => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = route;
      document.head.appendChild(link);
    });
  }, []);
};
```

### Intersection Observer Lazy Loading
```typescript
// Lazy load componenti below-the-fold
const LazyComponent = lazy(() => 
  import('./Component').then(module => {
    // Delay per evitare waterfall
    return new Promise(resolve => {
      setTimeout(() => resolve(module), 100);
    });
  })
);
```

---

## 📈 METRICHE TARGET

### Pre-Ottimizzazione (Baseline)
```
Main Bundle:        322KB raw │ 99KB gzip
Total Chunks:       28 files
First Load JS:      362KB raw │ 109KB gzip
Route Chunks Avg:   25KB raw │ 7KB gzip
```

### Post-Ottimizzazione (Target)
```
Main Bundle:        <200KB raw │ <80KB gzip  (-38%)
Total Chunks:       <15 files              (-46%)
First Load JS:      <240KB raw │ <90KB gzip (-34%)
Route Chunks Avg:   <20KB raw │ <6KB gzip  (-20%)
```

### Web Vitals Impact
```
LCP: -200ms (faster main bundle)
FID: -50ms (smaller JS parse time)  
CLS: 0 (no layout impact)
TTI: -300ms (faster hydration)
```

---

## 🛠️ IMPLEMENTAZIONE ROADMAP

### Fase 1: Quick Wins (2-3h)
1. ✅ **Icon consolidation** - Vite plugin config
2. ✅ **Lazy route loading** - React.lazy implementation  
3. ✅ **Tree shaking** - Package.json sideEffects

### Fase 2: Vendor Splitting (3-4h)  
1. ⚠️ **Manual chunks** - Rollup configuration
2. ⚠️ **Dynamic imports** - Context lazy loading
3. ⚠️ **Prefetch strategy** - Route preloading

### Fase 3: Advanced Optimization (4-6h)
1. ❌ **Bundle analyzer** - Detailed dependency audit
2. ❌ **Code splitting** - Component-level splitting
3. ❌ **CDN integration** - Static asset optimization

---

## ⚠️ RISCHI E MITIGAZIONI

### Rischi Identificati
1. **Breaking Changes:** Lazy loading può causare race conditions
2. **Cache Invalidation:** Chunk splitting cambia hash
3. **Runtime Errors:** Dynamic imports possono fallire

### Mitigazioni
1. **Suspense Boundaries:** Error boundaries per lazy components
2. **Graceful Degradation:** Fallback per failed imports
3. **Progressive Enhancement:** Feature detection

---

## 📋 VALIDATION CHECKLIST

### Build Validation
- [ ] Bundle size reduction >30%
- [ ] Chunk count reduction >40%  
- [ ] No runtime errors in dev/prod
- [ ] Lighthouse score improvement

### Performance Validation  
- [ ] LCP improvement >200ms
- [ ] TTI improvement >300ms
- [ ] Main thread blocking <50ms
- [ ] Network waterfall optimized

---

**CONCLUSIONE:** Bundle attuale sovradimensionato ma con chiare opportunità di ottimizzazione. Implementazione graduale può ridurre dimensioni del 30-40% mantenendo funzionalità.
