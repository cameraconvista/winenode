import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || /your-project\.supabase\.co/.test(SUPABASE_URL)) {
  throw new Error('[Supabase config] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY mancanti o placeholder. ' +
    'Imposta .env (dev) e .env.production (build) e ricostruisci.')
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
