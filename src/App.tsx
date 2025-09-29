import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { OrdiniProvider } from './contexts/OrdiniContext'
import IntroPage from './components/IntroPage'
import { useFirstLaunch } from './hooks/useFirstLaunch'
import { initMainRoutesPrefetch } from './utils/prefetch'
// Import utility per testing in development
import './utils/resetFirstLaunch'

// Lazy loading per ottimizzare le prestazioni
const HomePage = lazy(() => import('./pages/HomePage'))
// RIMOSSO: const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const ManualWineInsertPage = lazy(() => import('./pages/ManualWineInsertPage'))
const FornitoriPage = lazy(() => import('./pages/FornitoriPage'))
// RIMOSSO: const ArchiviPage = lazy(() => import('./pages/ArchiviPage'))
const ImportaPage = lazy(() => import('./pages/ImportaPage'))
// RIMOSSO: const AccountPage = lazy(() => import('./pages/AccountPage'))
const PreferenzePage = lazy(() => import('./pages/PreferenzePage'))
const FoglioExcelPage = lazy(() => import('./pages/FoglioExcelPage'))
const CreaOrdinePage = lazy(() => import('./pages/CreaOrdinePage'))
const RiepilogoOrdinePage = lazy(() => import('./pages/RiepilogoOrdinePage'))
const GestisciOrdiniPage = lazy(() => import('./pages/GestisciOrdiniPage/index'))

function App() {
  const { isFirstLaunch, isLoading, markIntroCompleted } = useFirstLaunch()

  // Inizializza prefetch delle rotte principali su idle
  useEffect(() => {
    if (!isFirstLaunch && !isLoading) {
      initMainRoutesPrefetch();
    }
  }, [isFirstLaunch, isLoading]);

  // Mostra l'IntroPage solo al primo avvio
  if (isFirstLaunch && !isLoading) {
    return <IntroPage onComplete={markIntroCompleted} />
  }

  // Loading state durante il controllo localStorage
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app-bg">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-app-accent"></div>
      </div>
    )
  }

  return (
    <OrdiniProvider>
      <div className="min-h-screen bg-app-bg">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-app-bg">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-app-accent"></div>
          </div>
        }>
          <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/fornitori" element={<FornitoriPage />} />
          <Route path="/gestisci-ordini" element={<GestisciOrdiniPage />} />
          <Route path="/crea-ordine" element={<CreaOrdinePage />} />
          <Route path="/riepilogo-ordine" element={<RiepilogoOrdinePage />} />
          <Route path="/manual-wine-insert" element={<ManualWineInsertPage />} />
          <Route path="/preferenze" element={<PreferenzePage />} />
          <Route path="/importa" element={<ImportaPage />} />
          <Route path="/foglio-excel" element={<FoglioExcelPage />} />
          {/* Legacy routes per compatibilità */}
          <Route path="/orders/create/:supplier" element={<CreaOrdinePage />} />
          <Route path="/orders/summary/:supplier" element={<RiepilogoOrdinePage />} />
          <Route path="/orders/manage" element={<GestisciOrdiniPage />} />
          </Routes>
        </Suspense>
        
        {/* Toast notifications */}
        <Toaster 
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#fff9dc',
              color: '#541111',
              border: '1px solid #e2d6aa',
              fontSize: '14px',
              marginBottom: 'max(env(safe-area-inset-bottom), 0px) + 16px',
              zIndex: 9999 // Sopra il modale WhatsApp
            },
            duration: 3000
          }}
        />
      </div>
    </OrdiniProvider>
  )
}

export default App