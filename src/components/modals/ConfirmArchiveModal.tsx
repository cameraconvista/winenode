import React from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';
import { ORDINI_LABELS } from '../../constants/ordiniLabels';

interface ConfirmArchiveModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  fornitore?: string;
  totalItems?: number;
  totalValue?: number;
}

export default function ConfirmArchiveModal({
  isOpen,
  onConfirm,
  onCancel,
  fornitore,
  totalItems,
  totalValue
}: ConfirmArchiveModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: '#e2d6aa' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#d4a300' }}>
              <AlertTriangle className="h-5 w-5" style={{ color: '#fff9dc' }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold" style={{ color: '#541111' }}>
                {ORDINI_LABELS.qtyModal.confirmArchive.title}
              </h3>
              {fornitore && (
                <p className="text-sm" style={{ color: '#7a4a30' }}>
                  {fornitore}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm leading-relaxed mb-4" style={{ color: '#7a4a30' }}>
            {ORDINI_LABELS.qtyModal.confirmArchive.body}
          </p>

          {/* Riepilogo se disponibile */}
          {(totalItems !== undefined || totalValue !== undefined) && (
            <div className="p-3 rounded border mb-4" style={{ borderColor: '#e2d6aa', background: '#f9f9f9' }}>
              <div className="text-xs font-medium mb-2" style={{ color: '#7a4a30' }}>
                Riepilogo modifiche:
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {totalItems !== undefined && (
                  <div>
                    <span style={{ color: '#7a4a30' }}>Totale pezzi: </span>
                    <span className="font-bold" style={{ color: '#541111' }}>{totalItems}</span>
                  </div>
                )}
                {totalValue !== undefined && (
                  <div>
                    <span style={{ color: '#7a4a30' }}>Valore: </span>
                    <span className="font-bold" style={{ color: '#541111' }}>€{totalValue.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex flex-nowrap gap-3" style={{ borderColor: '#e2d6aa' }}>
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors"
            style={{ 
              background: 'white', 
              color: '#541111',
              border: '1px solid #e2d6aa',
              minHeight: '44px',
              fontSize: window.innerWidth <= 767 ? '13px' : '16px'
            }}
          >
            <X className="h-4 w-4" />
            {ORDINI_LABELS.qtyModal.confirmArchive.cancel}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors"
            style={{ 
              background: '#16a34a', 
              color: '#fff9dc',
              fontSize: window.innerWidth <= 767 ? '13px' : '16px'
            }}
          >
            <Check className="h-4 w-4" />
            {ORDINI_LABELS.qtyModal.confirmArchive.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
