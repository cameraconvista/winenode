
# 📊 Database Schema & API Documentation

## 🗄️ Schema Database Supabase

### Tabelle Principali

#### 1. **vini** - Catalogo Vini
```sql
CREATE TABLE vini (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome_vino TEXT NOT NULL DEFAULT '',
  tipologia TEXT NOT NULL DEFAULT '',
  produttore TEXT NOT NULL DEFAULT '',
  provenienza TEXT NOT NULL DEFAULT '',
  fornitore TEXT NOT NULL DEFAULT '',
  anno INTEGER CHECK (anno >= 1800 AND anno <= 2100),
  costo DECIMAL(10,2) DEFAULT 0.00,
  vendita DECIMAL(10,2) DEFAULT 0.00,
  min_stock INTEGER DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 2. **giacenza** - Gestione Scorte (SINGOLARE)
```sql
CREATE TABLE giacenza (
  id BIGSERIAL PRIMARY KEY,
  vino_id BIGINT REFERENCES vini(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  giacenza INTEGER DEFAULT 0 CHECK (giacenza >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vino_id, user_id)
);
```

#### 3. **ordini** - Sistema Ordini
```sql
CREATE TABLE ordini (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fornitore TEXT NOT NULL,
  stato TEXT NOT NULL DEFAULT 'sospeso' CHECK (stato IN ('sospeso', 'inviato', 'ricevuto', 'archiviato')),
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

#### 4. **tipologie** - Categorie Vini
```sql
CREATE TABLE tipologie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  colore TEXT DEFAULT '#cccccc',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);
```

#### 5. **fornitori** - Anagrafica Fornitori
```sql
CREATE TABLE fornitori (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefono TEXT,
  min_ordine_importo NUMERIC(10,2),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);
```

## 🔐 Row Level Security (RLS)

Tutte le tabelle hanno RLS abilitato con policy basate su `auth.uid() = user_id`:

```sql
-- Esempio policy per vini
CREATE POLICY "Users can view own wines" ON vini
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wines" ON vini
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

## 🔗 Relazioni

- `giacenza.vino_id` → `vini.id` (CASCADE DELETE)
- `vini.user_id` → `auth.users.id` (CASCADE DELETE)
- `ordini.user_id` → `auth.users.id` (CASCADE DELETE)

## 🌐 API Endpoints

### Vini
- `GET /api/wines` - Lista tutti i vini
- `GET /api/wines/:id` - Dettaglio vino
- `POST /api/wines` - Crea nuovo vino
- `PUT /api/wines/:id` - Aggiorna vino
- `DELETE /api/wines/:id` - Elimina vino

### Filtri e Ricerche
- `GET /api/wines/type/:type` - Vini per tipologia
- `GET /api/wines/supplier/:supplier` - Vini per fornitore
- `GET /api/wines/alerts/low-stock` - Vini con scorte basse

### Google Sheets Integration
- `GET /api/google-sheet-link/:userId` - Link Google Sheet utente
- `POST /api/google-sheet-link` - Salva link Google Sheet
- `DELETE /api/google-sheet-link/:userId` - Rimuovi link
- `POST /api/import-google-sheet` - Importa da Google Sheet

## 📋 Script CLI per Consultazione

### Verifica stato database
```bash
# Conta vini per tipologia
psql $DATABASE_URL -c "SELECT tipologia, COUNT(*) FROM vini GROUP BY tipologia;"

# Vini con scorte basse
psql $DATABASE_URL -c "SELECT v.nome_vino, g.giacenza, v.min_stock FROM vini v JOIN giacenza g ON v.id = g.vino_id WHERE g.giacenza <= v.min_stock;"

# Ordini per stato
psql $DATABASE_URL -c "SELECT stato, COUNT(*) FROM ordini GROUP BY stato;"
```

### Backup essenziale
```bash
# Backup tabelle principali
pg_dump $DATABASE_URL --table=vini --table=giacenza --table=ordini > backup_$(date +%Y%m%d).sql
```

## ⚠️ Constraint e Validazioni

- **Anno vino**: tra 1800 e 2100
- **Giacenza**: sempre >= 0
- **Stato ordini**: solo 'sospeso', 'inviato', 'ricevuto', 'archiviato'
- **Relazione vino-giacenza**: UNIQUE per evitare duplicati

## 🔄 Trigger Automatici

- `update_updated_at_column()`: Aggiorna automaticamente `updated_at` su modifiche
- Trigger attivi su: `vini`, `giacenza`, `ordini`

## 🚀 Esempi d'Uso API

### Creazione vino con giacenza
```javascript
// 1. Crea vino
const vino = await supabase.from('vini').insert({
  nome_vino: 'Barolo DOCG',
  tipologia: 'ROSSI',
  produttore: 'Borgogno',
  user_id: userId
}).select().single();

// 2. Crea giacenza associata
await supabase.from('giacenza').insert({
  vino_id: vino.id,
  giacenza: 6,
  user_id: userId
});
```

### Query con JOIN
```javascript
// Vini con giacenza
const { data } = await supabase
  .from('vini')
  .select(`
    *,
    giacenza:giacenza(giacenza, min_stock)
  `)
  .eq('user_id', userId);
```
