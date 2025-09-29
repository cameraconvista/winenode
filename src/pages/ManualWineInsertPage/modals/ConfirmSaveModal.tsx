import React, { memo } from 'react';

interface ConfirmSaveModalProps {
  showModal: boolean;
  confirmAction: 'add' | 'replace' | null;
  selectedTipologia: string;
  onClose: () => void;
  onConfirm: (sostituisci: boolean) => void;
}

export const ConfirmSaveModal = memo(function ConfirmSaveModal({
  showModal,
  confirmAction,
  selectedTipologia,
  onClose,
  onConfirm
}: ConfirmSaveModalProps) {
  if (!showModal) return null;

  const handleConfirm = () => {
    if (confirmAction === 'add') {
      onConfirm(false);
    } else if (confirmAction === 'replace') {
      onConfirm(true);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h3 className="text-xl font-bold text-cream">Conferma Salvataggio</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-cream"
          >
            ×
          </button>
        </div>

        <div className="p-4">
          <div className="mb-6">
            {confirmAction === 'replace' ? (
              <>
                <p className="text-red-300 text-center font-semibold">
                  🚨 ATTENZIONE: Stai per SOSTITUIRE completamente la lista esistente!
                </p>
                <p className="text-red-400 text-sm text-center mt-2">
                  Tutti i vini della categoria "{selectedTipologia}" verranno eliminati e sostituiti con questa nuova lista.
                </p>
                <p className="text-gray-400 text-sm text-center mt-2">
                  Questa operazione NON può essere annullata. Sei sicuro di voler procedere?
                </p>
              </>
            ) : (
              <>
                <p className="text-gray-300 text-center">
                  ⚠️ Sei sicuro di voler salvare la lista vini?
                </p>
                <p className="text-gray-400 text-sm text-center mt-2">
                  Premi "Conferma" per procedere, oppure "Annulla" per modificare.
                </p>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-cream rounded px-4 py-2 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-cream rounded px-4 py-2 transition-colors"
            >
              Conferma
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
