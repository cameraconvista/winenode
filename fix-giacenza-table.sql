
-- Script per creare la tabella giacenza corretta
-- Esegui questo nel SQL Editor di Supabase

-- 1. Elimina tabella esistente se c'è (per sicurezza)
DROP TABLE IF EXISTS public.giacenza CASCADE;

-- 2. Crea la tabella giacenza con struttura corretta
CREATE TABLE public.giacenza (
    id BIGSERIAL PRIMARY KEY,
    vino_id BIGINT NOT NULL REFERENCES public.vini(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    giacenzaa INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint unico per evitare duplicati
    UNIQUE(vino_id, user_id)
);

-- 3. Abilita RLS
ALTER TABLE public.giacenza ENABLE ROW LEVEL SECURITY;

-- 4. Crea le policy per RLS
CREATE POLICY "Users can view own giacenza" ON public.giacenza
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own giacenza" ON public.giacenza
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own giacenza" ON public.giacenza
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own giacenza" ON public.giacenza
    FOR DELETE USING (auth.uid() = user_id);

-- 5. Crea indici per performance
CREATE INDEX idx_giacenza_vino_id ON public.giacenza(vino_id);
CREATE INDEX idx_giacenza_user_id ON public.giacenza(user_id);
CREATE INDEX idx_giacenza_vino_user ON public.giacenza(vino_id, user_id);

-- 6. Verifica che la tabella vini abbia la struttura corretta
DO $$
BEGIN
    -- Assicurati che la tabella vini abbia un ID di tipo BIGINT/BIGSERIAL
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vini' 
        AND column_name = 'id'
        AND data_type = 'bigint'
        AND table_schema = 'public'
    ) THEN
        RAISE EXCEPTION 'ERRORE: La tabella vini deve avere una colonna id di tipo BIGINT';
    END IF;
END $$;

-- 7. Messaggio di conferma
SELECT 'Tabella giacenza creata con successo!' as risultato;
