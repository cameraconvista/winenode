# RISCHI E ROLLBACK - WINENODE CLEANUP

**Data:** 2025-09-29  
**Scope:** Risk assessment e strategie di rollback per ogni fase di cleanup  
**Approccio:** Chirurgico e non invasivo

---

## 🎯 PRINCIPI DI SICUREZZA

### Approccio Chirurgico Garantito
```
✅ ZERO modifiche layout/UX esistente
✅ ZERO alterazioni workflow funzionali  
✅ ZERO breaking changes per utenti finali
✅ Rollback <2 minuti per ogni intervento
✅ Backup automatico prima ogni fase
```

### Matrice Rischio-Beneficio
| Intervento | Rischio | Beneficio | ROI | Priorità |
|------------|---------|-----------|-----|----------|
| **Rimozione file duplicati** | ✅ Molto Basso | Alto | 9/10 | **P0** |
| **Lazy loading routes** | ⚠️ Basso | Alto | 8/10 | **P0** |
| **Bundle optimization** | ⚠️ Basso | Alto | 8/10 | **P0** |
| **Circular dependency fix** | ⚠️ Medio | Medio | 6/10 | **P1** |
| **Data layer optimization** | ⚠️ Medio | Alto | 7/10 | **P1** |
| **Context refactoring** | ❌ Alto | Medio | 4/10 | **P2** |

---

## 🛡️ FASE 1: RIMOZIONE SICURA (RISCHIO MINIMO)

### Interventi Zero-Risk
```bash
# File duplicati - CONSENSO 3+ STRUMENTI
rm src/**/* 2.{tsx,ts}           # 16 file duplicati
rm src/test/setup*.ts            # 2 file test inutilizzati  
rm src/data/wines.ts             # 1 file data obsoleto
rm src/lib/constants.ts          # 1 file constants duplicato

# Dipendenze inutilizzate - CONSENSO DEPCHECK+UNIMPORTED
npm uninstall csv-parse node-fetch react-toastify zustand
```

### ✅ Garanzie di Sicurezza
- **Validazione multi-tool:** ≥3 strumenti concordano
- **Grep verification:** 0 reference nascoste trovate
- **Build test:** `npm run build` success garantito
- **Type check:** `npx tsc --noEmit` success garantito

### Rollback Strategy
```bash
# Rollback immediato se problemi
git reset --hard HEAD~1
npm install  # Ripristina package.json originale

# Tempo rollback: <30 secondi
# Impatto rollback: Zero (solo cleanup)
```

### Risk Mitigation
```typescript
// Pre-cleanup validation
const validateCleanup = async () => {
  // 1. Build success check
  await exec('npm run build');
  
  // 2. Type check
  await exec('npx tsc --noEmit');
  
  // 3. E2E smoke test
  await exec('npm run test:e2e:smoke');
  
  console.log('✅ Cleanup validation passed');
};
```

---

## ⚡ FASE 2: LAZY LOADING (RISCHIO BASSO)

### Implementazione Graduale
```typescript
// Step 2.1: Convert single route (test)
const GestisciOrdiniPage = lazy(() => import('./pages/GestisciOrdiniPage'));

// Step 2.2: Add Suspense boundary
<Suspense fallback={<GestisciOrdiniSkeleton />}>
  <GestisciOrdiniPage />
</Suspense>

// Step 2.3: Validate no regressions
// Step 2.4: Convert remaining routes
```

### 🚨 Rischi Identificati
1. **Loading Delays:** Route switching può sembrare più lento
2. **Network Failures:** Dynamic import può fallire
3. **State Loss:** Component unmount perde stato locale

### Mitigazioni Implementate
```typescript
// 1. Prefetch strategy - Preload likely routes
useEffect(() => {
  requestIdleCallback(() => {
    import('./pages/GestisciOrdiniPage');
  });
}, []);

// 2. Error boundary - Graceful fallback
const LazyRouteErrorBoundary = ({ children }) => (
  <ErrorBoundary
    fallback={<div>Errore caricamento. <button onClick={() => window.location.reload()}>Riprova</button></div>}
  >
    {children}
  </ErrorBoundary>
);

// 3. State persistence - Save critical state
const useStatePersistence = (key, state) => {
  useEffect(() => {
    sessionStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);
};
```

