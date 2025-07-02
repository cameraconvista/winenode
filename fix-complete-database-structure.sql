
-- ============================================
-- STANDARDIZZAZIONE COMPLETA DATABASE WINENODE
-- Converte tutto a UUID e sistema le relazioni
-- ============================================

-- 1. BACKUP DATI ESISTENTI (se presenti)
CREATE TABLE IF NOT EXISTS backup_vini AS 
SELECT * FROM vini WHERE EXISTS (SELECT 1 FROM vini LIMIT 1);

CREATE TABLE IF NOT EXISTS backup_giacenza AS 
SELECT * FROM giacenza WHERE EXISTS (SELECT 1 FROM giacenza LIMIT 1);

-- 2. DROP E RICREA CON STRUTTURA CORRETTA
DROP TABLE IF EXISTS giacenza CASCADE;
DROP TABLE IF EXISTS vini CASCADE;
DROP TABLE IF EXISTS fornitori CASCADE;
DROP TABLE IF EXISTS tipologie CASCADE;

-- 3. TABELLA TIPOLOGIE (UUID)
CREATE TABLE tipologie (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    colore TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABELLA FORNITORI (UUID)
CREATE TABLE fornitori (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    telefono TEXT,
    email TEXT,
    min_ordine_importo DECIMAL(10,2) DEFAULT 0,
    note TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABELLA VINI (UUID)
CREATE TABLE vini (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    nome_vino TEXT NOT NULL DEFAULT '',
    tipologia TEXT NOT NULL DEFAULT '',
    produttore TEXT NOT NULL DEFAULT '',
    provenienza TEXT NOT NULL DEFAULT '',
    fornitore TEXT NOT NULL DEFAULT '',
    anno TEXT,
    costo DECIMAL(10,2) DEFAULT 0.00,
    vendita DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELLA GIACENZA (UUID)
CREATE TABLE giacenza (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vino_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    giacenza INTEGER DEFAULT 0 CHECK (giacenza >= 0),
    min_stock INTEGER DEFAULT 2 CHECK (min_stock >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- FOREIGN KEY CORRETTA
    CONSTRAINT fk_giacenza_vino_id 
        FOREIGN KEY (vino_id) 
        REFERENCES vini(id) 
        ON DELETE CASCADE,
    
    -- UNIQUE per evitare duplicati
    UNIQUE(vino_id, user_id)
);

-- 7. ABILITA RLS
ALTER TABLE vini ENABLE ROW LEVEL SECURITY;
ALTER TABLE giacenza ENABLE ROW LEVEL SECURITY;
ALTER TABLE fornitori ENABLE ROW LEVEL SECURITY;
ALTER TABLE tipologie ENABLE ROW LEVEL SECURITY;

-- 8. POLICIES VINI
CREATE POLICY "vini_select_own" ON vini FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "vini_insert_own" ON vini FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vini_update_own" ON vini FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "vini_delete_own" ON vini FOR DELETE USING (auth.uid() = user_id);

-- 9. POLICIES GIACENZA
CREATE POLICY "giacenza_select_own" ON giacenza FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "giacenza_insert_own" ON giacenza FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "giacenza_update_own" ON giacenza FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "giacenza_delete_own" ON giacenza FOR DELETE USING (auth.uid() = user_id);

-- 10. POLICIES FORNITORI
CREATE POLICY "fornitori_select_own" ON fornitori FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "fornitori_insert_own" ON fornitori FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "fornitori_update_own" ON fornitori FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "fornitori_delete_own" ON fornitori FOR DELETE USING (auth.uid() = user_id);

-- 11. POLICIES TIPOLOGIE
CREATE POLICY "tipologie_select_own" ON tipologie FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tipologie_insert_own" ON tipologie FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tipologie_update_own" ON tipologie FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "tipologie_delete_own" ON tipologie FOR DELETE USING (auth.uid() = user_id);

-- 12. INDICI PER PERFORMANCE
CREATE INDEX idx_vini_user_id ON vini(user_id);
CREATE INDEX idx_vini_tipologia ON vini(tipologia);
CREATE INDEX idx_vini_fornitore ON vini(fornitore);
CREATE INDEX idx_giacenza_user_id ON giacenza(user_id);
CREATE INDEX idx_giacenza_vino_id ON giacenza(vino_id);
CREATE INDEX idx_giacenza_user_vino ON giacenza(user_id, vino_id);
CREATE INDEX idx_fornitori_user_id ON fornitori(user_id);
CREATE INDEX idx_tipologie_user_id ON tipologie(user_id);

-- 13. TRIGGER UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vini_updated_at 
    BEFORE UPDATE ON vini 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_giacenza_updated_at 
    BEFORE UPDATE ON giacenza 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fornitori_updated_at 
    BEFORE UPDATE ON fornitori 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tipologie_updated_at 
    BEFORE UPDATE ON tipologie 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. GRANT PERMESSI
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON vini TO authenticated;
GRANT ALL ON giacenza TO authenticated;
GRANT ALL ON fornitori TO authenticated;
GRANT ALL ON tipologie TO authenticated;

-- 15. NOTIFICA CACHE REFRESH
NOTIFY pgrst, 'reload schema';

-- 16. MESSAGGIO FINALE
DO $$
BEGIN
    RAISE NOTICE '✅ STRUTTURA DATABASE STANDARDIZZATA!';
    RAISE NOTICE '🔑 Tutti gli ID sono ora UUID';
    RAISE NOTICE '🔗 Relazioni foreign key corrette';
    RAISE NOTICE '🔒 RLS e policies configurate';
    RAISE NOTICE '⚡ Indici e trigger attivi';
    RAISE NOTICE '📋 Pronto per l''app WineNode';
END $$;
