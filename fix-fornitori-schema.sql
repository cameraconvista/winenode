
-- Aggiusta la struttura della tabella fornitori per allinearla con il codice
ALTER TABLE fornitori 
ADD COLUMN IF NOT EXISTS telefono TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS contatto_email TEXT DEFAULT '';

-- Rinomina la colonna nome in fornitore per consistenza con il codice
ALTER TABLE fornitori 
RENAME COLUMN nome TO fornitore;

-- Verifica la struttura finale
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fornitori' 
ORDER BY ordinal_position;