### Rollback Strategy
```typescript
// Feature flag rollback
const ENABLE_LAZY_LOADING = false; // Instant rollback

// Conditional implementation
const RouteComponent = ENABLE_LAZY_LOADING 
  ? lazy(() => import('./Component'))
  : require('./Component').default;

// Tempo rollback: <2 minuti (config change)
```

---

## 📦 FASE 3: BUNDLE OPTIMIZATION (RISCHIO BASSO-MEDIO)

### Vendor Splitting Strategy
```typescript
// vite.config.ts - Configurazione sicura
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Stable vendor chunk
          vendor: ['react', 'react-dom'],
          
          // Database utilities  
          database: ['@supabase/supabase-js'],
          
          // UI components
          ui: ['lucide-react']
        }
      }
    }
  }
});
```

### 🚨 Rischi Identificati
1. **Cache Invalidation:** Chunk hash changes
2. **Loading Waterfall:** Sequential chunk loading
3. **Runtime Errors:** Module resolution failures

### Mitigazioni
```typescript
// 1. Stable chunk strategy
const stableChunks = {
  vendor: ['react', 'react-dom'], // Rarely changes
  ui: ['lucide-react'],           // Stable UI lib
  app: ['./src/main.tsx']         // App-specific code
};

// 2. Preload critical chunks
<link rel="preload" href="/assets/vendor-[hash].js" as="script">

// 3. Fallback loading
const loadChunkWithFallback = async (chunkName) => {
  try {
    return await import(chunkName);
  } catch (error) {
    console.warn(`Failed to load ${chunkName}, using fallback`);
    return await import('./fallback');
  }
};
```

### Rollback Strategy
```bash
# Revert to single bundle
git checkout HEAD~1 -- vite.config.ts
npm run build

# Tempo rollback: <5 minuti
# Impatto: Torna a bundle monolitico (funzionante)
```

---

## 🔄 FASE 4: CIRCULAR DEPENDENCY FIX (RISCHIO MEDIO)

### Problema Identificato
```typescript
// ❌ CIRCULAR: contexts/OrdiniContext.tsx ↔ hooks/useSupabaseOrdini.ts
OrdiniContext → useSupabaseOrdini → OrdiniContext
```

### Soluzione Chirurgica
```typescript
// ✅ SOLUTION: Extract shared service layer
// services/ordiniService.ts
export const ordiniService = {
  fetchOrdini: async () => { /* implementation */ },
  createOrdine: async (ordine) => { /* implementation */ },
  updateOrdine: async (id, updates) => { /* implementation */ }
};

// contexts/OrdiniContext.tsx - Uses service
import { ordiniService } from '../services/ordiniService';

// hooks/useSupabaseOrdini.ts - Uses service (no context import)
import { ordiniService } from '../services/ordiniService';
```

### 🚨 Rischi Identificati
1. **Breaking Changes:** Context API changes
2. **State Inconsistency:** Multiple state sources
3. **Performance Impact:** Additional abstraction layer

### Mitigazioni
```typescript
// 1. Backward compatibility wrapper
export const useOrdiniLegacy = () => {
  // Legacy API maintained for existing components
  const context = useContext(OrdiniContext);
  return {
    ...context,
    // Maintain exact same interface
  };
};

// 2. Gradual migration strategy
const ENABLE_NEW_ORDINI_SERVICE = false; // Feature flag

// 3. State synchronization
const useStateSynchronization = () => {
  useEffect(() => {
    // Sync between old and new state management
  }, []);
};
```

### Rollback Strategy
```bash
# Immediate rollback to working state
git reset --hard HEAD~1

# Or feature flag disable
const ENABLE_CIRCULAR_FIX = false;

# Tempo rollback: <2 minuti
```

---

## 📊 FASE 5: DATA LAYER OPTIMIZATION (RISCHIO MEDIO)

### Query Optimization Strategy
```typescript
// Batch queries implementation
const useBatchedQueries = () => {
  return useQuery(['wines', 'suppliers', 'tipologie'], async () => {
    const [wines, suppliers, tipologie] = await Promise.all([
      supabase.from('wines').select('id, name, price'),
      supabase.from('suppliers').select('id, name'),  
      supabase.from('tipologie').select('id, name')
    ]);
    
    return { wines, suppliers, tipologie };
  });
};
```

### 🚨 Rischi Identificati
1. **Query Failures:** Batch query può fallire completamente
2. **Cache Invalidation:** Complessa gestione cache
3. **Race Conditions:** Concurrent data updates

