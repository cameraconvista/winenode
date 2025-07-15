
-- Aggiungi la colonna 'colore' alla tabella tipologie se non esiste
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='tipologie' AND column_name='colore'
    ) THEN
        ALTER TABLE tipologie ADD COLUMN colore VARCHAR(7) DEFAULT '#cccccc';
        UPDATE tipologie SET colore = '#cccccc' WHERE colore IS NULL;
    END IF;
END $$;

-- Aggiungi eventuali altre colonne mancanti nella tabella vini
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='vini' AND column_name='tipologia'
    ) THEN
        ALTER TABLE vini ADD COLUMN tipologia TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='vini' AND column_name='anno'
    ) THEN
        ALTER TABLE vini ADD COLUMN anno INTEGER;
    END IF;
END $$;
