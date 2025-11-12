/**
 * WINES HOOK REFACTORED - WINENODE
 * 
 * Hook principale composto dai moduli specializzati.
 * Governance: Max 200 righe per file.
 */

import { useEffect } from 'react';
import { useWinesData, WineType } from './useWinesData';
import { useWinesOperations } from './useWinesOperations';
import { useWinesInventory } from './useWinesInventory';
import { useWinesRealtime } from './useWinesRealtime';
import { useRealtimeGiacenza } from './useRealtimeGiacenza';
import { useRealtimeVini } from './useRealtimeVini';

interface UseWinesReturn {
  wines: WineType[];
  suppliers: string[];
  loading: boolean;
  error: string | null;
  refreshWines: () => Promise<void>;
  updateWineInventory: (id: string, newInventory: number) => Promise<boolean>;
  updateMultipleWineInventories: (updates: Array<{id: string, newInventory: number}>) => Promise<boolean>;
  updateWineMinStock: (wineId: string, minStock: number) => Promise<boolean>;
  updateWine: (wineId: string, updates: Partial<WineType>) => Promise<boolean>;
  refetchGiacenzaById: (giacenzaId: string) => Promise<any>;
  refetchGiacenzaByVinoId: (vinoId: string) => Promise<any>;
  realtimeConnected: boolean;
  realtimeSubscribed: boolean;
}

const useWines = (): UseWinesReturn => {
  // Feature flags per realtime
  const realtimeGiacenzeEnabled = import.meta.env.VITE_REALTIME_GIACENZE_ENABLED === 'true';
  const realtimeViniEnabled = import.meta.env.VITE_REALTIME_VINI_ENABLED === 'true';
  const refreshOnFocusEnabled = import.meta.env.VITE_REFRESH_ON_FOCUS_ENABLED === 'true';

  // Hook base per data management
  const dataHook = useWinesData();

  // Hook per operazioni refetch
  const operationsHook = useWinesOperations({
    wines: dataHook.wines,
    setWines: dataHook.setWines
  });

  // Hook per gestione realtime
  const realtimeHook = useWinesRealtime({
    wines: dataHook.wines,
    setWines: dataHook.setWines,
    refetchGiacenzaById: operationsHook.refetchGiacenzaById,
    realtimeGiacenzeEnabled
  });

  // Hook per gestione inventory
  const inventoryHook = useWinesInventory({
    wines: dataHook.wines,
    setWines: dataHook.setWines,
    refetchGiacenzaById: operationsHook.refetchGiacenzaById,
    refetchGiacenzaByVinoId: operationsHook.refetchGiacenzaByVinoId,
    markUpdatePending: realtimeHook.markUpdatePending,
    realtimeGiacenzeEnabled
  });

  // Hook realtime per giacenze (se abilitato)
  const realtimeGiacenzaHook = useRealtimeGiacenza({
    enabled: realtimeGiacenzeEnabled,
    onInsert: realtimeHook.handleRealtimeInsert,
    onUpdate: realtimeHook.handleRealtimeUpdate,
    onDelete: realtimeHook.handleRealtimeDelete
  });

  // Hook realtime per vini (se abilitato)
  const realtimeViniHook = useRealtimeVini({
    enabled: realtimeViniEnabled,
    onExternalChange: () => {
      if (import.meta.env.DEV) {
        console.log('🔄 Realtime change detected on vini table');
      }
      // Refresh completo per semplicità
      dataHook.refreshWines();
    }
  });

  // Effect per refresh on focus (se abilitato)
  useEffect(() => {
    if (!refreshOnFocusEnabled) return;

    const handleFocus = () => {
      if (import.meta.env.DEV) {
        console.log('🔄 Window focus detected, refreshing wines...');
      }
      dataHook.refreshWines();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshOnFocusEnabled, dataHook.refreshWines]);

  // Determina status realtime
  const realtimeConnected = realtimeGiacenzeEnabled 
    ? realtimeGiacenzaHook.isConnected 
    : false;
  
  const realtimeSubscribed = realtimeGiacenzeEnabled 
    ? realtimeGiacenzaHook.isSubscribed 
    : false;

  return {
    // Data state
    wines: dataHook.wines,
    suppliers: dataHook.suppliers,
    loading: dataHook.loading,
    error: dataHook.error,
    
    // Operations
    refreshWines: dataHook.refreshWines,
    updateWineInventory: inventoryHook.updateWineInventory,
    updateMultipleWineInventories: inventoryHook.updateMultipleWineInventories,
    updateWineMinStock: inventoryHook.updateWineMinStock,
    updateWine: inventoryHook.updateWine,
    refetchGiacenzaById: operationsHook.refetchGiacenzaById,
    refetchGiacenzaByVinoId: operationsHook.refetchGiacenzaByVinoId,
    
    // Realtime status
    realtimeConnected,
    realtimeSubscribed
  };
};

export default useWines;
export { useWines };
export type { WineType };
