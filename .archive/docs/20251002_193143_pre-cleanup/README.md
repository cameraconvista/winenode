# WINENODE - Sistema di Gestione Inventario Vini

Sistema completo di gestione inventario vini con sincronizzazione Google Sheets, autenticazione utenti e gestione ordini.

## 🏗️ Architettura

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + API REST)
- **Integrazione**: Google Sheets per sincronizzazione automatica
- **Sviluppo**: Ottimizzato per Winsurf Cascade

## ✨ Funzionalità Principali

### 🍷 Gestione Inventario
- **Catalogo vini completo** con denominazioni, produttori, annate
- **Gestione scorte** con alert automatici per giacenze basse
- **Aggiornamento quantità** con feedback visivo e animazioni

### 🔍 Ricerca Avanzata
- **Ricerca locale reattiva** per nome vino (debounce 200ms)
- **Filtro case/accent-insensitive** ("aligo" trova "Aligoté")
- **Toggle intuitivo** con icona lente nella navbar
- **Reset automatico** alla chiusura

### 📱 Mobile-First Design
- **Navbar ottimizzata** con icone raggruppate e pulsante "Tutti"
- **Touch targets ≥44px** per accessibilità
- **Safe-area insets** per iPhone con notch
- **Tema light** con palette coerente WineNode

### 🛒 Sistema Ordini
- **Creazione ordini** con selezione quantità intuitive
- **Gestione stati** (sospeso → inviato → ricevuto → archiviato)
- **Riepilogo dettagliato** con totali e conferma
- **Modifica quantità** in fase di ricezione

### 🔄 Sincronizzazione
- **Google Sheets integration** per import automatico
- **Backup automatico** con rotazione e verifica integrità
- **Database Supabase** con RLS e API REST

## 🚀 Setup Sviluppo Locale

### Prerequisiti
- Node.js >= 18.0.0
- npm >= 8.0.0
- Account Supabase (per database e auth)

### Installazione
```bash
# Installa dipendenze
npm install

# Copia template environment variables
cp .env.example .env

# Configura le variabili in .env:
# VITE_SUPABASE_URL=https://your-project.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Avvio
```bash
# Avvia server di sviluppo (localhost:3000)
npm run dev

# Build per produzione
npm run build

# Preview build
npm run preview
```

## 🗄️ Configurazione Database Supabase

### 1. Crea Progetto Supabase
1. Vai su [supabase.com](https://supabase.com/dashboard)
2. Crea nuovo progetto
3. Copia URL e ANON KEY dalle Project Settings > API

### 2. Setup Schema Database
Esegui il file `setup-giacenza-complete.sql` nel SQL Editor di Supabase per creare:
- Tabelle: `vini`, `giacenza`, `ordini`, `tipologie`, `fornitori`
- Row Level Security (RLS) policies
- Indici per performance
- Trigger automatici

### 3. Variabili Ambiente
Configura nel file `.env`:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgres://user:password@host:port/database
```

## 📱 Funzionalità

- **Autenticazione Utenti**: Sistema completo login/registrazione
- **Gestione Catalogo Vini**: CRUD completo con tipologie
- **Inventario Scorte**: Monitoraggio giacenze con alert
- **Sistema Ordini**: Gestione ordini fornitori con stati
- **Sincronizzazione Google Sheets**: Import automatico da fogli esterni
- **Interfaccia Mobile-First**: Ottimizzata per smartphone
- **Ricerca e Filtri**: Ricerca avanzata per nome, fornitore, tipologia

## 🍷 Tipologie Vini — Whitelist Compatibile Google Sheets

Il database supporta una **whitelist estesa** di tipologie vini per mantenere compatibilità con la sincronizzazione Google Sheets:

### Valori Ammessi
- **Standard**: `rosso`, `bianco`, `bollicine`, `rosato`, `dolci`
- **Storici**: `spumante`, `champagne`, `prosecco`

### Raccomandazioni Google Sheets
Per ottimizzare la sincronizzazione, si consiglia di normalizzare il foglio Google entro 30 giorni utilizzando le **5 etichette standard**:
- `ROSSI` → `rosso`
- `BIANCHI` → `bianco` 
- `BOLLICINE ITALIANE/FRANCESI` → `bollicine`
- `ROSATI` → `rosato`
- `VINI DOLCI` → `dolci`

> **Nota**: I valori storici (`spumante`, `champagne`, `prosecco`) rimangono supportati per retrocompatibilità ma si raccomanda la migrazione verso le etichette standard.

## 🛠️ Tecnologie

- React 18 + TypeScript
- Vite per build ottimizzata
- Tailwind CSS per styling
- Lucide React per iconi
- Configurazione Netlify ottimizzata

