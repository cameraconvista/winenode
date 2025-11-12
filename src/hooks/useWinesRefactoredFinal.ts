/**
 * WINES HOOK REFACTORED FINAL - WINENODE
 * 
 * Hook principale completamente refactored con architettura modulare.
 * Governance: Max 200 righe per file.
 */

import { useState, useEffect } from 'react';
import { useRealtimeGiacenza } from './useRealtimeGiacenza';
import { useRealtimeVini } from './useRealtimeVini';
import { useWinesHelpers } from './useWinesHelpers';
import { useWinesRealtimeHandlers } from './useWinesRealtimeHandlers';
import { useWinesDataManagement } from './useWinesDataManagement';
import { useWinesInventoryOperations } from './useWinesInventoryOperations';

export interface WineType {
  id: string;
  name: string;
  type: string;
  supplier: string;
  inventory: number;
  minStock: number;
  price: string;
  cost?: number;
  vintage: string | null;
  region: string | null;
  description: string | null;
  // Campi per optimistic locking con PK giacenza
  giacenza_id?: string;
  inventoryVersion?: number;
  inventoryUpdatedAt?: string;
}

const useWines = () => {
  const [wines, setWines] = useState<WineType[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Feature flags per realtime
  const realtimeGiacenzeEnabled = import.meta.env.VITE_REALTIME_GIACENZE_ENABLED === 'true';
  const realtimeViniEnabled = import.meta.env.VITE_REALTIME_VINI_ENABLED === 'true';
  const refreshOnFocusEnabled = import.meta.env.VITE_REFRESH_ON_FOCUS_ENABLED === 'true';
  
  // Log feature flags (solo in dev)
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug('🔧 Feature flags:', {
        realtimeGiacenze: realtimeGiacenzeEnabled,
        realtimeVini: realtimeViniEnabled,
        refreshOnFocus: refreshOnFocusEnabled
      });
    }
  }, []);

  // MODULI REFACTORED
  const { refetchGiacenzaById, refetchGiacenzaByVinoId } = useWinesHelpers({
    wines,
    setWines
  });

  const { handleRealtimeInsert, handleRealtimeUpdate, handleRealtimeDelete, markUpdatePending } = useWinesRealtimeHandlers({
    wines,
    setWines,
    refetchGiacenzaById,
    realtimeGiacenzeEnabled
  });

  const { fetchWines, ensureGiacenzaRecords } = useWinesDataManagement({
    wines,
    setWines,
    setSuppliers,
    setLoading,
    setError
  });

  const { updateWineInventory, updateMultipleWineInventories, updateWineMinStock, updateWine } = useWinesInventoryOperations({
    wines,
    setWines,
    refetchGiacenzaById,
    refetchGiacenzaByVinoId,
    markUpdatePending,
    realtimeGiacenzeEnabled
  });

  // Hook realtime per giacenze (se abilitato)
  const { isConnected: realtimeConnected, isSubscribed: realtimeSubscribed } = useRealtimeGiacenza({
    enabled: realtimeGiacenzeEnabled,
    onInsert: handleRealtimeInsert,
    onUpdate: handleRealtimeUpdate,
    onDelete: handleRealtimeDelete
  });

  // Hook realtime per vini (se abilitato)
  useRealtimeVini({
    enabled: realtimeViniEnabled,
    onExternalChange: fetchWines
  });

  // Caricamento iniziale
  useEffect(() => {
    fetchWines();
  }, [fetchWines]);

  // Effect per refresh on focus (se abilitato)
  useEffect(() => {
    if (!refreshOnFocusEnabled) return;

    const handleFocus = () => {
      if (import.meta.env.DEV) {
        console.log('🔄 Window focus detected, refreshing wines...');
      }
      fetchWines();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshOnFocusEnabled, fetchWines]);

  return {
    wines,
    suppliers,
    loading,
    error,
    refreshWines: fetchWines,
    updateWineInventory,
    updateMultipleWineInventories,
    updateWineMinStock,
    updateWine,
    refetchGiacenzaById,
    refetchGiacenzaByVinoId,
    // Realtime status
    realtimeConnected: realtimeGiacenzeEnabled ? realtimeConnected : false,
    realtimeSubscribed: realtimeGiacenzeEnabled ? realtimeSubscribed : false
  };
};

export default useWines;
