/**
 * WINES HOOK OFFLINE-READY - WINENODE
 * 
 * Wrapper del hook useWines esistente che aggiunge funzionalità offline.
 * Mantiene API identica per compatibilità totale con componenti esistenti.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWines as useWinesOriginal, WineType } from './useWines';
import { offlineCache, CACHE_TTL } from '../lib/offlineCache';
import { useNetworkStatus } from './useNetworkStatus';
import { useOfflineSync } from './useOfflineSyncClean';
import { offlineStorage } from '../lib/offlineStorage';

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
  const { isOnline, queueOperation } = useNetworkStatus();
  
  // Refs per stabilizzare callbacks e evitare loop infinito
  const refreshWinesRef = useRef(originalHook.refreshWines);
  refreshWinesRef.current = originalHook.refreshWines;
  
  // Callbacks stabilizzati con useCallback
  const onSyncStart = useCallback(() => {
    setSyncInProgress(true);
  }, []);
  
  const onSyncComplete = useCallback((successCount: number, errorCount: number) => {
    setSyncInProgress(false);
    if (import.meta.env.DEV) {
      console.log(`Sync completed: ${successCount} success, ${errorCount} errors`);
    }
    // Refresh data dopo sync - usando ref per evitare dependency loop
    if (successCount > 0) {
      setTimeout(() => {
        refreshWinesRef.current();
      }, 100); // Piccolo delay per evitare race conditions
    }
  }, []);
  
  const onSyncError = useCallback((error: Error) => {
    setSyncInProgress(false);
    console.error('Sync error:', error);
  }, []);

  // Auto-sync hook con callbacks stabilizzati
  const { syncPendingOperations, getSyncStats } = useOfflineSync({
    isOnline,
    onSyncStart,
    onSyncComplete,
    onSyncError
  });
  
  // State per funzionalità offline
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [lastCacheUpdate, setLastCacheUpdate] = useState<Date | null>(null);
  const [cacheStats, setCacheStats] = useState({
    winesHitRate: 0,
    suppliersHitRate: 0,
    lastSync: null as Date | null
  });
  
  // State interno per gestione offline
  const [internalWines, setInternalWines] = useState<WineType[]>([]);
  const [internalSuppliers, setInternalSuppliers] = useState<string[]>([]);
  const [syncInProgress, setSyncInProgress] = useState(false);
  
  // Refs per gestione cache
  const cacheKeysRef = useRef({
    wines: 'wines_catalog',
    suppliers: 'suppliers_list',
    giacenze: 'giacenze_data'
  });
  
  /**
   * Refresh vini con supporto cache offline
   */
  const refreshWinesWithCache = useCallback(async (): Promise<void> => {
    try {
      // Se online, prova refresh normale prima
      if (isOnline) {
        try {
          await originalHook.refreshWines();
          
          // Se successo, aggiorna cache
          if (originalHook.wines.length > 0) {
            offlineCache.set(cacheKeysRef.current.wines, originalHook.wines, CACHE_TTL.vini);
            offlineCache.set(cacheKeysRef.current.suppliers, originalHook.suppliers, CACHE_TTL.fornitori);
            
            setLastCacheUpdate(new Date());
            setIsUsingCache(false);
            
            if (import.meta.env.DEV) {
              console.log(`Wines cached: ${originalHook.wines.length} items`);
            }
          }
          
          return;
        } catch (networkError) {
          if (import.meta.env.DEV) {
            console.warn('Network refresh failed, trying cache fallback:', networkError);
          }
        }
      }
      
      // Fallback su cache se offline o errore rete
      const cachedWines = offlineCache.get<WineType[]>(cacheKeysRef.current.wines);
      const cachedSuppliers = offlineCache.get<string[]>(cacheKeysRef.current.suppliers);
      
      if (cachedWines && cachedSuppliers) {
        // ← FIX CRITICO: Aggiorna state interno invece di solo flag
        setInternalWines(cachedWines);
        setInternalSuppliers(cachedSuppliers);
        setIsUsingCache(true);
        
        if (import.meta.env.DEV) {
          console.log(`Using cached wines: ${cachedWines.length} items (offline mode)`);
        }
      } else {
        // Nessun cache disponibile
        if (!isOnline) {
          throw new Error('Nessuna connessione e nessun dato in cache disponibile');
        }
      }
      
    } catch (error) {
      console.error('Failed to refresh wines (online + cache):', error);
      throw error;
    }
  }, [isOnline, originalHook]);
  
  /**
   * Update inventory con supporto offline
   */
  const updateInventoryOffline = useCallback(async (
    wineId: string, 
    newInventory: number
  ): Promise<boolean> => {
    try {
      // Se online, prova update normale
      if (isOnline) {
        const success = await originalHook.updateWineInventory(wineId, newInventory);
        
        if (success) {
          // Aggiorna cache locale
          const cachedWines = offlineCache.get<WineType[]>(cacheKeysRef.current.wines);
          if (cachedWines) {
            const updatedWines = cachedWines.map(wine => 
              wine.id === wineId 
                ? { ...wine, inventory: newInventory }
                : wine
            );
            offlineCache.set(cacheKeysRef.current.wines, updatedWines, CACHE_TTL.vini);
          }
        }
        
        return success;
      } else {
        // Offline: queue operazione per sync futuro
        const operationId = await offlineStorage.addPendingOperation({
          type: 'UPDATE_INVENTORY',
          payload: { wineId, newInventory },
          maxRetries: 3
        });
        
        // Update ottimistico in cache E state interno
        const cachedWines = offlineCache.get<WineType[]>(cacheKeysRef.current.wines);
        if (cachedWines) {
          const updatedWines = cachedWines.map(wine => 
            wine.id === wineId 
              ? { ...wine, inventory: newInventory }
              : wine
          );
          offlineCache.set(cacheKeysRef.current.wines, updatedWines, CACHE_TTL.vini);
          setInternalWines(updatedWines); // ← FIX CRITICO: Aggiorna state interno
          
          if (import.meta.env.DEV) {
            console.log(`Inventory updated offline (queued: ${operationId}): ${wineId} -> ${newInventory}`);
          }
        }
        
        return true; // Ottimistic success
      }
    } catch (error) {
      console.error('Failed to update inventory:', error);
      return false;
    }
  }, [isOnline, originalHook.updateWineInventory, queueOperation]);
  
  /**
   * Forza refresh cache da rete
   */
  const forceCacheRefresh = useCallback(async (): Promise<void> => {
    if (!isOnline) {
      throw new Error('Impossibile aggiornare cache: nessuna connessione');
    }
    
    try {
      // Invalida cache esistente
      offlineCache.invalidate(cacheKeysRef.current.wines);
      offlineCache.invalidate(cacheKeysRef.current.suppliers);
      
      // Forza refresh da rete
      await originalHook.refreshWines();
      
      // Aggiorna cache con dati freschi
      if (originalHook.wines.length > 0) {
        offlineCache.set(cacheKeysRef.current.wines, originalHook.wines, CACHE_TTL.vini);
        offlineCache.set(cacheKeysRef.current.suppliers, originalHook.suppliers, CACHE_TTL.fornitori);
        
        setLastCacheUpdate(new Date());
        setIsUsingCache(false);
        
        if (import.meta.env.DEV) {
          console.log('Cache force refreshed from network');
        }
      }
    } catch (error) {
      console.error('Failed to force refresh cache:', error);
      throw error;
    }
  }, [isOnline, originalHook]);
  
  /**
   * Pulisce cache offline
   */
  const clearOfflineCache = useCallback(() => {
    offlineCache.invalidate(cacheKeysRef.current.wines);
    offlineCache.invalidate(cacheKeysRef.current.suppliers);
    offlineCache.invalidate(cacheKeysRef.current.giacenze);
    
    setLastCacheUpdate(null);
    setIsUsingCache(false);
    
    if (import.meta.env.DEV) {
      console.log('Offline cache cleared');
    }
  }, []);
  
  // Effect per aggiornamento statistiche cache
  useEffect(() => {
    const updateCacheStats = () => {
      const stats = offlineCache.getStats();
      
      setCacheStats(prev => ({
        ...prev,
        winesHitRate: stats.hitRate,
        suppliersHitRate: stats.hitRate, // Semplificato per ora
        lastSync: lastCacheUpdate
      }));
    };
    
    // Aggiorna stats ogni 30 secondi
    const interval = setInterval(updateCacheStats, 30000);
    updateCacheStats(); // Prima volta subito
    
    return () => clearInterval(interval);
  }, [lastCacheUpdate]);
  
  // Ref per debounce sync trigger
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Effect per gestione cambio stato rete - FIX: Debounced per production
  useEffect(() => {
    // Clear previous timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    if (isOnline && isUsingCache) {
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
  }, [isOnline, isUsingCache]); // Dependency stabili
  
  // Determina se stiamo usando dati cached
  useEffect(() => {
    if (!isOnline) {
      const hasCache = offlineCache.get(cacheKeysRef.current.wines) !== null;
      setIsUsingCache(hasCache);
    }
  }, [isOnline]);
  
  return {
    // API identica al hook originale - FIX CRITICO: Usa state interno quando offline
    wines: isUsingCache ? internalWines : originalHook.wines,
    suppliers: isUsingCache ? internalSuppliers : originalHook.suppliers,
    loading: originalHook.loading || syncInProgress,
    error: originalHook.error,
    
    // Metodi originali (con enhancement offline)
    refreshWines: refreshWinesWithCache,
    updateWineInventory: updateInventoryOffline,
    updateMultipleWineInventories: originalHook.updateMultipleWineInventories,
    updateWineMinStock: originalHook.updateWineMinStock,
    updateWine: originalHook.updateWine,
    refetchGiacenzaById: originalHook.refetchGiacenzaById,
    refetchGiacenzaByVinoId: originalHook.refetchGiacenzaByVinoId,
    
    // Realtime status
    realtimeConnected: originalHook.realtimeConnected,
    realtimeSubscribed: originalHook.realtimeSubscribed,
    
    // Nuove funzionalità offline
    isUsingCache,
    lastCacheUpdate,
    cacheStats,
    
    // Metodi offline
    forceCacheRefresh,
    clearOfflineCache
  };
};

// Re-export del tipo per compatibilità
export type { WineType };
