-- =========================
-- service_user.sql (BEGIN)
-- =========================
-- STEP 3: USER_ID FISSO + MIGRAZIONE DATI (tenant unico)
-- Data: 2025-09-22T00:35:23+02:00
-- Assunto: RLS già DISABILITATA (STEP 2)

-- SERVICE_USER_ID fisso convenzionale
-- UUID: 00000000-0000-0000-0000-000000000001

-- 1) Imposta DEFAULT del SERVICE_USER_ID sulle colonne user_id (se presenti)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['vini','giacenza','ordini','tipologie','fornitori']
  LOOP
    BEGIN
      EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id SET DEFAULT %L::uuid;', t, '00000000-0000-0000-0000-000000000001');
      RAISE NOTICE '✅ DEFAULT impostato per tabella: %', t;
    EXCEPTION WHEN undefined_column THEN
      -- La tabella non ha user_id: ignora
      RAISE NOTICE '⚠️ Tabella % non ha colonna user_id, ignorata', t;
    END;
  END LOOP;
END$$;

-- 2) Aggiorna TUTTI i record esistenti al SERVICE_USER_ID (solo dove necessario)
UPDATE public.vini       SET user_id = '00000000-0000-0000-0000-000000000001' WHERE user_id IS DISTINCT FROM '00000000-0000-0000-0000-000000000001';
UPDATE public.giacenza   SET user_id = '00000000-0000-0000-0000-000000000001' WHERE user_id IS DISTINCT FROM '00000000-0000-0000-0000-000000000001';
UPDATE public.ordini     SET user_id = '00000000-0000-0000-0000-000000000001' WHERE user_id IS DISTINCT FROM '00000000-0000-0000-0000-000000000001';
UPDATE public.tipologie  SET user_id = '00000000-0000-0000-0000-000000000001' WHERE user_id IS DISTINCT FROM '00000000-0000-0000-0000-000000000001';
UPDATE public.fornitori  SET user_id = '00000000-0000-0000-0000-000000000001' WHERE user_id IS DISTINCT FROM '00000000-0000-0000-0000-000000000001';

-- 3) Sistema eventuali NULL
UPDATE public.vini       SET user_id = '00000000-0000-0000-0000-000000000001' WHERE user_id IS NULL;
UPDATE public.giacenza   SET user_id = '00000000-0000-0000-0000-000000000001' WHERE user_id IS NULL;
UPDATE public.ordini     SET user_id = '00000000-0000-0000-0000-000000000001' WHERE user_id IS NULL;
UPDATE public.tipologie  SET user_id = '00000000-0000-0000-0000-000000000001' WHERE user_id IS NULL;
UPDATE public.fornitori  SET user_id = '00000000-0000-0000-0000-000000000001' WHERE user_id IS NULL;

-- (OPZIONALE, solo se serve) Uniforma a NOT NULL dopo l'allineamento
-- ALTER TABLE public.vini       ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE public.giacenza   ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE public.ordini     ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE public.tipologie  ALTER COLUMN user_id SET NOT NULL;
-- ALTER TABLE public.fornitori  ALTER COLUMN user_id SET NOT NULL;

-- 4) Verifica rapida - DECOMMENTARE PER ESEGUIRE
-- SELECT 'vini' as tabella, COUNT(*) as records_non_conformi FROM public.vini WHERE user_id <> '00000000-0000-0000-0000-000000000001'
-- UNION ALL SELECT 'giacenza', COUNT(*) FROM public.giacenza WHERE user_id <> '00000000-0000-0000-0000-000000000001'
-- UNION ALL SELECT 'ordini', COUNT(*) FROM public.ordini WHERE user_id <> '00000000-0000-0000-0000-000000000001'
-- UNION ALL SELECT 'tipologie', COUNT(*) FROM public.tipologie WHERE user_id <> '00000000-0000-0000-0000-000000000001'
-- UNION ALL SELECT 'fornitori', COUNT(*) FROM public.fornitori WHERE user_id <> '00000000-0000-0000-0000-000000000001';

-- Atteso: tutti 0

-- 5) Test INSERT con DEFAULT - DECOMMENTARE PER TESTARE
-- INSERT INTO public.vini (nome_vino, tipologia) VALUES ('Test Vino', 'TEST');
-- SELECT user_id FROM public.vini WHERE nome_vino = 'Test Vino';
-- DELETE FROM public.vini WHERE nome_vino = 'Test Vino';

-- 6) Messaggi finali
DO $$
BEGIN
    RAISE NOTICE '🎯 MIGRAZIONE USER_ID COMPLETATA';
    RAISE NOTICE '📋 Tutte le tabelle ora usano SERVICE_USER_ID: 00000000-0000-0000-0000-000000000001';
    RAISE NOTICE '✅ DEFAULT impostato per nuovi record';
    RAISE NOTICE '🔄 Record esistenti migrati al tenant unico';
    RAISE NOTICE '⚠️ Eseguire query di verifica per confermare risultati';
END $$;

-- =======================
-- service_user.sql (END)
-- =======================
