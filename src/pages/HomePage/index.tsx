import React from 'react';
import { useNavigate } from 'react-router-dom';

import { useWines } from '../../hooks/useWinesOffline';
import { useCarrelloOrdini } from '../../hooks/useCarrelloOrdini';
import { useNuovoOrdine } from '../../hooks/useNuovoOrdine';
import { useOrdersPinGate } from '../../hooks/useOrdersPinGate';

import { useHomeState } from './hooks/useHomeState';
import { useHomeSelectors } from './hooks/useHomeSelectors';
import { useHomeHandlers } from './hooks/useHomeHandlers';

import { Header } from './components/Header';
import { WineList } from './components/WineList';
import { NavBar } from './components/NavBar';
import { ModalsManager } from './modals/ModalsManager';

export default function HomePage() {
  const navigate = useNavigate();
  const {
    wines,
    suppliers,
    loading,
    error,
    refreshWines,
    updateWineInventory,
    updateWine
  } = useWines();

  // Stato locale consolidato
  const {
    isAuthenticated,
    user,
    isAdmin,
    isMobileDevice,
    filters,
    setFilters,
    selectedWine,
    setSelectedWine,
    showFilterModal,
    setShowFilterModal,
    showWineDetailsModal,
    setShowWineDetailsModal,
    activeTab,
    setActiveTab,
    animatingInventory,
    setAnimatingInventory,
    showInventoryModal,
    setShowInventoryModal,
    editingWine,
    setEditingWine
  } = useHomeState();

  // Hook per gestire il modale Nuovo Ordine
  const {
    isNuovoOrdineModalOpen,
    openNuovoOrdineModal,
    closeNuovoOrdineModal,
    handleAvanti
  } = useNuovoOrdine();

  // Hook per gestire il modale Carrello Ordini
  const {
    isCarrelloModalOpen,
    openCarrelloModal,
    closeCarrelloModal,
    handleNuovoOrdine,
    handleGestisciOrdini
  } = useCarrelloOrdini({ onNuovoOrdine: openNuovoOrdineModal });

  // Hook per gestire il PIN gate degli ordini
  const {
    isOrdersUnlocked,
    isPinModalOpen,
    openPinModal,
    closePinModal,
    validatePin,
    unlock
  } = useOrdersPinGate();

  // Selettori e derive memoizzate
  const { chipDisplayText, filteredWines, wineSearch } = useHomeSelectors(
    wines, 
    activeTab, 
    filters
  );

  // Handlers memoizzati
  const {
    handleCarrelloClick,
    handleValidPin,
    handleWineClick,
    handleTabChange,
    handleUpdateWine,
    handleOpenInventoryModal,
    handleCloseInventoryModal,
    handleConfirmInventory
  } = useHomeHandlers({
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
  });

  // Early returns per stati di caricamento
  if (!isAuthenticated) return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center">
      <p className="text-app-text">Effettua l'accesso per vedere i tuoi vini</p>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-app-accent"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center">
      <div className="text-center">
        <p className="text-app-danger mb-4">{error}</p>
        <button onClick={refreshWines} className="bg-app-accent hover:bg-app-accent/80 text-white px-4 py-2 rounded-lg">
          Riprova
        </button>
      </div>
    </div>
  );

  return (
    <div className="homepage-container" style={{ 
      width: '100vw',
      height: '100vh',
      maxWidth: '100%',
      overflow: 'hidden',
      position: 'relative',
      background: 'var(--bg)'
    }}>
      <Header />
      
      <WineList
        filteredWines={filteredWines}
        wines={wines}
        animatingInventory={animatingInventory}
        wineSearch={wineSearch}
        onWineClick={handleWineClick}
        onOpenInventoryModal={handleOpenInventoryModal}
      />

      <NavBar
        filters={filters}
        setFilters={setFilters}
        setShowFilterModal={setShowFilterModal}
        activeTab={activeTab}
        chipDisplayText={chipDisplayText}
        wineSearch={wineSearch}
        onCarrelloClick={handleCarrelloClick}
        onTabChange={handleTabChange}
        onRefreshWines={refreshWines}
      />

      <ModalsManager
        showFilterModal={showFilterModal}
        setShowFilterModal={setShowFilterModal}
        filters={filters}
        setFilters={setFilters}
        wines={wines}
        selectedWine={selectedWine}
        showWineDetailsModal={showWineDetailsModal}
        setShowWineDetailsModal={setShowWineDetailsModal}
        suppliers={suppliers}
        onUpdateWine={handleUpdateWine}
        showInventoryModal={showInventoryModal}
        editingWine={editingWine}
        onConfirmInventory={handleConfirmInventory}
        onCloseInventoryModal={handleCloseInventoryModal}
        isCarrelloModalOpen={isCarrelloModalOpen}
        closeCarrelloModal={closeCarrelloModal}
        handleNuovoOrdine={handleNuovoOrdine}
        handleGestisciOrdini={handleGestisciOrdini}
        isNuovoOrdineModalOpen={isNuovoOrdineModalOpen}
        closeNuovoOrdineModal={closeNuovoOrdineModal}
        handleAvanti={handleAvanti}
        isPinModalOpen={isPinModalOpen}
        closePinModal={closePinModal}
        handleValidPin={handleValidPin}
        validatePin={validatePin}
      />
    </div>
  );
}
