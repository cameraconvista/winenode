import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

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