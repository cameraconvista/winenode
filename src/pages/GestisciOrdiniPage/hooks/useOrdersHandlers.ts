import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrdini, Ordine } from '../../../contexts/OrdiniContext';
import { isFeatureEnabled } from '../../../config/featureFlags';
import { OrderDetail } from '../../../utils/buildWhatsAppMessage';
import { OrdersPageState, TabType } from '../types';

interface UseOrdersHandlersProps {
  pageState: OrdersPageState;
  setTabs: React.Dispatch<React.SetStateAction<any>>;
  setModals: React.Dispatch<React.SetStateAction<any>>;
  setModifiedQuantities: React.Dispatch<React.SetStateAction<Record<string, Record<number, number>>>>;
  setDraftQuantities: React.Dispatch<React.SetStateAction<Record<string, Record<number, number>>>>;
  setEditingQuantity: React.Dispatch<React.SetStateAction<any>>;
  setSmartModalOrdine: React.Dispatch<React.SetStateAction<Ordine | null>>;
  setPendingArchiveOrder: React.Dispatch<React.SetStateAction<any>>;
  setOrdineToDelete: React.Dispatch<React.SetStateAction<any>>;
  setWhatsApp: React.Dispatch<React.SetStateAction<any>>;
}

export const useOrdersHandlers = ({
  pageState,
  setTabs,
  setModals,
  setModifiedQuantities,
  setDraftQuantities,
  setEditingQuantity,
  setSmartModalOrdine,
  setPendingArchiveOrder,
  setOrdineToDelete,
  setWhatsApp
}: UseOrdersHandlersProps) => {
  const navigate = useNavigate();
  const {
    ordiniInviati,
    confermaRicezioneOrdine,
    aggiornaQuantitaOrdine,
    eliminaOrdineInviato,
    eliminaOrdineStorico,
    inizializzaQuantitaConfermate,
    aggiornaQuantitaConfermata
  } = useOrdini();

  // NAVIGATION
  const handleClose = useCallback(() => {
    navigate('/');
  }, [navigate]);

  // TAB MANAGEMENT
  const handleSetActiveTab = useCallback((tab: TabType) => {
    setTabs(prev => ({ ...prev, active: tab }));
  }, [setTabs]);

  const handleToggleExpanded = useCallback((ordineId: string) => {
    setTabs(prev => ({
      ...prev,
      expanded: new Set(prev.expanded).has(ordineId)
        ? new Set([...prev.expanded].filter(id => id !== ordineId))
        : new Set([...prev.expanded, ordineId])
    }));
  }, [setTabs]);

  // ORDER ACTIONS
  const handleVisualizza = useCallback((ordineId: string) => {
    // TODO: Implementare visualizzazione dettagli ordine
  }, []);

  const handleConfermaOrdine = useCallback(async (ordineId: string) => {
    await confermaRicezioneOrdine(ordineId);
  }, [confermaRicezioneOrdine]);

  const handleEliminaOrdineCreato = useCallback((ordineId: string, ordine: Ordine) => {
    setOrdineToDelete({ id: ordineId, ordine, tipo: 'inviato' });
    setModals(prev => ({ ...prev, showConfermaEliminazione: true }));
  }, [setOrdineToDelete, setModals]);

  const handleEliminaOrdineArchiviato = useCallback((ordineId: string, ordine: Ordine) => {
    setOrdineToDelete({ id: ordineId, ordine, tipo: 'archiviato' });
    setModals(prev => ({ ...prev, showConfermaEliminazione: true }));
  }, [setOrdineToDelete, setModals]);

  // QUANTITY MANAGEMENT
  const handleQuantityChange = useCallback((ordineId: string, dettaglioIndex: number, newQuantity: number) => {
    setModifiedQuantities(prev => ({
      ...prev,
      [ordineId]: {
        ...prev[ordineId],
        [dettaglioIndex]: newQuantity
      }
    }));
  }, [setModifiedQuantities]);

  const handleOpenQuantityModal = useCallback((ordineId: string, dettaglioIndex: number) => {
    const ordine = ordiniInviati.find(o => o.id === ordineId);
    if (!ordine?.dettagli?.[dettaglioIndex]) return;

    const originalValue = ordine.dettagli[dettaglioIndex].quantity;
    const currentValue = isFeatureEnabled('QTY_MODAL_PERSIST_COMMIT') 
      ? (pageState.draftQuantities[ordineId]?.[dettaglioIndex] ?? pageState.modifiedQuantities[ordineId]?.[dettaglioIndex] ?? originalValue)
      : (pageState.modifiedQuantities[ordineId]?.[dettaglioIndex] ?? originalValue);

    setEditingQuantity({ ordineId, dettaglioIndex, currentValue, originalValue });
    setModals(prev => ({ ...prev, showQuantityModal: true }));
  }, [ordiniInviati, pageState.draftQuantities, pageState.modifiedQuantities, setEditingQuantity, setModals]);

  const handleCloseQuantityModal = useCallback(() => {
    setModals(prev => ({ ...prev, showQuantityModal: false }));
    setEditingQuantity(null);
  }, [setModals, setEditingQuantity]);

  // SMART MODAL
  const handleOpenSmartModal = useCallback((ordine: Ordine) => {
    if (!isFeatureEnabled('CREATI_SMART_FULL_MODAL')) return;
    
    if (ordine.dettagli) {
      inizializzaQuantitaConfermate(ordine.id, ordine.dettagli);
    }
    
    setSmartModalOrdine(ordine);
    setModals(prev => ({ ...prev, showSmartModal: true }));
  }, [inizializzaQuantitaConfermate, setSmartModalOrdine, setModals]);

  const handleCloseSmartModal = useCallback(() => {
    setModals(prev => ({ ...prev, showSmartModal: false }));
    setSmartModalOrdine(null);
  }, [setModals, setSmartModalOrdine]);

  // WHATSAPP MODAL
  const handleOpenWhatsAppModal = useCallback((ordine: Ordine) => {
    console.log('🔄 handleOpenWhatsAppModal chiamato con ordine:', ordine);
    
    if (!ordine.dettagli || ordine.dettagli.length === 0) {
      console.log('❌ Ordine senza dettagli o dettagli vuoti, esco');
      console.log('📋 Ordine completo:', JSON.stringify(ordine, null, 2));
      alert('Errore: Ordine senza dettagli. Impossibile generare messaggio WhatsApp.');
      return;
    }
    
    const orderDetails: OrderDetail[] = ordine.dettagli.map(dettaglio => ({
      wineName: dettaglio.wineName,
      vintage: undefined,
      quantity: dettaglio.quantity,
      unit: dettaglio.unit as 'bottiglie' | 'cartoni'
    }));
    
    console.log('📦 OrderDetails generati:', orderDetails);
    console.log('🏢 Supplier name:', ordine.fornitore);
    
    setWhatsApp({
      orderDetails,
      supplierName: ordine.fornitore
    });
    setModals(prev => ({ ...prev, showWhatsAppModal: true }));
    
    console.log('✅ Modale WhatsApp dovrebbe aprirsi');
  }, [setWhatsApp, setModals]);

  const handleCloseWhatsAppModal = useCallback(() => {
    setModals(prev => ({ ...prev, showWhatsAppModal: false }));
    setWhatsApp({ orderDetails: [], supplierName: '' });
  }, [setModals, setWhatsApp]);

  // QUANTITY & MODAL HANDLERS - Estratti per ridurre complessità
  const handleConfirmQuantityModal = useCallback((newQuantity: number) => {
    if (!pageState.editingQuantity) return;

    if (isFeatureEnabled('QTY_MODAL_PERSIST_COMMIT')) {
      setDraftQuantities(prev => ({
        ...prev,
        [pageState.editingQuantity!.ordineId]: {
          ...prev[pageState.editingQuantity!.ordineId],
          [pageState.editingQuantity!.dettaglioIndex]: newQuantity
        }
      }));

      const ordine = ordiniInviati.find(o => o.id === pageState.editingQuantity!.ordineId);
      if (ordine && ordine.dettagli) {
        const wineId = ordine.dettagli[pageState.editingQuantity!.dettaglioIndex].wineId;
        aggiornaQuantitaConfermata(pageState.editingQuantity!.ordineId, wineId, newQuantity);
      }
    } else {
      setModifiedQuantities(prev => ({
        ...prev,
        [pageState.editingQuantity!.ordineId]: {
          ...prev[pageState.editingQuantity!.ordineId],
          [pageState.editingQuantity!.dettaglioIndex]: newQuantity
        }
      }));
    }

    handleCloseQuantityModal();
  }, [pageState.editingQuantity, ordiniInviati, setDraftQuantities, setModifiedQuantities, aggiornaQuantitaConfermata, isFeatureEnabled]);

  const handleSmartModalConfirm = useCallback((modifiedQuantities: Record<number, number>) => {
    if (!pageState.smartModalOrdine?.dettagli) return;
    pageState.smartModalOrdine.dettagli.forEach((dettaglio, index) => {
      if (modifiedQuantities[index] !== undefined) {
        aggiornaQuantitaConfermata(pageState.smartModalOrdine!.id, dettaglio.wineId, modifiedQuantities[index]);
      }
    });
  }, [pageState.smartModalOrdine, aggiornaQuantitaConfermata]);

  const handleSmartModalArchive = useCallback(async (modifiedQuantities: Record<number, number>) => {
    if (!pageState.smartModalOrdine?.dettagli) return;
    try {
      pageState.smartModalOrdine.dettagli.forEach((dettaglio, index) => {
        if (modifiedQuantities[index] !== undefined) {
          aggiornaQuantitaConfermata(pageState.smartModalOrdine!.id, dettaglio.wineId, modifiedQuantities[index]);
        }
      });
      await confermaRicezioneOrdine(pageState.smartModalOrdine.id);
      setTabs(prev => ({ ...prev, active: 'archiviati' }));
    } catch (error) {
      console.error('Errore durante archiviazione Smart Modal:', error);
    }
  }, [pageState.smartModalOrdine, aggiornaQuantitaConfermata, confermaRicezioneOrdine, setTabs]);

  const handleConfirmArchive = useCallback(async () => {
    if (!pageState.pendingArchiveOrder) return;
    const ordine = ordiniInviati.find(o => o.id === pageState.pendingArchiveOrder!.ordineId);
    if (!ordine?.dettagli) return;

    try {
      const dettagliAggiornati = ordine.dettagli.map((dettaglio, index) => ({
        ...dettaglio,
        quantity: pageState.pendingArchiveOrder!.quantities[index] ?? dettaglio.quantity,
        totalPrice: (pageState.pendingArchiveOrder!.quantities[index] ?? dettaglio.quantity) * dettaglio.unitPrice
      }));

      aggiornaQuantitaOrdine(pageState.pendingArchiveOrder!.ordineId, dettagliAggiornati);
      await confermaRicezioneOrdine(pageState.pendingArchiveOrder!.ordineId);

      setDraftQuantities(prev => {
        const newDrafts = { ...prev };
        delete newDrafts[pageState.pendingArchiveOrder!.ordineId];
        return newDrafts;
      });

      setModals(prev => ({ ...prev, showConfirmArchive: false }));
      setPendingArchiveOrder(null);
      setTabs(prev => ({ ...prev, active: 'archiviati' }));
    } catch (error) {
      console.error('Errore durante archiviazione:', error);
    }
  }, [pageState.pendingArchiveOrder, ordiniInviati, aggiornaQuantitaOrdine, confermaRicezioneOrdine, setDraftQuantities, setModals, setPendingArchiveOrder, setTabs]);

  const handleCancelArchive = useCallback(() => {
    setModals(prev => ({ ...prev, showConfirmArchive: false }));
    setPendingArchiveOrder(null);
  }, [setModals, setPendingArchiveOrder]);

  // CONFIRM ELIMINATION
  const confermaEliminazione = useCallback(() => {
    if (!pageState.ordineToDelete) return;

    switch (pageState.ordineToDelete.tipo) {
      case 'inviato':
        eliminaOrdineInviato(pageState.ordineToDelete.id);
        break;
      case 'archiviato':
        eliminaOrdineStorico(pageState.ordineToDelete.id);
        break;
    }

    setOrdineToDelete(null);
    setModals(prev => ({ ...prev, showConfermaEliminazione: false }));
  }, [pageState.ordineToDelete, eliminaOrdineInviato, eliminaOrdineStorico, setOrdineToDelete, setModals]);

  return {
    // Navigation
    handleClose,
    
    // Tabs
    handleSetActiveTab,
    handleToggleExpanded,
    
    // Orders
    handleVisualizza,
    handleConfermaOrdine,
    handleEliminaOrdineCreato,
    handleEliminaOrdineArchiviato,
    
    // Quantity
    handleQuantityChange,
    handleOpenQuantityModal,
    handleCloseQuantityModal,
    handleConfirmQuantityModal,
    
    // Smart Modal
    handleOpenSmartModal,
    handleCloseSmartModal,
    handleSmartModalConfirm,
    handleSmartModalArchive,
    
    // Archive
    handleConfirmArchive,
    handleCancelArchive,
    
    // WhatsApp
    handleOpenWhatsAppModal,
    handleCloseWhatsAppModal,
    
    // Elimination
    confermaEliminazione
  };
};
