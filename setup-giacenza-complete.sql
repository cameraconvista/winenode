
-- ============================================
-- SCRIPT COMPLETO PER SISTEMA GIACENZE WINENODE
-- Eseguire nel SQL Editor di Supabase
-- ============================================

-- 1. PULIZIA COMPLETA (se necessario)
DROP TABLE IF EXISTS public.giacenze CASCADE;
DROP TABLE IF EXISTS public.giacenza CASCADE;

-- 2. Verifica e pulizia tabella vini (rimuovi giacenza se esiste)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'vini' 
        AND column_name = 'giacenza'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.vini DROP COLUMN giacenza;
        RAISE NOTICE '✅ Colonna giacenza rimossa dalla tabella vini';
    END IF;
END $$;

-- 3. Crea/aggiorna tabella vini (senza giacenza)
CREATE TABLE IF NOT EXISTS public.vini (
    id BIGSERIAL PRIMARY KEY,
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

-- 4. Crea tabella giacenza (SINGOLARE)
CREATE TABLE public.giacenza (
    id BIGSERIAL PRIMARY KEY,
    vino_id BIGINT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    giacenza INTEGER DEFAULT 0 CHECK (giacenza >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- FOREIGN KEY ESPLICITA
    CONSTRAINT fk_giacenza_vino_id 
        FOREIGN KEY (vino_id) 
        REFERENCES public.vini(id) 
        ON DELETE CASCADE,
    
    -- UNIQUE per evitare duplicati
    UNIQUE(vino_id, user_id)
);

-- 5. Abilita RLS
ALTER TABLE public.vini ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giacenza ENABLE ROW LEVEL SECURITY;

-- 6. Drop policies esistenti
DROP POLICY IF EXISTS "Users can view own wines" ON public.vini;
DROP POLICY IF EXISTS "Users can insert own wines" ON public.vini;
DROP POLICY IF EXISTS "Users can update own wines" ON public.vini;
DROP POLICY IF EXISTS "Users can delete own wines" ON public.vini;

DROP POLICY IF EXISTS "Users can view own giacenza" ON public.giacenza;
DROP POLICY IF EXISTS "Users can insert own giacenza" ON public.giacenza;
DROP POLICY IF EXISTS "Users can update own giacenza" ON public.giacenza;
DROP POLICY IF EXISTS "Users can delete own giacenza" ON public.giacenza;

-- 7. Policies per vini
CREATE POLICY "Users can view own wines" ON public.vini
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wines" ON public.vini
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wines" ON public.vini
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wines" ON public.vini
    FOR DELETE USING (auth.uid() = user_id);

-- 8. Policies per giacenza
CREATE POLICY "Users can view own giacenza" ON public.giacenza
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own giacenza" ON public.giacenza
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own giacenza" ON public.giacenza
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own giacenza" ON public.giacenza
    FOR DELETE USING (auth.uid() = user_id);

-- 9. Indici per performance
CREATE INDEX IF NOT EXISTS idx_vini_user_id ON public.vini(user_id);
CREATE INDEX IF NOT EXISTS idx_vini_tipologia ON public.vini(tipologia);
CREATE INDEX IF NOT EXISTS idx_giacenza_user_id ON public.giacenza(user_id);
CREATE INDEX IF NOT EXISTS idx_giacenza_vino_id ON public.giacenza(vino_id);
CREATE INDEX IF NOT EXISTS idx_giacenza_user_vino ON public.giacenza(user_id, vino_id);

-- 10. Trigger per updated_at
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

-- 11. Pulisci cache schema
NOTIFY pgrst, 'reload schema';

-- 12. Messaggio finale
DO $$
BEGIN
    RAISE NOTICE '✅ WINENODE Schema configurato con successo!';
    RAISE NOTICE '📋 Tabella giacenza (singolare) creata';
    RAISE NOTICE '🔗 Foreign Key: giacenza.vino_id -> vini.id';
    RAISE NOTICE '🔒 RLS e policies attive';
    RAISE NOTICE '⚡ Trigger e indici configurati';
    RAISE NOTICE '🧹 Cache schema pulita';
END $$;
