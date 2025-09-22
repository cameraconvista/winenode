
-- SCHEMA COMPLETO E CORRETTO PER WINENODE

-- === TABELLA: tipologie ===
CREATE TABLE IF NOT EXISTS tipologie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  colore TEXT
);

-- === TABELLA: fornitori ===
CREATE TABLE IF NOT EXISTS fornitori (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefono TEXT,
  min_ordine_importo NUMERIC(10, 2)
);

-- === TABELLA: vini ===
CREATE TABLE IF NOT EXISTS vini (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_vino TEXT NOT NULL,
  anno TEXT,
  produttore TEXT,
  provenienza TEXT,
  fornitore UUID REFERENCES fornitori(id) ON DELETE SET NULL,
  costo NUMERIC(10, 2),
  vendita NUMERIC(10, 2),
  margine NUMERIC(10, 2),
  tipologia UUID REFERENCES tipologie(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- === TABELLA: giacenze ===
CREATE TABLE IF NOT EXISTS giacenze (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vino_id UUID REFERENCES vini(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  giacenza INTEGER DEFAULT 6,
  min_stock INTEGER DEFAULT 3,
  UNIQUE (vino_id, user_id)
);

-- === TABELLA: ordini ===
CREATE TABLE IF NOT EXISTS ordini (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data TIMESTAMP DEFAULT timezone('utc', now()),
  fornitore UUID REFERENCES fornitori(id) ON DELETE SET NULL,
  contenuto JSONB,
  totale NUMERIC(10, 2),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- === ATTIVA RLS SU TUTTE LE TABELLE ===
ALTER TABLE vini ENABLE ROW LEVEL SECURITY;
ALTER TABLE giacenze ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordini ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornitori ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipologie ENABLE ROW LEVEL SECURITY;

-- === POLICY CORRETTE ===

-- VINI
CREATE POLICY "Select own vini" ON vini FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Insert own vini" ON vini FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own vini" ON vini FOR UPDATE USING (user_id = auth.uid());

-- GIACENZE
CREATE POLICY "Select own giacenze" ON giacenze FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Insert own giacenze" ON giacenze FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own giacenze" ON giacenze FOR UPDATE USING (user_id = auth.uid());

-- ORDINI
CREATE POLICY "Select own ordini" ON ordini FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Insert own ordini" ON ordini FOR INSERT WITH CHECK (user_id = auth.uid());

-- FORNITORI
CREATE POLICY "Read fornitori" ON fornitori FOR SELECT USING (true);

-- TIPOLOGIE
CREATE POLICY "Read tipologie" ON tipologie FOR SELECT USING (true);
