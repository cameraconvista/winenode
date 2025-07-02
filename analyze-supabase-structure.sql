-- === ANALISI COMPLETA STRUTTURA SUPABASE ATTUALE ===

-- Verifica tabelle esistenti
SELECT 'TABELLE ESISTENTI:' as info;
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Analisi tabella VINI
SELECT 'ANALISI TABELLA VINI:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'vini' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'CONTEGGIO VINI:' as info;
SELECT COUNT(*) as total_vini FROM vini;

-- Analisi tabella GIACENZA
SELECT 'ANALISI TABELLA GIACENZA:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'giacenza' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'CONTEGGIO GIACENZA:' as info;
SELECT COUNT(*) as total_giacenza FROM giacenza;

-- Analisi tabella ORDINI (semplice)
SELECT 'ANALISI TABELLA ORDINI:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ordini' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'CONTEGGIO ORDINI:' as info;
SELECT COUNT(*) as total_ordini FROM ordini;

-- Analisi tabella FORNITORI
SELECT 'ANALISI TABELLA FORNITORI:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'fornitori' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'CONTEGGIO FORNITORI:' as info;
SELECT COUNT(*) as total_fornitori FROM fornitori;

-- Analisi tabella TIPOLOGIE
SELECT 'ANALISI TABELLA TIPOLOGIE:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'tipologie' AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT 'CONTEGGIO TIPOLOGIE:' as info;
SELECT COUNT(*) as total_tipologie FROM tipologie;

-- Verifica RLS
SELECT 'VERIFICA RLS:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('vini', 'giacenza', 'ordini', 'fornitori', 'tipologie');

-- Verifica POLICY
SELECT 'VERIFICA POLICY:' as info;
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verifica indici
SELECT 'VERIFICA INDICI:' as info;
SELECT indexname, tablename, indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('vini', 'giacenza', 'ordini', 'fornitori', 'tipologie')
ORDER BY tablename, indexname;

-- Test di connessione con utente specifico
SELECT 'TEST USER ID:' as info;
SELECT 
  CASE 
    WHEN auth.uid() IS NOT NULL THEN 'User autenticato: ' || auth.uid()::text
    ELSE 'Nessun utente autenticato'
  END as auth_status;

-- Verifica dati di esempio
SELECT 'ESEMPIO VINI:' as info;
SELECT id, nome_vino, tipologia, fornitore, costo, vendita
FROM vini 
LIMIT 3;

SELECT 'ESEMPIO GIACENZA:' as info;
SELECT g.id, v.nome_vino, g.giacenza, g.min_stock
FROM giacenza g
JOIN vini v ON g.vino_id = v.id
LIMIT 3;

SELECT '=== ANALISI COMPLETATA ===' as info;