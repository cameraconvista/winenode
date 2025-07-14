import { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { authManager, isSupabaseAvailable } from './lib/supabase'
import HomePage from './pages/HomePage'
import SettingsPage from './pages/SettingsPage'

import LoginForm from './components/LoginForm'
import SaldoCommand from './components/SaldoCommand'
import { Session } from '@supabase/supabase-js'
import ManualWineInsertPage from './pages/ManualWineInsertPage'
import FornitoriPage from './pages/FornitoriPage'
import ArchiviPage from './pages/ArchiviPage'
import ImportaPage from './pages/ImportaPage'
import AccountPage from './pages/AccountPage'
import PreferenzePage from './pages/PreferenzePage'
import FoglioExcelPage from './pages/FoglioExcelPage'
import OrdiniSospesiPage from './pages/OrdiniSospesiPage'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [session, setSession] = useState<Session | null>(null)
  const [fallbackMode, setFallbackMode] = useState(false)
  const [showSaldo, setShowSaldo] = useState(false)
  const [bypassAuth, setBypassAuth] = useState(false)

  // Global saldo command listener
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      if (e.key === 's' && e.ctrlKey) {
        e.preventDefault()
        setShowSaldo(!showSaldo)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showSaldo])

  useEffect(() => {
    // App startup

    if (!isSupabaseAvailable) {
      console.log('⚠️ Supabase non disponibile, modalità fallback')
      setFallbackMode(true)
      setLoading(false)
      return
    }

    // 🎯 Gestione migliorata del cambio stato autenticazione
    const unsubscribe = authManager.onAuthStateChange((user) => {
      if (user && process.env.NODE_ENV === 'development') {
        console.log('Auth state: Logged in as', user.email)
      }
      
      setIsAuthenticated(!!user)
      setSession(
        user
          ? {
              access_token: user.token || '',
              token_type: 'Bearer',
              expires_in: 3600,
              refresh_token: user.refreshToken || '',
              user: user
            } as Session
          : null
      )
      
      // 🚀 Rimuovi loading solo dopo aver processato lo stato dell'utente
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-cream">Caricamento...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Routes>
        <Route path="/" element={
          (session || fallbackMode || bypassAuth) ? <HomePage /> : <LoginForm />
        } />
        <Route path="/settings" element={
          (session || fallbackMode || bypassAuth) ? <SettingsPage /> : <LoginForm />
        } />
        <Route path="/settings/fornitori" element={
          (session || fallbackMode || bypassAuth) ? <FornitoriPage /> : <LoginForm />
        } />
        <Route path="/settings/archivi" element={<ArchiviPage />} />
        <Route path="/settings/archivi/importa" element={<ImportaPage />} />
        <Route path="/settings/archivi/manuale" element={<ManualWineInsertPage />} />


        <Route path="/settings/preferenze" element={<PreferenzePage />} />
        <Route path="/settings/account" element={<AccountPage />} />

          <Route path="/manual-wine-insert" element={<ManualWineInsertPage />} />
        <Route path="/saldo" element={<SaldoCommand />} />
        <Route path="/foglio-excel" element={<FoglioExcelPage />} />
        <Route path="/ordini/sospesi" element={<OrdiniSospesiPage />} />
      </Routes>

      {/* Global Saldo Overlay */}
      {showSaldo && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowSaldo(false)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <SaldoCommand />
            <div className="text-center mt-4">
              <button 
                onClick={() => setShowSaldo(false)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm"
              >
                Chiudi (o premi Ctrl+S)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App