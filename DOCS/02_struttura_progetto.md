
# 🏗️ Struttura Progetto WineNode

## 📁 Mappa Directory

```
winenode/
├── 📂 DOCS/                    # Documentazione progetto
├── 📂 public/                  # Asset statici
│   ├── 🖼️ *.png               # Loghi e icone
│   └── 📄 manifest.json       # PWA manifest
├── 📂 server/                  # Backend Express
│   ├── 🗄️ app.ts              # Server principale con API routes
│   ├── 🔌 db.ts               # Connessione database Neon
│   ├── 🚀 index.ts            # Entry point server
│   └── 💾 storage.ts          # Layer astrazione database
├── 📂 shared/                  # Codice condiviso
│   └── 📋 schema.ts           # Schema Drizzle ORM
├── 📂 src/                     # Frontend React
│   ├── 📂 components/         # Componenti riutilizzabili
│   ├── 📂 hooks/              # Custom hooks
│   ├── 📂 lib/                # Librerie e utilità
│   ├── 📂 pages/              # Pagine principali
│   ├── 📂 utils/              # Funzioni di utilità
│   ├── 🎨 App.tsx             # Componente radice
│   ├── 🎨 index.css           # Stili globali
│   └── 🚀 main.tsx            # Entry point React
├── 📂 scripts/                # Script di utilità
├── ⚙️ vite.config.ts          # Configurazione Vite
├── 📦 package.json            # Dipendenze e script
└── 🔧 tsconfig.json           # Configurazione TypeScript
```

## 🧩 Responsabilità Moduli

### Backend (`/server`)
- **app.ts**: API REST endpoints, middleware CORS, routing
- **db.ts**: Configurazione Neon Database con Drizzle ORM
- **storage.ts**: Interface IStorage + implementazione DatabaseStorage
- **index.ts**: Minimal entry point

### Frontend (`/src`)

#### Components (`/src/components`)
- **Modal Components**: `*Modal.tsx` - Popup e dialoghi
- **Business Logic**: `WineCard.tsx`, `CategoryTabs.tsx`
- **Forms**: `LoginForm.tsx`, `SearchAndFilters.tsx`
- **Tables**: `WineTableHeader.tsx`, `WineTableRow.tsx`

#### Pages (`/src/pages`)
- **HomePage.tsx**: Dashboard principale
- **ArchiviPage.tsx**: Visualizzazione catalogo vini
- **OrdiniSospesiPage.tsx**: Gestione ordini
- **SettingsPage.tsx**: Configurazioni utente

#### Hooks (`/src/hooks`)
- **Data Hooks**: `useWines.ts`, `useOrdini.ts`, `useTipologie.ts`
- **Auth**: `useAuthManager.ts`
- **UI**: `useColumnResize.ts`

#### Lib (`/src/lib`)
- **supabase.ts**: Client Supabase + AuthManager singleton
- **googleSheets.ts**: Integrazione Google Sheets API
- **importFromGoogleSheet.ts**: Logica importazione automatica

### Shared (`/shared`)
- **schema.ts**: Schema Drizzle per tipizzazione database

## 🎯 Convenzioni Naming

### File e Directory
- **PascalCase**: Componenti React (`WineCard.tsx`)
- **camelCase**: Hooks (`useWines.ts`), utilità (`wineUtils.ts`)
- **kebab-case**: File SQL (`setup-giacenza-complete.sql`)
- **UPPERCASE**: Documentazione (`README.md`, `DOCS/`)

### Variabili e Funzioni
```typescript
// Interfaces
interface WineData { ... }
interface AuthUser { ... }

// Components
const WineCard: React.FC<WineCardProps> = ({ wine }) => { ... }

// Hooks
const useWines = () => { ... }

// Constants
const CATEGORY_MAPPINGS = { ... }
const SUPABASE_URL = "..."
```

### Database
- **Tabelle**: lowercase con underscore (`vini`, `giacenza`, `ordini`)
- **Colonne**: lowercase con underscore (`nome_vino`, `user_id`)
- **Foreign Keys**: `{tabella}_id` (`vino_id`, `user_id`)

## 📐 Guidelines Modulari

### Nuovi Componenti
```typescript
// 1. Props interface
interface NewComponentProps {
  data: DataType;
  onAction: (id: string) => void;
  className?: string;
}

// 2. Component con prop drilling minimale
const NewComponent: React.FC<NewComponentProps> = ({ 
  data, 
  onAction, 
  className = '' 
}) => {
  return (
    <div className={clsx('base-styles', className)}>
      {/* JSX */}
    </div>
  );
};

export default NewComponent;
```

### Nuovi Hooks
```typescript
// Pattern standard per data fetching
export const useNewData = (filters?: FilterType) => {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch logic
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  return { data, loading, error, refetch: fetchData };
};
```

### Nuove Pagine
```typescript
// Struttura standard pagina
const NewPage: React.FC = () => {
  // 1. Hooks per dati
  const { data, loading, error } = useNewData();
  
  // 2. State locale
  const [localState, setLocalState] = useState();
  
  // 3. Event handlers
  const handleAction = (id: string) => { ... };
  
  // 4. Early returns per loading/error
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  // 5. Render principale
  return (
    <div className="page-container">
      <h1>Titolo Pagina</h1>
      {/* Content */}
    </div>
  );
};
```

## 🔄 Flusso Dati Standard

1. **User Input** → Component
2. **Component** → Hook (useWines, useOrdini)
3. **Hook** → Supabase Client
4. **Supabase** → Database
5. **Response** → Hook → Component → UI Update

## 🎨 Convenzioni CSS

### Classi Tailwind
- **Layout**: `flex`, `grid`, `container`
- **Spacing**: `p-4`, `m-2`, `gap-4`
- **Colors**: Tema bordeaux scuro consistente
- **Responsive**: Mobile-first con breakpoint tablet

### CSS Custom
```css
/* Prefisso per classi custom */
.wine-card { ... }
.order-status { ... }
.modal-backdrop { ... }
```

## 🧪 Testing Strategy

### Componenti
- Props validation
- Event handling
- Conditional rendering

### Hooks
- Data fetching states
- Error handling
- Dependency updates

### API
- Endpoint responses
- Error cases
- Authentication

## 📦 Dependencies Management

### Core Dependencies
- **React 18**: Frontend framework
- **Vite**: Build tool e dev server
- **TypeScript**: Type safety
- **Tailwind CSS**: Styling
- **Supabase**: Backend-as-a-Service

### Development Dependencies
- **ESLint**: Code linting
- **Drizzle Kit**: Database migrations
- **PostCSS**: CSS processing

---

💡 **Regola d'oro**: Ogni nuovo modulo deve essere autocontenuto, tipizzato e seguire il pattern established del progetto.
