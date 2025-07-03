
import React, { useState } from 'react';
import { ShoppingCart, Plus, Settings, X } from 'lucide-react';
import OrdineModal from './OrdineModal';
import GestisciOrdiniModal from './GestisciOrdiniModal';

interface CarrelloModalProps {
  open: boolean;
  onClose: () => void;
  onFornitoreSelezionato?: (fornitore: string) => void;
}

export default function CarrelloModal({ open, onClose, onFornitoreSelezionato }: CarrelloModalProps) {
  const [showOrdineModal, setShowOrdineModal] = useState(false);
  const [showGestisciOrdiniModal, setShowGestisciOrdiniModal] = useState(false);

  if (!open) return null;

  const handleNuovoOrdine = () => {
    setShowOrdineModal(true);
  };

  const handleGestisciOrdini = () => {
    setShowGestisciOrdiniModal(true);
  };

  const handleFornitoreSelezionatoInternal = (fornitore: string) => {
    if (onFornitoreSelezionato) {
      onFornitoreSelezionato(fornitore);
    }
    setShowOrdineModal(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-6 w-6 text-amber-400" />
              <h2 className="text-xl font-bold text-cream">Carrello Ordini</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Menu Options */}
          <div className="space-y-4">
            <button
              onClick={handleNuovoOrdine}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg p-4 transition-colors flex items-center gap-3"
            >
              <Plus className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Nuovo Ordine</div>
                <div className="text-sm text-amber-100">Crea un nuovo ordine per un fornitore</div>
              </div>
            </button>

            <button
              onClick={handleGestisciOrdini}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg p-4 transition-colors flex items-center gap-3"
            >
              <Settings className="h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Gestisci Ordini</div>
                <div className="text-sm text-gray-300">Visualizza e gestisci tutti gli ordini</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Modali secondari */}
      <OrdineModal
        open={showOrdineModal}
        onClose={() => setShowOrdineModal(false)}
        onFornitoreSelezionato={handleFornitoreSelezionatoInternal}
      />

      <GestisciOrdiniModal
        open={showGestisciOrdiniModal}
        onClose={() => setShowGestisciOrdiniModal(false)}
      />
    </>
  );
}
