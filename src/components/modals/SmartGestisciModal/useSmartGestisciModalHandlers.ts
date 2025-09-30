import { useCallback } from 'react';
import { isFeatureEnabled } from '../../../config/featureFlags';
import { DettaglioOrdine, EditingItem } from './types';

interface UseSmartGestisciModalHandlersProps {
  dettagli: DettaglioOrdine[];
  modifiedQuantities: Record<number, number>;
  setModifiedQuantities: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  setShowQuantityModal: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingItem: React.Dispatch<React.SetStateAction<EditingItem | null>>;
  setShowConfirmArchive: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
  onConfirm: (modifiedQuantities: Record<number, number>) => void;
  onArchive?: (modifiedQuantities: Record<number, number>) => void;
}

export function useSmartGestisciModalHandlers({
  dettagli,
  modifiedQuantities,
  setModifiedQuantities,
  setShowQuantityModal,
  setEditingItem,
  setShowConfirmArchive,
  onClose,
  onConfirm,
  onArchive
}: UseSmartGestisciModalHandlersProps) {

  const handleQuantityClick = useCallback((index: number) => {
    const originalValue = dettagli[index].quantity;
    const currentValue = modifiedQuantities[index] ?? originalValue;
    
    setEditingItem({
      index,
      originalValue,
      currentValue
    });
    setShowQuantityModal(true);
  }, [dettagli, modifiedQuantities, setEditingItem, setShowQuantityModal]);

  const handleQuantityConfirm = useCallback((newQuantity: number, editingItem: EditingItem | null) => {
    if (!editingItem) return;

    setModifiedQuantities(prev => ({
      ...prev,
      [editingItem.index]: newQuantity
    }));
    
    setShowQuantityModal(false);
    setEditingItem(null);
  }, [setModifiedQuantities, setShowQuantityModal, setEditingItem]);

  const handleQuantityCancel = useCallback(() => {
    setShowQuantityModal(false);
    setEditingItem(null);
  }, [setShowQuantityModal, setEditingItem]);

  const handleConfirm = useCallback(() => {
    if (isFeatureEnabled('QTY_MODAL_CONFIRM_ARCHIVE_FLOW') && onArchive) {
      // Mostra dialog di conferma archiviazione
      setShowConfirmArchive(true);
    } else {
      // Comportamento legacy
      onConfirm(modifiedQuantities);
      onClose();
    }
  }, [modifiedQuantities, onConfirm, onArchive, onClose, setShowConfirmArchive]);

  const handleConfirmArchive = useCallback(() => {
    if (onArchive) {
      onArchive(modifiedQuantities);
    }
    setShowConfirmArchive(false);
    onClose();
  }, [onArchive, modifiedQuantities, setShowConfirmArchive, onClose]);

  const handleCancelArchive = useCallback(() => {
    setShowConfirmArchive(false);
  }, [setShowConfirmArchive]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  return {
    handleQuantityClick,
    handleQuantityConfirm,
    handleQuantityCancel,
    handleConfirm,
    handleConfirmArchive,
    handleCancelArchive,
    handleCancel
  };
}
