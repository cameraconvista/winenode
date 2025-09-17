
# 🗄️ CONFIGURAZIONE SUPABASE - WineNode

## 🎯 PANORAMICA GENERALE

Supabase è il **backend-as-a-service** utilizzato da WineNode per:
- **Database PostgreSQL** gestito e scalabile
- **Autenticazione utenti** con Row Level Security (RLS)
- **API REST/GraphQL** automatiche per le tabelle
- **Real-time subscriptions** per aggiornamenti live
- **Storage** per file e immagini (se necessario)

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
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. **Tabella `giacenza`** - Gestione Scorte
```sql
CREATE TABLE public.giacenza (
    id BIGSERIAL PRIMARY KEY,
    vino_id BIGINT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. **Tabella `fornitori`** - Gestione Fornitori
```sql
CREATE TABLE public.fornitori (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 5. **Tabella `ordini`** - Sistema Ordini
```sql
CREATE TABLE public.ordini (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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

## 🔒 ROW LEVEL SECURITY (RLS)

### 🛡️ Sicurezza Multi-Utente

Supabase utilizza **RLS** per garantire che ogni utente veda solo i propri dati:

#### Policy per `vini`
```sql
-- Abilita RLS
ALTER TABLE public.vini ENABLE ROW LEVEL SECURITY;

-- Policy di lettura
CREATE POLICY "Users can view own wines" ON public.vini
    FOR SELECT USING (auth.uid() = user_id);

-- Policy di inserimento  
CREATE POLICY "Users can insert own wines" ON public.vini
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy di aggiornamento
CREATE POLICY "Users can update own wines" ON public.vini
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy di cancellazione
CREATE POLICY "Users can delete own wines" ON public.vini
    FOR DELETE USING (auth.uid() = user_id);
```

#### Policy per `giacenza`
```sql
ALTER TABLE public.giacenza ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own giacenza" ON public.giacenza
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own giacenza" ON public.giacenza
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own giacenza" ON public.giacenza
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own giacenza" ON public.giacenza
    FOR DELETE USING (auth.uid() = user_id);
```

#### Policy per `ordini` e `ordini_dettaglio`
```sql
-- Ordini
ALTER TABLE public.ordini ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ordini" ON public.ordini 
    FOR SELECT USING (auth.uid() = user_id);

-- Ordini dettaglio (policy con JOIN)
ALTER TABLE public.ordini_dettaglio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ordini_dettaglio" ON public.ordini_dettaglio 
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM ordini 
        WHERE ordini.id = ordini_dettaglio.ordine_id 
        AND ordini.user_id = auth.uid()
    ));
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
-- File: setup-giacenza-complete.sql (dal progetto)

-- Questo script:
-- ✅ Crea tutte le tabelle necessarie
-- ✅ Configura RLS e policy
-- ✅ Aggiunge indici per performance  
-- ✅ Configura trigger per updated_at
-- ✅ Inserisce dati di default (tipologie)
```

#### 3. Ottenimento Credenziali
```bash
# Da Project Settings > API:
SUPABASE_URL=https://rtmohyjquscdkbtibdsu.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (per script server)
```

---

## 🔧 INDICI E PERFORMANCE

### 📈 Indici Ottimizzati
```sql
-- Indici per query frequenti
CREATE INDEX IF NOT EXISTS idx_vini_user_id ON public.vini(user_id);
CREATE INDEX IF NOT EXISTS idx_vini_tipologia ON public.vini(tipologia);
CREATE INDEX IF NOT EXISTS idx_vini_fornitore ON public.vini(fornitore);

CREATE INDEX IF NOT EXISTS idx_giacenza_user_id ON public.giacenza(user_id);
CREATE INDEX IF NOT EXISTS idx_giacenza_vino_id ON public.giacenza(vino_id);
CREATE INDEX IF NOT EXISTS idx_giacenza_user_vino ON public.giacenza(user_id, vino_id);

CREATE INDEX IF NOT EXISTS idx_ordini_user_id ON public.ordini(user_id);
CREATE INDEX IF NOT EXISTS idx_ordini_stato ON public.ordini(stato);
CREATE INDEX IF NOT EXISTS idx_ordini_fornitore ON public.ordini(fornitore);
```

### ⚡ Trigger per Aggiornamenti Automatici
```sql
-- Funzione per updated_at
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

## 🔐 AUTENTICAZIONE E AUTORIZZAZIONE

### 👤 Sistema Autenticazione

