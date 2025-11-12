/**
 * OFFLINE SYNC HOOK SIMPLE - WINENODE
 * 
 * Versione semplificata senza emoji per production build.
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
          throw new Error(`Unknown operation type: ${operation.type}`);
      }

      if (import.meta.env.DEV) {
        console.log(`Sync successful: ${operation.type} (${operation.id})`);
      }

      return true;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`Sync failed: ${operation.type} (${operation.id})`, error);
      }
      return false;
    }
  };

  /**
   * Calcola delay per retry con exponential backoff
   */
  const calculateRetryDelay = (retryCount: number): number => {
    const baseDelay = 1000; // 1 secondo
    const maxDelay = 30000; // 30 secondi max
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
    return delay + Math.random() * 1000; // Jitter per evitare thundering herd
  };

  /**
   * Sincronizza tutte le operazioni pending
   */
  const syncPendingOperations = useCallback(async (): Promise<void> => {
    if (!isOnline || syncInProgressRef.current) {
      return;
    }

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

      if (import.meta.env.DEV) {
        console.log(`Starting sync of ${pendingOperations.length} operations`);
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
          console.error('Error processing operation:', error);
          await offlineStorage.updateOperationStatus(operation.id, 'failed');
          errorCount++;
        }
      }

      if (import.meta.env.DEV) {
        console.log(`Sync completed: ${successCount} success, ${errorCount} errors`);
      }

      onSyncComplete?.(successCount, errorCount);

    } catch (error) {
      const syncError = error instanceof Error ? error : new Error('Unknown sync error');
      console.error('Sync process failed:', syncError);
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

  // Auto-sync quando torna online
  useEffect(() => {
    if (isOnline && !syncInProgressRef.current) {
      // Aspetta 2 secondi per stabilizzare connessione
      const timeout = setTimeout(() => {
        syncPendingOperations();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [isOnline, syncPendingOperations]);

  return {
    syncPendingOperations,
    getSyncStats
  };
};
