import { useCallback } from 'react';
import { useOrdini, Ordine } from '../../../../contexts/OrdiniContext';
import { isFeatureEnabled } from '../../../../config/featureFlags';
import { OrderDetail } from '../../../../utils/buildWhatsAppMessage';
import { OrdersPageState } from '../../types';

interface UseModalHandlersProps {
  pageState: OrdersPageState;
  setModals: React.Dispatch<React.SetStateAction<any>>;
  setSmartModalOrdine: React.Dispatch<React.SetStateAction<Ordine | null>>;
  setPendingArchiveOrder: React.Dispatch<React.SetStateAction<any>>;
  setOrdineToDelete: React.Dispatch<React.SetStateAction<any>>;
  setWhatsApp: React.Dispatch<React.SetStateAction<any>>;
  setTabs: React.Dispatch<React.SetStateAction<any>>;
  setDraftQuantities: React.Dispatch<React.SetStateAction<Record<string, Record<number, number>>>>;
}

export const useModalHandlers = ({
  pageState,
  setModals,
  setSmartModalOrdine,
  setPendingArchiveOrder,
  setOrdineToDelete,
  setWhatsApp,
  setTabs,
  setDraftQuantities
}: UseModalHandlersProps) => {
  const {
    ordiniInviati,
    inizializzaQuantitaConfermate,
    aggiornaQuantitaConfermata,
    confermaRicezioneOrdineConQuantita,
    eliminaOrdineInviato,
    eliminaOrdineStorico
  } = useOrdini();

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
      const quantitaConfermate: Record<string, number> = {};
      pageState.smartModalOrdine.dettagli.forEach((dettaglio, index) => {
        if (modifiedQuantities[index] !== undefined) {
          quantitaConfermate[dettaglio.wineId] = modifiedQuantities[index];
        }
      });

      await confermaRicezioneOrdineConQuantita(pageState.smartModalOrdine.id, quantitaConfermate);
      setTabs(prev => ({ ...prev, active: 'archiviati' }));
    } catch (error) {
      console.error('Errore durante archiviazione:', error);
    }
  }, [pageState.smartModalOrdine, confermaRicezioneOrdineConQuantita, setTabs]);

  // WHATSAPP MODAL
  const handleOpenWhatsAppModal = useCallback((ordine: Ordine) => {
    console.log('🔄 handleOpenWhatsAppModal chiamato con ordine:', ordine);
    
    if (!ordine.dettagli || ordine.dettagli.length === 0) {
      console.warn('⚠️ Ordine senza dettagli, impossibile aprire WhatsApp');
      return;
    }

    const orderDetails: OrderDetail[] = ordine.dettagli.map(dettaglio => ({
      wineName: dettaglio.wineName,
      vintage: undefined, // OrdineDettaglio non ha vintage
      quantity: dettaglio.quantity,
      unit: (dettaglio.unit as 'bottiglie' | 'cartoni') || 'bottiglie'
    }));

    console.log('📋 OrderDetails preparati:', orderDetails);

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

  // ARCHIVE MODAL
  const handleConfirmArchive = useCallback(async () => {
    if (!pageState.pendingArchiveOrder) return;
    const ordine = ordiniInviati.find(o => o.id === pageState.pendingArchiveOrder!.ordineId);
    if (!ordine?.dettagli) return;

    try {
      const quantitaConfermate: Record<string, number> = {};
      ordine.dettagli.forEach((dettaglio, index) => {
        const quantitaModificata = pageState.pendingArchiveOrder!.quantities[index];
        if (quantitaModificata !== undefined) {
          quantitaConfermate[dettaglio.wineId] = quantitaModificata;
        }
      });

      await confermaRicezioneOrdineConQuantita(pageState.pendingArchiveOrder!.ordineId, quantitaConfermate);

      setDraftQuantities(prev => {
        const newState = { ...prev };
        delete newState[pageState.pendingArchiveOrder!.ordineId];
        return newState;
      });

      setModals(prev => ({ ...prev, showConfirmArchive: false }));
      setPendingArchiveOrder(null);
      setTabs(prev => ({ ...prev, active: 'archiviati' }));
    } catch (error) {
      console.error('Errore durante archiviazione:', error);
    }
  }, [pageState.pendingArchiveOrder, ordiniInviati, confermaRicezioneOrdineConQuantita, setDraftQuantities, setModals, setPendingArchiveOrder, setTabs]);

  const handleCancelArchive = useCallback(() => {
    setModals(prev => ({ ...prev, showConfirmArchive: false }));
    setPendingArchiveOrder(null);
  }, [setModals, setPendingArchiveOrder]);

  // ELIMINATION
  const confermaEliminazione = useCallback(() => {
    if (!pageState.ordineToDelete) return;

    if (pageState.ordineToDelete.tipo === 'inviato') {
      eliminaOrdineInviato(pageState.ordineToDelete.id);
    } else if (pageState.ordineToDelete.tipo === 'archiviato') {
      eliminaOrdineStorico(pageState.ordineToDelete.id);
    }

    setOrdineToDelete(null);
    setModals(prev => ({ ...prev, showConfermaEliminazione: false }));
  }, [pageState.ordineToDelete, eliminaOrdineInviato, eliminaOrdineStorico, setOrdineToDelete, setModals]);

  return {
    // Smart Modal
    handleOpenSmartModal,
    handleCloseSmartModal,
    handleSmartModalConfirm,
    handleSmartModalArchive,
    
    // WhatsApp
    handleOpenWhatsAppModal,
    handleCloseWhatsAppModal,
    
    // Archive
    handleConfirmArchive,
    handleCancelArchive,
    
    // Elimination
    confermaEliminazione
  };
};
