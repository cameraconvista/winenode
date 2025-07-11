-- Aggiungi solo la colonna stato mancante
ALTER TABLE ordini 
ADD COLUMN IF NOT EXISTS stato TEXT NOT NULL DEFAULT 'sospeso' 
CHECK (stato IN ('sospeso', 'inviato', 'ricevuto', 'archiviato'));

-- Verifica che sia stata aggiunta
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'ordini' AND column_name = 'stato';
