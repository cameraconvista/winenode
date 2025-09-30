import React from 'react';
import { Package } from 'lucide-react';
import { Ordine } from '../../../contexts/OrdiniContext';
import OrdineRicevutoCard from '../../../components/orders/OrdineRicevutoCard';
import { OrderCard } from './OrderCard';
import { TabType } from '../types';

interface OrdersListProps {
  currentTabData: Ordine[];
  emptyMessage: { title: string; subtitle: string };
  activeTab: TabType;
  expandedOrders: Set<string>;
  onToggleExpanded: (ordineId: string) => void;
  onVisualizza: (ordineId: string) => void;
  onConfermaOrdine: (ordineId: string) => void;
  onEliminaOrdineCreato: (ordineId: string, ordine: Ordine) => void;
  onEliminaOrdineArchiviato: (ordineId: string, ordine: Ordine) => void;
  onOpenWhatsAppModal: (ordine: Ordine) => void;
  onOpenSmartModal: (ordine: Ordine) => void;
  aggiornaQuantitaOrdine: any;
}

export const OrdersList: React.FC<OrdersListProps> = React.memo(({
  currentTabData,
  emptyMessage,
  activeTab,
  expandedOrders,
  onToggleExpanded,
  onVisualizza,
  onConfermaOrdine,
  onEliminaOrdineCreato,
  onEliminaOrdineArchiviato,
  onOpenWhatsAppModal,
  onOpenSmartModal,
  aggiornaQuantitaOrdine
}) => {
  return (
    <div className="gestisci-ordini-content-scroll" style={{
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      overscrollBehavior: 'contain',
      padding: '0 16px',
      paddingBottom: 'max(env(safe-area-inset-bottom), 0px) + 16px'
    }}>
      {currentTabData.length === 0 ? (
        <div className="gestisci-ordini-empty" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          textAlign: 'center',
          padding: '32px 16px'
        }}>
          <Package 
            className="h-16 w-16 mb-4 opacity-30"
            style={{ color: '#7a4a30' }}
          />
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#541111' }}>
            {emptyMessage.title}
          </h3>
          <p className="text-sm" style={{ color: '#7a4a30' }}>
            {emptyMessage.subtitle}
          </p>
        </div>
      ) : (
        <div className="gestisci-ordini-list" style={{
          padding: '8px 0',
          gap: '12px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {currentTabData.map((ordine) => {
            // Usa componente specializzato per ordini archiviati
            if (activeTab === 'archiviati') {
              return (
                <OrdineRicevutoCard
                  key={ordine.id}
                  ordine={ordine}
                  onVisualizza={onVisualizza}
                  onConfermaRicezione={onConfermaOrdine}
                  onElimina={onEliminaOrdineArchiviato}
                  onAggiornaQuantita={aggiornaQuantitaOrdine}
                />
              );
            }

            // Layout modulare per ordini creati
            return (
              <OrderCard
                key={ordine.id}
                ordine={ordine}
                isExpanded={expandedOrders.has(ordine.id)}
                onToggleExpanded={onToggleExpanded}
                onConfermaOrdine={onConfermaOrdine}
                onEliminaOrdine={onEliminaOrdineCreato}
                onOpenWhatsAppModal={onOpenWhatsAppModal}
                onOpenSmartModal={onOpenSmartModal}
              />
            );
          })}
        </div>
      )}
    </div>
  );
});
