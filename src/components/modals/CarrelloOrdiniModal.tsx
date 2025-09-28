import React from 'react';
import { X, Plus, Settings } from 'lucide-react';
import PhosphorCart from '~icons/ph/shopping-cart-light';

interface CarrelloOrdiniModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onNuovoOrdine: () => void;
  onGestisciOrdini: () => void;
}

export default function CarrelloOrdiniModal({ 
  isOpen, 
  onOpenChange, 
  onNuovoOrdine, 
  onGestisciOrdini 
}: CarrelloOrdiniModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="w-full max-w-sm rounded-lg overflow-hidden relative"
        style={{ background: '#2e0d0d', border: '1px solid #541111' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6">
          <div className="flex items-center gap-3">
            <PhosphorCart className="w-6 h-6" style={{ color: '#fff9dc' }} aria-hidden="true" />
            <h2 className="text-lg md:text-xl font-bold" style={{ color: '#fff9dc' }}>
              Carrello Ordini
            </h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="transition-colors flex-shrink-0"
            style={{ color: '#fff9dc' }}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 pt-0 space-y-4">
          {/* Nuovo Ordine Button */}
          <button
            onClick={onNuovoOrdine}
            className="w-full p-4 rounded-lg transition-colors text-left"
            style={{ background: '#541111', color: '#fff9dc' }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Plus className="h-5 w-5" />
              <span className="font-semibold text-base">Nuovo Ordine</span>
            </div>
            <p className="text-sm opacity-80">
              Crea un nuovo ordine per un fornitore
            </p>
          </button>

          {/* Gestisci Ordini Button */}
          <button
            onClick={onGestisciOrdini}
            className="w-full p-4 rounded-lg transition-colors text-left"
            style={{ background: '#fff2b8', color: '#541111', border: '1px solid #e2d6aa' }}
          >
            <div className="flex items-center gap-3 mb-2">
              <Settings className="h-5 w-5" />
              <span className="font-semibold text-base">Gestisci Ordini</span>
            </div>
            <p className="text-sm opacity-80">
              Visualizza e gestisci tutti gli ordini
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
