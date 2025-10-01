import { useCallback } from 'react';
import { useOrdini } from '../../../../contexts/OrdiniContext';
import { isFeatureEnabled } from '../../../../config/featureFlags';
import { OrdersPageState } from '../../types';

interface UseQuantityHandlersProps {
  pageState: OrdersPageState;
  setModals: React.Dispatch<React.SetStateAction<any>>;
  setModifiedQuantities: React.Dispatch<React.SetStateAction<Record<string, Record<number, number>>>>;
  setDraftQuantities: React.Dispatch<React.SetStateAction<Record<string, Record<number, number>>>>;
  setEditingQuantity: React.Dispatch<React.SetStateAction<any>>;
}

export const useQuantityHandlers = ({
  pageState,
  setModals,
  setModifiedQuantities,
  setDraftQuantities,
  setEditingQuantity
}: UseQuantityHandlersProps) => {
  const { ordiniInviati, aggiornaQuantitaConfermata } = useOrdini();

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

    const currentValue = pageState.draftQuantities[ordineId]?.[dettaglioIndex] ?? 
                        pageState.modifiedQuantities[ordineId]?.[dettaglioIndex] ?? 
                        ordine.dettagli[dettaglioIndex].quantity;
    const originalValue = ordine.dettagli[dettaglioIndex].quantity;

    setEditingQuantity({ ordineId, dettaglioIndex, currentValue, originalValue });
    setModals(prev => ({ ...prev, showQuantityModal: true }));
  }, [ordiniInviati, pageState.draftQuantities, pageState.modifiedQuantities, setEditingQuantity, setModals]);

  const handleCloseQuantityModal = useCallback(() => {
    setModals(prev => ({ ...prev, showQuantityModal: false }));
    setEditingQuantity(null);
  }, [setModals, setEditingQuantity]);

  const handleConfirmQuantityModal = useCallback((newQuantity: number) => {
    if (!pageState.editingQuantity) return;

    if (isFeatureEnabled('QTY_MODAL_PERSIST_COMMIT')) {
      const ordine = ordiniInviati.find(o => o.id === pageState.editingQuantity!.ordineId);
      if (ordine?.dettagli?.[pageState.editingQuantity!.dettaglioIndex]) {
        const dettaglio = ordine.dettagli[pageState.editingQuantity!.dettaglioIndex];
        aggiornaQuantitaConfermata(pageState.editingQuantity!.ordineId, dettaglio.wineId, newQuantity);
      }
    } else {
      setDraftQuantities(prev => ({
        ...prev,
        [pageState.editingQuantity!.ordineId]: {
          ...prev[pageState.editingQuantity!.ordineId],
          [pageState.editingQuantity!.dettaglioIndex]: newQuantity
        }
      }));

      setModifiedQuantities(prev => ({
        ...prev,
        [pageState.editingQuantity!.ordineId]: {
          ...prev[pageState.editingQuantity!.ordineId],
          [pageState.editingQuantity!.dettaglioIndex]: newQuantity
        }
      }));
    }

    handleCloseQuantityModal();
  }, [pageState.editingQuantity, ordiniInviati, setDraftQuantities, setModifiedQuantities, aggiornaQuantitaConfermata, isFeatureEnabled, handleCloseQuantityModal]);

  return {
    handleQuantityChange,
    handleOpenQuantityModal,
    handleCloseQuantityModal,
    handleConfirmQuantityModal
  };
};
