
-- Script per rimuovere le colonne economiche dalla tabella vini
-- Eseguire nel SQL Editor di Supabase

-- Rimuovi le colonne costo, vendita e margine
ALTER TABLE public.vini DROP COLUMN IF EXISTS costo;
ALTER TABLE public.vini DROP COLUMN IF EXISTS vendita; 
ALTER TABLE public.vini DROP COLUMN IF EXISTS margine;

-- Messaggio di conferma
DO $$
BEGIN
    RAISE NOTICE '✅ Colonne economiche rimosse dalla tabella vini';
    RAISE NOTICE '📋 La tabella vini ora contiene solo: nome_vino, anno, produttore, provenienza, fornitore, tipologia';
    RAISE NOTICE '💰 I dati economici rimangono solo nel Google Sheet';
END $$;
