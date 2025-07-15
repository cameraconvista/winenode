
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
}

export default function SearchModal({ open, onOpenChange, searchTerm, onSearchChange }: SearchModalProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  const handleSearch = () => {
    onSearchChange(localSearchTerm);
    onOpenChange(false);
  };

  const handleClear = () => {
    setLocalSearchTerm('');
    onSearchChange('');
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200]">
      {/* SearchModal senza background offuscante - posizionato in alto */}
      <div className="absolute top-0 left-0 right-0 bg-gray-900/95 border-b border-gray-700 shadow-lg">
        <div className="max-w-4xl mx-auto p-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={localSearchTerm}
                onChange={(e) => setLocalSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Cerca vini per nome, produttore, fornitore..."
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-cream placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoFocus
              />
            </div>

            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Cerca
            </button>

            <button
              onClick={handleClear}
              className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              title="Cancella ricerca"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {localSearchTerm && (
            <div className="mt-3 text-sm text-gray-400">
              Premi Invio o clicca "Cerca" per cercare: "{localSearchTerm}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
