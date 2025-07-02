
-- SCRIPT COMPLETO PER RIPARARE DATABASE WINENODE
-- STRUTTURA CORRETTA CON GIACENZA (SINGOLARE)

-- 1. Elimina tutte le policy esistenti per evitare conflitti
DROP POLICY IF EXISTS "Select own giacenze" ON giacenze;
DROP POLICY IF EXISTS "Insert own giacenze" ON giacenze;
DROP POLICY IF EXISTS "Update own giacenze" ON giacenze;
DROP POLICY IF EXISTS "Select own giacenza" ON giacenza;
DROP POLICY IF EXISTS "Insert own giacenza" ON giacenza;
DROP POLICY IF EXISTS "Update own giacenza" ON giacenza;
DROP POLICY IF EXISTS "Select own vini" ON vini;
DROP POLICY IF EXISTS "Insert own vini" ON vini;
DROP POLICY IF EXISTS "Update own vini" ON vini;

-- 2. Rimuovi tabelle sbagliate
DROP TABLE IF EXISTS giacenze CASCADE;

-- 3. Crea/aggiorna tabella vini
CREATE TABLE IF NOT EXISTS vini (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome_vino TEXT NOT NULL DEFAULT '',
  tipologia TEXT NOT NULL DEFAULT '',
  produttore TEXT NOT NULL DEFAULT '',
  provenienza TEXT NOT NULL DEFAULT '',
  fornitore TEXT NOT NULL DEFAULT '',
  anno INTEGER CHECK (anno >= 1800 AND anno <= 2100),
  costo DECIMAL(10,2) DEFAULT 0.00,
  vendita DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Crea tabella GIACENZA (singolare) corretta
CREATE TABLE IF NOT EXISTS giacenza (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vino_id UUID REFERENCES vini(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  giacenza INTEGER DEFAULT 6,
  min_stock INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (vino_id, user_id)
);

-- 5. Abilita RLS
ALTER TABLE giacenza ENABLE ROW LEVEL SECURITY;
ALTER TABLE vini ENABLE ROW LEVEL SECURITY;

-- 6. Crea policy corrette per GIACENZA
CREATE POLICY "Users can view own giacenza" ON giacenza
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own giacenza" ON giacenza
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own giacenza" ON giacenza
  FOR UPDATE USING (auth.uid() = user_id);

-- 7. Crea policy per VINI
CREATE POLICY "Users can view own vini" ON vini
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vini" ON vini
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vini" ON vini
  FOR UPDATE USING (auth.uid() = user_id);

-- 8. Crea indici per performance
CREATE INDEX IF NOT EXISTS idx_vini_user_id ON vini(user_id);
CREATE INDEX IF NOT EXISTS idx_giacenza_user_id ON giacenza(user_id);
CREATE INDEX IF NOT EXISTS idx_giacenza_vino_id ON giacenza(vino_id);

-- 9. Crea una riga di giacenza per ogni vino esistente che non ce l'ha
INSERT INTO giacenza (vino_id, user_id, giacenza, min_stock)
SELECT v.id, v.user_id, 6, 3
FROM vini v
WHERE NOT EXISTS (
  SELECT 1 FROM giacenza g 
  WHERE g.vino_id = v.id AND g.user_id = v.user_id
);

-- 10. Notifica reload schema
NOTIFY pgrst, 'reload schema';

-- Messaggio finale
DO $$
BEGIN
    RAISE NOTICE '✅ DATABASE WINENODE RIPARATO!';
    RAISE NOTICE '📋 Tabella GIACENZA (singolare) creata correttamente';
    RAISE NOTICE '🔗 Relazione: giacenza.vino_id -> vini.id';
    RAISE NOTICE '🔒 RLS e policies configurate';
    RAISE NOTICE '⚡ Indici e cache aggiornati';
END $$;
