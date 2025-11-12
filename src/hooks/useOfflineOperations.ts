/**
 * OFFLINE OPERATIONS HOOK - WINENODE
 * 
 * Hook dedicato per gestione operazioni offline (update inventory, etc).
 * Governance: Max 200 righe per file.
 */

import { useCallback } from 'react';
import { WineType } from './useWines';
import { offlineCache, CACHE_TTL } from '../lib/offlineCache';
import { offlineStorage } from '../lib/offlineStorage';

interface UseOfflineOperationsProps {
  isOnline: boolean;
  originalUpdateWineInventory: (wineId: string, newInventory: number) => Promise<boolean>;
  internalWines: WineType[];
  setInternalWines: (wines: WineType[]) => void;
}

interface UseOfflineOperationsReturn {
  updateInventoryOffline: (wineId: string, newInventory: number) => Promise<boolean>;
}

export const useOfflineOperations = ({
  isOnline,
  originalUpdateWineInventory,
  internalWines,
  setInternalWines
}: UseOfflineOperationsProps): UseOfflineOperationsReturn => {

  // Refs per gestione cache
  const cacheKeys = {
    wines: 'wines_catalog',
    suppliers: 'suppliers_list',
    giacenze: 'giacenze_data'
  };

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
        const success = await originalUpdateWineInventory(wineId, newInventory);
        
        if (success) {
          // Aggiorna cache locale
          const cachedWines = offlineCache.get<WineType[]>(cacheKeys.wines);
          if (cachedWines) {
            const updatedWines = cachedWines.map(wine => 
              wine.id === wineId 
                ? { ...wine, inventory: newInventory }
                : wine
            );
            offlineCache.set(cacheKeys.wines, updatedWines, CACHE_TTL.vini);
          }
          
          // Aggiorna anche state interno per consistency
          const updatedInternalWines = internalWines.map(wine => 
            wine.id === wineId 
              ? { ...wine, inventory: newInventory }
              : wine
          );
          setInternalWines(updatedInternalWines);
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
        const cachedWines = offlineCache.get<WineType[]>(cacheKeys.wines);
        if (cachedWines) {
          const updatedWines = cachedWines.map(wine => 
            wine.id === wineId 
              ? { ...wine, inventory: newInventory }
              : wine
          );
          offlineCache.set(cacheKeys.wines, updatedWines, CACHE_TTL.vini);
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
  }, [isOnline, originalUpdateWineInventory, internalWines, setInternalWines]);

  return {
    updateInventoryOffline
  };
};
