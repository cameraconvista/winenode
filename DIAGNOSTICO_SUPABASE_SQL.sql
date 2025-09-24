-- ============================================
-- WINENODE - DIAGNOSTICO SUPABASE COMPLETO
-- ============================================
-- Data: 25/09/2025 01:02
-- Scopo: Verificare configurazione attuale database
-- Eseguire in Supabase SQL Editor per diagnosi completa

-- ============================================
-- 1. VERIFICA STRUTTURA TABELLE
-- ============================================

-- Verifica esistenza e struttura tabella ordini
SELECT 
    'TABELLA ORDINI - STRUTTURA' as diagnostico,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ordini'
ORDER BY ordinal_position;

-- Verifica esistenza e struttura tabella fornitori
SELECT 
    'TABELLA FORNITORI - STRUTTURA' as diagnostico,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'fornitori'
ORDER BY ordinal_position;

-- ============================================
-- 2. VERIFICA DATI ESISTENTI
-- ============================================

-- Conta record in tabelle principali
SELECT 
    'CONTEGGIO RECORD' as diagnostico,
    'ordini' as tabella,
    COUNT(*) as record_count
FROM public.ordini
UNION ALL
SELECT 
    'CONTEGGIO RECORD',
    'fornitori',
    COUNT(*)
FROM public.fornitori
UNION ALL
SELECT 
    'CONTEGGIO RECORD',
    'tipologie',
    COUNT(*)
FROM public.tipologie
UNION ALL
SELECT 
    'CONTEGGIO RECORD',
    'vini',
    COUNT(*)
FROM public.vini;

-- Verifica fornitori esistenti
SELECT 
    'FORNITORI ESISTENTI' as diagnostico,
    id,
    nome,
    user_id,
    created_at
FROM public.fornitori
ORDER BY nome;

-- Verifica ordini esistenti (ultimi 10)
SELECT 
    'ORDINI ESISTENTI' as diagnostico,
    id,
    user_id,
    fornitore,
    totale,
    data,
    stato,
    contenuto,
    created_at
FROM public.ordini
ORDER BY created_at DESC
LIMIT 10;

-- ============================================
-- 3. VERIFICA FOREIGN KEYS E CONSTRAINTS
-- ============================================

-- Verifica foreign keys
SELECT 
    'FOREIGN KEYS' as diagnostico,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('ordini', 'fornitori', 'vini', 'tipologie');

-- Verifica constraints
SELECT 
    'CONSTRAINTS' as diagnostico,
    table_name,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name IN ('ordini', 'fornitori', 'vini', 'tipologie')
ORDER BY table_name, constraint_type;

-- ============================================
-- 4. VERIFICA RLS POLICIES
-- ============================================

-- Verifica Row Level Security
SELECT 
    'RLS STATUS' as diagnostico,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('ordini', 'fornitori', 'vini', 'tipologie');

-- Verifica policies esistenti
SELECT 
    'RLS POLICIES' as diagnostico,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('ordini', 'fornitori', 'vini', 'tipologie')
ORDER BY tablename, policyname;

-- ============================================
-- 5. VERIFICA SERVICE_USER_ID
-- ============================================

-- Verifica se SERVICE_USER_ID esiste nei dati
SELECT 
    'SERVICE_USER_ID CHECK' as diagnostico,
    'ordini' as tabella,
    COUNT(*) as records_with_service_user
FROM public.ordini
WHERE user_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 
    'SERVICE_USER_ID CHECK',
    'fornitori',
    COUNT(*)
FROM public.fornitori
WHERE user_id = '00000000-0000-0000-0000-000000000001'
UNION ALL
SELECT 
    'SERVICE_USER_ID CHECK',
    'vini',
    COUNT(*)
FROM public.vini
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- ============================================
-- 6. TEST INSERIMENTO ORDINE
-- ============================================

-- Test se possiamo inserire un ordine di prova
-- NOTA: Questo è solo un test, verrà fatto rollback
BEGIN;

-- Verifica se fornitore BOLOGNA VINI esiste
SELECT 
    'TEST FORNITORE BOLOGNA VINI' as diagnostico,
    id,
    nome,
    user_id
