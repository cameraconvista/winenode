-- ============================================
-- WINENODE - DISABILITA ROW LEVEL SECURITY
-- Data: 2025-09-22T00:27:22+02:00
-- Fase 2 Step 2: Auth Removal
-- ============================================

-- ATTENZIONE: Questo script è IRREVERSIBILE senza backup
-- Policy originali archiviate in: ARCHIVIATI/sql_policies/original_rls_policies.sql

-- 1. DISABILITA RLS SU TUTTE LE TABELLE APPLICATIVE
ALTER TABLE public.vini DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.giacenza DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordini DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipologie DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornitori DISABLE ROW LEVEL SECURITY;

-- 2. VERIFICA STATO RLS (opzionale - per debug)
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('vini', 'giacenza', 'ordini', 'tipologie', 'fornitori');

-- 3. MESSAGGI DI CONFERMA
DO $$
BEGIN
    RAISE NOTICE '✅ RLS DISABILITATO su tutte le tabelle applicative';
    RAISE NOTICE '📋 Tabelle modificate: vini, giacenza, ordini, tipologie, fornitori';
    RAISE NOTICE '🔓 Accesso ora libero senza auth.uid() check';
    RAISE NOTICE '⚠️  Per rollback: usare ARCHIVIATI/sql_policies/original_rls_policies.sql';
END $$;

-- FINE SCRIPT
