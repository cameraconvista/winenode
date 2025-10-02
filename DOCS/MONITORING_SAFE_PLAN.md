# 📊 MONITORING SAFE PLAN - PIANO FUTURO (NON ATTIVO)

## 🎯 PANORAMICA

Questo documento descrive un **piano di monitoraggio** per WineNode che può essere implementato in futuro, **senza modificare nulla oggi**. Tutti i sistemi descritti sono **inattivi** e richiedono implementazione manuale su branch dedicati.

---

## 📈 WEB VITALS (PIANO FUTURO)

### 🔧 Stato Attuale
- ✅ Dipendenza `web-vitals: ^5.1.0` già presente
- ✅ File `src/monitoring/webVitals.ts` implementato (SESSIONE 6)
- ❌ **NON ATTIVO** - Commentato in `main.tsx`

### 🚀 Piano di Attivazione (Branch Separato)

#### Step 1: Attivazione Base
```typescript
// In src/main.tsx (FUTURO - NON FARE ORA)
import { initWebVitals } from './monitoring/webVitals'

// Dopo render React
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    initWebVitals();
  });
} else {
  setTimeout(() => {
    initWebVitals();
  }, 100);
}
```

#### Step 2: Configurazione GA4 (Opzionale)
```typescript
// In src/monitoring/webVitals.ts (FUTURO)
const GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX'; // Da configurare

function sendToGA4(metric) {
  gtag('event', metric.name, {
    value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    event_category: 'Web Vitals',
    event_label: metric.id,
    non_interaction: true,
  });
}
```

#### Step 3: Console Logging (Debug)
```typescript
// Modalità debug per sviluppo
const DEBUG_MODE = process.env.NODE_ENV === 'development';

if (DEBUG_MODE) {
  console.log('Web Vital:', metric.name, metric.value);
}
```

### 📊 Metriche Monitorate
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms  
- **CLS** (Cumulative Layout Shift): < 0.1
- **FCP** (First Contentful Paint): < 1.8s
- **TTFB** (Time to First Byte): < 600ms

### 🔄 Rollback Web Vitals
```typescript
// Per disattivare rapidamente (FUTURO)
// Commentare in main.tsx:
// initWebVitals(); // DISATTIVATO
```

---

## 📦 BUNDLE ANALYZER (PIANO ON-DEMAND)

### 🔧 Stato Attuale
- ✅ `vite-bundle-analyzer` disponibile in devDependencies
- ❌ **NON CONFIGURATO** - Nessun script automatico

### 🚀 Piano di Implementazione (Branch Dedicato)

#### Script On-Demand (FUTURO)
```json
// In package.json (FUTURO - NON AGGIUNGERE ORA)
{
  "scripts": {
    "analyze": "npm run build && vite-bundle-analyzer",
    "analyze:report": "npm run analyze > reports/bundle-analysis.txt"
  }
}
```

#### Generazione Report Periodici
```bash
# Comando manuale (FUTURO)
mkdir -p reports/
npm run build
vite-bundle-analyzer --mode static --report-filename reports/bundle-$(date +%Y%m%d).html
```

#### Analisi Automatica (Branch Separato)
```yaml
# .github/workflows/bundle-analysis.yml (FUTURO - NON CREARE ORA)
name: Bundle Analysis
on:
  pull_request:
    branches: [main]
jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Install dependencies
        run: npm ci
      - name: Build and analyze
        run: |
          npm run build
          npm run analyze:report
      - name: Upload report
        uses: actions/upload-artifact@v4
        with:
          name: bundle-analysis
          path: reports/
```

### 📊 Metriche da Monitorare
- **Total Bundle Size**: < 167 kB gzipped
- **Main Bundle**: < 500 kB gzipped
- **Vendor Chunks**: React < 53 kB, Supabase < 30 kB
- **Code Splitting**: Efficacia lazy loading
- **Tree Shaking**: Dead code elimination

---

## 💰 PERFORMANCE BUDGET (PIANO PROGRESSIVO)

