/**
 * OFFLINE SYNC HOOK CLEAN - WINENODE
 * 
 * Versione completamente pulita per production build.
 * Governance: Max 200 righe per file.
 */

import { useCallback, useEffect, useRef } from 'react';
import { offlineStorage, PendingOperation } from '../lib/offlineStorage';
import { supabase } from '../lib/supabase';

interface UseOfflineSyncProps {
  isOnline: boolean;
  onSyncStart?: () => void;
  onSyncComplete?: (successCount: number, errorCount: number) => void;
  onSyncError?: (error: Error) => void;
}

interface UseOfflineSyncReturn {
  syncPendingOperations: () => Promise<void>;
  getSyncStats: () => Promise<{ pendingCount: number; completedCount: number; failedCount: number }>;
}

export const useOfflineSync = ({
  isOnline,
  onSyncStart,
  onSyncComplete,
  onSyncError
}: UseOfflineSyncProps): UseOfflineSyncReturn => {
  
  const syncInProgressRef = useRef(false);
  const lastSyncTimeRef = useRef<number>(0);

  /**
   * Esegue singola operazione Supabase
   */
  const executeOperation = async (operation: PendingOperation): Promise<boolean> => {
    try {
      switch (operation.type) {
        case 'UPDATE_INVENTORY': {
          const { error: inventoryError } = await supabase
            .from('giacenza')
            .update({ giacenza: operation.payload.newInventory })
            .eq('vino_id', operation.payload.wineId);
          
          if (inventoryError) throw inventoryError;
          break;
        }

        case 'UPDATE_MIN_STOCK': {
          const { error: minStockError } = await supabase
            .from('giacenza')
            .update({ min_stock: operation.payload.minStock })
            .eq('vino_id', operation.payload.wineId);
          
          if (minStockError) throw minStockError;
          break;
        }

        case 'UPDATE_WINE': {
          const { error: wineError } = await supabase
            .from('vini')
            .update(operation.payload.updates)
            .eq('id', operation.payload.wineId);
          
          if (wineError) throw wineError;
          break;
        }

        default:
          throw new Error('Unknown operation type: ' + operation.type);
      }

      return true;
    } catch (error) {
      return false;
    }
  };

  /**
   * Calcola delay per retry con exponential backoff
   */
  const calculateRetryDelay = (retryCount: number): number => {
    const baseDelay = 1000;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    return delay + Math.random() * 1000;
  };

  /**
   * Sincronizza tutte le operazioni pending
   */
  const syncPendingOperations = useCallback(async (): Promise<void> => {
    const now = Date.now();
    const minInterval = 10000; // Minimo 10 secondi tra sync
    
    if (!isOnline || syncInProgressRef.current || (now - lastSyncTimeRef.current) < minInterval) {
      return;
    }
    
    lastSyncTimeRef.current = now;

    syncInProgressRef.current = true;
    onSyncStart?.();

    let successCount = 0;
    let errorCount = 0;

    try {
      const pendingOperations = await offlineStorage.getPendingOperations();
      
      if (pendingOperations.length === 0) {
        onSyncComplete?.(0, 0);
        return;
      }

      // Processa operazioni in sequenza per evitare sovraccarico
      for (const operation of pendingOperations) {
        try {
          // Verifica se ha superato max retry
          if (operation.retryCount >= operation.maxRetries) {
            await offlineStorage.updateOperationStatus(operation.id, 'failed');
            errorCount++;
            continue;
          }

          // Marca come processing
          await offlineStorage.updateOperationStatus(operation.id, 'processing');

          // Esegui operazione
          const success = await executeOperation(operation);

          if (success) {
            await offlineStorage.removeOperation(operation.id);
            successCount++;
          } else {
            // Incrementa retry count
            const newRetryCount = operation.retryCount + 1;
            await offlineStorage.updateOperationStatus(
              operation.id, 
              'pending', 
              newRetryCount
            );
            errorCount++;

            // Schedule retry se non ha superato il limite
            if (newRetryCount < operation.maxRetries) {
              const delay = calculateRetryDelay(newRetryCount);
              setTimeout(() => {
                if (isOnline) {
                  syncPendingOperations();
                }
              }, delay);
            }
          }

          // Piccolo delay tra operazioni per non sovraccaricare
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          await offlineStorage.updateOperationStatus(operation.id, 'failed');
          errorCount++;
        }
      }

      onSyncComplete?.(successCount, errorCount);

    } catch (error) {
      const syncError = error instanceof Error ? error : new Error('Unknown sync error');
      onSyncError?.(syncError);
    } finally {
      syncInProgressRef.current = false;
    }
  }, [isOnline, onSyncStart, onSyncComplete, onSyncError]);

  /**
   * Ottiene statistiche sync
   */
  const getSyncStats = useCallback(async () => {
    return await offlineStorage.getStats();
  }, []);

  // Auto-sync rimosso - gestito da useWinesOffline per evitare duplicazione

  return {
    syncPendingOperations,
    getSyncStats
  };
};
