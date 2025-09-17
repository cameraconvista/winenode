
# 🔧 Riferimenti Replit - Cleanup Guide per Winsurf

## 📋 Panoramica

Questo documento elenca **tutti i riferimenti specifici a Replit** presenti nel progetto WineNode che devono essere rimossi o sostituiti quando si migra il progetto su Winsurf Cascade.

## 🎯 Obiettivo

Permettere a Winsurf Cascade di identificare automaticamente e ripulire tutti i riferimenti platform-specific di Replit per rendere il codice portabile e platform-agnostic.

---

## 📁 FILE DA MODIFICARE

### 1. `/vite.config.ts`
**Riferimenti Replit da rimuovere:**
```typescript
// ❌ RIMUOVERE - Configurazione specifica Replit
server: {
  host: '0.0.0.0',           // Replit-specific host binding
  port: 5000,                // Replit default port
  allowedHosts: 'all',       // Fix per "blocked host" error di Replit
  headers: {                 // Headers CORS specifici Replit
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
  }
}
```

**Sostituire con:**
```typescript
// ✅ Configurazione platform-agnostic
server: {
  host: 'localhost',
  port: 3000,
  open: true
}
```

### 2. `/src/lib/supabase.ts`
**Riferimenti Replit da modificare:**
```typescript
// ❌ RIMUOVERE - Header specifico Replit
global: {
  headers: {
    'X-Client-Info': 'winenode-app'  // Cambiare in 'winenode-winsurf'
  }
}

// ❌ RIMUOVERE - Console log specifici sviluppo Replit
console.log('✅ Supabase client creato con successo')
console.warn('⚠️ Variabili Supabase mancanti - modalità fallback')
console.log('📱 Modalità offline - AuthManager in standby')
```

### 3. `/src/components/CostTracker.tsx`
**Riferimenti Replit da rimuovere completamente:**
```typescript
// ❌ RIMUOVERE TUTTO IL FILE - Tracker costi specifico Replit
interface CostData {
  assistantEdits: number      // Costi Assistant Replit
  agentCheckpoints: number    // Costi Agent Replit
  totalCost: number
  monthlyBudget: number       // Budget Replit Core subscription
  lastReset: string
}
```

### 4. `/src/components/SaldoCommand.tsx`
**Riferimenti Replit da rimuovere completamente:**
```typescript
// ❌ RIMUOVERE TUTTO IL FILE - Comando saldo specifico Replit
const savedData = localStorage.getItem('replit-cost-tracker')  // Storage specifico Replit
<h2 className="text-xl font-bold text-cream">💰 SALDO REPLIT</h2>  // UI specifica Replit
```

### 5. `/.replit` (File di configurazione)
**File da eliminare completamente:**
```toml
# ❌ ELIMINARE TUTTO IL FILE - Configurazione specifica Replit
[deployment]
run = "npm run dev"
build = "npm run build"

# Workflow Start WineNode App
commands = [
  "pkill -f \"vite\\|node\" || true",
  "sleep 2", 
  "npm install",
  "npm run dev"
]
```

### 6. `/vite-plugin-allowedhosts.js`
**File da eliminare completamente:**
```javascript
// ❌ ELIMINARE TUTTO IL FILE - Plugin specifico per fix Replit blocked hosts
export default function allowedHostsPlugin() {
  // Tutto il contenuto è specifico per Replit
}
```

### 7. `/google-apps-script.js`
**Riferimenti Replit da modificare:**
```javascript
// ❌ MODIFICARE - Riferimenti console specifici Replit
console.log('🚀 Avvio sincronizzazione automatica Google Sheets → Supabase');
console.log('📋 Trovati ${fogli.length} fogli nel Google Sheet');
console.log('✅ Supabase client creato con successo');

// ❌ MODIFICARE - Headers specifici ambiente Replit
headers: {
  'apikey': SUPABASE_API_KEY,
  'Authorization': `Bearer ${SUPABASE_API_KEY}`,
  'Content-Type': 'application/json',
  'X-Client-Info': 'replit-gas-sync'  // Cambiare in 'winsurf-gas-sync'
}
```

---

## 🔧 VARIABILI AMBIENTE DA MODIFICARE

### Environment Variables References
```bash
# ❌ RIMUOVERE riferimenti specifici Replit
REPL_SLUG
REPL_OWNER  
REPL_PUBKEYS
REPLIT_DEV_DOMAIN

# ✅ MANTENERE variabili standard
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_GOOGLE_SERVICE_ACCOUNT_EMAIL
VITE_GOOGLE_PRIVATE_KEY
DATABASE_URL
```

