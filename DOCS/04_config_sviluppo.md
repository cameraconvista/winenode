
# ⚙️ Configurazione Sviluppo WineNode

## 🔥 Hot Reload Configuration

### Vite Development Server
```typescript
// vite.config.ts - Configurazione ottimizzata
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',          // Accessibile esternamente su Replit
    port: 5000,               // Porta standard Replit
    strictPort: false,        // Fallback automatico porta
    hmr: {
      port: 5173,             // Hot Module Replacement
      clientPort: 5173
    },
    cors: true,               // CORS abilitato per API
    allowedHosts: 'all'       // Fix Replit blocked hosts
  },
  resolve: {
    alias: {
      '@': '/src'             // Alias per import puliti
    }
  }
});
```

### Workflow Replit
```toml
# .replit - Configurazione ottimizzata
[deployment]
run = "npm run dev"
build = "npm run build"

# Workflow Start WineNode App
commands = [
  "pkill -f \"vite\\|node\" || true",  # Kill processi esistenti
  "sleep 2",                           # Pausa stabilizzazione
  "npm install",                       # Installa dipendenze
  "npm run dev"                        # Avvia development server
]
```

## 📊 Error Reporting Strutturato

### Error Boundary React
```typescript
// src/components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 Error Boundary caught an error:', error, errorInfo);
    
    // Log strutturato per debugging
    this.logError(error, errorInfo);
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    const errorReport = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.error('📋 Structured Error Report:', errorReport);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-950 flex items-center justify-center p-4">
          <div className="bg-red-900/20 rounded-lg p-8 border border-red-800/30 max-w-2xl">
            <h1 className="text-2xl font-bold text-red-200 mb-4">
              🚨 Errore Applicazione
            </h1>
            <p className="text-red-300 mb-4">
              Si è verificato un errore inaspettato. Ricarica la pagina per continuare.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-700 hover:bg-red-600 px-4 py-2 rounded text-white"
            >
              🔄 Ricarica Pagina
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Async Error Handler
```typescript
// src/lib/errorHandler.ts
export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp: string;
}

export class AppError extends Error {
  public readonly context: ErrorContext;
  public readonly isUserFacing: boolean;

  constructor(
    message: string, 
    context: Partial<ErrorContext> = {}, 
    isUserFacing = false
  ) {
    super(message);
    this.name = 'AppError';
    this.context = {
      timestamp: new Date().toISOString(),
      ...context
    };
    this.isUserFacing = isUserFacing;
  }
}

export const handleAsyncError = (error: unknown, context: Partial<ErrorContext> = {}) => {
  const appError = error instanceof AppError 
    ? error 
    : new AppError(
        error instanceof Error ? error.message : 'Errore sconosciuto',
        context
      );

  // Log strutturato
  console.error('🚨 Async Error:', {
    message: appError.message,
    context: appError.context,
    stack: appError.stack,
    isUserFacing: appError.isUserFacing
  });

  // Notifica utente se appropriato
  if (appError.isUserFacing) {
    // Integrazione con toast/notification system
    window.dispatchEvent(new CustomEvent('app-error', {
      detail: { message: appError.message }
    }));
  }

  return appError;
};
```

## 📝 Logging Configurabile

### Logger Utility
```typescript
// src/lib/logger.ts
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  component?: string;
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV;
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level;
  }

  private formatLog(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const levelName = LogLevel[entry.level];
    const component = entry.component ? `[${entry.component}]` : '';
    
    return `${timestamp} ${levelName} ${component} ${entry.message}`;
  }

  debug(message: string, context?: Record<string, any>, component?: string) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.DEBUG,
      message,
      context,
      component
    };

    console.debug('🔍', this.formatLog(entry), context || '');
  }

  info(message: string, context?: Record<string, any>, component?: string) {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      message,
      context,
      component
    };

    console.info('ℹ️', this.formatLog(entry), context || '');
  }

  warn(message: string, context?: Record<string, any>, component?: string) {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.WARN,
      message,
      context,
      component
    };

    console.warn('⚠️', this.formatLog(entry), context || '');
  }

  error(message: string, error?: Error, context?: Record<string, any>, component?: string) {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context: { ...context, error: error?.message, stack: error?.stack },
      component
    };

    console.error('🚨', this.formatLog(entry), entry.context);
  }
}

export const logger = new Logger();
```

### Usage Examples
```typescript
// In components
import { logger } from '@/lib/logger';

const WineCard = ({ wine }) => {
  const handleEdit = async () => {
    try {
      logger.debug('Starting wine edit', { wineId: wine.id }, 'WineCard');
      
      await updateWine(wine.id, data);
      
      logger.info('Wine updated successfully', { wineId: wine.id }, 'WineCard');
    } catch (error) {
      logger.error('Failed to update wine', error, { wineId: wine.id }, 'WineCard');
    }
  };
};
```

## 🌍 Environment Variables Management

### Environment Configuration
```typescript
// src/config/environment.ts
interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  isDevelopment: boolean;
  isProduction: boolean;
  logLevel: string;
}

const validateEnvironment = (): EnvironmentConfig => {
  const config = {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD,
    logLevel: import.meta.env.VITE_LOG_LEVEL || 'INFO'
  };

  // Validazione richieste
  if (!config.supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL è richiesto');
  }

  if (!config.supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY è richiesto');
  }

  return config;
};

export const env = validateEnvironment();

// Type-safe environment access
export const getEnvVar = (key: keyof EnvironmentConfig) => env[key];
```

### Environment Template
```bash
# .env.example
# Copiare in .env e compilare con valori reali

# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Development Configuration
VITE_LOG_LEVEL=DEBUG
VITE_ENABLE_DEBUGGING=true

# Google Sheets Integration (opzionale)
VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
VITE_GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n

# Database (per server)
DATABASE_URL=postgres://user:password@host:port/database
```

## 🔧 Development Tools Integration

### TypeScript Strict Configuration
```json
// tsconfig.json - Configurazione bilanciata
{
  "compilerOptions": {
    "strict": false,              // Evita blocchi in sviluppo
    "noUnusedLocals": false,      // Permette variabili temporanee
    "noUnusedParameters": false,  // Flessibilità parametri
    "skipLibCheck": true,         // Velocizza build
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  }
}
```

### ESLint Configuration
```javascript
// .eslintrc.js - Regole base
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-explicit-any': 'off',
    'react-hooks/exhaustive-deps': 'warn'
  }
};
```

## 🚀 Performance Monitoring

### Performance Metrics
```typescript
// src/lib/performance.ts
class PerformanceMonitor {
  private metrics: Map<string, number> = new Map();

  startTiming(label: string) {
    this.metrics.set(label, performance.now());
  }

  endTiming(label: string): number {
    const start = this.metrics.get(label);
    if (!start) return 0;
    
    const duration = performance.now() - start;
    this.metrics.delete(label);
    
    logger.debug(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  measureAsync<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.startTiming(label);
    return fn().finally(() => this.endTiming(label));
  }
}

export const perf = new PerformanceMonitor();
```

---

💡 **Quick Start**: Configura environment variables, abilita logging e usa Error Boundary per un sviluppo robusto.
