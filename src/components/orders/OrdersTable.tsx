// refactor: componente tabella ordini con ottimizzazioni performance
import React, { memo, useCallback, useMemo } from 'react';
import { Package, X, Eye, Check, Trash2 } from 'lucide-react';
import { Ordine, TabType } from '../../types/orders';
import OrdineRicevutoCard from './OrdineRicevutoCard';
import QuantityPicker from '../QuantityPicker';
import { ORDINI_LABELS } from '../../constants/ordiniLabels';
import { formatDateIt } from '../../utils/formatDate';
import { isFeatureEnabled } from '../../config/featureFlags';

interface OrdersTableProps {
  // Dati
  currentData: Ordine[];
  activeTab: TabType;
  emptyMessage: { title: string; subtitle: string };
  
  // Stati
  expandedOrders: Set<string>;
  managingOrders: Set<string>;
  modifiedQuantities: Record<string, Record<number, number>>;
  draftQuantities: Record<string, Record<number, number>>;
  
  // Handlers
  onToggleExpanded: (ordineId: string) => void;
  onToggleManaging: (ordineId: string) => void;
  onQuantityChange: (ordineId: string, dettaglioIndex: number, newQuantity: number) => void;
  onOpenQuantityModal: (ordineId: string, dettaglioIndex: number) => void;
  onOpenSmartModal: (ordine: Ordine) => void;
  onOpenWhatsAppModal: (ordine: Ordine) => void;
  onConfermaModifiche: (ordineId: string) => void;
  onEliminaOrdine: (ordineId: string, tipo: 'creato' | 'ricevuto' | 'storico') => void;
  
  // Context actions per OrdineRicevutoCard
  onVisualizza?: (ordine: Ordine) => void;
  onConfermaRicezione?: (ordineId: string) => Promise<void>;
  aggiornaQuantitaOrdine?: (ordineId: string, dettagli: any[]) => void;
  
  // Permessi e controlli per visibilità azioni
  readOnly?: boolean;
  canManageOrders?: boolean;
  onGestisci?: (ordine: Ordine) => void;
  onElimina?: (ordineId: string, tipo: 'creato' | 'ricevuto' | 'storico') => void;
}

