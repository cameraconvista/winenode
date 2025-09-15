
# 🚀 Setup Sviluppo WineNode

## 📋 Prerequisiti

### Sistema
- **Node.js**: >= 18.0.0
- **npm**: >= 8.0.0
- **Git**: Per version control
- **Browser moderno**: Chrome, Firefox, Safari, Edge

### Account e Servizi
- **Replit Account**: Per hosting e sviluppo
- **Supabase Account**: Per database e autenticazione
- **Google Account**: Per Google Sheets integration (opzionale)

## 🛠️ Installazione Completa

### 1. Clone e Setup Iniziale
```bash
# Su Replit - il progetto è già clonato
# Verifica directory corrente
pwd
ls -la

# Installa dipendenze
npm install

# Verifica installazione
npm list --depth=0
```

### 2. Configurazione Environment Variables

#### Su Replit (Secrets)
```bash
# Vai su Tools > Secrets e aggiungi:

# Supabase (RICHIESTO)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Database per server (RICHIESTO)
DATABASE_URL=postgres://user:password@host:port/database

# Google Sheets (OPZIONALE)
VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL=service@project.iam.gserviceaccount.com
VITE_GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n

# Development (OPZIONALE)
VITE_LOG_LEVEL=DEBUG
VITE_ENABLE_DEBUGGING=true
```

#### File Locale (se sviluppo locale)
```bash
# Crea .env dalla template
cp .env.example .env

# Modifica .env con i tuoi valori
nano .env
```

### 3. Setup Database Supabase

