
-- === ANALISI COMPLETA STRUTTURA SUPABASE WINENODE ===
-- Eseguire questo nel SQL Editor di Supabase per ottenere report dettagliato

-- 1. VERIFICA ESISTENZA TABELLE
SELECT '=== TABELLE ESISTENTI ===' as sezione;
SELECT 
    schemaname, 
    tablename, 
    tableowner,
    CASE WHEN has_table_privilege(tablename, 'SELECT') THEN 'LEGGIBILE' ELSE 'NON LEGGIBILE' END as permessi
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 2. STRUTTURA TABELLA VINI
SELECT '=== STRUTTURA TABELLA VINI ===' as sezione;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'vini' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. STRUTTURA TABELLA GIACENZA
SELECT '=== STRUTTURA TABELLA GIACENZA ===' as sezione;
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'giacenza' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. VERIFICA FOREIGN KEYS
SELECT '=== FOREIGN KEYS ===' as sezione;
SELECT
    tc.table_name AS tabella_origine, 
    kcu.column_name AS colonna_origine, 
    ccu.table_name AS tabella_destinazione,
    ccu.column_name AS colonna_destinazione,
    tc.constraint_name AS nome_constraint
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- 5. VERIFICA RLS
SELECT '=== ROW LEVEL SECURITY ===' as sezione;
SELECT 
    schemaname, 
    tablename, 
    CASE WHEN rowsecurity THEN 'ATTIVO' ELSE 'DISATTIVO' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- 6. VERIFICA POLICIES
SELECT '=== POLICIES CONFIGURATE ===' as sezione;
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    CASE WHEN permissive = 'PERMISSIVE' THEN 'PERMISSIVA' ELSE 'RESTRITTIVA' END as tipo,
    cmd as operazione
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 7. CONTEGGIO DATI
SELECT '=== CONTEGGIO DATI ===' as sezione;

-- Conta vini
SELECT 'VINI' as tabella, COUNT(*) as totale_record
FROM vini
UNION ALL
-- Conta giacenze
SELECT 'GIACENZA' as tabella, COUNT(*) as totale_record
FROM giacenza
ORDER BY tabella;

-- 8. VERIFICA UTENTE CORRENTE
SELECT '=== INFO UTENTE CORRENTE ===' as sezione;
SELECT 
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 'AUTENTICATO: ' || auth.uid()::text
    ELSE 'NON AUTENTICATO'
  END as stato_auth;

-- 9. ESEMPIO DATI VINI (primi 3)
SELECT '=== ESEMPIO DATI VINI ===' as sezione;
SELECT 
    id, 
    nome_vino, 
    tipologia, 
    fornitore, 
    costo, 
    vendita,
    user_id
FROM vini 
ORDER BY created_at DESC
LIMIT 3;

-- 10. ESEMPIO DATI GIACENZA (primi 3)
SELECT '=== ESEMPIO DATI GIACENZA ===' as sezione;
SELECT 
    g.id, 
    g.vino_id,
    v.nome_vino,
    g.giacenza, 
    g.user_id
FROM giacenza g
LEFT JOIN vini v ON g.vino_id = v.id
ORDER BY g.created_at DESC
LIMIT 3;

-- 11. VERIFICA RELAZIONI VINI-GIACENZA
SELECT '=== VERIFICA RELAZIONI VINI-GIACENZA ===' as sezione;
SELECT 
    'VINI SENZA GIACENZA' as tipo,
    COUNT(*) as conteggio
FROM vini v
LEFT JOIN giacenza g ON v.id = g.vino_id AND v.user_id = g.user_id
WHERE g.vino_id IS NULL

UNION ALL

SELECT 
    'GIACENZE ORFANE' as tipo,
    COUNT(*) as conteggio
FROM giacenza g
LEFT JOIN vini v ON g.vino_id = v.id AND g.user_id = v.user_id
WHERE v.id IS NULL;

-- 12. VERIFICA INDICI
SELECT '=== INDICI CONFIGURATI ===' as sezione;
SELECT 
    indexname, 
    tablename, 
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
    AND tablename IN ('vini', 'giacenza')
ORDER BY tablename, indexname;

SELECT '=== ANALISI STRUTTURA COMPLETATA ===' as sezione;
