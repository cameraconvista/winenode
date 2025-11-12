/**
 * OPERATIONS QUEUE HOOK - WINENODE
 * 
 * Hook per gestione queue operazioni offline.
 * Governance: Max 200 righe per file.
 */

import { useState, useCallback } from 'react';

interface PendingOperation {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface UseOperationsQueueReturn {
  pendingOperations: PendingOperation[];
  queueOperation: (operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>) => string;
  removeOperation: (id: string) => void;
  clearQueue: () => void;
  updateOperationRetryCount: (id: string, retryCount: number) => void;
}

// Helper per persistere queue in localStorage
const persistQueue = (operations: PendingOperation[]) => {
  try {
    localStorage.setItem('winenode_pending_operations', JSON.stringify(operations));
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to persist operations queue:', error);
    }
  }
};

// Helper per caricare queue da localStorage
const loadPersistedQueue = (): PendingOperation[] => {
  try {
    const stored = localStorage.getItem('winenode_pending_operations');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Valida che sia un array di operazioni
      if (Array.isArray(parsed)) {
        return parsed.filter(op => 
          op && 
          typeof op.id === 'string' && 
          typeof op.type === 'string' &&
          typeof op.timestamp === 'number'
        );
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to load persisted operations queue:', error);
    }
  }
  return [];
};

export const useOperationsQueue = (): UseOperationsQueueReturn => {
  // Queue operazioni offline
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>(() => {
    return loadPersistedQueue();
  });

  /**
   * Aggiunge operazione alla coda offline
   */
  const queueOperation = useCallback((
    operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>
  ): string => {
    const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const newOperation: PendingOperation = {
      ...operation,
      id,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    setPendingOperations(prev => {
      const updated = [...prev, newOperation];
      persistQueue(updated);
      return updated;
    });
    
    if (import.meta.env.DEV) {
      console.log(`📥 Operation queued: ${operation.type} (${id})`);
    }
    
    return id;
  }, []);

  /**
   * Rimuove operazione dalla coda
   */
  const removeOperation = useCallback((id: string) => {
    setPendingOperations(prev => {
      const updated = prev.filter(op => op.id !== id);
      persistQueue(updated);
      return updated;
    });
    
    if (import.meta.env.DEV) {
      console.log(`✅ Operation completed: ${id}`);
    }
  }, []);

  /**
   * Pulisce completamente la coda
   */
  const clearQueue = useCallback(() => {
    setPendingOperations([]);
    persistQueue([]);
    
    if (import.meta.env.DEV) {
      console.log('🧹 Operation queue cleared');
    }
  }, []);

  /**
   * Aggiorna retry count di un'operazione
   */
  const updateOperationRetryCount = useCallback((id: string, retryCount: number) => {
    setPendingOperations(prev => {
      const updated = prev.map(op => 
        op.id === id 
          ? { ...op, retryCount }
          : op
      );
      persistQueue(updated);
      return updated;
    });
  }, []);

  return {
    pendingOperations,
    queueOperation,
    removeOperation,
    clearQueue,
    updateOperationRetryCount
  };
};
