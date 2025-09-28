import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface WineSearchBarProps {
  isOpen: boolean;
  searchQuery: string;
  onQueryChange: (query: string) => void;
  onClose: () => void;
  onClear: () => void;
}

export const WineSearchBar: React.FC<WineSearchBarProps> = ({
  isOpen,
  searchQuery,
  onQueryChange,
  onClose,
  onClear,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus quando si apre
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Gestione tasti
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="px-4 py-3 border-b"
      style={{ 
        background: '#fff9dc',
        borderColor: '#e2d6aa'
      }}
    >
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Cerca vino... (solo nome)"
          className="w-full px-4 py-2 pr-10 rounded-lg border transition-colors"
          style={{
            background: 'white',
            borderColor: '#e2d6aa',
            color: '#541111'
          }}
          aria-label="Cerca per nome vino"
        />
        
        {/* Pulsante Clear */}
        {searchQuery && (
          <button
            onClick={onClear}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors hover:bg-gray-100"
            style={{ color: '#7a4a30' }}
            aria-label="Cancella ricerca"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* Indicatore risultati */}
      {searchQuery && (
        <div className="mt-2 text-xs" style={{ color: '#7a4a30' }}>
          Ricerca: "{searchQuery}"
        </div>
      )}
    </div>
  );
};