#### Configurazione Auth
```javascript
// In src/lib/supabase.ts
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,        // Mantieni sessione in localStorage
    autoRefreshToken: true,      // Rinnova automaticamente token
    detectSessionInUrl: true,    // Gestisce redirect OAuth
    flowType: 'pkce'            // Sicurezza extra per SPA
  }
});
```

#### Auth Policies Built-in
```sql
-- auth.users è gestita automaticamente da Supabase
-- Le nostre tabelle referenziano auth.users(id)
-- RLS usa auth.uid() per identificare l'utente corrente
```

### 🔒 Livelli di Sicurezza

1. **Network Level**: HTTPS obbligatorio
2. **Database Level**: PostgreSQL con SSL
3. **Row Level**: RLS policies per isolamento dati  
4. **API Level**: JWT tokens con scadenza
5. **Client Level**: Validazione input e sanitizzazione

---

## 📡 API E CLIENT INTEGRATION

### 🔌 Supabase Client Configuration
```typescript
// src/lib/supabase.ts - Configurazione client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'winenode-app'
    }
  }
});

// Gestione errori centralizzata
const handleSupabaseError = (error: any, operation: string) => {
  console.error(`❌ Errore ${operation}:`, error);
  
  if (error?.code === 'PGRST301') {
    throw new Error('Sessione scaduta, rieffettua il login');
  }
  
  if (error?.code === '23503') {
    throw new Error('Violazione vincolo database');
  }
  
  throw new Error(error?.message || `Errore durante ${operation}`);
};
```

### 📊 Query Pattern Comuni
```typescript
// Lettura vini dell'utente corrente
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
    user_id: authManager.getUserId()
  })
  .select()
  .single();

// Update con join
const { data, error } = await supabase
  .from('giacenza')
  .update({ giacenza: newQuantity })
  .eq('vino_id', vinoId)
  .eq('user_id', userId);
```

---

## 🔄 REAL-TIME SUBSCRIPTIONS

### 📡 Live Updates Configuration
```typescript
// Sottoscrizione per aggiornamenti real-time
const subscribeToWineChanges = () => {
  const subscription = supabase
    .channel('wine-changes')
    .on('postgres_changes', 
      { 
        event: '*',
        schema: 'public', 
        table: 'vini',
        filter: `user_id=eq.${authManager.getUserId()}`
      },
      (payload) => {
        console.log('🔄 Aggiornamento vini:', payload);
        // Aggiorna stato dell'app
        refetchWines();
      }
    )
    .subscribe();

  return () => subscription.unsubscribe();
};

// Sottoscrizione per giacenze
const subscribeToInventoryChanges = () => {
  return supabase
    .channel('inventory-changes')
    .on('postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'giacenza',
        filter: `user_id=eq.${authManager.getUserId()}`
      },
      (payload) => {
        console.log('📦 Aggiornamento giacenze:', payload);
        updateInventoryUI(payload.new);
      }
    )
    .subscribe();
};
```

---

## 🔧 FUNZIONI E STORED PROCEDURES

### 📊 Funzioni Custom per Business Logic
```sql
-- Calcola totale ordine automaticamente
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

-- Trigger per aggiornare totale ordine
CREATE OR REPLACE FUNCTION update_ordine_totale()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ordini 
    SET totale_euro = calculate_ordine_totale(
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.ordine_id
            ELSE NEW.ordine_id
        END
    )
    WHERE id = (
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.ordine_id
            ELSE NEW.ordine_id
        END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Applica trigger
CREATE TRIGGER trigger_update_ordine_totale
    AFTER INSERT OR UPDATE OR DELETE ON ordini_dettaglio
    FOR EACH ROW EXECUTE FUNCTION update_ordine_totale();
```

### 🔍 View per Query Complesse
```sql
-- Vista per vini con giacenze
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
LEFT JOIN giacenza g ON v.id = g.vino_id AND v.user_id = g.user_id;

-- Grant permessi sulla vista
GRANT SELECT ON vini_with_inventory TO authenticated;
```

---

## 🚨 BACKUP E DISASTER RECOVERY

