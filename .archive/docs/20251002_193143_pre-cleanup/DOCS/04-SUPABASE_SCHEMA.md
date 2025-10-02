# 04 - SUPABASE SCHEMA WINENODE

**Sintesi Executive**: Schema database PostgreSQL semplificato senza autenticazione, con RLS disabilitato, user_id fittizio per tutte le tabelle, check constraints rigorosi per stati ordini e colonna preservata data_invio_whatsapp per compliance.

## 🗄️ CONFIGURAZIONE DATABASE ATTUALE

**Modalità**: Senza autenticazione (RLS disabilitato)
**User ID Fittizio**: `00000000-0000-0000-0000-000000000001`
**Schema Auth**: Presente ma non utilizzato dall'app
**Accesso**: Pubblico per operazioni CRUD

## 📊 TABELLE PRINCIPALI

### 1. **tipologie** - Categorie Vini
```sql
CREATE TABLE tipologie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,                    -- "ROSSI", "BIANCHI", "BOLLICINE", etc.
  colore TEXT,                          -- Colore UI associato
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Dati Attuali**: 6 righe per categorie vini
**Whitelist Tipologie**: ROSSI, BIANCHI, BOLLICINE ITALIANE, BOLLICINE FRANCESI, ROSATI, VINI DOLCI

### 2. **fornitori** - Anagrafica Fornitori
```sql
CREATE TABLE fornitori (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,                    -- Nome fornitore
  telefono TEXT,                         -- Contatto telefonico
  email TEXT,                           -- Email contatto
  indirizzo TEXT,                       -- Indirizzo fornitore
  min_ordine_importo NUMERIC(10, 2),    -- Importo minimo ordine
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Dati Attuali**: 2 righe
**Policy Speciale**: Accesso SELECT pubblico per anon users
**RLS**: Disabilitato (policy `anon_select_fornitori`)

### 3. **vini** - Catalogo Principale
```sql
CREATE TABLE vini (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL,
  nome_vino TEXT NOT NULL,              -- Nome del vino
  anno TEXT,                            -- Annata (testo per flessibilità)
  produttore TEXT,                      -- Casa produttrice
  provenienza TEXT,                     -- Zona di provenienza
  fornitore UUID REFERENCES fornitori(id) ON DELETE SET NULL,
  costo NUMERIC(10, 2) DEFAULT 0.00,   -- Costo di acquisto
  vendita NUMERIC(10, 2) DEFAULT 0.00, -- Prezzo di vendita
  margine NUMERIC(10, 2),               -- Margine calcolato
  tipologia UUID REFERENCES tipologie(id) ON DELETE SET NULL,
  min_stock INTEGER DEFAULT 2,          -- Soglia minima giacenza
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Dati Attuali**: 59 righe
**Relazioni**: FK a fornitori e tipologie
**Business Logic**: Calcolo margine automatico (vendita - costo)

### 4. **giacenza** - Gestione Scorte
```sql
CREATE TABLE giacenza (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vino_id UUID REFERENCES vini(id) ON DELETE CASCADE NOT NULL,
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL,
  giacenza INTEGER DEFAULT 0 CHECK (giacenza >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE (vino_id, user_id)             -- Relazione 1:1 con vini
);
```

**Constraint**: Giacenza non negativa
**Relazione**: 1:1 con tabella vini
**Alert Logic**: Confronto con vini.min_stock per avvisi

### 5. **ordini** - Sistema Gestione Ordini ⚠️
```sql
CREATE TABLE ordini (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT '00000000-0000-0000-0000-000000000001'::uuid NOT NULL,
  fornitore UUID REFERENCES fornitori(id) ON DELETE SET NULL,
  stato TEXT NOT NULL DEFAULT 'sospeso' 
    CHECK (stato IN ('sospeso', 'inviato', 'ricevuto', 'archiviato')),
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_invio_whatsapp TIMESTAMP WITH TIME ZONE,    -- COLONNA PRESERVATA
  data_ricevimento TIMESTAMP WITH TIME ZONE,
  contenuto JSONB,                                 -- Dettagli ordine
  contenuto_ricevuto JSONB,                       -- Quantità ricevute
  totale NUMERIC(10, 2) DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Dati Attuali**: 6 righe
**Check Constraint CRITICO**: Solo stati `('sospeso','inviato','ricevuto','archiviato')`
**Colonna Preservata**: `data_invio_whatsapp` per compliance WhatsApp

## 🔒 SICUREZZA E RLS

### Stato Attuale (Semplificato)
```sql
-- RLS DISABILITATO su tutte le tabelle principali
ALTER TABLE fornitori DISABLE ROW LEVEL SECURITY;
ALTER TABLE vini DISABLE ROW LEVEL SECURITY;
ALTER TABLE ordini DISABLE ROW LEVEL SECURITY;
ALTER TABLE giacenza DISABLE ROW LEVEL SECURITY;
ALTER TABLE tipologie DISABLE ROW LEVEL SECURITY;

-- Policy pubblica solo per fornitori
CREATE POLICY "anon_select_fornitori" ON fornitori
  FOR SELECT TO anon USING (true);
```

### Policy Rimosse (Archiviate)
- `fornitori_select_own`, `fornitori_insert_own`
- `fornitori_update_own`, `fornitori_delete_own`
- Tutte basate su `auth.uid()` (non più necessarie)

## 📈 INDICI PERFORMANCE

```sql
-- Indici per ricerche frequenti
CREATE INDEX idx_vini_user_id ON vini(user_id);
CREATE INDEX idx_vini_tipologia ON vini(tipologia);
CREATE INDEX idx_vini_fornitore ON vini(fornitore);
CREATE INDEX idx_giacenza_vino_id ON giacenza(vino_id);
CREATE INDEX idx_giacenza_user_id ON giacenza(user_id);
CREATE INDEX idx_ordini_user_id ON ordini(user_id);
CREATE INDEX idx_ordini_stato ON ordini(stato);
CREATE INDEX idx_ordini_fornitore ON ordini(fornitore);
```

**Raccomandazioni**: Aggiungere indici compositi per query complesse

## 🔄 MIGRAZIONI E GOVERNANCE

### CI Database Migrations Guard
**File**: `.github/workflows/ci.yml` (job: `db-migrations-guard`)
**Pattern DDL Bloccati**:
- `CREATE INDEX`, `CREATE TABLE`, `CREATE TYPE`
- `ALTER TABLE`, `ADD CONSTRAINT`
- `DROP INDEX`, `DROP TABLE`, `DROP CONSTRAINT`

### Override Mechanism
- **Label PR**: `allow-db-migrations`
- **Autorizzazione**: Esplicita per modifiche schema
- **Documentazione**: Riferimenti a playbook migrazioni

### Procedure Rollback
```sql
-- Ripristino RLS (se necessario)
ALTER TABLE fornitori ENABLE ROW LEVEL SECURITY;
-- Ripristino policy auth-based (disponibili in DOCS/SCHEMA_UNICO.sql)
```

## 📋 MAPPATURA STATI ORDINI

### Stati Validi (Check Constraint)
| Stato | Descrizione | Transizione Da | Transizione A |
|-------|-------------|----------------|---------------|
| `sospeso` | Ordine creato, non inviato | - | `inviato` |
| `inviato` | Ordine confermato e inviato | `sospeso` | `ricevuto` |
| `ricevuto` | Merce arrivata al fornitore | `inviato` | `archiviato` |
| `archiviato` | Ordine processato e completato | `ricevuto` | - |

### Stati Rimossi (Non Validi)
- ❌ `in_corso` → Sostituito con `sospeso`
- ❌ `completato` → Sostituito con `archiviato`
- ❌ `annullato` → Non implementato

## 🔗 INTEGRAZIONE GOOGLE SHEETS

### Sincronizzazione Automatica
**Script**: `google-apps-script.js` (server-side)
**Frequenza**: Ogni 5 minuti
**Mapping**: Tipologie → Colonne Google Sheets
**Batch Size**: 50 vini per volta (rate limiting)

### Configurazione
```javascript
const CONFIG = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  API_KEY: 'your-anon-key',
  USER_ID: '00000000-0000-0000-0000-000000000001',
  SHEET_ID: 'your-google-sheet-id'
};
```

## 🛡️ BACKUP E RECOVERY

### Schema Backup
**File**: `/DOCS/SCHEMA_UNICO.sql` (204 righe)
**Contenuto**: DDL completo con indici e constraint
**Versione**: Consolidata 22/09/2025

### Procedure Recovery
```bash
# Backup schema attuale
pg_dump --schema-only > current_schema.sql

# Ripristino da backup
psql -f /DOCS/SCHEMA_UNICO.sql
```

## 📊 METRICHE DATABASE

### Dimensioni Attuali
- **Fornitori**: 2 righe (~1KB)
- **Vini**: 59 righe (~15KB)
- **Ordini**: 6 righe (~3KB)
- **Giacenza**: ~59 righe (1:1 con vini)
- **Tipologie**: 6 righe (~500B)

### Performance
- **Query medie**: <10ms (con indici)
- **Connessioni**: Pool Supabase ottimizzato
- **Cache**: Client-side con React Query

---

**Riferimenti**:
- Schema completo: `/DOCS/SCHEMA_UNICO.sql`
- Migrazioni: `/DOCS/DB_MIGRATIONS_SCRIPTS.sql`
- Playbook: `/DOCS/PLAYBOOK_MIGRAZIONI.md`
- CI Guard: `.github/workflows/ci.yml`
