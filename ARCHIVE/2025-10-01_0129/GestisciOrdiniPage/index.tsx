import React from 'react';
import { X } from 'lucide-react';
import { useOrdini } from '../../contexts/OrdiniContext';
import { useOrdersPageState } from './hooks/useOrdersPageState';
import { useOrdersSelectors } from './hooks/useOrdersSelectors';
import { useOrdersHandlers } from './hooks/useOrdersHandlers';
import { OrdersTabs } from './components/OrdersTabs';
import { OrdersList } from './components/OrdersList';
import { ModalsManager } from './modals/ModalsManager';
import '../../styles/gestisci-ordini-mobile.css';

export default function GestisciOrdiniPage() {
  const { loading, aggiornaQuantitaOrdine, ordiniInviati } = useOrdini();
  
  // Hook consolidati per stato e logica
  const pageState = useOrdersPageState();
  const selectors = useOrdersSelectors(pageState);
  const handlers = useOrdersHandlers({
    pageState,
    setTabs: (pageState as any).setTabs,
    setModals: (pageState as any).setModals,
    setModifiedQuantities: (pageState as any).setModifiedQuantities,
    setDraftQuantities: (pageState as any).setDraftQuantities,
    setEditingQuantity: (pageState as any).setEditingQuantity,
    setSmartModalOrdine: (pageState as any).setSmartModalOrdine,
    setPendingArchiveOrder: (pageState as any).setPendingArchiveOrder,
    setOrdineToDelete: (pageState as any).setOrdineToDelete,
    setWhatsApp: (pageState as any).setWhatsApp
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-app-accent"></div>
      </div>
    );
  }

  return (
    <div className="homepage-container" style={{ 
      width: '100vw',
      height: '100dvh',
      maxWidth: '100%',
      overflow: 'hidden',
      position: 'relative',
      background: '#fff9dc'
    }}>
      {/* Header */}
      <header className="mobile-header">
        <div className="header-content">
          <div className="logo-wrap">
            <picture>
              <source type="image/webp" srcSet="/logo1.webp" />
              <img 
                src="/logo1.png" 
                alt="WINENODE"
                loading="eager"
              />
            </picture>
          </div>
        </div>
      </header>

      {/* Content Scrollabile */}
      <main className="mobile-content">
        <div className="gestisci-ordini-page-content" style={{
          height: '100%',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}>
          
          {/* Titolo e Pulsante Chiudi */}
          <div className="gestisci-ordini-header-section" style={{
            flexShrink: 0,
            padding: '16px',
            borderBottom: '1px solid #e2d6aa',
            background: '#fff9dc'
          }}>
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold" style={{ color: '#541111' }}>
                Gestisci Ordini
              </h1>
              <button
                onClick={handlers.handleClose}
                className="gestisci-ordini-button"
                style={{ 
                  color: '#541111',
                  background: 'transparent',
                  minWidth: '44px',
                  minHeight: '44px',
                  padding: '10px'
                }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Tabs Modulari */}
          <OrdersTabs
            activeTab={pageState.tabs.active}
            onSetActiveTab={handlers.handleSetActiveTab}
            getTabCount={selectors.getTabCount}
          />

          {/* Lista Ordini Modulare */}
          <OrdersList
            currentTabData={selectors.currentTabData}
            emptyMessage={selectors.emptyMessage}
            activeTab={pageState.tabs.active}
            expandedOrders={pageState.tabs.expanded}
            onToggleExpanded={handlers.handleToggleExpanded}
            onVisualizza={handlers.handleVisualizza}
            onConfermaOrdine={handlers.handleConfermaOrdine}
            onEliminaOrdineCreato={handlers.handleEliminaOrdineCreato}
            onEliminaOrdineArchiviato={handlers.handleEliminaOrdineArchiviato}
            onOpenWhatsAppModal={handlers.handleOpenWhatsAppModal}
            onOpenSmartModal={handlers.handleOpenSmartModal}
            aggiornaQuantitaOrdine={aggiornaQuantitaOrdine}
          />
        </div>
      </main>

      {/* Modali Manager con Lazy Loading */}
      <ModalsManager
        // Conferma Eliminazione
        showConfermaEliminazione={pageState.modals.showConfermaEliminazione}
        onSetShowConfermaEliminazione={(show) => (pageState as any).setModals(prev => ({ ...prev, showConfermaEliminazione: show }))}
        ordineToDelete={pageState.ordineToDelete}
        onConfermaEliminazione={handlers.confermaEliminazione}
        getMessaggioEliminazione={selectors.getMessaggioEliminazione}

        // Quantity Modal
        showQuantityModal={pageState.modals.showQuantityModal}
        editingQuantity={pageState.editingQuantity}
        onConfirmQuantityModal={handlers.handleConfirmQuantityModal}
        onCloseQuantityModal={handlers.handleCloseQuantityModal}

        // Smart Modal
        showSmartModal={pageState.modals.showSmartModal}
        smartModalOrdine={pageState.smartModalOrdine}
        onCloseSmartModal={handlers.handleCloseSmartModal}
        onSmartModalConfirm={handlers.handleSmartModalConfirm}
        onSmartModalArchive={handlers.handleSmartModalArchive}

        // Confirm Archive
        showConfirmArchive={pageState.modals.showConfirmArchive}
        pendingArchiveOrder={pageState.pendingArchiveOrder}
        onConfirmArchive={handlers.handleConfirmArchive}
        onCancelArchive={handlers.handleCancelArchive}
        ordiniInviati={ordiniInviati}

        // WhatsApp Modal
        showWhatsAppModal={pageState.modals.showWhatsAppModal}
        whatsAppOrderDetails={pageState.whatsApp.orderDetails}
        whatsAppSupplierName={pageState.whatsApp.supplierName}
        onCloseWhatsAppModal={handlers.handleCloseWhatsAppModal}
      />
    </div>
  );
}