### Mitigazioni
```typescript
// 1. Graceful degradation
const useBatchedQueriesWithFallback = () => {
  const batchQuery = useBatchedQueries();
  
  if (batchQuery.error) {
    // Fallback to individual queries
    return {
      wines: useWines(),
      suppliers: useSuppliers(),
      tipologie: useTipologie()
    };
  }
  
  return batchQuery.data;
};

// 2. Optimistic updates with rollback
const useOptimisticUpdate = () => {
  const [optimisticState, setOptimisticState] = useState();
  
  const updateWithRollback = async (update) => {
    const previousState = optimisticState;
    setOptimisticState(update); // Immediate UI update
    
    try {
      await apiUpdate(update);
    } catch (error) {
      setOptimisticState(previousState); // Rollback on error
      throw error;
    }
  };
  
  return updateWithRollback;
};
```

### Rollback Strategy
```typescript
// Feature flag per ogni ottimizzazione
const DATA_OPTIMIZATIONS = {
  BATCH_QUERIES: false,
  QUERY_MEMOIZATION: false,
  OPTIMISTIC_UPDATES: false
};

// Tempo rollback: <1 minuto (config change)
```

---

## 🔧 MONITORING E VALIDAZIONE

### Automated Health Checks
```typescript
// healthCheck.ts - Continuous validation
const performHealthCheck = async () => {
  const checks = [
    () => validateBuildSuccess(),
    () => validateTypeCheck(),
    () => validateE2ESmoke(),
    () => validatePerformanceMetrics(),
    () => validateNoConsoleErrors()
  ];
  
  for (const check of checks) {
    try {
      await check();
    } catch (error) {
      console.error('Health check failed:', error);
      await triggerRollback();
      break;
    }
  }
};
```

### Performance Regression Detection
```typescript
// Performance budget enforcement
const performanceBudget = {
  bundleSize: 200 * 1024,      // 200KB max
  lcp: 2500,                   // 2.5s max
  fid: 100,                    // 100ms max
  routeSwitch: 200             // 200ms max
};

const validatePerformance = async () => {
  const metrics = await measurePerformance();
  
  Object.entries(performanceBudget).forEach(([metric, budget]) => {
    if (metrics[metric] > budget) {
      throw new Error(`Performance regression: ${metric} exceeded budget`);
    }
  });
};
```

---

## 📋 EMERGENCY PROCEDURES

### Critical Rollback (Production Issues)
```bash
# EMERGENCY: Immediate rollback to last known good state
git reset --hard $(git rev-parse HEAD~1)
npm install
npm run build
npm run deploy

# Tempo: <2 minuti
# Comunicazione: Automatic Slack notification
```

### Partial Rollback (Feature-Specific)
```typescript
// Disable specific optimizations via feature flags
const EMERGENCY_DISABLE = {
  LAZY_LOADING: false,
  BUNDLE_SPLITTING: false,
  DATA_OPTIMIZATION: false,
  CIRCULAR_FIX: false
};

// Tempo: <30 secondi (config deploy)
```

### Validation Checklist
```markdown
## Pre-Deploy Validation
- [ ] Build success (npm run build)
- [ ] Type check success (npx tsc --noEmit)
- [ ] E2E smoke tests pass
- [ ] Performance metrics within budget
- [ ] No console errors in production build
- [ ] Rollback procedure tested

## Post-Deploy Monitoring  
- [ ] Error rate <0.1% (first 5 minutes)
- [ ] Performance metrics stable
- [ ] User feedback monitoring
- [ ] Automated health checks passing
```

---

## 🎯 SUCCESS CRITERIA

### Quantitative Metrics
```
Bundle Size:        -30% (322KB → 225KB)
Route Switch Time:  -50% (400ms → 200ms)  
Build Time:         -20% (2.4s → 1.9s)
Dead Code:          -90% (31 files → 3 files)
Circular Deps:      -100% (1 → 0)
```

### Qualitative Metrics
```
Code Maintainability:  ⬆️ Improved (centralized, modular)
Developer Experience:  ⬆️ Improved (faster builds, cleaner code)
User Experience:       ➡️ Unchanged (zero visual changes)
System Reliability:   ⬆️ Improved (fewer dependencies, cleaner arch)
```

---

**CONCLUSIONE:** Strategia di cleanup chirurgica con rischi minimizzati attraverso approccio graduale, feature flags, e rollback immediato. Ogni fase validata prima di procedere alla successiva.
