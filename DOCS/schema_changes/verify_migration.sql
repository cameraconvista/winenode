-- =========================
-- verify_migration.sql
-- =========================
-- VERIFICA MIGRAZIONE USER_ID FISSO
-- Da eseguire DOPO service_user.sql

-- 1) VERIFICA: Nessun record con user_id diverso da SERVICE_USER_ID
SELECT 'vini' as tabella, COUNT(*) as records_non_conformi 
FROM public.vini 
WHERE user_id <> '00000000-0000-0000-0000-000000000001'

UNION ALL 

SELECT 'giacenza', COUNT(*) 
FROM public.giacenza 
WHERE user_id <> '00000000-0000-0000-0000-000000000001'

UNION ALL 

SELECT 'ordini', COUNT(*) 
FROM public.ordini 
WHERE user_id <> '00000000-0000-0000-0000-000000000001'

UNION ALL 

SELECT 'tipologie', COUNT(*) 
FROM public.tipologie 
WHERE user_id <> '00000000-0000-0000-0000-000000000001'

UNION ALL 

SELECT 'fornitori', COUNT(*) 
FROM public.fornitori 
WHERE user_id <> '00000000-0000-0000-0000-000000000001';

-- Risultato atteso: tutti 0

-- 2) VERIFICA: Conteggio totale record per tabella
SELECT 'vini' as tabella, COUNT(*) as totale_records FROM public.vini
UNION ALL SELECT 'giacenza', COUNT(*) FROM public.giacenza
UNION ALL SELECT 'ordini', COUNT(*) FROM public.ordini
UNION ALL SELECT 'tipologie', COUNT(*) FROM public.tipologie
UNION ALL SELECT 'fornitori', COUNT(*) FROM public.fornitori;

-- 3) TEST DEFAULT: Inserimento senza user_id specificato
-- NOTA: Eseguire manualmente uno alla volta, poi eliminare

-- Test vini:
-- INSERT INTO public.vini (nome_vino, tipologia) VALUES ('Test Default Vino', 'TEST');
-- SELECT user_id, nome_vino FROM public.vini WHERE nome_vino = 'Test Default Vino';
-- DELETE FROM public.vini WHERE nome_vino = 'Test Default Vino';

-- Test fornitori:
-- INSERT INTO public.fornitori (nome) VALUES ('TEST DEFAULT FORNITORE');
-- SELECT user_id, nome FROM public.fornitori WHERE nome = 'TEST DEFAULT FORNITORE';
-- DELETE FROM public.fornitori WHERE nome = 'TEST DEFAULT FORNITORE';

-- 4) VERIFICA SCHEMA: Default value impostato
SELECT 
    table_name,
    column_name,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND column_name = 'user_id'
AND table_name IN ('vini', 'giacenza', 'ordini', 'tipologie', 'fornitori')
ORDER BY table_name;
