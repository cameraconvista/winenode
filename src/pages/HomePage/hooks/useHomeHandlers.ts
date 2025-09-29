import { useCallback } from 'react';
import { WineType } from '../../../hooks/useWines';

interface UseHomeHandlersProps {
  // Handlers esterni
  updateWineInventory: (id: string, value: number) => Promise<boolean>;
  refreshWines: () => Promise<void>;
  updateWine: (id: string, updates: Partial<WineType>) => Promise<void>;
  
  // State setters
  setSelectedWine: (wine: WineType | null) => void;
  setShowWineDetailsModal: (show: boolean) => void;
  setActiveTab: (tab: string) => void;
  setAnimatingInventory: (id: string | null) => void;
  setEditingWine: (wine: WineType | null) => void;
  setShowInventoryModal: (show: boolean) => void;
  
  // Hooks esterni
  isOrdersUnlocked: boolean;
  openCarrelloModal: () => void;
  openPinModal: () => void;
  unlock: () => void;
  
  // Stato
  wines: WineType[];
  editingWine: WineType | null;
}

export function useHomeHandlers({
  updateWineInventory,
  refreshWines,
  updateWine,
  setSelectedWine,
  setShowWineDetailsModal,
  setActiveTab,
  setAnimatingInventory,
  setEditingWine,
  setShowInventoryModal,
  isOrdersUnlocked,
  openCarrelloModal,
  openPinModal,
  unlock,
  wines,
  editingWine
}: UseHomeHandlersProps) {

  // Memoizza handlers per performance
  const handleCarrelloClick = useCallback(() => {
    if (isOrdersUnlocked) {
      openCarrelloModal();
    } else {
      openPinModal();
    }
  }, [isOrdersUnlocked, openCarrelloModal, openPinModal]);

  const handleValidPin = useCallback(() => {
    unlock();
    openCarrelloModal();
  }, [unlock, openCarrelloModal]);

  const handleInventoryChange = useCallback(async (id: string, value: number) => {
    const adjusted = Math.max(0, value);
    console.log('🔄 Aggiornamento giacenza:', id, 'da', wines.find(w => w.id === id)?.inventory, 'a', adjusted);

    // Aggiornamento ottimistico per feedback immediato
    const previousInventory = wines.find(w => w.id === id)?.inventory || 0;

    const success = await updateWineInventory(id, adjusted);
    if (success) {
      console.log('✅ Giacenza salvata correttamente su Supabase');
      // Trigger animation feedback
      setAnimatingInventory(id);
      setTimeout(() => setAnimatingInventory(null), 600);
    } else {
      console.error('❌ Errore aggiornamento giacenza - rollback a:', previousInventory);
      // In caso di errore, forza il refresh per sincronizzare
      await refreshWines();
    }
  }, [wines, updateWineInventory, refreshWines, setAnimatingInventory]);

  const handleWineClick = useCallback((wine: WineType) => {
    setSelectedWine(wine);
    setShowWineDetailsModal(true);
  }, [setSelectedWine, setShowWineDetailsModal]);

  const handleTabChange = useCallback((category: string) => {
    setActiveTab(category);
  }, [setActiveTab]);

  const handleUpdateWine = useCallback(async (id: string, updates: Partial<WineType>): Promise<void> => {
    try {
      await updateWine(id, updates);
    } catch (error) {
      console.error('❌ Errore aggiornamento vino:', error);
    }
  }, [updateWine]);

  // Memoizza handlers modali
  const handleOpenInventoryModal = useCallback((wine: WineType) => {
    setEditingWine(wine);
    setShowInventoryModal(true);
  }, [setEditingWine, setShowInventoryModal]);

  const handleCloseInventoryModal = useCallback(() => {
    setShowInventoryModal(false);
    setEditingWine(null);
  }, [setShowInventoryModal, setEditingWine]);

  const handleConfirmInventory = useCallback(async (newValue: number) => {
    if (!editingWine) return;
    
    // Chiudi modale immediatamente per UX fluida
    handleCloseInventoryModal();
    
    // Animazione di conferma
    setAnimatingInventory(editingWine.id);
    
    try {
      await updateWineInventory(editingWine.id, newValue);
      console.log('✅ Giacenza aggiornata con successo');
    } catch (error) {
      console.error('❌ Errore aggiornamento giacenza:', error);
    } finally {
      // Rimuovi animazione dopo 1 secondo
      setTimeout(() => setAnimatingInventory(null), 1000);
    }
  }, [editingWine, handleCloseInventoryModal, updateWineInventory, setAnimatingInventory]);

  return {
    handleCarrelloClick,
    handleValidPin,
    handleInventoryChange,
    handleWineClick,
    handleTabChange,
    handleUpdateWine,
    handleOpenInventoryModal,
    handleCloseInventoryModal,
    handleConfirmInventory
  };
}