---

## 📝 COMMENTI E DOCUMENTAZIONE DA AGGIORNARE

### 1. `/DOCS/04_config_sviluppo.md`
```markdown
# ❌ RIMUOVERE sezioni Replit-specific
## Workflow Replit
## Configurazione ottimizzata per Replit
## Fix Replit blocked hosts

# ✅ SOSTITUIRE con sezioni Winsurf-specific
## Workflow Winsurf
## Configurazione ottimizzata per Winsurf  
## Setup sviluppo locale
```

### 2. `/DOCS/05_setup_sviluppo.md`
```markdown
# ❌ RIMUOVERE riferimenti
- **Replit Account**: Per hosting e sviluppo
- Su Replit - il progetto è già clonato
- Workflow Replit
- Comandi Replit

# ✅ SOSTITUIRE con
- **Winsurf Setup**: Per sviluppo AI-assisted
- Setup locale con Winsurf
- Workflow Winsurf Cascade
- Comandi sviluppo locale
```

### 3. Commenti nel codice da aggiornare
```typescript
// ❌ RIMUOVERE commenti come:
// Fix per Replit environment
// Replit-specific configuration  
// Workaround Replit blocked hosts
// Configurazione ottimizzata per Replit

// ✅ SOSTITUIRE con:
// Local development configuration
// Standard web development setup
// Cross-platform compatibility
// Winsurf-optimized settings
```

---

## 🗂️ FILE DA ELIMINARE COMPLETAMENTE

### File specifici Replit da rimuovere:
1. `/.replit` - Configurazione runtime Replit
2. `/vite-plugin-allowedhosts.js` - Plugin fix Replit
3. `/src/components/CostTracker.tsx` - Tracker costi Replit
4. `/src/components/SaldoCommand.tsx` - Comando saldo Replit

### Directory opzionali da pulire:
1. `/.config/` (se presente) - Config Replit
2. `/.upm/` (se presente) - Package manager Replit

---

## 🔄 SOSTITUZIONI AUTOMATICHE CONSIGLIATE

### Pattern di sostituzione testo:
```bash
# Sostituzioni dirette
"replit" → "winsurf"
"Replit" → "Winsurf"
"REPLIT" → "WINSURF"
"repl.it" → "windsurf.dev"

# Host e porte
"0.0.0.0" → "localhost"
"port: 5000" → "port: 3000"
"replit.dev" → "localhost:3000"

# Headers specifici
"X-Client-Info': 'winenode-app'" → "X-Client-Info': 'winenode-winsurf'"
"replit-cost-tracker" → "winsurf-dev-tracker"

# Console logs ambiente
"📱 Modalità offline - AuthManager in standby" → "🔧 Modalità sviluppo locale"
"✅ Supabase client creato con successo" → "✅ Client configurato per sviluppo locale"
```

---

## 📋 CHECKLIST POST-CLEANUP

### Verifica dopo il cleanup:
- [ ] Nessun riferimento a "replit" nel codice
- [ ] File `.replit` eliminato
- [ ] Plugin `allowedhosts` rimosso
- [ ] Componenti `CostTracker` e `SaldoCommand` eliminati
- [ ] Configurazione `vite.config.ts` aggiornata per sviluppo locale
- [ ] Headers Supabase aggiornati
- [ ] Variabili ambiente purificate
- [ ] Documentazione aggiornata con riferimenti Winsurf
- [ ] Console logs generalizzati
- [ ] Porte e host configurati per sviluppo locale

### Test di funzionamento:
- [ ] `npm run dev` funziona su localhost
- [ ] Connessione Supabase operativa
- [ ] Autenticazione funzionante
- [ ] Import Google Sheets operativo
- [ ] Nessun errore console relativo a Replit

---

## 🎯 RISULTATO ATTESO

Dopo aver applicato tutte le modificazioni elencate, il progetto WineNode sarà completamente **platform-agnostic** e pronto per funzionare su qualsiasi ambiente di sviluppo, con ottimizzazioni specifiche per Winsurf Cascade.

Il codice risultante sarà:
- ✅ Pulito da riferimenti Replit
- ✅ Configurato per sviluppo locale
- ✅ Ottimizzato per Winsurf
- ✅ Portabile su altri IDE
- ✅ Mantenendo tutte le funzionalità core

---

**📌 Nota per Winsurf Cascade:** Utilizza questo documento come guida per processare automaticamente tutti i file del progetto e applicare le sostituzioni necessarie per rendere il codice completamente platform-independent.
