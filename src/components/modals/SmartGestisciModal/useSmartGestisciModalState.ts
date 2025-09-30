import { useState, useEffect } from 'react';
import { DettaglioOrdine, EditingItem } from './types';

export function useSmartGestisciModalState(isOpen: boolean, dettagli: DettaglioOrdine[]) {
  const [modifiedQuantities, setModifiedQuantities] = useState<Record<number, number>>({});
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [showConfirmArchive, setShowConfirmArchive] = useState(false);

  // Inizializza quantità modificate quando si apre il modale
  useEffect(() => {
    if (isOpen) {
      const initialQuantities = dettagli.reduce((acc, dettaglio, index) => {
        acc[index] = dettaglio.quantity;
        return acc;
      }, {} as Record<number, number>);
      setModifiedQuantities(initialQuantities);
    }
  }, [isOpen, dettagli]);

  return {
    modifiedQuantities,
    setModifiedQuantities,
    showQuantityModal,
    setShowQuantityModal,
    editingItem,
    setEditingItem,
    showConfirmArchive,
    setShowConfirmArchive
  };
}
