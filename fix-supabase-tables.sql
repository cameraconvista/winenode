
-- Crea la tabella tipologie se non esiste
CREATE TABLE IF NOT EXISTS public.tipologie (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  colore text,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Crea la tabella fornitori se non esiste
CREATE TABLE IF NOT EXISTS public.fornitori (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
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
