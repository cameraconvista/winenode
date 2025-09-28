import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { OrdiniProvider } from './contexts/OrdiniContext'

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
const GestisciOrdiniPage = lazy(() => import('./pages/GestisciOrdiniPage'))

function App() {
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
          {/* RIMOSSO: Route /settings eliminata */}
          {/* RIMOSSO: Route /settings/fornitori eliminata */}
          {/* RIMOSSO: Route archivi eliminate */}
          {/* RIMOSSO: Route /settings/preferenze eliminata */}
          {/* RIMOSSO: Route /settings/account eliminata */}
          <Route path="/manual-wine-insert" element={<ManualWineInsertPage />} />
          <Route path="/foglio-excel" element={<FoglioExcelPage />} />
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
              marginBottom: 'max(env(safe-area-inset-bottom), 0px) + 16px'
            },
            duration: 2000
          }}
        />
      </div>
    </OrdiniProvider>
  )
}

export default App