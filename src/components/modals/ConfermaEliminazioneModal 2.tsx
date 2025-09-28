import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfermaEliminazioneModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  titolo: string;
  messaggio: string;
  dettagliOrdine?: {
    fornitore: string;
    totale: number;
    data: string;
  };
}

export default function ConfermaEliminazioneModal({
  isOpen,
  onOpenChange,
  onConfirm,
  titolo,
  messaggio,
  dettagliOrdine
}: ConfermaEliminazioneModalProps) {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div 
        className="w-full max-w-sm rounded-lg overflow-hidden relative"
        style={{ background: '#fff9dc', border: '1px solid #e2d6aa' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: '#e2d6aa' }}>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" style={{ color: '#dc2626' }} />
            <h2 className="text-lg font-bold" style={{ color: '#541111' }}>
              {titolo}
            </h2>
          </div>
          <button
            onClick={handleCancel}
            className="transition-colors flex-shrink-0"
            style={{ color: '#541111' }}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-base mb-4" style={{ color: '#541111' }}>
            {messaggio}
          </p>

          {/* Dettagli ordine se forniti */}
          {dettagliOrdine && (
            <div 
              className="p-3 rounded-lg mb-4"
              style={{ background: '#fff2b8', border: '1px solid #e2d6aa' }}
            >
              <div className="text-sm space-y-1" style={{ color: '#7a4a30' }}>
                <div className="flex justify-between">
                  <span className="font-medium">Fornitore:</span>
                  <span>{dettagliOrdine.fornitore}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Totale:</span>
                  <span className="font-bold" style={{ color: '#16a34a' }}>
                    €{dettagliOrdine.totale.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Data:</span>
                  <span>{dettagliOrdine.data}</span>
                </div>
              </div>
            </div>
          )}

          {/* Pulsanti */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors"
              style={{ 
                background: 'white', 
                color: '#541111',
                border: '1px solid #e2d6aa'
              }}
            >
              Annulla
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-3 rounded-lg font-medium transition-colors"
              style={{ 
                background: '#dc2626', 
                color: '#fff9dc'
              }}
            >
              Elimina
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