// Componente singola riga ordine memoizzato
const OrderRow = memo(({ 
  ordine, 
  activeTab, 
  isExpanded, 
  isManaging, 
  modifiedQuantities, 
  draftQuantities,
  onToggleExpanded, 
  onToggleManaging, 
  onQuantityChange, 
  onOpenQuantityModal, 
  onOpenSmartModal, 
  onOpenWhatsAppModal, 
  onConfermaModifiche, 
  onEliminaOrdine,
  readOnly,
  canManageOrders
}: {
  ordine: Ordine;
  activeTab: TabType;
  isExpanded: boolean;
  isManaging: boolean;
  modifiedQuantities: Record<number, number>;
  draftQuantities: Record<number, number>;
  onToggleExpanded: (ordineId: string) => void;
  onToggleManaging: (ordineId: string) => void;
  onQuantityChange: (ordineId: string, dettaglioIndex: number, newQuantity: number) => void;
  onOpenQuantityModal: (ordineId: string, dettaglioIndex: number) => void;
  onOpenSmartModal: (ordine: Ordine) => void;
  onOpenWhatsAppModal: (ordine: Ordine) => void;
  onConfermaModifiche: (ordineId: string) => void;
  onEliminaOrdine: (ordineId: string, tipo: 'creato' | 'ricevuto' | 'storico') => void;
  readOnly?: boolean;
  canManageOrders?: boolean;
}) => {
  // Helper normalizzazione stato
  const toStato = useCallback((ordine: Ordine) => 
    (ordine.stato ?? '').trim().toUpperCase(), []);

  const handleToggleExpanded = useCallback(() => {
    onToggleExpanded(ordine.id);
  }, [onToggleExpanded, ordine.id]);

  const handleToggleManaging = useCallback(() => {
    onToggleManaging(ordine.id);
  }, [onToggleManaging, ordine.id]);

  const handleOpenWhatsApp = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenWhatsAppModal(ordine);
  }, [onOpenWhatsAppModal, ordine]);

  const handleOpenSmart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenSmartModal(ordine);
  }, [onOpenSmartModal, ordine]);

  const handleConferma = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onConfermaModifiche(ordine.id);
  }, [onConfermaModifiche, ordine.id]);

  const handleElimina = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onEliminaOrdine(ordine.id, 'creato');
  }, [onEliminaOrdine, ordine.id]);

  return (
    <div
      className="gestisci-ordini-card cursor-pointer"
      onClick={handleToggleExpanded}
    >
      {/* Header con fornitore e badge */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <h4 className="font-bold text-base" style={{ color: '#541111' }}>
            {ordine.fornitore}
          </h4>
        </div>
        {activeTab === 'creati' && (
          <div className="flex items-center gap-2">
            {/* Pulsante WhatsApp */}
            <button
              onClick={handleOpenWhatsApp}
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
        )}
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

      {/* Box dettagli espandibile per ordini creati */}
      {activeTab === 'creati' && isExpanded && ordine.dettagli && (
        <div 
          className="mb-4 p-3 rounded border-t"
          style={{ borderColor: '#e2d6aa', background: 'white' }}
        >
          <div className="space-y-2">
            {ordine.dettagli.map((dettaglio, index) => {
              const isCompactMode = isFeatureEnabled('CREATI_SMART_FULL_MODAL');
              // Usa draftQuantities se disponibile per persistenza
              const currentQuantity = isFeatureEnabled('QTY_MODAL_PERSIST_COMMIT')
                ? (draftQuantities[index] ?? modifiedQuantities[index] ?? dettaglio.quantity)
                : (modifiedQuantities[index] ?? dettaglio.quantity);

              return (
                <div key={index} className="flex items-center justify-between py-1">
                  <div className="flex-1">
                    <span className="text-sm font-medium" style={{ color: '#541111' }}>
                      {dettaglio.wineName}
                    </span>
                    <div className="text-xs" style={{ color: '#7a4a30' }}>
                      {dettaglio.quantity} {dettaglio.unit} × €{dettaglio.unitPrice.toFixed(2)}
                    </div>
                  </div>
                  
                  {isCompactMode ? (
                    <div className="text-sm font-medium" style={{ color: '#541111' }}>
                      {currentQuantity} {dettaglio.unit}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {isManaging ? (
                        <QuantityPicker
                          value={currentQuantity}
                          onChange={(newQuantity) => onQuantityChange(ordine.id, index, newQuantity)}
                          min={0}
                          max={999}
                        />
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenQuantityModal(ordine.id, index);
                          }}
                          className="px-2 py-1 text-xs rounded border"
                          style={{ 
                            borderColor: '#e2d6aa',
                            background: '#fff9dc',
                            color: '#541111'
                          }}
                        >
                          {currentQuantity} {dettaglio.unit}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pulsanti azione */}
          <div className="flex gap-2 mt-4 pt-3 border-t" style={{ borderColor: '#e2d6aa' }}>
            {isFeatureEnabled('CREATI_SMART_FULL_MODAL') ? (
              <>
                <button
                  onClick={handleOpenSmart}
                  className="flex items-center gap-1 px-3 py-2 rounded text-sm font-medium flex-1"
                  style={{ background: '#d4a300', color: '#fff9dc' }}
                >
                  <Check className="h-4 w-4" />
                  {ORDINI_LABELS.azioni.conferma}
                </button>
                <button
                  onClick={handleElimina}
                  className="flex items-center gap-1 px-3 py-2 rounded text-sm font-medium"
                  style={{ 
                    background: '#dc2626', 
                    color: '#fff9dc'
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  {ORDINI_LABELS.azioni.elimina}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleToggleManaging}
                  className="flex items-center gap-1 px-3 py-2 rounded text-sm font-medium flex-1"
                  style={{ 
                    background: isManaging ? '#dc2626' : '#16a34a', 
                    color: '#fff9dc' 
                  }}
                >
                  {isManaging ? 'Annulla' : 'Gestisci'}
                </button>
                
                {isManaging && (
                  <button
                    onClick={handleConferma}
                    className="flex items-center gap-1 px-3 py-2 rounded text-sm font-medium"
                    style={{ background: '#d4a300', color: '#fff9dc' }}
                  >
                    <Check className="h-4 w-4" />
                    Conferma
                  </button>
                )}
                
                <button
                  onClick={handleElimina}
                  className="flex items-center gap-1 px-3 py-2 rounded text-sm font-medium"
                  style={{ 
                    background: 'transparent', 
                    color: '#dc2626',
                    border: '1px solid #dc2626'
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  {ORDINI_LABELS.azioni.elimina}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

OrderRow.displayName = 'OrderRow';

// Componente principale tabella
export const OrdersTable = memo(({
  currentData,
  activeTab,
  emptyMessage,
  expandedOrders,
  managingOrders,
  modifiedQuantities,
  draftQuantities,
  onToggleExpanded,
  onToggleManaging,
  onQuantityChange,
  onOpenQuantityModal,
  onOpenSmartModal,
  onOpenWhatsAppModal,
  onConfermaModifiche,
  onEliminaOrdine,
  onVisualizza,
  onConfermaRicezione,
  aggiornaQuantitaOrdine,
  readOnly,
  canManageOrders,
  onGestisci,
  onElimina
}: OrdersTableProps) => {
  
  // Memoizza empty state
  const emptyState = useMemo(() => (
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
  ), [emptyMessage]);

  // Memoizza lista ordini
  const ordersList = useMemo(() => (
    <div className="gestisci-ordini-list" style={{
      padding: '8px 0',
      gap: '12px',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {currentData.map((ordine) => {
        // Usa componente specializzato per ordini archiviati
        if (activeTab === 'archiviati') {
          return (
            <OrdineRicevutoCard
              key={ordine.id}
              ordine={ordine}
              onVisualizza={onVisualizza ? () => onVisualizza(ordine) : undefined}
              onConfermaRicezione={onConfermaRicezione}
              onElimina={(ordineId) => onEliminaOrdine(ordineId, 'storico')}
              onAggiornaQuantita={aggiornaQuantitaOrdine}
            />
          );
        }

        // Layout standard per creati
        return (
          <OrderRow
            key={ordine.id}
            ordine={ordine}
            activeTab={activeTab}
            isExpanded={expandedOrders.has(ordine.id)}
            isManaging={managingOrders.has(ordine.id)}
            modifiedQuantities={modifiedQuantities[ordine.id] || {}}
            draftQuantities={draftQuantities[ordine.id] || {}}
            onToggleExpanded={onToggleExpanded}
            onToggleManaging={onToggleManaging}
            onQuantityChange={onQuantityChange}
            onOpenQuantityModal={onOpenQuantityModal}
            onOpenSmartModal={onOpenSmartModal}
            onOpenWhatsAppModal={onOpenWhatsAppModal}
            onConfermaModifiche={onConfermaModifiche}
            onEliminaOrdine={onEliminaOrdine}
            readOnly={readOnly}
            canManageOrders={canManageOrders}
          />
        );
      })}
    </div>
  ), [
    currentData,
    activeTab,
    expandedOrders,
    managingOrders,
    modifiedQuantities,
    draftQuantities,
    onToggleExpanded,
    onToggleManaging,
    onQuantityChange,
    onOpenQuantityModal,
    onOpenSmartModal,
    onOpenWhatsAppModal,
    onConfermaModifiche,
    onEliminaOrdine,
    onVisualizza,
    onConfermaRicezione,
    aggiornaQuantitaOrdine,
    readOnly,
    canManageOrders
  ]);

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
      {currentData.length === 0 ? emptyState : ordersList}
    </div>
  );
});

OrdersTable.displayName = 'OrdersTable';
