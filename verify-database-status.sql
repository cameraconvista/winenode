
-- Verifica completa dello stato del database
-- Eseguire questo nel SQL Editor di Supabase

-- 1. Verifica esistenza tabelle
SELECT 
    schemaname, 
    tablename, 
    tableowner 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('vini', 'giacenza', 'giacenze');

-- 2. Verifica struttura tabella vini
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'vini' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Verifica struttura tabella giacenza
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'giacenza' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Verifica foreign keys
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name IN ('giacenza')
    AND tc.table_schema = 'public';

-- 5. Conta vini per utente
SELECT 
    user_id,
    COUNT(*) as num_vini
FROM vini 
GROUP BY user_id;

-- 6. Conta giacenze per utente
SELECT 
    user_id,
    COUNT(*) as num_giacenze,
    SUM(giacenzaa) as giacenza_totale
FROM giacenza 
GROUP BY user_id;

-- 7. Verifica vini senza giacenza
SELECT 
    v.id,
    v.nome_vino,
    v.user_id,
    CASE WHEN g.vino_id IS NULL THEN 'NO GIACENZA' ELSE 'HA GIACENZA' END as stato_giacenza
FROM vini v
LEFT JOIN giacenza g ON v.id = g.vino_id AND v.user_id = g.user_id
ORDER BY v.id;

-- 8. Verifica giacenze orfane (senza vino corrispondente)
SELECT 
    g.vino_id,
    g.giacenzaa,
    g.user_id,
    CASE WHEN v.id IS NULL THEN 'VINO NON TROVATO' ELSE 'VINO OK' END as stato_vino
FROM giacenza g
LEFT JOIN vini v ON g.vino_id = v.id AND g.user_id = v.user_id
ORDER BY g.vino_id;
