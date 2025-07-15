import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

// Enhanced error handling for syntax errors
const handleCriticalError = (error: any, context: string) => {
  console.error(`🚨 Critical ${context} error:`, error);
  
  // Clear any corrupted state
  try {
    localStorage.removeItem('wine-app-state');
    sessionStorage.clear();
  } catch (e) {
    console.warn('Could not clear storage:', e);
  }
  
  // Render emergency fallback
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; background: #1f2937; color: white; min-height: 100vh; font-family: Arial, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; text-align: center; padding-top: 100px;">
          <h1 style="color: #dc2626; margin-bottom: 20px;">🚨 Errore Critico dell'App</h1>
          <p style="margin-bottom: 20px; line-height: 1.6;">
            L'applicazione ha riscontrato un errore critico di sintassi JavaScript.<br>
            Questo è spesso causato da problemi temporanei del bundler Vite.
          </p>
          <div style="margin: 30px 0;">
            <button onclick="window.location.reload()" 
              style="padding: 12px 24px; background: #dc2626; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin: 5px;">
              🔄 Ricarica Pagina
            </button>
            <button onclick="window.location.href = window.location.origin" 
              style="padding: 12px 24px; background: #059669; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; margin: 5px;">
              🏠 Vai alla Home
            </button>
          </div>
          <details style="margin-top: 40px; text-align: left; background: #374151; padding: 15px; border-radius: 8px;">
            <summary style="cursor: pointer; font-weight: bold;">Dettagli Tecnici</summary>
            <pre style="white-space: pre-wrap; font-size: 12px; margin-top: 10px; color: #f87171;">Context: ${context}\nError: ${error?.message || 'Unknown error'}</pre>
          </details>
        </div>
      </div>
    `;
  }
};

// Global error handlers
window.addEventListener('unhandledrejection', (event) => {
  handleCriticalError(event.reason, 'Promise Rejection');
  event.preventDefault();
});

window.addEventListener('error', (event) => {
  handleCriticalError(event.error, 'JavaScript Runtime');
  event.preventDefault();
});

// Safe app initialization
let isAppMounted = false;

const initializeApp = () => {
  if (isAppMounted) return;
  
  try {
    const root = document.getElementById('root');
    if (!root) {
      throw new Error('Root element not found');
    }

    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </React.StrictMode>
    );
    
    isAppMounted = true;
    console.log('✅ App initialized successfully');
    
  } catch (error) {
    handleCriticalError(error, 'React Initialization');
  }
};

// Initialize with timeout to allow Vite to settle
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initializeApp, 100);
  });
} else {
  setTimeout(initializeApp, 100);
}
