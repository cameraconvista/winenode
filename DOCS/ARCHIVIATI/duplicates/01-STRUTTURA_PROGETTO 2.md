# 01 - STRUTTURA PROGETTO WINENODE

**Sintesi Executive**: Mappa completa dell'architettura modulare WineNode, organizzata per responsabilità funzionali con convenzioni naming enterprise-grade e guidelines per nuovi sviluppatori.

## 🏗️ ARCHITETTURA GENERALE

**Stack Tecnologico**:
- Frontend: React 18 + TypeScript + Vite + Tailwind CSS
- Backend: Supabase (PostgreSQL + Auth + API REST)
- Build Tool: Vite ottimizzato per performance
- Testing: Vitest + Testing Library
- Linting: ESLint + TypeScript + Husky hooks

## 📁 DIRECTORY PRINCIPALI

### `/src/` - Frontend Application (64 items)
```
src/
├── components/          # Componenti React modulari
│   ├── modals/         # Modali specifici (separati)
│   └── *.tsx           # Componenti base (WineCard, FilterModal)
├── hooks/              # Custom hooks per logica business
├── pages/              # Pagine routing (HomePage, CreaOrdinePage)
├── contexts/           # Context providers (OrdiniContext)
├── lib/                # Utilities e configurazioni
├── types/              # Interfacce TypeScript
├── utils/              # Funzioni helper
└── styles/             # CSS e temi
```

**Responsabilità**: UI/UX, state management, routing, business logic frontend

### `/server/` - Backend Services (11 items)
```
server/
├── config/             # Configurazioni ambiente
├── middleware/         # Express middleware
├── routes/             # API endpoints (wines, googleSheets)
└── services/           # Business logic backend
```

**Responsabilità**: API REST, integrazione Supabase, Google Sheets sync

### `/scripts/` - Automation & Utilities (15 items)
```
scripts/
├── backup-system.js    # Sistema backup completo
├── recovery-*.js       # Recovery snapshots
├── bundle-guard.js     # Bundle size monitoring
├── wa-soft-guard.sh    # WhatsApp pattern detection
└── *.js               # Utilities (diagnose, cleanup, setup)
```

**Responsabilità**: Automazioni CI/CD, backup, diagnostica, setup

### `/DOCS/` - Documentazione (57 items)
```
DOCS/
├── 01-08-*.md         # File informativi numerati
├── REPORT_*.md        # Report analisi per area
├── PIANO_AZIONE_*.md  # Piani implementazione
├── LOG_*.txt          # Cronologie operazioni
└── AUDIT/             # Audit e verifiche
```

**Responsabilità**: Documentazione tecnica, audit, cronologie

## 🔧 FILE CONFIGURAZIONE ROOT

| File | Responsabilità | Note |
|------|----------------|------|
| `package.json` | Dependencies + 41 script npm | Organizzato per categorie |
| `vite.config.ts` | Build configuration | Ottimizzato performance |
| `tsconfig.json` | TypeScript settings | Strict mode attivo |
| `eslint.config.js` | Code quality rules | Governance architetturale |
| `tailwind.config.js` | CSS framework | Tema custom light |
| `.nvmrc` | Node.js version lock | v22.15.0 |
| `.gitignore` | Git exclusions | Standard + custom |
| `.env.example` | Environment template | Supabase + Google config |

## 📋 CONVENZIONI NAMING

### File e Directory
- **Componenti React**: PascalCase (`WineCard.tsx`)
- **Hooks**: camelCase con prefisso `use` (`useWines.ts`)
- **Utilities**: kebab-case (`backup-system.js`)
- **Pagine**: PascalCase + suffisso `Page` (`HomePage.tsx`)
- **Tipi**: PascalCase (`Wine.ts`, `Order.ts`)

### Script NPM (41 comandi)
- **Build**: `dev`, `build`, `preview`
- **Quality**: `lint`, `lint:fix`, `typecheck`, `test`, `test:ci`
- **Backup**: `backup`, `backup:list`, `backup:restore`
- **Recovery**: `recovery`, `recovery:save`, `recovery:auto`
- **Utilities**: `diagnose`, `cleanup`, `project-info`

## 🎯 GUIDELINES SVILUPPATORI

### Principi Architetturali
1. **Componenti separati**: Max 200-300 righe per file
2. **Hook personalizzati**: Logica business in `/hooks/`
3. **Responsabilità singola**: Un componente = una funzione
4. **Riutilizzabilità**: Componenti parametrizzati
5. **Separazione concerns**: UI/logic/data separate

### Workflow Sviluppo
1. **Pre-commit**: ESLint + lint-staged automatici
2. **Pre-push**: TypeScript check obbligatorio
3. **CI/CD**: 4 job sequenziali (setup → lint → build → guard)
4. **Backup**: Automatico prima modifiche critiche
5. **Recovery**: Snapshots per rollback rapidi

### Struttura Moduli
```typescript
// Pattern standard componente
interface ComponentProps {
  // Props tipizzate
}

export const Component: React.FC<ComponentProps> = ({ props }) => {
  // Hook personalizzati
  // Logica componente
  // Return JSX
}
```

## 📊 METRICHE PROGETTO

- **File totali**: ~200 (esclusi node_modules)
- **Componenti React**: 13 attivi
- **Custom hooks**: 13 specializzati
- **Script utility**: 15 automazioni
- **Pagine routing**: 10 principali
- **Build time**: ~4s (eccellente)
- **Bundle size**: 170KB JS + 60KB CSS

## 🔄 INTEGRAZIONE SISTEMI

### Database (Supabase)
- Schema: `wines`, `fornitori`, `ordini`, `giacenza`
- RLS policies per multi-utente
- Migrazioni documentate in `/DOCS/`

### External APIs
- Google Sheets: Sincronizzazione automatica catalogo
- WhatsApp: Pattern detection per compliance

### Build & Deploy
- Vite: Build ottimizzato con tree-shaking
- GitHub Actions: CI/CD completa
- Bundle guard: Monitoraggio dimensioni

---

**Riferimenti**: Per dettagli implementativi vedere file 02-08 in `/DOCS/`
