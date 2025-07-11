
-- ============================================
-- ALLINEAMENTO NOMI COLONNE TABELLA ORDINI
-- ============================================

-- 1. Rinomina colonne esistenti per allinearle al codice
ALTER TABLE ordini 
RENAME COLUMN data_ordine TO data;

ALTER TABLE ordini 
RENAME COLUMN totale_euro TO totale;

-- 2. Aggiungi colonna contenuto mancante
ALTER TABLE ordini 
ADD COLUMN IF NOT EXISTS contenuto TEXT;

-- 3. Verifica struttura finale
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ordini' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- ============================================
-- MESSAGGIO DI CONFERMA
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Nomi colonne tabella ordini allineati al codice!';
    RAISE NOTICE '📋 Colonne: id, data, fornitore, contenuto, totale, stato, user_id';
    RAISE NOTICE '🔄 Schema database ora compatibile con il codice TypeScript';
END $$;