#### A. Crea Progetto Supabase
1. Vai su [supabase.com](https://supabase.com)
2. Crea nuovo progetto
3. Copia URL e ANON KEY

#### B. Esegui Schema Setup
```sql
-- Nel SQL Editor di Supabase, esegui:
-- Contenuto del file: setup-giacenza-complete.sql

-- 1. Pulizia e creazione tabelle
-- 2. Configurazione RLS
-- 3. Policies di sicurezza
-- 4. Indici per performance
```

#### C. Verifica Setup Database
```bash
# Test connessione (se hai psql installato)
psql "$DATABASE_URL" -c "SELECT current_database(), current_user;"

# Test tramite script
./scripts/db-health.sh
```

## 🏃‍♂️ Avvio Sviluppo

### Comandi Principali
```bash
# Sviluppo (hot reload)
npm run dev

# Build produzione
npm run build

# Anteprima build
npm run preview

# Linting
npm run lint
npm run lint:fix
```

### Workflow Replit
```bash
# Usa il pulsante Run per avviare il workflow automatico
# Oppure manualmente:

# 1. Uccidi processi esistenti
pkill -f "vite|node" || true

# 2. Installa dipendenze aggiornate
npm install

# 3. Avvia development server
npm run dev
```

## 🔍 Verifica Setup

### 1. Health Check Completo
```bash
# Esegui script di verifica
./scripts/check-config.sh

# Output atteso:
# ✅ Tutte le configurazioni OK
# ✅ Dipendenze installate
# ✅ Environment variables configurate
```

### 2. Test Connessione Database
```bash
# Test database
./scripts/db-health.sh

# Output atteso:
# 📊 Conteggi tabelle
# 🔗 Integrità relazioni OK
# ⚠️ Nessuna anomalia
```

### 3. Test Frontend
1. Apri browser su `https://your-repl.replit.dev:5000`
2. Verifica caricamento home page
3. Test login/registrazione
4. Verifica navigazione tra pagine

## 🛠️ Comandi Sviluppo Avanzati

### Database Management
```bash
# Reset completo database
psql "$DATABASE_URL" -f setup-giacenza-complete.sql

# Backup database
pg_dump "$DATABASE_URL" > backup_$(date +%Y%m%d).sql

# Restore backup
psql "$DATABASE_URL" < backup_20241201.sql
```

### Development Utilities
```bash
# Monitor dimensioni progetto
./scripts/monitor-sizes.sh

# Cleanup environment sviluppo
./scripts/cleanup-dev.sh

# Genera nuovo componente
./scripts/generate-component.sh MyComponent

# Genera nuovo hook
./scripts/generate-hook.sh useMyHook

# Pre-deploy check
./scripts/pre-deploy.sh
```

### Debugging
```bash
# Log dettagliato Vite
DEBUG=vite:* npm run dev

# Log network requests
VITE_LOG_LEVEL=DEBUG npm run dev

# Profiling build
npm run build -- --profile
```

## 🚨 Troubleshooting Problemi Comuni

### 1. "Blocked Host" Error
**Problema**: Vite blocca connessioni da host esterni su Replit

**Soluzione**:
```typescript
// vite.config.ts - Verifica presenza
server: {
  host: '0.0.0.0',
  allowedHosts: 'all'  // ← Questa riga è cruciale
}
```

### 2. "Module not found" Errors
**Problema**: Import non risolti o dipendenze mancanti

**Soluzione**:
```bash
# Reinstalla clean
rm -rf node_modules package-lock.json
npm install

# Verifica aliases in vite.config.ts
resolve: {
  alias: {
    '@': '/src'
  }
}
```

### 3. Supabase Connection Issues
**Problema**: "Invalid API key" o connection timeout

**Soluzione**:
```bash
# Verifica environment variables
echo $VITE_SUPABASE_URL
echo ${VITE_SUPABASE_ANON_KEY:0:20}...

# Test connessione manuale
curl -H "apikey: $VITE_SUPABASE_ANON_KEY" \
     "$VITE_SUPABASE_URL/rest/v1/"
```

### 4. TypeScript Errors
**Problema**: Build fallisce per errori TypeScript

**Soluzione**:
```bash
# Check TypeScript senza build
npx tsc --noEmit

# Fix common issues
# 1. Aggiungi type annotations mancanti
# 2. Usa 'any' temporaneamente per oggetti complessi
# 3. Verifica import/export
```

### 5. Hot Reload Non Funziona
**Problema**: Modifiche non si riflettono automaticamente

**Soluzione**:
```bash
# Restart dev server
pkill -f "vite|node"
npm run dev

# Verifica porta HMR in vite.config.ts
hmr: {
  port: 5173,
  clientPort: 5173
}
```

### 6. Database Schema Issues
**Problema**: Tabelle mancanti o policy RLS non funzionanti

**Soluzione**:
```sql
-- Re-esegui setup completo
-- File: setup-giacenza-complete.sql

-- Verifica RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Verifica policies
SELECT tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 📊 Workflow Consigliato

### 1. Daily Development
```bash
# Morning startup
git pull origin main
npm install              # Se ci sono nuove dipendenze
./scripts/check-config.sh # Health check
npm run dev              # Start development

# Durante sviluppo
git add .
git commit -m "feat: description"
git push origin feature-branch
```

### 2. Feature Development
```bash
# 1. Crea branch feature
git checkout -b feature/new-feature

# 2. Sviluppa con hot reload
npm run dev

# 3. Test e build
npm run build
./scripts/pre-deploy.sh

# 4. Commit e push
git add .
git commit -m "feat: new feature description"
git push origin feature/new-feature
```

### 3. Bug Fixing
```bash
# 1. Reproduci bug in dev
npm run dev

# 2. Debug con logging
VITE_LOG_LEVEL=DEBUG npm run dev

# 3. Fix e test
npm run build

# 4. Verify fix
./scripts/db-health.sh
```

### 4. Pre-Production Checklist
- [ ] `npm run build` eseguito senza errori
- [ ] `./scripts/pre-deploy.sh` passed
- [ ] Environment variables configurate
- [ ] Database schema aggiornato
- [ ] Test manuali completati
- [ ] Performance check OK

## 🎯 Performance Tips

### Development
- Usa `npm run dev` per hot reload ottimale
- Configura browser cache disabled per development
- Utilizza React DevTools per debugging
- Monitora Network tab per API calls

### Build Optimization
```bash
# Analizza bundle size
npm run build -- --analyze

# Verifica source maps
npm run build && ls -la dist/

# Test build locale
npm run preview
```

### Database Performance
```sql
-- Monitor query performance
EXPLAIN ANALYZE SELECT * FROM vini WHERE tipologia = 'ROSSI';

-- Verifica indici
SELECT indexname, indexdef FROM pg_indexes 
WHERE tablename = 'vini';
```

---

💡 **Quick Start**: `npm install` → configura Secrets → `npm run dev` → apri browser!

🔄 **Daily Workflow**: `git pull` → `npm run dev` → sviluppa → `git commit & push`

🚨 **Emergency**: `./scripts/cleanup-dev.sh` → riconfigura environment → restart
