import React from 'react';
import { ORDINI_LABELS } from '../../../../constants/ordiniLabels';
import { getStandardButtonStyles, getNavbarTwoButtonLayout } from '../../../../utils/buttonStyles';

interface FooterProps {
  totalConfermato: number;
  valoreConfermato: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export function Footer({ totalConfermato, valoreConfermato, onCancel, onConfirm }: FooterProps) {
  const cancelButtonStyles = getStandardButtonStyles({ variant: 'secondary' });
  const confirmButtonStyles = getStandardButtonStyles({ variant: 'primary' });
  const layoutStyles = getNavbarTwoButtonLayout();

  return (
    /* RIEPILOGO COMPATTO SOPRA NAVBAR */
    <div 
      className="fixed bottom-0 left-0 right-0 border-t px-4 py-2"
      style={{ 
        background: '#fff9dc',
        borderColor: '#e2d6aa',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 64px)', // Spazio per navbar
        zIndex: 40
      }}
    >
      {/* Riepilogo compatto */}
      <div className="flex justify-between items-center text-sm mb-3">
        <div>
          <span style={{ color: '#7a4a30' }}>Totale: </span>
          <span className="font-semibold" style={{ color: '#541111' }}>
            {totalConfermato} pz
          </span>
        </div>
        <div>
          <span style={{ color: '#7a4a30' }}>Valore: </span>
          <span className="font-semibold" style={{ color: '#541111' }}>
            €{valoreConfermato.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Pulsanti */}
      <div className={layoutStyles.containerClasses}>
        <button
          onClick={onCancel}
          className={cancelButtonStyles.className}
          style={{ ...cancelButtonStyles.style, minHeight: '44pt' }}
        >
          {ORDINI_LABELS.gestioneInline.azioni.annulla}
        </button>
        <button
          onClick={onConfirm}
          className={confirmButtonStyles.className}
          style={{ ...confirmButtonStyles.style, minHeight: '44pt' }}
        >
          {ORDINI_LABELS.gestioneInline.azioni.confermaModifiche}
        </button>
      </div>
    </div>
  );
}
