ALTER TABLE ordini ADD COLUMN IF NOT EXISTS stato TEXT NOT NULL DEFAULT 'sospeso' CHECK (stato IN ('sospeso', 'inviato', 'ricevuto', 'archiviato'));
