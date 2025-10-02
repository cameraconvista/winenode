import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || /your-project\.supabase\.co/.test(SUPABASE_URL)) {
  throw new Error('[Supabase config] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY mancanti o placeholder. ' +
    'Imposta .env (dev) e .env.production (build) e ricostruisci.')
}

// STEP 2 - SUPABASE CLIENT HARDENING con configurazioni esplicite
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: { eventsPerSecond: 10 }
  }
})

// STEP 2 - Log diagnostici condizionali per produzione
if (import.meta.env.DEV || import.meta.env.VITE_RT_DEBUG === 'true') {
  const maskedKey = SUPABASE_ANON_KEY.slice(0, 4) + '...' + SUPABASE_ANON_KEY.slice(-4);
  console.debug('🔧 Supabase client initialized:', {
    url: SUPABASE_URL,
    anonKey: maskedKey,
    channels: supabase.realtime.getChannels().length,
    wsEndpoint: (supabase as any)?.realtime?.socket?.endpoint || 'N/A'
  });
}
