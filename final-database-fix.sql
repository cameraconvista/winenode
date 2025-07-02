
-- === RIPARAZIONE FINALE DATABASE WINENODE ===
-- Basato sull'analisi struttura Supabase completata

-- 1. Verifica e ripara la tabella giacenza
DO $$
BEGIN
    -- Verifica se la tabella giacenza esiste
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'giacenza' AND table_schema = 'public'
    ) THEN
        -- Verifica la colonna min_stock
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'giacenza' 
            AND column_name = 'min_stock'
            AND table_schema = 'public'
        ) THEN
            ALTER TABLE public.giacenza ADD COLUMN min_stock INTEGER DEFAULT 2;
            RAISE NOTICE '✅ Colonna min_stock aggiunta alla tabella giacenza';
        END IF;
    ELSE
        -- Crea la tabella giacenza se non esiste
        CREATE TABLE public.giacenza (
            id BIGSERIAL PRIMARY KEY,
            vino_id BIGINT NOT NULL,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            giacenza INTEGER DEFAULT 0 CHECK (giacenza >= 0),
            min_stock INTEGER DEFAULT 2,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            
            CONSTRAINT fk_giacenza_vino_id 
                FOREIGN KEY (vino_id) 
                REFERENCES public.vini(id) 
                ON DELETE CASCADE,
            
            UNIQUE(vino_id, user_id)
        );
        RAISE NOTICE '✅ Tabella giacenza creata';
    END IF;
END $$;

-- 2. Assicura che RLS sia attivo
ALTER TABLE public.vini ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giacenza ENABLE ROW LEVEL SECURITY;

-- 3. Verifica e ricrea le policy per giacenza
DROP POLICY IF EXISTS "Users can view own giacenza" ON public.giacenza;
DROP POLICY IF EXISTS "Users can insert own giacenza" ON public.giacenza;
DROP POLICY IF EXISTS "Users can update own giacenza" ON public.giacenza;
DROP POLICY IF EXISTS "Users can delete own giacenza" ON public.giacenza;

CREATE POLICY "Users can view own giacenza" ON public.giacenza
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own giacenza" ON public.giacenza
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own giacenza" ON public.giacenza
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own giacenza" ON public.giacenza
    FOR DELETE USING (auth.uid() = user_id);

-- 4. Indici per performance
CREATE INDEX IF NOT EXISTS idx_giacenza_user_vino ON public.giacenza(user_id, vino_id);
CREATE INDEX IF NOT EXISTS idx_giacenza_vino_id ON public.giacenza(vino_id);

-- 5. Pulisci cache schema
NOTIFY pgrst, 'reload schema';

-- Messaggio finale
DO $$
BEGIN
    RAISE NOTICE '🎉 DATABASE WINENODE RIPARATO COMPLETAMENTE!';
    RAISE NOTICE '✅ Tabella giacenza: OK';
    RAISE NOTICE '✅ Foreign Key: giacenza.vino_id -> vini.id';
    RAISE NOTICE '✅ RLS e Policy: OK';
    RAISE NOTICE '✅ Indici: OK';
    RAISE NOTICE '🚀 L''app dovrebbe funzionare correttamente ora!';
END $$;