FROM public.fornitori
WHERE nome = 'BOLOGNA VINI';

-- Se non esiste, proviamo a crearlo (test)
INSERT INTO public.fornitori (user_id, nome)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    'BOLOGNA VINI TEST'
WHERE NOT EXISTS (
    SELECT 1 FROM public.fornitori 
    WHERE nome = 'BOLOGNA VINI TEST'
);

-- Test inserimento ordine
INSERT INTO public.ordini (
    user_id,
    fornitore,
    totale,
    data,
    stato,
    contenuto
)
SELECT 
    '00000000-0000-0000-0000-000000000001',
    f.id,
    100.00,
    NOW(),
    'in_corso',
    '[{"wineId": "test", "wineName": "Test Wine", "quantity": 1, "unit": "bottiglie", "unitPrice": 100, "totalPrice": 100}]'::jsonb
FROM public.fornitori f
WHERE f.nome = 'BOLOGNA VINI TEST'
LIMIT 1;

-- Verifica se l'inserimento è riuscito
SELECT 
    'TEST INSERIMENTO ORDINE' as diagnostico,
    id,
    user_id,
    fornitore,
    totale,
    stato,
    contenuto
FROM public.ordini
WHERE user_id = '00000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC
LIMIT 1;

-- Rollback del test
ROLLBACK;

-- ============================================
-- 7. VERIFICA PERMESSI UTENTE CORRENTE
-- ============================================

-- Verifica utente corrente e permessi
SELECT 
    'UTENTE CORRENTE' as diagnostico,
    current_user as utente,
    session_user as sessione,
    current_setting('role') as ruolo;

-- Verifica permessi su tabelle
SELECT 
    'PERMESSI TABELLE' as diagnostico,
    table_name,
    privilege_type
FROM information_schema.role_table_grants
WHERE grantee = current_user
AND table_schema = 'public'
AND table_name IN ('ordini', 'fornitori', 'vini', 'tipologie')
ORDER BY table_name, privilege_type;

-- ============================================
-- 8. VERIFICA TRIGGERS E FUNZIONI
-- ============================================

-- Verifica triggers esistenti
SELECT 
    'TRIGGERS' as diagnostico,
    event_object_table as tabella,
    trigger_name,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'public'
AND event_object_table IN ('ordini', 'fornitori', 'vini', 'tipologie')
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 9. VERIFICA INDICI
-- ============================================

-- Verifica indici esistenti
SELECT 
    'INDICI' as diagnostico,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('ordini', 'fornitori', 'vini', 'tipologie')
ORDER BY tablename, indexname;

-- ============================================
-- 10. DIAGNOSTICO FINALE
-- ============================================

-- Riepilogo configurazione
SELECT 
    'DIAGNOSTICO FINALE' as diagnostico,
    'Tabelle esistenti' as categoria,
    COUNT(*) as valore
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('ordini', 'fornitori', 'vini', 'tipologie')
UNION ALL
SELECT 
    'DIAGNOSTICO FINALE',
    'RLS abilitato',
    COUNT(*)
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('ordini', 'fornitori', 'vini', 'tipologie')
AND rowsecurity = true
UNION ALL
SELECT 
    'DIAGNOSTICO FINALE',
    'Policies attive',
    COUNT(*)
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('ordini', 'fornitori', 'vini', 'tipologie')
UNION ALL
SELECT 
    'DIAGNOSTICO FINALE',
    'Foreign keys',
    COUNT(*)
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name IN ('ordini', 'fornitori', 'vini', 'tipologie')
AND constraint_type = 'FOREIGN KEY';

-- ============================================
-- FINE DIAGNOSTICO
-- ============================================

-- ISTRUZIONI:
-- 1. Copiare tutto questo codice
-- 2. Incollare in Supabase SQL Editor
-- 3. Eseguire (Run)
-- 4. Copiare tutti i risultati
-- 5. Condividere per analisi completa

-- Questo diagnostico fornirà:
-- - Struttura completa delle tabelle
-- - Dati esistenti
-- - Configurazione RLS
-- - Permessi utente
-- - Test di inserimento
-- - Stato generale del database
