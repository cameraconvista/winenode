// refactor: handler per azioni su ordini (business logic separata)
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ordine, TabType, QuantityEditState, ArchivePendingState } from '../types/orders';
import { OrderDetail } from '../utils/buildWhatsAppMessage';
import { isFeatureEnabled } from '../config/featureFlags';

interface OrdersHandlersProps {
  // Dati ordini
  ordiniInviati: Ordine[];
  ordiniStorico: Ordine[];
  
  // Azioni context
  aggiornaQuantitaOrdine: (ordineId: string, dettagli: any[]) => void;
  confermaRicezioneOrdine: (ordineId: string) => Promise<void>;
  eliminaOrdineInviato: (ordineId: string) => Promise<void>;
  eliminaOrdineStorico: (ordineId: string) => Promise<void>;
  inizializzaQuantitaConfermate: (ordineId: string, dettagli: any[]) => void;
  aggiornaQuantitaConfermata: (ordineId: string, wineId: string, quantity: number) => void;
  
  // Stati locali
  expandedOrders: Set<string>;
  managingOrders: Set<string>;
  modifiedQuantities: Record<string, Record<number, number>>;
  draftQuantities: Record<string, Record<number, number>>;
  
  // Setters stati
  setActiveTab: (tab: TabType) => void;
  setExpandedOrders: (fn: (prev: Set<string>) => Set<string>) => void;
  setManagingOrders: (fn: (prev: Set<string>) => Set<string>) => void;
  setModifiedQuantities: (fn: (prev: Record<string, Record<number, number>>) => Record<string, Record<number, number>>) => void;
  setDraftQuantities: (fn: (prev: Record<string, Record<number, number>>) => Record<string, Record<number, number>>) => void;
  
  // Setters modali
  setShowQuantityModal: (show: boolean) => void;
  setEditingQuantity: (state: QuantityEditState | null) => void;
  setShowSmartModal: (show: boolean) => void;
  setSmartModalOrdine: (ordine: Ordine | null) => void;
  setShowConfirmArchive: (show: boolean) => void;
  setPendingArchiveOrder: (state: ArchivePendingState | null) => void;
  setShowWhatsAppModal: (show: boolean) => void;
  setWhatsAppOrderDetails: (details: OrderDetail[]) => void;
  setWhatsAppSupplierName: (name: string) => void;
  
  // Eliminazione
  setOrdineToDelete: (ordine: any) => void;
}

