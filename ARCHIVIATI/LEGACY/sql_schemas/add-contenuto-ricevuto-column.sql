-- Aggiungi colonna contenuto_ricevuto alla tabella ordini
ALTER TABLE ordini ADD COLUMN IF NOT EXISTS contenuto_ricevuto JSONB;

-- Verifica la struttura aggiornata
\d ordini;
