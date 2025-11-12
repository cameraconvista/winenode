/**
 * NETWORK RETRY HOOK - WINENODE
 * 
 * Hook per gestione retry operazioni e statistiche.
 * Governance: Max 200 righe per file.
 */

import { useCallback, useRef } from 'react';

interface PendingOperation {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface UseNetworkRetryProps {
  pendingOperations: PendingOperation[];
  removeOperation: (id: string) => void;
  updateOperationRetryCount: (id: string, retryCount: number) => void;
  isOnline: boolean;
}

interface UseNetworkRetryReturn {
  retryOperation: (id: string) => Promise<boolean>;
  retryAllOperations: () => Promise<void>;
  getRetryStats: () => {
    queuedOperations: number;
    successfulRetries: number;
    failedRetries: number;
  };
}

export const useNetworkRetry = ({
  pendingOperations,
  removeOperation,
  updateOperationRetryCount,
  isOnline
}: UseNetworkRetryProps): UseNetworkRetryReturn => {

  const retryStatsRef = useRef({
    queuedOperations: 0,
    successfulRetries: 0,
    failedRetries: 0
  });

  /**
   * Riprova singola operazione
   */
  const retryOperation = useCallback(async (id: string): Promise<boolean> => {
    const operation = pendingOperations.find(op => op.id === id);
    if (!operation) return false;
    
    // Verifica se ha superato il limite di retry
    if (operation.retryCount >= operation.maxRetries) {
      if (import.meta.env.DEV) {
        console.warn(`❌ Operation ${id} exceeded max retries (${operation.maxRetries})`);
      }
      return false;
    }
    
    try {
      // Incrementa contatore retry
      const newRetryCount = operation.retryCount + 1;
      updateOperationRetryCount(id, newRetryCount);
      
      // Qui si dovrebbe implementare la logica specifica per ogni tipo di operazione
      // Per ora simula successo/fallimento
      const success = Math.random() > 0.3; // 70% successo simulato
      
      if (success) {
        removeOperation(id);
        retryStatsRef.current.successfulRetries++;
        
        if (import.meta.env.DEV) {
          console.log(`✅ Operation retry successful: ${operation.type}`);
        }
        
        return true;
      } else {
        retryStatsRef.current.failedRetries++;
        
        if (import.meta.env.DEV) {
          console.warn(`⚠️ Operation retry failed: ${operation.type} (attempt ${newRetryCount}/${operation.maxRetries})`);
        }
        
        return false;
      }
    } catch (error) {
      retryStatsRef.current.failedRetries++;
      
      if (import.meta.env.DEV) {
        console.error(`❌ Operation retry error: ${operation.type}`, error);
      }
      
      return false;
    }
  }, [pendingOperations, removeOperation, updateOperationRetryCount]);

  /**
   * Riprova tutte le operazioni in coda
   */
  const retryAllOperations = useCallback(async (): Promise<void> => {
    if (!isOnline || pendingOperations.length === 0) return;
    
    if (import.meta.env.DEV) {
      console.log(`🔄 Retrying ${pendingOperations.length} queued operations...`);
    }
    
    // Riprova operazioni in parallelo con delay per evitare sovraccarico
    const retryPromises = pendingOperations.map((operation, index) => 
      new Promise<void>(resolve => {
        setTimeout(async () => {
          await retryOperation(operation.id);
          resolve();
        }, index * 200); // 200ms delay tra operazioni
      })
    );
    
    await Promise.all(retryPromises);
  }, [isOnline, pendingOperations, retryOperation]);

  /**
   * Ottiene statistiche retry
   */
  const getRetryStats = useCallback(() => {
    return {
      ...retryStatsRef.current,
      queuedOperations: pendingOperations.length
    };
  }, [pendingOperations.length]);

  // Aggiorna stats quando cambia la queue
  retryStatsRef.current.queuedOperations = pendingOperations.length;

  return {
    retryOperation,
    retryAllOperations,
    getRetryStats
  };
};
