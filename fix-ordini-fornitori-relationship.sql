
-- Fix della relazione mancante tra ordini e fornitori
-- Questo risolve l'errore PGRST200

-- 1. Prima aggiungiamo la colonna fornitore_id se non esiste
ALTER TABLE ordini 
ADD COLUMN IF NOT EXISTS fornitore_id UUID;

-- 2. Creiamo la foreign key relationship
ALTER TABLE ordini 
ADD CONSTRAINT fk_ordini_fornitori 
FOREIGN KEY (fornitore_id) REFERENCES fornitori(id) ON DELETE SET NULL;

-- 3. Aggiorniamo gli ordini esistenti per collegare i fornitori
UPDATE ordini 
SET fornitore_id = f.id
FROM fornitori f 
WHERE ordini.fornitore = f.nome 
AND ordini.fornitore_id IS NULL;

-- 4. Verifichiamo la struttura
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('ordini', 'fornitori') 
ORDER BY table_name, ordinal_position;
