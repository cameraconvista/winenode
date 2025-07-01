
-- ============================================
-- SCRIPT DI MIGRAZIONE DATI ESISTENTI
-- Solo se hai già dati nella tabella vini con giacenza
-- ============================================

-- Migra giacenze esistenti dalla tabella vini alla tabella giacenza
INSERT INTO public.giacenza (vino_id, user_id, giacenza, created_at, updated_at)
SELECT 
    id as vino_id,
    user_id,
    COALESCE(giacenza, 0) as giacenza,
    created_at,
    updated_at
FROM public.vini 
WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'vini' 
    AND column_name = 'giacenza'
    AND table_schema = 'public'
)
ON CONFLICT (vino_id, user_id) DO UPDATE SET
    giacenza = EXCLUDED.giacenza,
    updated_at = EXCLUDED.updated_at;

-- Messaggio di conferma
DO $$
BEGIN
    RAISE NOTICE '✅ Migrazione dati completata!';
    RAISE NOTICE '📊 Dati giacenza trasferiti da vini a giacenza';
END $$;
