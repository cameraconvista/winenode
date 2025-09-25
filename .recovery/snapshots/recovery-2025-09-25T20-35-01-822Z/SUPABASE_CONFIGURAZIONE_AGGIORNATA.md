# 🗄️ CONFIGURAZIONE SUPABASE - WineNode (AGGIORNATA)

## 🎯 PANORAMICA GENERALE

Supabase è il **backend-as-a-service** utilizzato da WineNode per:
- **Database PostgreSQL** gestito e scalabile
- **API REST** automatiche per le tabelle
- **Storage** per file e immagini (se necessario)

**⚠️ IMPORTANTE**: L'app WineNode ora opera in **modalità tenant unico** senza sistema di autenticazione utenti.

---

## 🏗️ ARCHITETTURA DATABASE

### 📊 Schema Completo Tabelle

#### 1. **Tabella `vini`** - Catalogo Principale
```sql
CREATE TABLE public.vini (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome_vino TEXT NOT NULL,
    anno TEXT,
    produttore TEXT,
    provenienza TEXT,
    fornitore TEXT,
    costo DECIMAL(10,2),
    vendita DECIMAL(10,2), 
    margine DECIMAL(10,2),
    tipologia TEXT NOT NULL,
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. **Tabella `giacenza`** - Gestione Scorte
```sql
CREATE TABLE public.giacenza (
    id BIGSERIAL PRIMARY KEY,
    vino_id BIGINT NOT NULL,
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    giacenza INTEGER DEFAULT 0 CHECK (giacenza >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT fk_giacenza_vino_id 
        FOREIGN KEY (vino_id) 
        REFERENCES public.vini(id) 
        ON DELETE CASCADE,
    
    UNIQUE(vino_id, user_id)
);
```

#### 3. **Tabella `tipologie`** - Categorie Vini
```sql
CREATE TABLE public.tipologie (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE,
    colore TEXT DEFAULT '#cccccc',
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. **Tabella `fornitori`** - Gestione Fornitori
```sql
CREATE TABLE public.fornitori (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. **Tabella `ordini`** - Sistema Ordini
```sql
CREATE TABLE public.ordini (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001',
    fornitore TEXT NOT NULL,
    stato TEXT NOT NULL DEFAULT 'sospeso' 
        CHECK (stato IN ('sospeso', 'inviato', 'ricevuto', 'archiviato')),
    data_ordine TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_invio_whatsapp TIMESTAMP WITH TIME ZONE,
    data_ricevimento TIMESTAMP WITH TIME ZONE,
    totale_euro DECIMAL(10,2) DEFAULT 0,
    contenuto JSONB,
    contenuto_ricevuto JSONB,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 6. **Tabella `ordini_dettaglio`** - Dettagli Ordini
```sql
CREATE TABLE public.ordini_dettaglio (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ordine_id UUID REFERENCES ordini(id) ON DELETE CASCADE,
    vino_id INTEGER REFERENCES vini(id) ON DELETE CASCADE,
    quantita_ordinata INTEGER NOT NULL DEFAULT 0,
    quantita_ricevuta INTEGER,
    prezzo_unitario DECIMAL(8,2) DEFAULT 0,
    subtotale DECIMAL(10,2) GENERATED ALWAYS AS (quantita_ordinata * prezzo_unitario) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 🔒 SICUREZZA SEMPLIFICATA

### 🛡️ Modalità Tenant Unico

**IMPORTANTE**: WineNode ora opera senza autenticazione utenti:

- **SERVICE_USER_ID**: `'00000000-0000-0000-0000-000000000001'` (UUID fisso)
- **RLS Disabilitato**: Tutte le policy RLS possono essere rimosse
- **Accesso Diretto**: Query dirette senza filtri `user_id`
- **Sicurezza**: Gestita a livello applicazione

#### Configurazione Semplificata
```sql
-- Disabilita RLS su tutte le tabelle (opzionale)
ALTER TABLE public.vini DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.giacenza DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipologie DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornitori DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordini DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordini_dettaglio DISABLE ROW LEVEL SECURITY;

-- Rimuovi tutte le policy esistenti (opzionale)
DROP POLICY IF EXISTS "Users can view own wines" ON public.vini;
DROP POLICY IF EXISTS "Users can insert own wines" ON public.vini;
-- ... altre policy
```

---

## ⚙️ CONFIGURAZIONE SUPABASE

### 🔧 Setup Progetto

#### 1. Creazione Progetto
```bash
# 1. Vai su https://supabase.com/dashboard
# 2. Click "New Project"
# 3. Scegli Organization
# 4. Nome progetto: "winenode" 
# 5. Password database: [genera sicura]
# 6. Region: "East US (North Virginia)" [più vicina]
# 7. Pricing plan: "Free" (per sviluppo)
```

#### 2. Configurazione Database
```sql
-- Nel SQL Editor di Supabase, esegui:
-- File: setup-winenode-single-tenant.sql

-- Questo script:
-- ✅ Crea tutte le tabelle necessarie
-- ✅ Imposta SERVICE_USER_ID di default
-- ✅ Aggiunge indici per performance  
-- ✅ Configura trigger per updated_at
-- ✅ Inserisce dati di default (tipologie)
-- ✅ Disabilita RLS (opzionale)
```

#### 3. Ottenimento Credenziali
```bash
# Da Project Settings > API:
SUPABASE_URL=https://rtmohyjquscdkbtibdsu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# SERVICE_ROLE_KEY non necessario per app senza auth
```

---

## 🔧 INDICI E PERFORMANCE

### 📈 Indici Ottimizzati
```sql
-- Indici per query frequenti (senza user_id)
CREATE INDEX IF NOT EXISTS idx_vini_tipologia ON public.vini(tipologia);
CREATE INDEX IF NOT EXISTS idx_vini_fornitore ON public.vini(fornitore);
CREATE INDEX IF NOT EXISTS idx_vini_nome ON public.vini(nome_vino);

CREATE INDEX IF NOT EXISTS idx_giacenza_vino_id ON public.giacenza(vino_id);

CREATE INDEX IF NOT EXISTS idx_ordini_stato ON public.ordini(stato);
CREATE INDEX IF NOT EXISTS idx_ordini_fornitore ON public.ordini(fornitore);
CREATE INDEX IF NOT EXISTS idx_ordini_data ON public.ordini(data_ordine);
```

### ⚡ Trigger per Aggiornamenti Automatici
```sql
-- Funzione per updated_at (invariata)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Applica a tutte le tabelle
CREATE TRIGGER update_vini_updated_at 
    BEFORE UPDATE ON public.vini 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_giacenza_updated_at 
    BEFORE UPDATE ON public.giacenza 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ordini_updated_at 
    BEFORE UPDATE ON public.ordini 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

---

## 🔐 CONFIGURAZIONE CLIENT SEMPLIFICATA

### 👤 Senza Sistema Autenticazione

#### Configurazione Client
```javascript
// In src/lib/supabase.ts
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
// Nessuna configurazione auth necessaria
```

#### Costanti App
```typescript
// In src/config/constants.ts
export const SERVICE_USER_ID = '00000000-0000-0000-0000-000000000001';

export const APP_CONFIG = {
  SINGLE_TENANT_MODE: true,
  SERVICE_USER_ID,
  SCHEMA_VERSION: '2.0.0-auth-removed',
  DEMO_MODE_AVAILABLE: true
} as const;

export const getUserId = (): string => SERVICE_USER_ID;
export const isSingleTenantMode = (): boolean => APP_CONFIG.SINGLE_TENANT_MODE;
```

---

## 📡 API E CLIENT INTEGRATION

### 🔌 Supabase Client Configuration
```typescript
// src/lib/supabase.ts - Configurazione semplificata
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    headers: {
      'X-Client-Info': 'winenode-app'
    }
  }
});

// Gestione errori centralizzata
const handleSupabaseError = (error: any, operation: string) => {
  console.error(`❌ Errore ${operation}:`, error);
  
  if (error?.code === '23503') {
    throw new Error('Violazione vincolo database');
  }
  
  throw new Error(error?.message || `Errore durante ${operation}`);
};
```

### 📊 Query Pattern Semplificati
```typescript
// Lettura vini (senza filtro user_id)
const { data: vini, error } = await supabase
  .from('vini')
  .select(`
    *,
    giacenza(giacenza)
  `)
  .order('nome_vino');

// Inserimento nuovo vino
const { data, error } = await supabase
  .from('vini')
  .insert({
    nome_vino: 'Barolo DOCG',
    tipologia: 'ROSSI',
    user_id: getUserId()
  })
  .select()
  .single();

// Update giacenza
const { data, error } = await supabase
  .from('giacenza')
  .update({ giacenza: newQuantity })
  .eq('vino_id', vinoId)
  .eq('user_id', getUserId());
```

---

## 🔄 REAL-TIME SUBSCRIPTIONS (OPZIONALE)

### 📡 Live Updates Semplificati
```typescript
// Sottoscrizione per aggiornamenti real-time (senza filtro utente)
const subscribeToWineChanges = () => {
  const subscription = supabase
    .channel('wine-changes')
    .on('postgres_changes', 
      { 
        event: '*',
        schema: 'public', 
        table: 'vini'
      },
      (payload) => {
        console.log('🔄 Aggiornamento vini:', payload);
        refetchWines();
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
};
```

---

## 🔧 FUNZIONI E STORED PROCEDURES

### 📊 Funzioni Custom per Business Logic
```sql
-- Calcola totale ordine automaticamente (invariata)
CREATE OR REPLACE FUNCTION calculate_ordine_totale(ordine_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    totale DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(subtotale), 0) INTO totale
    FROM ordini_dettaglio 
    WHERE ordine_id = ordine_uuid;
    
    RETURN totale;
END;
$$ LANGUAGE plpgsql;
```

### 🔍 View Semplificate
```sql
-- Vista per vini con giacenze (senza filtro user)
CREATE OR REPLACE VIEW vini_with_inventory AS
SELECT 
    v.*,
    COALESCE(g.giacenza, 0) as current_inventory,
    CASE 
        WHEN COALESCE(g.giacenza, 0) <= 2 THEN 'low'
        WHEN COALESCE(g.giacenza, 0) <= 5 THEN 'medium' 
        ELSE 'high'
    END as stock_level
FROM vini v
LEFT JOIN giacenza g ON v.id = g.vino_id;

-- Grant permessi sulla vista
GRANT SELECT ON vini_with_inventory TO anon;
GRANT SELECT ON vini_with_inventory TO authenticated;
```

---

## 🚨 BACKUP E DISASTER RECOVERY

### 💾 Strategia Backup Semplificata
```sql
-- Backup completo applicazione (tenant unico)
CREATE OR REPLACE FUNCTION backup_app_data()
RETURNS JSON AS $$
DECLARE
    backup_data JSON;
BEGIN
    SELECT json_build_object(
        'vini', (SELECT json_agg(row_to_json(v)) FROM vini v),
        'giacenze', (SELECT json_agg(row_to_json(g)) FROM giacenza g),
        'ordini', (SELECT json_agg(row_to_json(o)) FROM ordini o),
        'fornitori', (SELECT json_agg(row_to_json(f)) FROM fornitori f),
        'tipologie', (SELECT json_agg(row_to_json(t)) FROM tipologie t),
        'timestamp', NOW()
    ) INTO backup_data;
    
    RETURN backup_data;
END;
$$ LANGUAGE plpgsql;
```

---

## 📈 MONITORING E DEBUGGING

### 🔍 Query di Diagnostica Semplificate
```sql
-- Statistiche applicazione
SELECT 
    'vini' as tabella,
    COUNT(*) as totale_record
FROM vini
UNION ALL
SELECT 
    'ordini' as tabella,
    COUNT(*) as totale_record
FROM ordini
UNION ALL
SELECT 
    'giacenze' as tabella,
    COUNT(*) as totale_record
FROM giacenza;

-- Vini con giacenza bassa
SELECT 
    v.nome_vino,
    v.tipologia,
    v.fornitore,
    COALESCE(g.giacenza, 0) as giacenza_attuale
FROM vini v
LEFT JOIN giacenza g ON v.id = g.vino_id
WHERE COALESCE(g.giacenza, 0) <= 2
ORDER BY giacenza_attuale ASC, v.nome_vino;
```

---

## 🛠️ MAINTENANCE E OTTIMIZZAZIONE

### 🔧 Script di Manutenzione
```sql
-- Pulizia dati orfani
DELETE FROM giacenza 
WHERE vino_id NOT IN (SELECT id FROM vini);

DELETE FROM ordini_dettaglio 
WHERE ordine_id NOT IN (SELECT id FROM ordini);

-- Statistiche e ottimizzazione
ANALYZE;
VACUUM;
REINDEX DATABASE postgres;
```

---

## 📋 CHECKLIST CONFIGURAZIONE AGGIORNATA

### ✅ Setup Iniziale
- [ ] Progetto Supabase creato
- [ ] Schema database implementato (versione single-tenant)
- [ ] SERVICE_USER_ID configurato come default
- [ ] RLS disabilitato (opzionale)
- [ ] Indici per performance aggiunti
- [ ] Trigger per `updated_at` attivati

### ✅ Codice Applicazione
- [ ] `getUserId()` importato e utilizzato in tutti i file
- [ ] Chiamate `supabase.auth.*` rimosse completamente
- [ ] Costanti `SERVICE_USER_ID` configurate
- [ ] Query semplificate senza filtri auth
- [ ] Error handling aggiornato

### ✅ Performance
- [ ] Query ottimizzate senza controlli auth
- [ ] Indici appropriati per tenant unico
- [ ] Stored procedures aggiornate
- [ ] View semplificate
- [ ] Monitoring configurato

### ✅ Integrazione
- [ ] Client Supabase semplificato
- [ ] Configurazione constants aggiornata
- [ ] Error handling centralizzato
- [ ] Real-time subscriptions opzionali

---

**🎯 RISULTATO**: Database Supabase completamente configurato per modalità tenant unico, senza autenticazione, ottimizzato per performance e semplicità di gestione.

## 🔄 MIGRAZIONE DA MULTI-UTENTE

Se stai migrando da un sistema multi-utente:

1. **Backup completo** dei dati esistenti
2. **Aggiorna schema** con SERVICE_USER_ID di default
3. **Rimuovi policy RLS** (opzionale)
4. **Aggiorna codice** rimuovendo chiamate auth
5. **Testa funzionalità** complete
6. **Monitora performance** post-migrazione

---

*Documento aggiornato: 25/09/2025 - Versione Single Tenant*
