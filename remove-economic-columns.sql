
-- IMPORTANTE: Le colonne economiche devono rimanere nel database
-- Vengono popolate dal Google Sheet ma NON mostrate nell'UI

-- Questo script è stato annullato
-- Le colonne costo, vendita, margine rimangono in Supabase

DO $$
BEGIN
    RAISE NOTICE '📋 Le colonne economiche rimangono nel database Supabase';
    RAISE NOTICE '💰 Sono popolate dal Google Sheet ma nascoste nell''interfaccia utente';
    RAISE NOTICE '🚫 Non eseguire ALTER TABLE DROP COLUMN su costo, vendita, margine';
END $$;