### 💾 Strategia Backup
```sql
-- Backup automatico giornaliero (configurazione Supabase)
-- Point-in-time recovery fino a 7 giorni (piano Free)
-- 30 giorni (piano Pro)

-- Export manuale per backup locale
COPY (
    SELECT * FROM vini WHERE user_id = 'user-uuid'
) TO '/tmp/vini_backup.csv' WITH CSV HEADER;

-- Backup completo utente
CREATE OR REPLACE FUNCTION backup_user_data(target_user_id UUID)
RETURNS JSON AS $$
DECLARE
    backup_data JSON;
BEGIN
    SELECT json_build_object(
        'vini', (SELECT json_agg(row_to_json(v)) FROM vini v WHERE v.user_id = target_user_id),
        'giacenze', (SELECT json_agg(row_to_json(g)) FROM giacenza g WHERE g.user_id = target_user_id),
        'ordini', (SELECT json_agg(row_to_json(o)) FROM ordini o WHERE o.user_id = target_user_id),
        'fornitori', (SELECT json_agg(row_to_json(f)) FROM fornitori f WHERE f.user_id = target_user_id),
        'tipologie', (SELECT json_agg(row_to_json(t)) FROM tipologie t WHERE t.user_id = target_user_id),
        'timestamp', NOW()
    ) INTO backup_data;
    
    RETURN backup_data;
END;
$$ LANGUAGE plpgsql;
```

---

## 📈 MONITORING E DEBUGGING

### 🔍 Query di Diagnostica
```sql
-- Statistiche utente
SELECT 
    u.email,
    (SELECT COUNT(*) FROM vini WHERE user_id = u.id) as total_wines,
    (SELECT COUNT(*) FROM ordini WHERE user_id = u.id) as total_orders,
    (SELECT SUM(giacenza) FROM giacenza WHERE user_id = u.id) as total_inventory
FROM auth.users u
WHERE u.id = 'target-user-id';

-- Performance query più lente
SELECT 
    query,
    mean_exec_time,
    calls,
    total_exec_time
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Connessioni attive
SELECT 
    state,
    COUNT(*) as connections
FROM pg_stat_activity 
WHERE state IS NOT NULL
GROUP BY state;
```

### 🔍 Log Personalizzati
```sql
-- Tabella log personalizzata (opzionale)
CREATE TABLE IF NOT EXISTS app_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    level TEXT CHECK (level IN ('DEBUG', 'INFO', 'WARN', 'ERROR')),
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Funzione di logging
CREATE OR REPLACE FUNCTION log_event(
    p_user_id UUID,
    p_level TEXT,
    p_message TEXT,
    p_metadata JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO app_logs (user_id, level, message, metadata)
    VALUES (p_user_id, p_level, p_message, p_metadata);
END;
$$ LANGUAGE plpgsql;
```

---

## 🛠️ MAINTENANCE E OTTIMIZZAZIONE

### 🔧 Script di Manutenzione
```sql
-- Pulizia dati orfani
DELETE FROM giacenza 
WHERE vino_id NOT IN (SELECT id FROM vini);

-- Ricostruisci statistiche
ANALYZE;

-- Vacuum per liberare spazio
VACUUM;

-- Reindex per performance
REINDEX DATABASE postgres;

-- Aggiorna sequence dopo import bulk
SELECT setval('vini_id_seq', (SELECT MAX(id) FROM vini));
```

### ⚡ Ottimizzazioni Performance
```sql
-- Configura parametri PostgreSQL per Supabase
-- (gestito automaticamente, ma utile sapere cosa viene configurato)

-- shared_preload_libraries = 'pg_stat_statements'
-- max_connections = 500
-- shared_buffers = 128MB  
-- effective_cache_size = 4GB
-- maintenance_work_mem = 64MB
-- checkpoint_completion_target = 0.9
-- wal_buffers = 16MB
-- default_statistics_target = 100
```

---

## 📋 CHECKLIST CONFIGURAZIONE COMPLETA

### ✅ Setup Iniziale
- [ ] Progetto Supabase creato
- [ ] Schema database implementato (`setup-giacenza-complete.sql`)
- [ ] RLS policies configurate per tutte le tabelle
- [ ] Indici per performance aggiunti
- [ ] Trigger per `updated_at` attivati

### ✅ Sicurezza
- [ ] Environment variables configurate su Replit
- [ ] Anon key utilizzata per client
- [ ] Service role key riservata per script server
- [ ] RLS testato per isolamento utenti
- [ ] Policy validate per tutte le operazioni CRUD

### ✅ Performance
- [ ] Query ottimizzate con indici appropriati  
- [ ] Stored procedures per business logic complessa
- [ ] View per query ricorrenti
- [ ] Monitoring configurato per identificare bottleneck

### ✅ Integrazione
- [ ] Client Supabase configurato in `src/lib/supabase.ts`
- [ ] AuthManager integrato con sistema auth
- [ ] Error handling centralizzato
- [ ] Real-time subscriptions per UI reattivo

---

**🎯 RISULTATO:** Database Supabase completamente configurato, sicuro, performante e integrato con WineNode per gestione completa vini, giacenze, ordini e fornitori con isolamento multi-utente garantito.
