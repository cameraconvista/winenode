
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
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div className="fixed top-24 sm:top-32 lg:top-28 left-1/2 transform -translate-x-1/2 w-full max-w-2xl mx-4 pointer-events-auto">
        <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-xl">
          {/* Layout ultra-compatto su una riga */}
          <div className="flex items-center gap-2 p-2">
            {/* Icona ricerca */}
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
            
            {/* Input di ricerca */}
            <input
              type="text"
              placeholder="Cerca vino, produttore, fornitore..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 py-1.5 px-2 bg-gray-700 border border-gray-600 rounded text-cream placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              autoFocus
            />
            
            {/* Pulsante cancella (solo se c'è testo) */}
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="text-gray-400 hover:text-red-400 p-0.5 rounded transition-colors flex-shrink-0"
                title="Cancella ricerca"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            
            {/* Pulsante chiudi */}
            <button
              onClick={() => onOpenChange(false)}
              className="text-gray-400 hover:text-cream p-0.5 rounded transition-colors flex-shrink-0"
              title="Chiudi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Indicatore ricerca attiva - più compatto */}
          {searchTerm && (
            <div className="px-2 pb-1.5">
              <div className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded px-1.5 py-0.5 inline-block">
                🔍 "{searchTerm}"
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
