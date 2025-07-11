
-- ============================================
-- AGGIUNGI COLONNE MANCANTI TABELLA ORDINI
-- ============================================

-- Aggiungi colonne per tracciamento date
ALTER TABLE ordini 
ADD COLUMN IF NOT EXISTS data_invio_whatsapp TIMESTAMP WITH TIME ZONE;

ALTER TABLE ordini 
ADD COLUMN IF NOT EXISTS data_ricevimento TIMESTAMP WITH TIME ZONE;

ALTER TABLE ordini 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE ordini 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Aggiorna i record esistenti con created_at se mancante
UPDATE ordini 
SET created_at = NOW() 
WHERE created_at IS NULL;

UPDATE ordini 
SET updated_at = NOW() 
WHERE updated_at IS NULL;

-- Trigger per aggiornare automaticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ordini_updated_at ON ordini;
CREATE TRIGGER update_ordini_updated_at 
  BEFORE UPDATE ON ordini 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VERIFICA STRUTTURA FINALE
-- ============================================

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ordini' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- MESSAGGIO DI CONFERMA
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Colonne mancanti aggiunte alla tabella ordini!';
    RAISE NOTICE '📅 data_invio_whatsapp - Tracciamento invio WhatsApp';
    RAISE NOTICE '📦 data_ricevimento - Tracciamento ricevimento ordine';
    RAISE NOTICE '⏰ created_at/updated_at - Timestamp standard';
    RAISE NOTICE '🔄 Trigger automatico per updated_at configurato';
    RAISE NOTICE '🎯 Sistema ordini ora completamente funzionale!';
END $$;
