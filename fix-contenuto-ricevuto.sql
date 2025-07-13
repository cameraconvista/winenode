
-- Fix per la colonna contenuto_ricevuto mancante
DO $$
BEGIN
    -- Verifica se la colonna esiste già
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'ordini' 
        AND column_name = 'contenuto_ricevuto'
    ) THEN
        -- Aggiungi la colonna se non esiste
        ALTER TABLE ordini ADD COLUMN contenuto_ricevuto JSONB;
        RAISE NOTICE '✅ Colonna contenuto_ricevuto aggiunta';
    ELSE
        RAISE NOTICE '⚠️ Colonna contenuto_ricevuto già esistente';
    END IF;
END $$;

-- Verifica la struttura finale
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ordini' 
AND column_name IN ('contenuto', 'contenuto_ricevuto')
ORDER BY column_name;
