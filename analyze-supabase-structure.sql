
-- ============================================
-- ANALISI COMPLETA STRUTTURA SUPABASE WINENODE
-- ============================================

-- 1. ELENCO TUTTE LE TABELLE
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 2. STRUTTURA DETTAGLIATA OGNI TABELLA
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    c.character_maximum_length
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
ORDER BY t.table_name, c.ordinal_position;

-- 3. FOREIGN KEYS E RELAZIONI
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';

-- 4. INDICI ESISTENTI
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. RLS STATUS
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 6. POLICIES ATTIVE
SELECT 
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
ORDER BY tablename, policyname;

-- 7. CONTEGGIO RECORD PER TABELLA
SELECT 
    'vini' as tabella,
    COUNT(*) as numero_record
FROM vini
UNION ALL
SELECT 
    'giacenza' as tabella,
    COUNT(*) as numero_record
FROM giacenza
UNION ALL
SELECT 
    'fornitori' as tabella,
    COUNT(*) as numero_record
FROM fornitori
UNION ALL
SELECT 
    'tipologie' as tabella,
    COUNT(*) as numero_record
FROM tipologie
UNION ALL
SELECT 
    'ordini' as tabella,
    COUNT(*) as numero_record
FROM ordini
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ordini')
UNION ALL
SELECT 
    'ordini_dettaglio' as tabella,
    COUNT(*) as numero_record
FROM ordini_dettaglio
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ordini_dettaglio');

-- 8. VERIFICA UTENTI PRESENTI
SELECT 
    DISTINCT user_id
FROM vini
UNION
SELECT 
    DISTINCT user_id
FROM giacenza
WHERE user_id IS NOT NULL;

-- 9. TEST RELAZIONI GIACENZA-VINI
SELECT 
    v.id as vino_id,
    v.nome_vino,
    g.giacenza,
    g.user_id
FROM vini v
LEFT JOIN giacenza g ON v.id = g.vino_id
LIMIT 5;

-- 10. VERIFICA SEQUENCE E AUTO-INCREMENT
SELECT 
    table_name,
    column_name,
    column_default
FROM information_schema.columns
WHERE column_default LIKE 'nextval%'
  AND table_schema = 'public';
