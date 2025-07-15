import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Critical error handling
window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Critical unhandled rejection:', event.reason);
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  console.error('🚨 Critical JavaScript error:', event.error);
  event.preventDefault();
});

// App initialization with error boundary
try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  )
} catch (error) {
  console.error('🚨 Critical React initialization error:', error);
  // Fallback rendering
  document.getElementById('root')!.innerHTML = `
    <div style="padding: 20px; background: #1f2937; color: white; min-height: 100vh;">
      <h1>🚨 Errore Critico</h1>
      <p>L'applicazione ha riscontrato un errore critico. Ricarica la pagina.</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; background: #dc2626; color: white; border: none; border-radius: 5px; cursor: pointer;">
        🔄 Ricarica App
      </button>
    </div>
  `;
}
