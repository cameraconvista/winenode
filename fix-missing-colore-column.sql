
-- Aggiungi la colonna 'colore' alla tabella wines se non esiste
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='wines' AND column_name='colore'
    ) THEN
        ALTER TABLE wines ADD COLUMN colore TEXT;
        UPDATE wines SET colore = 'rosso' WHERE colore IS NULL;
    END IF;
END $$;

-- Aggiungi eventuali altre colonne mancanti
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='wines' AND column_name='tipologia'
    ) THEN
        ALTER TABLE wines ADD COLUMN tipologia TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='wines' AND column_name='anno'
    ) THEN
        ALTER TABLE wines ADD COLUMN anno INTEGER;
    END IF;
END $$;
