
import { Search, X } from 'lucide-react'

interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  searchTerm: string
  onSearchChange: (term: string) => void
}

export default function SearchModal({ open, onOpenChange, searchTerm, onSearchChange }: SearchModalProps) {
  if (!open) return null

  const handleSearchChange = (value: string) => {
    // Filtraggio in tempo reale come nella pagina Archivi
    onSearchChange(value)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Chiudi con Escape
    if (e.key === 'Escape') {
      onOpenChange(false)
    }
    // Chiudi con Enter
    if (e.key === 'Enter') {
      onOpenChange(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 w-full max-w-2xl mx-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
          {/* Layout compatto su una riga */}
          <div className="flex items-center gap-3 p-3">
            {/* Icona ricerca */}
            <Search className="h-5 w-5 text-gray-400 flex-shrink-0" />
            
            {/* Input di ricerca */}
            <input
              type="text"
              placeholder="Cerca vino, produttore, fornitore..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 py-2 px-3 bg-gray-700 border border-gray-600 rounded-lg text-cream placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            
            {/* Pulsante cancella (solo se c'è testo) */}
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="text-gray-400 hover:text-red-400 p-1 rounded transition-colors flex-shrink-0"
                title="Cancella ricerca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            {/* Pulsante chiudi */}
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-cream p-1 rounded transition-colors flex-shrink-0"
              title="Chiudi"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Indicatore ricerca attiva */}
          {searchTerm && (
            <div className="px-3 pb-3">
              <div className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-2 py-1">
                🔍 Filtraggio in tempo reale: "{searchTerm}"
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
