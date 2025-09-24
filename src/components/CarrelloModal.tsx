
import React, { useState } from 'react';
import { ShoppingCart, Plus, Settings, X } from 'lucide-react';
import NewOrderModal from '../features/orders/modals/NewOrderModal';
import GestisciOrdiniModal from './GestisciOrdiniModal';

interface CarrelloModalProps {
  open: boolean;
  onClose: () => void;
  onFornitoreSelezionato?: (fornitore: string) => void;
}

export default function CarrelloModal({ open, onClose }: CarrelloModalProps) {
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showGestisciOrdiniModal, setShowGestisciOrdiniModal] = useState(false);

  if (!open) return null;

  const handleNuovoOrdine = () => {
    setShowNewOrderModal(true);
  };

  const handleGestisciOrdini = () => {
    setShowGestisciOrdiniModal(true);
  };

  return (
    <>
      {!showNewOrderModal && (
        <div 
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
        >
        <div className="border border-gray-700 rounded-lg shadow-lg max-w-md w-full p-6" style={{
          background: '#541111'
        }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6" style={{ color: '#fff9dc' }} />
              <h2 className="text-xl font-bold" style={{ color: '#fff9dc' }}>Carrello Ordini</h2>
            </div>
            <button
              onClick={onClose}
              className="transition-colors"
              style={{ color: '#fff9dc' }}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Menu Options */}
          <div className="space-y-4 p-4 rounded-lg" style={{ background: '#fff9dc' }}>
            <button
              onClick={handleNuovoOrdine}
              className="w-full font-medium rounded-lg p-4 transition-colors flex items-center gap-3"
              style={{
                background: '#541111',
                color: '#fff9dc'
              }}
            >
              <Plus className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Nuovo Ordine</div>
                <div className="text-sm opacity-80">Crea un nuovo ordine per un fornitore</div>
              </div>
            </button>

            <button
              onClick={handleGestisciOrdini}
              className="w-full font-medium rounded-lg p-4 transition-colors flex items-center gap-3"
              style={{
                background: 'transparent',
                color: '#541111',
                border: '1px solid rgba(84, 17, 17, 0.3)'
              }}
            >
              <Settings className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Gestisci Ordini</div>
                <div className="text-sm opacity-70">Visualizza e gestisci tutti gli ordini</div>
              </div>
            </button>
          </div>
        </div>
        </div>
      )}

      {/* Modali secondari */}
      <NewOrderModal
        open={showNewOrderModal}
        onClose={() => setShowNewOrderModal(false)}
      />

      <GestisciOrdiniModal
        open={showGestisciOrdiniModal}
        onClose={() => setShowGestisciOrdiniModal(false)}
      />
    </>
  );
}
