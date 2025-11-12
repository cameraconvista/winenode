import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

// Web Vitals monitoring (solo produzione, non impatta bundle)
import { initWebVitals } from './monitoring/webVitals'

// Offline functionality integration (non invasivo)
import { initializeOfflineFeatures } from './lib/offlineIntegration'

// Gestione errori globali
window.addEventListener('error', (event) => {
  console.error('Errore globale:', event.error)
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Promise rejettata:', event.reason)
})

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root element not found')
}

ReactDOM.createRoot(root).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)

// Inizializza Web Vitals e funzionalità offline dopo il render (non blocca startup)
// Usa requestIdleCallback se disponibile, altrimenti setTimeout
if ('requestIdleCallback' in window) {
  requestIdleCallback(() => {
    initWebVitals();
    initializeOfflineFeatures();
  });
} else {
  setTimeout(() => {
    initWebVitals();
    initializeOfflineFeatures();
  }, 100);
}