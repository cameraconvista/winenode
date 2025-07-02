
-- Fix the giacenza table relationship with vini table
-- First, let's ensure the vini table exists and has the correct structure
CREATE TABLE IF NOT EXISTS vini (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_vino TEXT NOT NULL,
    anno INTEGER,
    produttore TEXT,
    provenienza TEXT,
    fornitore TEXT,
    costo DECIMAL(10,2),
    vendita DECIMAL(10,2),
    margine DECIMAL(10,2),
    tipologia TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Now fix the giacenza table with proper foreign key relationship
DROP TABLE IF EXISTS giacenza CASCADE;

CREATE TABLE giacenza (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vino_id UUID NOT NULL REFERENCES vini(id) ON DELETE CASCADE,
    giacenzaa INTEGER NOT NULL DEFAULT 0,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(vino_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_giacenza_vino_id ON giacenza(vino_id);
CREATE INDEX IF NOT EXISTS idx_giacenza_user_id ON giacenza(user_id);
CREATE INDEX IF NOT EXISTS idx_vini_user_id ON vini(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE vini ENABLE ROW LEVEL SECURITY;
ALTER TABLE giacenza ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for vini table
CREATE POLICY "Users can view own wines" ON vini
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wines" ON vini
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wines" ON vini
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wines" ON vini
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for giacenza table
CREATE POLICY "Users can view own inventory" ON giacenza
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own inventory" ON giacenza
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own inventory" ON giacenza
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own inventory" ON giacenza
    FOR DELETE USING (auth.uid() = user_id);
