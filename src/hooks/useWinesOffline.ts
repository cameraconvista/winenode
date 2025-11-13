/**
 * WINES HOOK OFFLINE-READY REFACTORED - WINENODE
 * 
 * Wrapper del hook useWines esistente che aggiunge funzionalità offline.
 * Mantiene API identica per compatibilità totale con componenti esistenti.
 * Governance: Max 200 righe per file - REFACTORED.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWines as useWinesOriginal, WineType } from './useWines';
import { useNetworkStatus } from './useNetworkStatus';
import { useOfflineSync } from './useOfflineSyncClean';
import { useOfflineCache } from './useOfflineCache';
import { useOfflineOperations } from './useOfflineOperations';

interface UseWinesOfflineReturn {
  // API identica al hook originale
  wines: WineType[];
  suppliers: string[];
  loading: boolean;
  error: string | null;
  
  // Metodi originali
  refreshWines: () => Promise<void>;
  updateWineInventory: (wineId: string, newInventory: number) => Promise<boolean>;
  updateMultipleWineInventories: (updates: Array<{id: string, newInventory: number}>) => Promise<boolean>;
  updateWineMinStock: (wineId: string, minStock: number) => Promise<boolean>;
  updateWine: (wineId: string, updates: Partial<WineType>) => Promise<boolean>;
  refetchGiacenzaById: (giacenzaId: string) => Promise<any>;
  refetchGiacenzaByVinoId: (vinoId: string) => Promise<any>;
  
  // Realtime status
  realtimeConnected: boolean;
  realtimeSubscribed: boolean;
  
  // Nuove funzionalità offline (opzionali)
  isUsingCache: boolean;
  lastCacheUpdate: Date | null;
  cacheStats: {
    winesHitRate: number;
    suppliersHitRate: number;
    lastSync: Date | null;
  };
  
  // Metodi offline
  forceCacheRefresh: () => Promise<void>;
  clearOfflineCache: () => void;
}

/**
 * Hook principale per gestione vini con supporto offline
 */
export const useWines = (): UseWinesOfflineReturn => {
  // Hook originale (mantenuto per compatibilità)
  const originalHook = useWinesOriginal();
  
  // Network status
  const { isOnline } = useNetworkStatus();
  
  // State per sync progress
  const [syncInProgress, setSyncInProgress] = useState(false);
  
  // Refs per stabilizzare callbacks e evitare loop infinito
  const refreshWinesRef = useRef(originalHook.refreshWines);
  refreshWinesRef.current = originalHook.refreshWines;
  
  // Hook per gestione cache offline
  const cacheHook = useOfflineCache({
    originalWines: originalHook.wines,
    originalSuppliers: originalHook.suppliers,
    isOnline,
    originalRefreshWines: originalHook.refreshWines
  });
  
  // Hook per operazioni offline - FIX: Usa versione sincrona per evitare conflitto con optimistic UI
  const operationsHook = useOfflineOperations({
    isOnline,
    originalUpdateWineInventory: originalHook.updateWineInventorySync, // FIX: Usa versione sincrona
    internalWines: cacheHook.internalWines,
    setInternalWines: cacheHook.setInternalWines
  });
  
  // Callbacks stabilizzati con useCallback
  const onSyncStart = useCallback(() => {
    setSyncInProgress(true);
  }, []);
  
  const onSyncComplete = useCallback((successCount: number, errorCount: number) => {
    setSyncInProgress(false);
    if (import.meta.env.DEV) {
      console.log(`Sync completed: ${successCount} success, ${errorCount} errors`);
    }
    // FIX CRITICO: NON fare refresh dopo sync - sovrascrive le modifiche offline!
    // Le modifiche sono già state sincronizzate sul server, mantieni lo stato locale
    if (successCount > 0) {
      if (import.meta.env.DEV) {
        console.log(`✅ Sync successful, keeping local state (${successCount} operations)`);
      }
      // Solo aggiorna flag cache senza refresh
      cacheHook.setIsUsingCache(false);
    }
  }, [cacheHook]);
  
  const onSyncError = useCallback((error: Error) => {
    setSyncInProgress(false);
    console.error('Sync error:', error);
  }, []);

  // Auto-sync hook con callbacks stabilizzati
  const { syncPendingOperations } = useOfflineSync({
    isOnline,
    onSyncStart,
    onSyncComplete,
    onSyncError
  });
  
  // Ref per debounce sync trigger
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Effect per gestione cambio stato rete - FIX: Debounced per production
  useEffect(() => {
    // Clear previous timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    if (isOnline && cacheHook.isUsingCache) {
      // Debounce sync trigger per evitare chiamate multiple in production
      syncTimeoutRef.current = setTimeout(() => {
        syncPendingOperations().catch(error => {
          console.warn('Auto-sync failed after reconnection:', error);
        });
      }, 5000); // Aumentato a 5s per stabilità production
    }
    
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [isOnline, cacheHook.isUsingCache, syncPendingOperations]);
  
  // Sincronizza internalWines con originalWines quando disponibili
  useEffect(() => {
    if (originalHook.wines.length > 0 && cacheHook.internalWines.length === 0) {
      if (import.meta.env.DEV) {
        console.log(`Initializing internalWines with ${originalHook.wines.length} items`);
      }
      cacheHook.setInternalWines(originalHook.wines);
      cacheHook.setInternalSuppliers(originalHook.suppliers);
    }
  }, [originalHook.wines, originalHook.suppliers, cacheHook]);

  // Determina se stiamo usando dati cached
  useEffect(() => {
    if (!isOnline) {
      // Logica per determinare se abbiamo cache disponibile
      // Implementazione semplificata per ora
      cacheHook.setIsUsingCache(cacheHook.internalWines.length > 0);
    }
  }, [isOnline, cacheHook]);
  
  return {
    // API identica al hook originale - FIX RACE CONDITION: Priorità internalWines se aggiornato
    wines: (cacheHook.isUsingCache || cacheHook.internalWines.length > 0) ? cacheHook.internalWines : originalHook.wines,
    suppliers: (cacheHook.isUsingCache || cacheHook.internalSuppliers.length > 0) ? cacheHook.internalSuppliers : originalHook.suppliers,
    loading: originalHook.loading || syncInProgress,
    error: originalHook.error,
    
    // Metodi originali (con enhancement offline)
    refreshWines: cacheHook.refreshWinesWithCache,
    updateWineInventory: operationsHook.updateInventoryOffline,
    updateMultipleWineInventories: originalHook.updateMultipleWineInventories,
    updateWineMinStock: originalHook.updateWineMinStock,
    updateWine: originalHook.updateWine,
    refetchGiacenzaById: originalHook.refetchGiacenzaById,
    refetchGiacenzaByVinoId: originalHook.refetchGiacenzaByVinoId,
    
    // Realtime status
    realtimeConnected: originalHook.realtimeConnected,
    realtimeSubscribed: originalHook.realtimeSubscribed,
    
    // Nuove funzionalità offline
    isUsingCache: cacheHook.isUsingCache,
    lastCacheUpdate: cacheHook.lastCacheUpdate,
    cacheStats: cacheHook.cacheStats,
    
    // Metodi offline
    forceCacheRefresh: cacheHook.forceCacheRefresh,
    clearOfflineCache: cacheHook.clearOfflineCache
  };
};

// Re-export del tipo per compatibilità
export type { WineType };
