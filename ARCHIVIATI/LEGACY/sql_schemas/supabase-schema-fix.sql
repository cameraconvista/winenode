
-- Crea la tabella tipologie se non esiste
CREATE TABLE IF NOT EXISTS public.tipologie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  colore text DEFAULT '#cccccc',
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Crea la tabella fornitori se non esiste
CREATE TABLE IF NOT EXISTS public.fornitori (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Abilita RLS (Row Level Security)
ALTER TABLE public.tipologie ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornitori ENABLE ROW LEVEL SECURITY;

-- Policy per tipologie
CREATE POLICY "Users can view own tipologie" ON public.tipologie
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tipologie" ON public.tipologie
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tipologie" ON public.tipologie
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tipologie" ON public.tipologie
  FOR DELETE USING (auth.uid() = user_id);

-- Policy per fornitori
CREATE POLICY "Users can view own fornitori" ON public.fornitori
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own fornitori" ON public.fornitori
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own fornitori" ON public.fornitori
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own fornitori" ON public.fornitori
  FOR DELETE USING (auth.uid() = user_id);

-- Inserisci le tipologie di default
INSERT INTO public.tipologie (nome, colore, user_id) 
SELECT 'BOLLICINE ITALIANE', '#FFD700', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM public.tipologie WHERE nome = 'BOLLICINE ITALIANE' AND user_id = auth.uid());

INSERT INTO public.tipologie (nome, colore, user_id) 
SELECT 'BOLLICINE FRANCESI', '#FFD700', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM public.tipologie WHERE nome = 'BOLLICINE FRANCESI' AND user_id = auth.uid());

INSERT INTO public.tipologie (nome, colore, user_id) 
SELECT 'BIANCHI', '#FFFFFF', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM public.tipologie WHERE nome = 'BIANCHI' AND user_id = auth.uid());

INSERT INTO public.tipologie (nome, colore, user_id) 
SELECT 'ROSSI', '#8B0000', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM public.tipologie WHERE nome = 'ROSSI' AND user_id = auth.uid());

INSERT INTO public.tipologie (nome, colore, user_id) 
SELECT 'ROSATI', '#FFC0CB', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM public.tipologie WHERE nome = 'ROSATI' AND user_id = auth.uid());

INSERT INTO public.tipologie (nome, colore, user_id) 
SELECT 'VINI DOLCI', '#DDA0DD', auth.uid()
WHERE NOT EXISTS (SELECT 1 FROM public.tipologie WHERE nome = 'VINI DOLCI' AND user_id = auth.uid());
