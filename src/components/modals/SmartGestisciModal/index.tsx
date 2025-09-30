import React from 'react';
import { SmartGestisciModalProps } from './types';
import { useSmartGestisciModalState } from './useSmartGestisciModalState';
import { useSmartGestisciModalHandlers } from './useSmartGestisciModalHandlers';
import { useTotalConfermato, useValoreConfermato, useWineProducer } from './selectors';
import { SmartGestisciModalView } from './SmartGestisciModal.view';

export default function SmartGestisciModal(props: SmartGestisciModalProps) {
  const {
    isOpen,
    onClose,
    onConfirm,
    onArchive,
    ordineId,
    fornitore,
    dettagli
  } = props;

  // State management
  const {
    modifiedQuantities,
    setModifiedQuantities,
    showQuantityModal,
    setShowQuantityModal,
    editingItem,
    setEditingItem,
    showConfirmArchive,
    setShowConfirmArchive
  } = useSmartGestisciModalState(isOpen, dettagli);

  // Handlers
  const {
    handleQuantityClick,
    handleQuantityConfirm: handleQuantityConfirmBase,
    handleQuantityCancel,
    handleConfirm,
    handleConfirmArchive,
    handleCancelArchive,
    handleCancel
  } = useSmartGestisciModalHandlers({
    dettagli,
    modifiedQuantities,
    setModifiedQuantities,
    setShowQuantityModal,
    setEditingItem,
    setShowConfirmArchive,
    onClose,
    onConfirm,
    onArchive
  });

  // Wrapper per handleQuantityConfirm che passa editingItem
  const handleQuantityConfirm = (newQuantity: number) => {
    handleQuantityConfirmBase(newQuantity, editingItem);
  };

  // Derived values
  const totalConfermato = useTotalConfermato(dettagli, modifiedQuantities);
  const valoreConfermato = useValoreConfermato(dettagli, modifiedQuantities);
  const getWineProducer = useWineProducer();

  return (
    <SmartGestisciModalView
      {...props}
      modifiedQuantities={modifiedQuantities}
      showQuantityModal={showQuantityModal}
      editingItem={editingItem}
      showConfirmArchive={showConfirmArchive}
      totalConfermato={totalConfermato}
      valoreConfermato={valoreConfermato}
      getWineProducer={getWineProducer}
      handleQuantityClick={handleQuantityClick}
      handleQuantityConfirm={handleQuantityConfirm}
      handleQuantityCancel={handleQuantityCancel}
      handleConfirm={handleConfirm}
      handleConfirmArchive={handleConfirmArchive}
      handleCancelArchive={handleCancelArchive}
      handleCancel={handleCancel}
    />
  );
}

// Re-export types for compatibility
export type { SmartGestisciModalProps, DettaglioOrdine } from './types';