## 🔧 Sviluppo Locale

```bash
# Installa dipendenze
npm install

# Avvia server di sviluppo
npm run dev

# Build per produzione
npm run build

# Preview build
npm run preview
```

## 📊 Dati Vini

Il sistema include 12 vini di esempio con:
- Denominazioni italiane autentiche
- Fornitori realistici
- Prezzi e scorte variabili
- Regioni di produzione
- Annate specifiche

## ⚙️ Operazioni & Standards di Team

### Versione Node.js
- Usa `nvm use` per allineare la versione Node (file .nvmrc)
- Versione corrente: 22.15.0

### Formattazione Codice
- Regole di formattazione gestite da .editorconfig
- Indent: 2 spazi, EOL: LF, UTF-8 encoding
- Trim trailing whitespace automatico

### Git & Repository
- .gitattributes normalizza EOL e migliora i diff
- .gitignore copre backup/recovery/coverage
- Commit atomici con messaggi descrittivi

### CI/CD Pipeline
La pipeline GitHub Actions esegue i job in sequenza:
```
setup → lint_typecheck → build_test
```

- **setup**: Installa Node.js da .nvmrc + cache npm
- **lint_typecheck**: ESLint + TypeScript check obbligatori
- **build_test**: Build Vite + test suite con coverage

### Scripts Disponibili
```bash
# Build e sviluppo
npm run build          # Build produzione Vite
npm run test:ci        # Test con coverage
npm run typecheck      # TypeScript check

# Backup e recovery
npm run backup          # Crea backup completo
npm run backup:list     # Lista backup disponibili
npm run diagnose        # Analisi salute progetto

# Qualità codice
npm run lint           # ESLint check
npm run lint:fix       # ESLint auto-fix

# Utility
npm run cleanup        # Trova file obsoleti
npm run project-info   # Riepilogo progetto
npm run commit:auto    # Commit automatico GitHub
```

### Recovery System
Sistema di snapshot leggeri per ripristino rapido dello stato operativo:

**Che cos'è:** Snapshot automatici dello stato del repository (configurazioni, script, documentazione) senza segreti o dipendenze pesanti.

**Dove:** `.recovery/snapshots/` con naming `recovery_YYYYMMDD_HHMM.tar`

**Retention:** Mantiene 5 snapshot più recenti (configurabile via `RECOVERY_KEEP`)

**Comandi:**
```bash
npm run recovery:snapshot  # Crea nuovo snapshot
npm run recovery:rotate    # Applica retention policy  
npm run recovery:gc        # Snapshot + rotate automatico
```

**Ripristino locale:**
```bash
# Lista snapshot disponibili
ls -la .recovery/snapshots/

# Ripristina snapshot specifico
tar -xf .recovery/snapshots/recovery_YYYYMMDD_HHMM.tar

# Reinstalla dipendenze se necessario
npm ci && npm run build
```

**Sicurezza:** Gli snapshot non contengono file `.env` o segreti. Le credenziali sono gestite via GitHub Secrets per CI/CD.

### WhatsApp (futuro ripristino)
Funzionalità di condivisione ordini via WhatsApp attualmente disattivata:

**Documentazione:**
- 📋 [DOCS/PLAYBOOK_RIPRISTINO_WHATSAPP.md](DOCS/PLAYBOOK_RIPRISTINO_WHATSAPP.md) - Guida completa per ripristino
- 🔍 Audit completo archiviato in `DOCS/AUDIT/WA_2025_09_28/`

**Controlli CI:**
- **Soft Guard:** Rileva automaticamente pattern WhatsApp in CI (non bloccante)
- **Hard Guard:** Setta `REQUIRE_WA_GUARD=fail` per bloccare CI se rileva WhatsApp

**Feature Flag:**
- `VITE_FEATURE_WHATSAPP=true|false` (default: false)
- Pulsante WhatsApp visibile solo quando flag attivo

## 🎨 Design

- Tema chiaro con palette #fff9dc
- Animazioni fluide e responsive
- Accessibilità mobile ottimizzata
- Interfaccia utente intuitiva

## 🔒 Sicurezza

- Nessuna dipendenza da servizi esterni
- Dati gestiti localmente
- Build process sicuro per Netlify
- Configurazione HTTPS automatica

## 📝 Note di Deployment

Il progetto è stato ottimizzato specificamente per Netlify con:
- Configurazione `netlify.toml` ottimizzata
- Redirects SPA configurati
- Build command ottimizzata
- Dipendenze minimal per build veloce

Per supporto tecnico o personalizzazioni, contattare il team di sviluppo.