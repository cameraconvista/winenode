-- ============================================
-- WINENODE - SCHEMA DATABASE UNIFICATO
-- ============================================
-- Versione consolidata basata su file storici
-- Data consolidamento: 22/09/2025
-- Fonte: Analisi file in ARCHIVIATI/LEGACY/sql_schemas/
-- ============================================

-- ============================================
-- TABELLE PRINCIPALI
-- ============================================

-- === TABELLA: tipologie ===
-- Gestisce le categorie di vini (ROSSI, BIANCHI, BOLLICINE, etc.)
CREATE TABLE IF NOT EXISTS tipologie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,                    -- Nome tipologia (es. "ROSSI", "BIANCHI")
  colore TEXT,                          -- Colore associato per UI
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- === TABELLA: fornitori ===
-- Anagrafica fornitori di vini
CREATE TABLE IF NOT EXISTS fornitori (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,                    -- Nome fornitore
  telefono TEXT,                         -- Contatto telefonico
  email TEXT,                           -- Email contatto
  indirizzo TEXT,                       -- Indirizzo fornitore
  min_ordine_importo NUMERIC(10, 2),    -- Importo minimo ordine
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- === TABELLA: vini ===
-- Catalogo principale vini
CREATE TABLE IF NOT EXISTS vini (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome_vino TEXT NOT NULL,              -- Nome del vino
  anno TEXT,                            -- Annata (testo per flessibilità)
  produttore TEXT,                      -- Casa produttrice
  provenienza TEXT,                     -- Zona di provenienza
  fornitore UUID REFERENCES fornitori(id) ON DELETE SET NULL,  -- FK a fornitori
  costo NUMERIC(10, 2) DEFAULT 0.00,   -- Costo di acquisto
  vendita NUMERIC(10, 2) DEFAULT 0.00, -- Prezzo di vendita
  margine NUMERIC(10, 2),               -- Margine calcolato
  tipologia UUID REFERENCES tipologie(id) ON DELETE SET NULL,  -- FK a tipologie
  min_stock INTEGER DEFAULT 2,          -- Soglia minima giacenza
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- === TABELLA: giacenza ===
-- Gestione scorte vini (relazione 1:1 con vini)
CREATE TABLE IF NOT EXISTS giacenza (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vino_id UUID REFERENCES vini(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  giacenza INTEGER DEFAULT 0 CHECK (giacenza >= 0),  -- Quantità disponibile
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraint per evitare duplicati
  UNIQUE (vino_id, user_id)
);

-- === TABELLA: ordini ===
-- Sistema gestione ordini
CREATE TABLE IF NOT EXISTS ordini (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  fornitore UUID REFERENCES fornitori(id) ON DELETE SET NULL,  -- FK a fornitori
  stato TEXT NOT NULL DEFAULT 'sospeso' CHECK (stato IN ('sospeso', 'inviato', 'ricevuto', 'archiviato')),
  data TIMESTAMP WITH TIME ZONE DEFAULT NOW(),         -- Data creazione ordine
  data_invio_whatsapp TIMESTAMP WITH TIME ZONE,       -- Data invio WhatsApp
  data_ricevimento TIMESTAMP WITH TIME ZONE,          -- Data ricezione merce
  contenuto JSONB,                                     -- Dettagli ordine in JSON
  contenuto_ricevuto JSONB,                           -- Quantità effettivamente ricevute
  totale NUMERIC(10, 2) DEFAULT 0,                    -- Totale ordine
  note TEXT,                                           -- Note aggiuntive
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDICI PER PERFORMANCE
-- ============================================

-- Indici per ricerche frequenti
CREATE INDEX IF NOT EXISTS idx_vini_user_id ON vini(user_id);
CREATE INDEX IF NOT EXISTS idx_vini_tipologia ON vini(tipologia);
CREATE INDEX IF NOT EXISTS idx_vini_fornitore ON vini(fornitore);
CREATE INDEX IF NOT EXISTS idx_giacenza_vino_id ON giacenza(vino_id);
CREATE INDEX IF NOT EXISTS idx_giacenza_user_id ON giacenza(user_id);
CREATE INDEX IF NOT EXISTS idx_ordini_user_id ON ordini(user_id);
CREATE INDEX IF NOT EXISTS idx_ordini_stato ON ordini(stato);
CREATE INDEX IF NOT EXISTS idx_ordini_data ON ordini(data);

-- ============================================
-- TRIGGER PER TIMESTAMP AUTOMATICI
-- ============================================

-- Funzione per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger su tutte le tabelle
CREATE TRIGGER update_tipologie_updated_at 
  BEFORE UPDATE ON tipologie 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fornitori_updated_at 
  BEFORE UPDATE ON fornitori 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vini_updated_at 
  BEFORE UPDATE ON vini 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_giacenza_updated_at 
  BEFORE UPDATE ON giacenza 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ordini_updated_at 
  BEFORE UPDATE ON ordini 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Attiva RLS su tutte le tabelle
ALTER TABLE tipologie ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornitori ENABLE ROW LEVEL SECURITY;
ALTER TABLE vini ENABLE ROW LEVEL SECURITY;
ALTER TABLE giacenza ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordini ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLICY RLS
-- ============================================

-- TIPOLOGIE - Lettura pubblica, scrittura per proprietario
DROP POLICY IF EXISTS "Read tipologie" ON tipologie;
DROP POLICY IF EXISTS "Manage own tipologie" ON tipologie;
CREATE POLICY "Read tipologie" ON tipologie FOR SELECT USING (true);
CREATE POLICY "Manage own tipologie" ON tipologie FOR ALL USING (user_id = auth.uid());

-- FORNITORI - Lettura pubblica, scrittura per proprietario  
DROP POLICY IF EXISTS "Read fornitori" ON fornitori;
DROP POLICY IF EXISTS "Manage own fornitori" ON fornitori;
CREATE POLICY "Read fornitori" ON fornitori FOR SELECT USING (true);
CREATE POLICY "Manage own fornitori" ON fornitori FOR ALL USING (user_id = auth.uid());

-- VINI - Solo dati propri
DROP POLICY IF EXISTS "Select own vini" ON vini;
DROP POLICY IF EXISTS "Insert own vini" ON vini;
DROP POLICY IF EXISTS "Update own vini" ON vini;
DROP POLICY IF EXISTS "Delete own vini" ON vini;
CREATE POLICY "Select own vini" ON vini FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Insert own vini" ON vini FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own vini" ON vini FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Delete own vini" ON vini FOR DELETE USING (user_id = auth.uid());

-- GIACENZA - Solo dati propri
DROP POLICY IF EXISTS "Select own giacenza" ON giacenza;
DROP POLICY IF EXISTS "Insert own giacenza" ON giacenza;
DROP POLICY IF EXISTS "Update own giacenza" ON giacenza;
DROP POLICY IF EXISTS "Delete own giacenza" ON giacenza;
CREATE POLICY "Select own giacenza" ON giacenza FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Insert own giacenza" ON giacenza FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own giacenza" ON giacenza FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Delete own giacenza" ON giacenza FOR DELETE USING (user_id = auth.uid());

-- ORDINI - Solo dati propri
DROP POLICY IF EXISTS "Select own ordini" ON ordini;
DROP POLICY IF EXISTS "Insert own ordini" ON ordini;
DROP POLICY IF EXISTS "Update own ordini" ON ordini;
DROP POLICY IF EXISTS "Delete own ordini" ON ordini;
CREATE POLICY "Select own ordini" ON ordini FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Insert own ordini" ON ordini FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own ordini" ON ordini FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Delete own ordini" ON ordini FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- FINE SCHEMA
-- ============================================

-- Note:
-- 1. Questo schema è ottimizzato per multi-tenant con RLS
-- 2. Ogni utente vede solo i propri dati (vini, giacenze, ordini)
-- 3. Tipologie e fornitori sono condivisi (lettura pubblica)
-- 4. Tutti i timestamp sono gestiti automaticamente
-- 5. Constraint di integrità referenziale implementati
