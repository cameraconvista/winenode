/**
 * OFFLINE CACHE HOOK - WINENODE
 * 
 * Hook dedicato per gestione cache offline e sincronizzazione state.
 * Governance: Max 200 righe per file.
 */

import { useState, useCallback, useRef } from 'react';
import { WineType } from './useWines';
import { offlineCache, CACHE_TTL } from '../lib/offlineCache';

interface UseOfflineCacheProps {
  originalWines: WineType[];
  originalSuppliers: string[];
  isOnline: boolean;
  originalRefreshWines: () => Promise<void>;
}

interface UseOfflineCacheReturn {
  // State
  internalWines: WineType[];
  internalSuppliers: string[];
  isUsingCache: boolean;
  lastCacheUpdate: Date | null;
  cacheStats: {
    winesHitRate: number;
    suppliersHitRate: number;
    lastSync: Date | null;
  };
  
  // Actions
  setInternalWines: (wines: WineType[]) => void;
  setInternalSuppliers: (suppliers: string[]) => void;
  setIsUsingCache: (using: boolean) => void;
  setLastCacheUpdate: (date: Date | null) => void;
  refreshWinesWithCache: () => Promise<void>;
  forceCacheRefresh: () => Promise<void>;
  clearOfflineCache: () => void;
  syncInternalWithOriginal: () => void;
}

export const useOfflineCache = ({
  originalWines,
  originalSuppliers,
  isOnline,
  originalRefreshWines
}: UseOfflineCacheProps): UseOfflineCacheReturn => {

  // State interno per gestione offline
  const [internalWines, setInternalWines] = useState<WineType[]>([]);
  const [internalSuppliers, setInternalSuppliers] = useState<string[]>([]);
  const [isUsingCache, setIsUsingCache] = useState(false);
  const [lastCacheUpdate, setLastCacheUpdate] = useState<Date | null>(null);
  const [cacheStats, setCacheStats] = useState({
    winesHitRate: 0,
    suppliersHitRate: 0,
    lastSync: null as Date | null
  });

  // Refs per gestione cache
  const cacheKeysRef = useRef({
    wines: 'wines_catalog',
    suppliers: 'suppliers_list',
    giacenze: 'giacenze_data'
  });

  /**
   * Sincronizza state interno con originale
   */
  const syncInternalWithOriginal = useCallback(() => {
    setInternalWines(originalWines);
    setInternalSuppliers(originalSuppliers);
  }, [originalWines, originalSuppliers]);

  /**
   * Refresh vini con supporto cache offline
   */
  const refreshWinesWithCache = useCallback(async (): Promise<void> => {
    try {
      // Se online, prova refresh normale prima
      if (isOnline) {
        try {
          await originalRefreshWines();
          
          // Se successo, aggiorna cache e sincronizza state interno
          if (originalWines.length > 0) {
            offlineCache.set(cacheKeysRef.current.wines, originalWines, CACHE_TTL.vini);
            offlineCache.set(cacheKeysRef.current.suppliers, originalSuppliers, CACHE_TTL.fornitori);
            
            // Sincronizza state interno con dati freschi
            setInternalWines(originalWines);
            setInternalSuppliers(originalSuppliers);
            setLastCacheUpdate(new Date());
            setIsUsingCache(false);
            
            if (import.meta.env.DEV) {
              console.log(`Wines cached: ${originalWines.length} items`);
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
  }, [isOnline, originalRefreshWines, originalWines, originalSuppliers]);

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
      await originalRefreshWines();
      
      // Aggiorna cache con dati freschi
      if (originalWines.length > 0) {
        offlineCache.set(cacheKeysRef.current.wines, originalWines, CACHE_TTL.vini);
        offlineCache.set(cacheKeysRef.current.suppliers, originalSuppliers, CACHE_TTL.fornitori);
        
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
  }, [isOnline, originalRefreshWines, originalWines, originalSuppliers]);

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

  return {
    // State
    internalWines,
    internalSuppliers,
    isUsingCache,
    lastCacheUpdate,
    cacheStats,
    
    // Actions
    setInternalWines,
    setInternalSuppliers,
    setIsUsingCache,
    setLastCacheUpdate,
    refreshWinesWithCache,
    forceCacheRefresh,
    clearOfflineCache,
    syncInternalWithOriginal
  };
};
