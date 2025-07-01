import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

import { createClient } from '@supabase/supabase-js'

// ✅ Verifica che le variabili d'ambiente siano presenti
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Errore: Variabili ambiente mancanti.')
  console.error('VITE_SUPABASE_URL:', SUPABASE_URL)
  console.error('VITE_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY)
  throw new Error('Variabili Supabase mancanti. Controlla i Secret in Replit.')
}

// ✅ Crea client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// ✅ Logga la sessione utente attuale (solo per debug)
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('❌ Errore Supabase:', error.message)
  } else {
    console.log('👤 USER SESSION:', data.session)
    console.log('🆔 USER ID:', data.session?.user.id)
  }
})

// ✅ Avvia l'app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
