
-- === PULIZIA COMPLETA E RICOSTRUZIONE DATABASE ===

-- Rimuovi tabelle esistenti se presenti
DROP TABLE IF EXISTS public.giacenza CASCADE;
DROP TABLE IF EXISTS public.giacenze CASCADE;
DROP TABLE IF EXISTS public.vini CASCADE;
DROP TABLE IF EXISTS public.fornitori CASCADE;
DROP TABLE IF EXISTS public.tipologie CASCADE;
DROP TABLE IF EXISTS public.ordini CASCADE;

-- === TABELLA: tipologie ===
CREATE TABLE public.tipologie (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  colore TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- === TABELLA: fornitori ===
CREATE TABLE public.fornitori (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefono TEXT,
  min_ordine_importo NUMERIC(10, 2),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- === TABELLA: vini ===
CREATE TABLE public.vini (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_vino TEXT NOT NULL,
  anno TEXT,
  produttore TEXT,
  provenienza TEXT,
  fornitore TEXT,
  costo NUMERIC(10, 2),
  vendita NUMERIC(10, 2),
  margine NUMERIC(10, 2),
  tipologia TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- === TABELLA: giacenza (SINGOLARE) ===
CREATE TABLE public.giacenza (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vino_id UUID REFERENCES public.vini(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  giacenza INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (vino_id, user_id)
);

-- === TABELLA: ordini ===
CREATE TABLE public.ordini (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  fornitore TEXT,
  contenuto JSONB,
  totale NUMERIC(10, 2),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- === ATTIVA RLS SU TUTTE LE TABELLE ===
ALTER TABLE public.vini ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.giacenza ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordini ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornitori ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tipologie ENABLE ROW LEVEL SECURITY;

-- === RIMUOVI POLICY ESISTENTI ===
DROP POLICY IF EXISTS "Select own vini" ON public.vini;
DROP POLICY IF EXISTS "Insert own vini" ON public.vini;
DROP POLICY IF EXISTS "Update own vini" ON public.vini;
DROP POLICY IF EXISTS "Delete own vini" ON public.vini;

DROP POLICY IF EXISTS "Select own giacenza" ON public.giacenza;
DROP POLICY IF EXISTS "Insert own giacenza" ON public.giacenza;
DROP POLICY IF EXISTS "Update own giacenza" ON public.giacenza;
DROP POLICY IF EXISTS "Delete own giacenza" ON public.giacenza;

DROP POLICY IF EXISTS "Select own ordini" ON public.ordini;
DROP POLICY IF EXISTS "Insert own ordini" ON public.ordini;
DROP POLICY IF EXISTS "Update own ordini" ON public.ordini;
DROP POLICY IF EXISTS "Delete own ordini" ON public.ordini;

DROP POLICY IF EXISTS "Users can view own fornitori" ON public.fornitori;
DROP POLICY IF EXISTS "Users can insert own fornitori" ON public.fornitori;
DROP POLICY IF EXISTS "Users can update own fornitori" ON public.fornitori;
DROP POLICY IF EXISTS "Users can delete own fornitori" ON public.fornitori;

DROP POLICY IF EXISTS "Users can view own tipologie" ON public.tipologie;
DROP POLICY IF EXISTS "Users can insert own tipologie" ON public.tipologie;
DROP POLICY IF EXISTS "Users can update own tipologie" ON public.tipologie;
DROP POLICY IF EXISTS "Users can delete own tipologie" ON public.tipologie;

-- === CREA POLICY CORRETTE ===

-- VINI
CREATE POLICY "Select own vini" ON public.vini FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own vini" ON public.vini FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own vini" ON public.vini FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete own vini" ON public.vini FOR DELETE USING (auth.uid() = user_id);

-- GIACENZA
CREATE POLICY "Select own giacenza" ON public.giacenza FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own giacenza" ON public.giacenza FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own giacenza" ON public.giacenza FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete own giacenza" ON public.giacenza FOR DELETE USING (auth.uid() = user_id);

-- ORDINI
CREATE POLICY "Select own ordini" ON public.ordini FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insert own ordini" ON public.ordini FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Update own ordini" ON public.ordini FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Delete own ordini" ON public.ordini FOR DELETE USING (auth.uid() = user_id);

-- FORNITORI
CREATE POLICY "Users can view own fornitori" ON public.fornitori FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fornitori" ON public.fornitori FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fornitori" ON public.fornitori FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fornitori" ON public.fornitori FOR DELETE USING (auth.uid() = user_id);

-- TIPOLOGIE
CREATE POLICY "Users can view own tipologie" ON public.tipologie FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tipologie" ON public.tipologie FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tipologie" ON public.tipologie FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tipologie" ON public.tipologie FOR DELETE USING (auth.uid() = user_id);

-- === INDICI PER PERFORMANCE ===
CREATE INDEX IF NOT EXISTS idx_vini_user_id ON public.vini(user_id);
CREATE INDEX IF NOT EXISTS idx_giacenza_user_id ON public.giacenza(user_id);
CREATE INDEX IF NOT EXISTS idx_giacenza_vino_id ON public.giacenza(vino_id);
CREATE INDEX IF NOT EXISTS idx_ordini_user_id ON public.ordini(user_id);
CREATE INDEX IF NOT EXISTS idx_fornitori_user_id ON public.fornitori(user_id);
CREATE INDEX IF NOT EXISTS idx_tipologie_user_id ON public.tipologie(user_id);

-- === DATI DI TEST ===
INSERT INTO public.tipologie (nome, colore, user_id) VALUES 
('Rosso', '#8B0000', 'f5ed5dd6-38fe-4528-9a25-941e0996c0a2'),
('Bianco', '#F5F5DC', 'f5ed5dd6-38fe-4528-9a25-941e0996c0a2'),
('Bollicine', '#FFD700', 'f5ed5dd6-38fe-4528-9a25-941e0996c0a2'),
('Rosato', '#FFC0CB', 'f5ed5dd6-38fe-4528-9a25-941e0996c0a2')
ON CONFLICT DO NOTHING;

INSERT INTO public.fornitori (nome, user_id) VALUES 
('Fornitore Test', 'f5ed5dd6-38fe-4528-9a25-941e0996c0a2')
ON CONFLICT DO NOTHING;
