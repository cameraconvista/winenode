
-- SCRIPT COMPLETO PER RIPARARE DATABASE WINENODE

-- 1. Elimina tutte le policy esistenti per evitare conflitti
DROP POLICY IF EXISTS "Select own giacenze" ON giacenze;
DROP POLICY IF EXISTS "Insert own giacenze" ON giacenze;
DROP POLICY IF EXISTS "Update own giacenze" ON giacenze;
DROP POLICY IF EXISTS "Select own vini" ON vini;
DROP POLICY IF EXISTS "Insert own vini" ON vini;
DROP POLICY IF EXISTS "Update own vini" ON vini;

-- 2. Assicura che la tabella giacenze esista con la struttura corretta
DROP TABLE IF EXISTS giacenza CASCADE;  -- Rimuovi eventuale tabella al singolare
CREATE TABLE IF NOT EXISTS giacenze (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vino_id UUID REFERENCES vini(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  giacenza INTEGER DEFAULT 6,
  min_stock INTEGER DEFAULT 3,
  updated_at TIMESTAMP DEFAULT timezone('utc', now()),
  UNIQUE (vino_id, user_id)
);

-- 3. Abilita RLS
ALTER TABLE giacenze ENABLE ROW LEVEL SECURITY;
ALTER TABLE vini ENABLE ROW LEVEL SECURITY;

-- 4. Crea policy corrette
CREATE POLICY "Users can view own giacenze" ON giacenze
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own giacenze" ON giacenze
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own giacenze" ON giacenze
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own vini" ON vini
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vini" ON vini
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vini" ON vini
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. Crea una riga di giacenza per ogni vino esistente che non ce l'ha
INSERT INTO giacenze (vino_id, user_id, giacenza, min_stock)
SELECT v.id, v.user_id, 6, 3
FROM vini v
WHERE NOT EXISTS (
  SELECT 1 FROM giacenze g 
  WHERE g.vino_id = v.id AND g.user_id = v.user_id
);
