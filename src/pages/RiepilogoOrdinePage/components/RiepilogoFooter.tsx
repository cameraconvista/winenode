import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { RiepilogoHandlers, OrdineDetail } from '../types';

interface RiepilogoFooterProps {
  ordineDetails: OrdineDetail[];
  totalBottiglie: number;
  isConfirming: boolean;
  handlers: RiepilogoHandlers;
}

export const RiepilogoFooter: React.FC<RiepilogoFooterProps> = ({
  ordineDetails,
  totalBottiglie,
  isConfirming,
  handlers
}) => {
  return (
    <>
      {/* Riga informazioni IVA */}
      <div className="flex items-center justify-center gap-3 text-sm" style={{ color: '#7a4a30' }}>
        <span>{totalBottiglie} bottiglie totali</span>
        <span style={{ color: '#e2d6aa' }}>•</span>
        <div className="flex items-center gap-2" style={{ color: '#d4a300' }}>
          <AlertTriangle className="h-4 w-4" />
          <span>Prezzi IVA esclusa</span>
        </div>
      </div>

      {/* FOOTER FISSO */}
      <footer 
        className="fixed bottom-0 left-0 right-0 p-4 border-t"
        style={{ 
          background: '#fff9dc', 
          borderColor: '#e2d6aa',
          paddingBottom: 'calc(max(env(safe-area-inset-bottom), 0px) + 28px)',
          zIndex: 50
        }}
      >
        <div className="flex flex-nowrap gap-3">
          <button
            onClick={handlers.handleModificaOrdine}
            className="px-6 py-3 rounded-lg font-medium transition-colors"
            style={{ 
              background: 'white', 
              color: '#541111',
              border: '1px solid #e2d6aa',
              minHeight: '44px',
              minWidth: '120px',
              flex: '1',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              fontSize: window.innerWidth <= 767 ? '13px' : '16px'
            }}
          >
            Indietro
          </button>
          <button
            onClick={handlers.handleConferma}
            disabled={ordineDetails.length === 0 || isConfirming}
            className="px-6 py-3 rounded-lg font-medium transition-colors"
            style={{ 
              background: (ordineDetails.length > 0 && !isConfirming) ? '#16a34a' : '#d1c7b8',
              color: '#fff9dc',
              minHeight: '44px',
              minWidth: '120px',
              flex: '1',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              fontSize: window.innerWidth <= 767 ? '13px' : '16px',
              opacity: isConfirming ? 0.7 : 1
            }}
          >
            {isConfirming ? 'Confermando...' : 'Conferma Ordine'}
          </button>
        </div>
      </footer>
    </>
  );
};
