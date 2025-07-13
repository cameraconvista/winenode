
-- Aggiungi la colonna contenuto_ricevuto alla tabella ordini
ALTER TABLE ordini ADD COLUMN IF NOT EXISTS contenuto_ricevuto JSONB;

-- Verifica che la colonna sia stata aggiunta
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ordini' 
AND column_name = 'contenuto_ricevuto';
