

-- Script per correggere l'incompatibilità UUID/BIGINT
-- Esegui questo nel SQL Editor di Supabase

-- 1. Elimina tabelle esistenti per ricrearle correttamente
DROP TABLE IF EXISTS public.giacenza CASCADE;

-- 2. Verifica il tipo di ID della tabella vini
DO $$
BEGIN
    -- Controlla se vini.id è UUID o BIGINT
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vini' 
        AND column_name = 'id'
        AND data_type = 'uuid'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '✅ Tabella vini usa UUID - configurazione corretta';
    ELSIF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vini' 
        AND column_name = 'id'
        AND data_type = 'bigint'
        AND table_schema = 'public'
    ) THEN
        RAISE NOTICE '⚠️  Tabella vini usa BIGINT - sarà convertita a UUID';
    ELSE
        RAISE EXCEPTION 'ERRORE: Tabella vini non trovata o struttura incorretta';
    END IF;
END $$;

-- 3. Converti tabella vini a UUID se necessario
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vini' 
        AND column_name = 'id'
        AND data_type = 'bigint'
        AND table_schema = 'public'
    ) THEN
        -- Backup dei dati esistenti se ci sono
        CREATE TEMP TABLE vini_backup AS SELECT * FROM public.vini;
        
        -- Ricrea tabella vini con UUID
        DROP TABLE public.vini CASCADE;
        
        CREATE TABLE public.vini (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            nome_vino TEXT NOT NULL DEFAULT '',
            tipologia TEXT NOT NULL DEFAULT '',
            produttore TEXT NOT NULL DEFAULT '',
            provenienza TEXT NOT NULL DEFAULT '',
            fornitore TEXT NOT NULL DEFAULT '',
            anno INTEGER CHECK (anno >= 1800 AND anno <= 2100),
            costo DECIMAL(10,2) DEFAULT 0.00,
            vendita DECIMAL(10,2) DEFAULT 0.00,
            min_stock INTEGER DEFAULT 2,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Ripristina i dati (senza ID per generare nuovi UUID)
        INSERT INTO public.vini (user_id, nome_vino, tipologia, produttore, provenienza, fornitore, anno, costo, vendita, min_stock, created_at, updated_at)
        SELECT user_id, nome_vino, tipologia, produttore, provenienza, fornitore, anno, costo, vendita, min_stock, created_at, updated_at
        FROM vini_backup;
        
        RAISE NOTICE '✅ Tabella vini convertita a UUID';
    END IF;
END $$;

-- 4. Crea la tabella giacenza con UUID
CREATE TABLE public.giacenza (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vino_id UUID NOT NULL REFERENCES public.vini(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    giacenzaa INTEGER NOT NULL DEFAULT 0 CHECK (giacenzaa >= 0),
    min_stock INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint unico per evitare duplicati
    UNIQUE(vino_id, user_id)
);

-- 5. Abilita RLS
ALTER TABLE public.vini ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giacenza ENABLE ROW LEVEL SECURITY;

-- 6. Drop vecchie policies
DROP POLICY IF EXISTS "Users can view own wines" ON public.vini;
DROP POLICY IF EXISTS "Users can insert own wines" ON public.vini;
DROP POLICY IF EXISTS "Users can update own wines" ON public.vini;
DROP POLICY IF EXISTS "Users can delete own wines" ON public.vini;

DROP POLICY IF EXISTS "Users can view own giacenza" ON public.giacenza;
DROP POLICY IF EXISTS "Users can insert own giacenza" ON public.giacenza;
DROP POLICY IF EXISTS "Users can update own giacenza" ON public.giacenza;
DROP POLICY IF EXISTS "Users can delete own giacenza" ON public.giacenza;

-- 7. Crea nuove policies
CREATE POLICY "Users can view own wines" ON public.vini
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wines" ON public.vini
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wines" ON public.vini
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wines" ON public.vini
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own giacenza" ON public.giacenza
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own giacenza" ON public.giacenza
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own giacenza" ON public.giacenza
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own giacenza" ON public.giacenza
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Crea indici per performance
CREATE INDEX IF NOT EXISTS idx_vini_user_id ON public.vini(user_id);
CREATE INDEX IF NOT EXISTS idx_vini_tipologia ON public.vini(tipologia);
CREATE INDEX IF NOT EXISTS idx_giacenza_user_id ON public.giacenza(user_id);
CREATE INDEX IF NOT EXISTS idx_giacenza_vino_id ON public.giacenza(vino_id);
CREATE INDEX IF NOT EXISTS idx_giacenza_user_vino ON public.giacenza(user_id, vino_id);

-- 9. Trigger per updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_vini_updated_at ON public.vini;
CREATE TRIGGER update_vini_updated_at 
    BEFORE UPDATE ON public.vini 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_giacenza_updated_at ON public.giacenza;
CREATE TRIGGER update_giacenza_updated_at 
    BEFORE UPDATE ON public.giacenza 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 10. Aggiorna il cache dello schema
NOTIFY pgrst, 'reload schema';

-- 11. Messaggio finale
DO $$
BEGIN
    RAISE NOTICE '🎉 PROBLEMA RISOLTO!';
    RAISE NOTICE '✅ Incompatibilità UUID/BIGINT corretta';
    RAISE NOTICE '🔗 Foreign Key giacenza.vino_id -> vini.id (entrambi UUID)';
    RAISE NOTICE '📋 Tabelle vini e giacenza ricreate correttamente';
    RAISE NOTICE '🔒 RLS e policies configurate';
    RAISE NOTICE '⚡ Cache schema aggiornata';
    RAISE NOTICE '';
    RAISE NOTICE '▶️  PROSSIMO PASSO: Testa l''importazione CSV!';
END $$;

