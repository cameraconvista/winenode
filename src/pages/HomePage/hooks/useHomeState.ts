import { useState, useEffect } from 'react';
import { WineType } from '../../../hooks/useWines';

export interface HomeFilters {
  wineType: string;
  supplier: string;
  showAlertsOnly: boolean;
}

export function useHomeState() {
  // Stato autenticazione (sempre true per questa app)
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // App senza autenticazione - sempre autenticato
    setIsAuthenticated(true);
  }, []);

  // Stato filtri e UI
  const [filters, setFilters] = useState<HomeFilters>({ 
    wineType: '', 
    supplier: '', 
    showAlertsOnly: false 
  });
  
  const [selectedWine, setSelectedWine] = useState<WineType | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showWineDetailsModal, setShowWineDetailsModal] = useState(false);
  const [activeTab, setActiveTab] = useState("TUTTI I VINI");
  const [animatingInventory, setAnimatingInventory] = useState<string | null>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [editingWine, setEditingWine] = useState<WineType | null>(null);

  return {
    // Stato autenticazione
    isAuthenticated,
    
    // Stato filtri
    filters,
    setFilters,
    
    // Stato UI
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
  };
}
