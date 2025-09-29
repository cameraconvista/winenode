import React, { memo } from 'react';
import FilterModal from '../../../components/FilterModal';
import WineDetailsModal from '../../../components/WineDetailsModal';
import HomeInventoryModal from '../../../components/HomeInventoryModal';
import CarrelloOrdiniModal from '../../../components/modals/CarrelloOrdiniModal';
import NuovoOrdineModal from '../../../components/modals/NuovoOrdineModal';
import OrdersPinModal from '../../../components/security/OrdersPinModal';
import { WineType } from '../../../hooks/useWines';
import { HomeFilters } from '../hooks/useHomeState';

interface ModalsManagerProps {
  // Filter Modal
  showFilterModal: boolean;
  setShowFilterModal: (show: boolean) => void;
  filters: HomeFilters;
  setFilters: React.Dispatch<React.SetStateAction<HomeFilters>>;
  wines: WineType[];
  
  // Wine Details Modal
  selectedWine: WineType | null;
  showWineDetailsModal: boolean;
  setShowWineDetailsModal: (show: boolean) => void;
  suppliers: string[];
  onUpdateWine: (id: string, updates: Partial<WineType>) => Promise<void>;
  
  // Inventory Modal
  showInventoryModal: boolean;
  editingWine: WineType | null;
  onConfirmInventory: (newValue: number) => Promise<void>;
  onCloseInventoryModal: () => void;
  
  // Carrello Modal
  isCarrelloModalOpen: boolean;
  closeCarrelloModal: () => void;
  handleNuovoOrdine: () => void;
  handleGestisciOrdini: () => void;
  
  // Nuovo Ordine Modal
  isNuovoOrdineModalOpen: boolean;
  closeNuovoOrdineModal: () => void;
  handleAvanti: () => void;
  
  // PIN Modal
  isPinModalOpen: boolean;
  closePinModal: () => void;
  handleValidPin: () => void;
  validatePin: (pin: string) => boolean;
}

export const ModalsManager = memo(function ModalsManager({
  showFilterModal,
  setShowFilterModal,
  filters,
  setFilters,
  wines,
  selectedWine,
  showWineDetailsModal,
  setShowWineDetailsModal,
  suppliers,
  onUpdateWine,
  showInventoryModal,
  editingWine,
  onConfirmInventory,
  onCloseInventoryModal,
  isCarrelloModalOpen,
  closeCarrelloModal,
  handleNuovoOrdine,
  handleGestisciOrdini,
  isNuovoOrdineModalOpen,
  closeNuovoOrdineModal,
  handleAvanti,
  isPinModalOpen,
  closePinModal,
  handleValidPin,
  validatePin
}: ModalsManagerProps) {
  return (
    <>
      <FilterModal 
        open={showFilterModal} 
        onOpenChange={setShowFilterModal} 
        filters={filters} 
        onFiltersChange={setFilters}
        wines={wines}
      />
      
      <WineDetailsModal 
        wine={selectedWine} 
        open={showWineDetailsModal} 
        onOpenChange={setShowWineDetailsModal} 
        onUpdateWine={onUpdateWine} 
        suppliers={suppliers} 
      />

      <HomeInventoryModal
        isOpen={showInventoryModal}
        initialValue={editingWine?.inventory || 0}
        onConfirm={onConfirmInventory}
        onCancel={onCloseInventoryModal}
        min={0}
        max={999}
      />

      <CarrelloOrdiniModal
        isOpen={isCarrelloModalOpen}
        onOpenChange={closeCarrelloModal}
        onNuovoOrdine={handleNuovoOrdine}
        onGestisciOrdini={handleGestisciOrdini}
      />

      <NuovoOrdineModal
        isOpen={isNuovoOrdineModalOpen}
        onOpenChange={closeNuovoOrdineModal}
        onAvanti={handleAvanti}
      />

      <OrdersPinModal
        open={isPinModalOpen}
        onClose={closePinModal}
        onValidPin={handleValidPin}
        onInvalidPin={() => {}} // Gestito internamente dal modale
        validatePin={validatePin}
      />
    </>
  );
});