export function useOrdersHandlers(props: OrdersHandlersProps) {
  const navigate = useNavigate();
  
  const {
    ordiniInviati,
    ordiniStorico,
    aggiornaQuantitaOrdine,
    confermaRicezioneOrdine,
    eliminaOrdineInviato,
    eliminaOrdineStorico,
    inizializzaQuantitaConfermate,
    aggiornaQuantitaConfermata,
    expandedOrders,
    managingOrders,
    modifiedQuantities,
    draftQuantities,
    setActiveTab,
    setExpandedOrders,
    setManagingOrders,
    setModifiedQuantities,
    setDraftQuantities,
    setShowQuantityModal,
    setEditingQuantity,
    setShowSmartModal,
    setSmartModalOrdine,
    setShowConfirmArchive,
    setPendingArchiveOrder,
    setShowWhatsAppModal,
    setWhatsAppOrderDetails,
    setWhatsAppSupplierName,
    setOrdineToDelete
  } = props;

  const handleToggleExpanded = useCallback((ordineId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ordineId)) {
        newSet.delete(ordineId);
      } else {
        newSet.add(ordineId);
      }
      return newSet;
    });
  }, [setExpandedOrders]);

  const handleToggleManaging = useCallback((ordineId: string) => {
    if (!isFeatureEnabled('CREATI_INLINE_GESTISCI')) return;
    
    setManagingOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(ordineId)) {
        newSet.delete(ordineId);
        // Reset quantità modificate quando si chiude la gestione
        setModifiedQuantities(prevMod => {
          const newMod = { ...prevMod };
          delete newMod[ordineId];
          return newMod;
        });
      } else {
        newSet.add(ordineId);
        // Inizializza quantità con valori originali
        const ordine = ordiniInviati.find(o => o.id === ordineId);
        if (ordine && ordine.dettagli) {
          setModifiedQuantities(prevMod => ({
            ...prevMod,
            [ordineId]: ordine.dettagli!.reduce((acc, dettaglio, index) => {
              acc[index] = dettaglio.quantity;
              return acc;
            }, {} as Record<number, number>)
          }));
        }
      }
      return newSet;
    });
  }, [setManagingOrders, setModifiedQuantities, ordiniInviati]);

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
    if (!ordine || !ordine.dettagli || !ordine.dettagli[dettaglioIndex]) return;

    const originalValue = ordine.dettagli[dettaglioIndex].quantity;
    // Usa draftQuantities se disponibile, altrimenti modifiedQuantities, altrimenti originale
    const currentValue = isFeatureEnabled('QTY_MODAL_PERSIST_COMMIT') 
      ? (draftQuantities[ordineId]?.[dettaglioIndex] ?? modifiedQuantities[ordineId]?.[dettaglioIndex] ?? originalValue)
      : (modifiedQuantities[ordineId]?.[dettaglioIndex] ?? originalValue);

    setEditingQuantity({
      ordineId,
      dettaglioIndex,
      currentValue,
      originalValue
    });
    setShowQuantityModal(true);
  }, [ordiniInviati, draftQuantities, modifiedQuantities, setEditingQuantity, setShowQuantityModal]);

  const handleCloseQuantityModal = useCallback(() => {
    setShowQuantityModal(false);
    setEditingQuantity(null);
  }, [setShowQuantityModal, setEditingQuantity]);

  const handleConfirmQuantityModal = useCallback((newQuantity: number, editingQuantity: QuantityEditState | null) => {
    if (!editingQuantity) return;

    if (isFeatureEnabled('QTY_MODAL_PERSIST_COMMIT')) {
      // Commit del draft: salva in draftQuantities per persistenza
      setDraftQuantities(prev => ({
        ...prev,
        [editingQuantity.ordineId]: {
          ...prev[editingQuantity.ordineId],
          [editingQuantity.dettaglioIndex]: newQuantity
        }
      }));

      // AGGIORNA LE QUANTITÀ REALI NELL'ORDINE
      const ordine = ordiniInviati.find(o => o.id === editingQuantity.ordineId);
      if (ordine && ordine.dettagli) {
        // Aggiorna le quantità confermate invece dell'ordine direttamente
        const wineId = ordine.dettagli[editingQuantity.dettaglioIndex].wineId;
        aggiornaQuantitaConfermata(editingQuantity.ordineId, wineId, newQuantity);
        console.log('✅ Quantità confermata aggiornata:', newQuantity);
      }

      // Se abilitato il flusso di archiviazione, mostra dialog
      if (isFeatureEnabled('QTY_MODAL_CONFIRM_ARCHIVE_FLOW')) {
        const ordine = ordiniInviati.find(o => o.id === editingQuantity.ordineId);
        if (ordine && ordine.dettagli) {
          // Prepara le quantità per l'archiviazione
          const quantities = ordine.dettagli.reduce((acc, _, index) => {
            acc[index] = index === editingQuantity.dettaglioIndex 
              ? newQuantity 
              : (draftQuantities[editingQuantity.ordineId]?.[index] ?? ordine.dettagli![index].quantity);
            return acc;
          }, {} as Record<number, number>);

          setPendingArchiveOrder({
            ordineId: editingQuantity.ordineId,
            quantities
          });
          setShowConfirmArchive(true);
        }
      }
    } else {
      // Comportamento legacy
      handleQuantityChange(editingQuantity.ordineId, editingQuantity.dettaglioIndex, newQuantity);
    }

    handleCloseQuantityModal();
  }, [
    setDraftQuantities,
    ordiniInviati,
    aggiornaQuantitaConfermata,
    draftQuantities,
    setPendingArchiveOrder,
    setShowConfirmArchive,
    handleQuantityChange,
    handleCloseQuantityModal
  ]);

  const handleOpenSmartModal = useCallback((ordine: Ordine) => {
    if (!isFeatureEnabled('CREATI_SMART_FULL_MODAL')) return;
    
    // Inizializza le quantità confermate per questo ordine
    if (ordine.dettagli) {
      inizializzaQuantitaConfermate(ordine.id, ordine.dettagli);
    }
    
    setSmartModalOrdine(ordine);
    setShowSmartModal(true);
  }, [inizializzaQuantitaConfermate, setSmartModalOrdine, setShowSmartModal]);

  const handleCloseSmartModal = useCallback(() => {
    setShowSmartModal(false);
    setSmartModalOrdine(null);
  }, [setShowSmartModal, setSmartModalOrdine]);

  const handleSmartModalConfirm = useCallback((modifiedQuantities: Record<number, number>, smartModalOrdine: Ordine | null) => {
    if (!smartModalOrdine || !smartModalOrdine.dettagli) return;

    // Aggiorna le quantità confermate per ogni prodotto modificato
    smartModalOrdine.dettagli.forEach((dettaglio, index) => {
      if (modifiedQuantities[index] !== undefined) {
        aggiornaQuantitaConfermata(smartModalOrdine.id, dettaglio.wineId, modifiedQuantities[index]);
      }
    });

    console.log('✅ Quantità confermate aggiornate tramite Smart Modal');
  }, [aggiornaQuantitaConfermata]);

  const handleSmartModalArchive = useCallback(async (modifiedQuantities: Record<number, number>, smartModalOrdine: Ordine | null) => {
    if (!smartModalOrdine || !smartModalOrdine.dettagli) return;

    try {
      // Aggiorna le quantità confermate per ogni prodotto modificato
      smartModalOrdine.dettagli.forEach((dettaglio, index) => {
        if (modifiedQuantities[index] !== undefined) {
          aggiornaQuantitaConfermata(smartModalOrdine.id, dettaglio.wineId, modifiedQuantities[index]);
        }
      });

      // Conferma ricezione con quantità confermate (logica atomica)
      await confermaRicezioneOrdine(smartModalOrdine.id);

      // Switch al tab Archiviati
      setActiveTab('archiviati');

      console.log('✅ Ordine archiviato con successo tramite Smart Modal');
    } catch (error) {
      console.error('❌ Errore durante archiviazione Smart Modal:', error);
    }
  }, [aggiornaQuantitaConfermata, confermaRicezioneOrdine, setActiveTab]);

  const handleConfirmArchive = useCallback(async (pendingArchiveOrder: ArchivePendingState | null) => {
    if (!pendingArchiveOrder) return;

    const ordine = ordiniInviati.find(o => o.id === pendingArchiveOrder.ordineId);
    if (!ordine || !ordine.dettagli) return;

    try {
      // Prepara i dettagli aggiornati con le quantità committate
      const dettagliAggiornati = ordine.dettagli.map((dettaglio, index) => {
        const newQuantity = pendingArchiveOrder.quantities[index] ?? dettaglio.quantity;
        return {
          ...dettaglio,
          quantity: newQuantity,
          totalPrice: newQuantity * dettaglio.unitPrice
        };
      });

      // Prima aggiorna le quantità, poi conferma ricezione (logica atomica Fase 3)
      aggiornaQuantitaOrdine(pendingArchiveOrder.ordineId, dettagliAggiornati);
      await confermaRicezioneOrdine(pendingArchiveOrder.ordineId);

      // Pulisci gli stati
      setDraftQuantities(prev => {
        const newDrafts = { ...prev };
        delete newDrafts[pendingArchiveOrder.ordineId];
        return newDrafts;
      });

      // Chiudi dialog e switch al tab Archiviati
      setShowConfirmArchive(false);
      setPendingArchiveOrder(null);
      setActiveTab('archiviati');

      console.log('✅ Ordine archiviato con successo');
    } catch (error) {
      console.error('❌ Errore durante archiviazione:', error);
    }
  }, [
    ordiniInviati,
    aggiornaQuantitaOrdine,
    confermaRicezioneOrdine,
    setDraftQuantities,
    setShowConfirmArchive,
    setPendingArchiveOrder,
    setActiveTab
  ]);

  const handleCancelArchive = useCallback(() => {
    setShowConfirmArchive(false);
    setPendingArchiveOrder(null);
  }, [setShowConfirmArchive, setPendingArchiveOrder]);

  const handleOpenWhatsAppModal = useCallback((ordine: Ordine) => {
    if (!ordine.dettagli) return;
    
    // Converte i dettagli ordine nel formato richiesto dal modale WhatsApp
    const orderDetails: OrderDetail[] = ordine.dettagli.map(dettaglio => ({
      wineName: dettaglio.wineName,
      vintage: undefined, // OrdineDettaglio non ha vintage, sarà undefined
      quantity: dettaglio.quantity,
      unit: dettaglio.unit as 'bottiglie' | 'cartoni'
    }));
    
    setWhatsAppOrderDetails(orderDetails);
    setWhatsAppSupplierName(ordine.fornitore);
    setShowWhatsAppModal(true);
  }, [setWhatsAppOrderDetails, setWhatsAppSupplierName, setShowWhatsAppModal]);

  const handleCloseWhatsAppModal = useCallback(() => {
    setShowWhatsAppModal(false);
    setWhatsAppOrderDetails([]);
    setWhatsAppSupplierName('');
  }, [setShowWhatsAppModal, setWhatsAppOrderDetails, setWhatsAppSupplierName]);

  const handleConfermaModifiche = useCallback(async (ordineId: string) => {
    const ordine = ordiniInviati.find(o => o.id === ordineId);
    if (!ordine || !ordine.dettagli) return;

    try {
      // Prepara i dettagli aggiornati con le quantità modificate
      const dettagliAggiornati = ordine.dettagli.map((dettaglio, index) => {
        const newQuantity = modifiedQuantities[ordineId]?.[index] ?? dettaglio.quantity;
        return {
          ...dettaglio,
          quantity: newQuantity,
          totalPrice: newQuantity * dettaglio.unitPrice
        };
      });

      // Aggiorna l'ordine nel context
      aggiornaQuantitaOrdine(ordineId, dettagliAggiornati);

      // Conferma ricezione con logica atomica (riusa Fase 3)
      await confermaRicezioneOrdine(ordineId);

      // Chiudi la modalità gestione
      handleToggleManaging(ordineId);

      console.log('✅ Quantità confermate e ordine archiviato con successo');
    } catch (error) {
      console.error('❌ Errore durante la conferma delle modifiche:', error);
    }
  }, [ordiniInviati, modifiedQuantities, aggiornaQuantitaOrdine, confermaRicezioneOrdine, handleToggleManaging]);

  const handleEliminaOrdine = useCallback((ordineId: string, tipo: 'inviato' | 'ricevuto' | 'storico') => {
    setOrdineToDelete({ id: ordineId, tipo });
  }, [setOrdineToDelete]);

  const confermaEliminazione = useCallback((ordineToDelete: any) => {
    if (!ordineToDelete) return;

    switch (ordineToDelete.tipo) {
      case 'inviato':
        eliminaOrdineInviato(ordineToDelete.id);
        break;
      case 'ricevuto':
        // eliminaOrdineRicevuto rimossa - non più necessaria
        break;
      case 'storico':
        eliminaOrdineStorico(ordineToDelete.id);
        break;
    }
  }, [eliminaOrdineInviato, eliminaOrdineStorico]);

  return {
    handleToggleExpanded,
    handleToggleManaging,
    handleQuantityChange,
    handleOpenQuantityModal,
    handleCloseQuantityModal,
    handleConfirmQuantityModal,
    handleOpenSmartModal,
    handleCloseSmartModal,
    handleSmartModalConfirm,
    handleSmartModalArchive,
    handleConfirmArchive,
    handleCancelArchive,
    handleOpenWhatsAppModal,
    handleCloseWhatsAppModal,
    handleConfermaModifiche,
    handleEliminaOrdine,
    confermaEliminazione,
    
    // Alias per compatibilità OrdersTable
    onGestisci: handleOpenSmartModal,
    onElimina: handleEliminaOrdine,
    gestisciOrdine: handleOpenSmartModal,
    eliminaOrdine: handleEliminaOrdine
  };
}
