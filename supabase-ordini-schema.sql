
-- ============================================
-- SCHEMA COMPLETO PER SISTEMA ORDINI WINENODE
-- ============================================

-- Tabella principale ordini
CREATE TABLE IF NOT EXISTS ordini (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  fornitore TEXT NOT NULL,
  stato TEXT NOT NULL DEFAULT 'sospeso' CHECK (stato IN ('sospeso', 'inviato', 'ricevuto', 'archiviato')),
  data_ordine TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_invio_whatsapp TIMESTAMP WITH TIME ZONE,
  data_ricevimento TIMESTAMP WITH TIME ZONE,
  totale_euro DECIMAL(10,2) DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella dettagli ordini
CREATE TABLE IF NOT EXISTS ordini_dettaglio (
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

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ordini_updated_at 
  BEFORE UPDATE ON ordini 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ordini_dettaglio_updated_at 
  BEFORE UPDATE ON ordini_dettaglio 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_ordini_user_id ON ordini(user_id);
CREATE INDEX IF NOT EXISTS idx_ordini_stato ON ordini(stato);
CREATE INDEX IF NOT EXISTS idx_ordini_fornitore ON ordini(fornitore);
CREATE INDEX IF NOT EXISTS idx_ordini_dettaglio_ordine_id ON ordini_dettaglio(ordine_id);
CREATE INDEX IF NOT EXISTS idx_ordini_dettaglio_vino_id ON ordini_dettaglio(vino_id);

-- RLS (Row Level Security)
ALTER TABLE ordini ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordini_dettaglio ENABLE ROW LEVEL SECURITY;

-- Policy per ordini
CREATE POLICY "Users can view own ordini" ON ordini 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ordini" ON ordini 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ordini" ON ordini 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ordini" ON ordini 
  FOR DELETE USING (auth.uid() = user_id);

-- Policy per ordini_dettaglio
CREATE POLICY "Users can view own ordini_dettaglio" ON ordini_dettaglio 
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM ordini 
    WHERE ordini.id = ordini_dettaglio.ordine_id 
    AND ordini.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own ordini_dettaglio" ON ordini_dettaglio 
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM ordini 
    WHERE ordini.id = ordini_dettaglio.ordine_id 
    AND ordini.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own ordini_dettaglio" ON ordini_dettaglio 
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM ordini 
    WHERE ordini.id = ordini_dettaglio.ordine_id 
    AND ordini.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own ordini_dettaglio" ON ordini_dettaglio 
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM ordini 
    WHERE ordini.id = ordini_dettaglio.ordine_id 
    AND ordini.user_id = auth.uid()
  ));

-- ============================================
-- FUNZIONI HELPER PER ORDINI
-- ============================================

-- Funzione per calcolare il totale ordine
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

-- Trigger per aggiornare automaticamente il totale ordine
CREATE OR REPLACE FUNCTION update_ordine_totale()
RETURNS TRIGGER AS $$
BEGIN
    -- Aggiorna il totale dell'ordine quando vengono modificati i dettagli
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

CREATE TRIGGER trigger_update_ordine_totale
    AFTER INSERT OR UPDATE OR DELETE ON ordini_dettaglio
    FOR EACH ROW EXECUTE FUNCTION update_ordine_totale();

-- ============================================
-- GRANT PERMESSI
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ordini TO authenticated;
GRANT ALL ON ordini_dettaglio TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ============================================
-- MESSAGGIO DI CONFERMA
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Schema ordini creato con successo!';
    RAISE NOTICE '📋 Tabelle create: ordini, ordini_dettaglio';
    RAISE NOTICE '🔒 RLS abilitato su tutte le tabelle';
    RAISE NOTICE '⚡ Trigger e funzioni configurati';
    RAISE NOTICE '🧮 Calcolo automatico totali abilitato';
    RAISE NOTICE '🎯 Sistema ordini pronto per l''uso';
END $$;
