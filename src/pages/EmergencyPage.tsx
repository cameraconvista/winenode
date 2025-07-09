
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Home, Database, Settings, AlertTriangle } from 'lucide-react'

export default function EmergencyPage() {
  const navigate = useNavigate()

  const handleRecovery = async () => {
    try {
      // Reset localStorage
      localStorage.clear()
      
      // Reset sessionStorage
      sessionStorage.clear()
      
      console.log('✅ Storage pulito')
      
      // Ricarica l'app
      window.location.reload()
    } catch (error) {
      console.error('❌ Errore durante recovery:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 border border-red-500/30">
        <div className="text-center mb-6">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">
            MODALITÀ RECOVERY
          </h1>
          <p className="text-gray-300 text-sm">
            L'applicazione ha rilevato problemi critici
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleRecovery}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            🔄 RESET COMPLETO
          </button>

          <button
            onClick={() => navigate('/')}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            🏠 TORNA ALLA HOME
          </button>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <h3 className="text-white font-medium mb-2">Problemi Rilevati:</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Configurazione Supabase</li>
              <li>• Cache dell'applicazione</li>
              <li>• Stato delle dipendenze</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