### 🔧 Stato Attuale
- ✅ `@size-limit/preset-app` configurato
- ✅ Soglie attuali rispettate (157.07 kB < 167 kB)
- ❌ **NON PROGRESSIVO** - Soglie statiche

### 🚀 Piano Soglie Progressive (FUTURO)

#### Fase 1: Mantenimento (0-3 mesi)
```json
// .size-limit.json (FUTURO - NON MODIFICARE ORA)
[
  {
    "name": "Total Bundle (gzip)",
    "path": "dist/assets/*.js",
    "limit": "167 kB",
    "gzip": true
  }
]
```

#### Fase 2: Ottimizzazione (3-6 mesi)
```json
// Riduzione graduale (FUTURO)
{
  "name": "Total Bundle (gzip)",
  "limit": "150 kB", // -10%
  "gzip": true
}
```

#### Fase 3: Target Finale (6+ mesi)
```json
// Obiettivo ambizioso (FUTURO)
{
  "name": "Total Bundle (gzip)",
  "limit": "130 kB", // -22%
  "gzip": true
}
```

### 📈 Strategia di Riduzione
1. **Lazy Loading Avanzato**: Route-based splitting
2. **Tree Shaking**: Eliminazione dead code
3. **Vendor Optimization**: Bundle splitting intelligente
4. **Asset Optimization**: Immagini, font, CSS

---

## 🔄 ROLLBACK & KILL-SWITCH

### 🚨 Disattivazione Rapida Web Vitals
```typescript
// In src/main.tsx (EMERGENZA)
// Commentare completamente:
/*
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    initWebVitals();
  });
}
*/
```

### 🚨 Disattivazione Bundle Analysis
```bash
# Rimuovere script da package.json
npm run build # Solo build normale
```

### 🚨 Rollback Performance Budget
```json
// Ripristinare soglie originali in .size-limit.json
{
  "limit": "500 kB" // Soglia molto permissiva
}
```

### 🚨 Disattivazione CI Monitoring
```yaml
# Commentare job in .github/workflows/
# jobs:
#   bundle-analysis: # DISATTIVATO
```

---

## 📋 CHECKLIST ATTIVAZIONE (FUTURO)

### ✅ Pre-Requisiti
- [ ] Branch dedicato creato (`feature/monitoring`)
- [ ] Backup completo effettuato
- [ ] Team informato delle modifiche
- [ ] Ambiente di staging pronto

### ✅ Web Vitals
- [ ] Decommentare in `main.tsx`
- [ ] Configurare GA4 (opzionale)
- [ ] Test su staging
- [ ] Verifica console logs
- [ ] Deploy graduale (10% → 50% → 100%)

### ✅ Bundle Analysis
- [ ] Aggiungere script npm
- [ ] Test generazione report
- [ ] Configurare CI (opzionale)
- [ ] Definire soglie alert

### ✅ Performance Budget
- [ ] Aggiornare .size-limit.json
- [ ] Test build con nuove soglie
- [ ] Configurare CI enforcement
- [ ] Piano di riduzione bundle

---

## 🎯 BENEFICI ATTESI

### 📊 Web Vitals
- **Visibilità**: Metriche performance reali utenti
- **Ottimizzazione**: Identificazione bottleneck
- **SEO**: Miglioramento Core Web Vitals
- **UX**: Monitoraggio esperienza utente

### 📦 Bundle Analysis
- **Size Control**: Prevenzione bundle bloat
- **Optimization**: Identificazione opportunità
- **Regression**: Rilevamento aumenti dimensioni
- **Splitting**: Ottimizzazione code splitting

### 💰 Performance Budget
- **Governance**: Controllo automatico dimensioni
- **CI/CD**: Prevenzione regressioni
- **Team Awareness**: Consapevolezza impatto modifiche
- **Progressive**: Miglioramento continuo

---

**⚠️ IMPORTANTE**: Tutti i sistemi descritti sono **INATTIVI** e richiedono implementazione manuale su branch dedicati. Nessuna modifica è stata applicata al codice esistente.
