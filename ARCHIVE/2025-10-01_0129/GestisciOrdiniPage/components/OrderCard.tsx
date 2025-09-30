import React from 'react';
import { Check, Trash2 } from 'lucide-react';
import { Ordine } from '../../../contexts/OrdiniContext';
import { ORDINI_LABELS } from '../../../constants/ordiniLabels';
import { formatDateIt } from '../../../utils/formatDate';
import { isFeatureEnabled } from '../../../config/featureFlags';

interface OrderCardProps {
  ordine: Ordine;
  isExpanded: boolean;
  onToggleExpanded: (ordineId: string) => void;
  onConfermaOrdine: (ordineId: string) => void;
  onEliminaOrdine: (ordineId: string, ordine: Ordine) => void;
  onOpenWhatsAppModal: (ordine: Ordine) => void;
  onOpenSmartModal: (ordine: Ordine) => void;
}

export const OrderCard: React.FC<OrderCardProps> = React.memo(({
  ordine,
  isExpanded,
  onToggleExpanded,
  onConfermaOrdine,
  onEliminaOrdine,
  onOpenWhatsAppModal,
  onOpenSmartModal
}) => {
  const handleCardClick = () => {
    onToggleExpanded(ordine.id);
  };

  const handleConfermaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFeatureEnabled('CREATI_SMART_FULL_MODAL')) {
      onOpenSmartModal(ordine);
    } else {
      onConfermaOrdine(ordine.id);
    }
  };

  const handleEliminaClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEliminaOrdine(ordine.id, ordine);
  };

  const handleWhatsAppClick = (e: React.MouseEvent) => {
    console.log('🔄 WhatsApp button clicked in OrderCard');
    e.stopPropagation();
    console.log('📋 Ordine da inviare:', ordine);
    onOpenWhatsAppModal(ordine);
    console.log('✅ onOpenWhatsAppModal chiamato');
  };

  return (
    <div
      className="gestisci-ordini-card cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Header con fornitore e badge */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-base" style={{ color: '#541111' }}>
            {ordine.fornitore}
          </h4>
        </div>
        <div className="flex items-center gap-2">
          {/* Pulsante WhatsApp */}
          <button
            onClick={handleWhatsAppClick}
            className="flex items-center justify-center rounded transition-colors hover:bg-black/5"
            style={{ 
              width: '28px', 
              height: '28px',
              padding: '4px'
            }}
            aria-label="Invia ordine via WhatsApp"
          >
            <img 
              src="/whatsapp.png" 
              alt="WhatsApp" 
              className="w-5 h-5"
              loading="lazy"
              decoding="async"
              style={{ filter: 'none' }}
            />
          </button>
          
          {/* Badge CREATO */}
          <span 
            className="px-2 py-1 rounded text-xs font-medium"
            style={{ background: '#16a34a', color: '#fff9dc' }}
          >
            {ORDINI_LABELS.badges.creato}
          </span>
        </div>
      </div>

      {/* Dettagli ordine */}
      <div className="grid grid-cols-2 gap-4 mb-3 text-xs" style={{ color: '#7a4a30' }}>
        <div>
          <span className="block font-medium">{ORDINI_LABELS.dettagli.ordinato}</span>
          <span className="font-bold">{formatDateIt(ordine.data)}</span>
        </div>
        <div>
          <span className="block font-medium">{ORDINI_LABELS.dettagli.totale}</span>
          <span className="font-bold" style={{ color: '#7a4a30' }}>
            €{ordine.totale.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Box dettagli espandibile */}
      {isExpanded && ordine.dettagli && (
        <div 
          className="mb-4 p-3 rounded border-t"
          style={{ borderColor: '#e2d6aa', background: 'white' }}
        >
          <div className="space-y-2">
            {ordine.dettagli.map((dettaglio, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <div className="flex-1 min-w-0">
                  <div className="font-medium" style={{ color: '#541111' }}>
                    {dettaglio.wineName}
                  </div>
                  <div style={{ color: '#7a4a30' }}>
                    {dettaglio.quantity} {dettaglio.unit} - €{(dettaglio.quantity * dettaglio.unitPrice).toFixed(2)} (€{dettaglio.unitPrice.toFixed(2)}/cad)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pulsanti azione */}
      <div className="flex gap-2 pt-2 border-t" style={{ borderColor: '#e2d6aa' }}>
        <button
          onClick={handleConfermaClick}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors"
          style={{ 
            background: '#d4a300', 
            color: '#fff9dc'
          }}
        >
          <Check className="h-3 w-3" />
          {ORDINI_LABELS.azioni.conferma}
        </button>
        <button
          onClick={handleEliminaClick}
          className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded text-xs font-medium transition-colors"
          style={{ 
            background: '#dc2626', 
            color: '#fff9dc'
          }}
        >
          <Trash2 className="h-3 w-3" />
          {ORDINI_LABELS.azioni.elimina}
        </button>
      </div>
    </div>
  );
});

// Export default per compatibilità
export default OrderCard;
