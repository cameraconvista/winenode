-- ============================================
-- BACKUP ORIGINALE POLICY RLS - WINENODE
-- Data backup: 2025-09-22T00:20:32+02:00
-- Fonte: setup-giacenza-complete.sql
-- ============================================

-- POLICIES PER VINI
CREATE POLICY "Users can view own wines" ON public.vini
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own wines" ON public.vini
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own wines" ON public.vini
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own wines" ON public.vini
    FOR DELETE USING (auth.uid() = user_id);

-- POLICIES PER GIACENZA
CREATE POLICY "Users can view own giacenza" ON public.giacenza
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own giacenza" ON public.giacenza
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own giacenza" ON public.giacenza
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own giacenza" ON public.giacenza
    FOR DELETE USING (auth.uid() = user_id);

-- POLICIES PER ORDINI (da altri file SQL)
CREATE POLICY "Users can view own ordini" ON public.ordini 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ordini" ON public.ordini 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- POLICIES PER TIPOLOGIE
CREATE POLICY "Users can view own tipologie" ON public.tipologie
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tipologie" ON public.tipologie
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tipologie" ON public.tipologie
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tipologie" ON public.tipologie
    FOR DELETE USING (auth.uid() = user_id);

-- POLICIES PER FORNITORI
CREATE POLICY "Users can view own fornitori" ON public.fornitori
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own fornitori" ON public.fornitori
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own fornitori" ON public.fornitori
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own fornitori" ON public.fornitori
    FOR DELETE USING (auth.uid() = user_id);

-- NOTA: Queste policy verranno DISABILITATE in Fase 2
-- Per ripristinare: eseguire questo file dopo aver riabilitato RLS
