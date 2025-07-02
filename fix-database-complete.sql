-- SCRIPT FINALE CORRETTO PER WINENODE
-- Eseguire nel SQL Editor di Supabase

-- 1. Elimina tabelle problematiche
DROP TABLE IF EXISTS public.giacenze CASCADE;
DROP TABLE IF EXISTS public.giacenza CASCADE;

-- 2. Crea tabella vini corretta
CREATE TABLE IF NOT EXISTS public.vini (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crea tabella GIACENZA (singolare) corretta
CREATE TABLE public.giacenza (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vino_id UUID NOT NULL REFERENCES public.vini(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    giacenza INTEGER NOT NULL DEFAULT 0 CHECK (giacenza >= 0),
    min_stock INTEGER DEFAULT 2,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(vino_id, user_id)
);

-- 4. Abilita RLS
ALTER TABLE public.vini ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giacenza ENABLE ROW LEVEL SECURITY;

-- 5. Elimina policy esistenti
DROP POLICY IF EXISTS "Users can view own wines" ON public.vini;
DROP POLICY IF EXISTS "Users can insert own wines" ON public.vini;
DROP POLICY IF EXISTS "Users can update own wines" ON public.vini;
DROP POLICY IF EXISTS "Users can view own giacenza" ON public.giacenza;
DROP POLICY IF EXISTS "Users can insert own giacenza" ON public.giacenza;
DROP POLICY IF EXISTS "Users can update own giacenza" ON public.giacenza;

-- 6. Crea policy corrette
CREATE POLICY "Users can view own wines" ON public.vini
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wines" ON public.vini
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wines" ON public.vini
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own giacenza" ON public.giacenza
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own giacenza" ON public.giacenza
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own giacenza" ON public.giacenza
    FOR UPDATE USING (auth.uid() = user_id);

-- 7. Crea indici
CREATE INDEX IF NOT EXISTS idx_vini_user_id ON public.vini(user_id);
CREATE INDEX IF NOT EXISTS idx_giacenza_user_id ON public.giacenza(user_id);
CREATE INDEX IF NOT EXISTS idx_giacenza_vino_id ON public.giacenza(vino_id);

-- 8. Pulisci cache
NOTIFY pgrst, 'reload schema';

-- 9. Messaggio finale
DO $$
BEGIN
    RAISE NOTICE '✅ WINENODE DATABASE RIPARATO!';
    RAISE NOTICE '📋 Tabella GIACENZA (singolare) creata';
    RAISE NOTICE '🔗 FK: giacenza.vino_id -> vini.id (UUID)';
    RAISE NOTICE '🔒 RLS e policies attive';
END $$;