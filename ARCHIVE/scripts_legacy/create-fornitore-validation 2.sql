-- =====================================================
-- VALIDAZIONE AUTOMATICA FORNITORI - WineNode
-- =====================================================
-- Previene inserimento di valori fornitore non ufficiali
-- Applica soft-fix automatico (NULL) per valori non validi
-- Data: 28/09/2025
-- =====================================================

-- Funzione di validazione fornitore
-- Permette NULL, valida contro public.fornitori, applica soft-fix
CREATE OR REPLACE FUNCTION enforce_fornitore_valid()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Permetti NULL (fornitore non specificato)
  IF NEW.fornitore IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Verifica se il fornitore esiste nella tabella ufficiale
  IF EXISTS (SELECT 1 FROM public.fornitori f WHERE f.nome = NEW.fornitore) THEN
    RETURN NEW;
  ELSE
    -- Soft-fix: annulla valore non ufficiale invece di errore
    NEW.fornitore := NULL;
    
    -- Log per debug (opzionale, rimuovi se non necessario)
    RAISE NOTICE 'Fornitore non valido "%" sostituito con NULL in tabella %', 
                 OLD.fornitore, TG_TABLE_NAME;
    
    RETURN NEW;
  END IF;
END;
$$;

-- =====================================================
-- APPLICAZIONE TRIGGER ALLE TABELLE
-- =====================================================

-- 1. Tabella principale: public.vini
DROP TRIGGER IF EXISTS trg_enforce_fornitore_vini ON public.vini;
CREATE TRIGGER trg_enforce_fornitore_vini
  BEFORE INSERT OR UPDATE ON public.vini
  FOR EACH ROW EXECUTE FUNCTION enforce_fornitore_valid();

-- 2. Tabella staging: public.vini_staging (se esiste e ha colonna fornitore)
DO $$
BEGIN
  -- Verifica se la tabella e la colonna esistono
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vini_staging' 
    AND column_name = 'fornitore'
  ) THEN
    -- Rimuovi trigger esistente se presente
    DROP TRIGGER IF EXISTS trg_enforce_fornitore_vini_staging ON public.vini_staging;
    
    -- Crea nuovo trigger
    CREATE TRIGGER trg_enforce_fornitore_vini_staging
      BEFORE INSERT OR UPDATE ON public.vini_staging
      FOR EACH ROW EXECUTE FUNCTION enforce_fornitore_valid();
    
    RAISE NOTICE 'Trigger applicato a public.vini_staging';
  ELSE
    RAISE NOTICE 'Tabella public.vini_staging non trovata o senza colonna fornitore - trigger saltato';
  END IF;
END $$;

-- 3. Tabella staging raw: public.vini_staging_raw (se esiste e ha colonna fornitore)
DO $$
BEGIN
  -- Verifica se la tabella e la colonna esistono
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'vini_staging_raw' 
    AND column_name = 'fornitore'
  ) THEN
    -- Rimuovi trigger esistente se presente
    DROP TRIGGER IF EXISTS trg_enforce_fornitore_vini_staging_raw ON public.vini_staging_raw;
    
    -- Crea nuovo trigger
    CREATE TRIGGER trg_enforce_fornitore_vini_staging_raw
      BEFORE INSERT OR UPDATE ON public.vini_staging_raw
      FOR EACH ROW EXECUTE FUNCTION enforce_fornitore_valid();
    
    RAISE NOTICE 'Trigger applicato a public.vini_staging_raw';
  ELSE
    RAISE NOTICE 'Tabella public.vini_staging_raw non trovata o senza colonna fornitore - trigger saltato';
  END IF;
END $$;

-- =====================================================
-- VERIFICA INSTALLAZIONE
-- =====================================================

-- Mostra trigger creati
SELECT 
  schemaname,
  tablename,
  triggername,
  'enforce_fornitore_valid()' as function_name
FROM pg_triggers 
WHERE triggername LIKE 'trg_enforce_fornitore_%'
ORDER BY schemaname, tablename;

-- Test rapido (opzionale - decommentare per testare)
/*
-- Test 1: Inserimento valore valido
INSERT INTO public.vini (nome_vino, fornitore) VALUES ('TEST_VALID', 'BOLOGNA VINI');

-- Test 2: Inserimento valore non valido (dovrebbe diventare NULL)
INSERT INTO public.vini (nome_vino, fornitore) VALUES ('TEST_INVALID', 'FORNITORE_INESISTENTE');

-- Test 3: Inserimento NULL (dovrebbe rimanere NULL)
INSERT INTO public.vini (nome_vino, fornitore) VALUES ('TEST_NULL', NULL);

-- Verifica risultati
SELECT nome_vino, fornitore FROM public.vini WHERE nome_vino LIKE 'TEST_%';

-- Cleanup test (decommentare dopo verifica)
-- DELETE FROM public.vini WHERE nome_vino LIKE 'TEST_%';
*/

-- =====================================================
-- DOCUMENTAZIONE
-- =====================================================

COMMENT ON FUNCTION enforce_fornitore_valid() IS 
'Valida valori fornitore contro public.fornitori. Permette NULL. Applica soft-fix (NULL) per valori non validi.';

-- =====================================================
-- FINE SCRIPT
-- =====================================================

SELECT 'Validazione automatica fornitori installata con successo!' as status;
