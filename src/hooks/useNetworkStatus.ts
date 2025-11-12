/**
 * NETWORK STATUS HOOK REFACTORED - WINENODE
 * 
 * Hook principale composto dai moduli specializzati.
 * Governance: Max 200 righe per file.
 */

import { useEffect } from 'react';
import { useNetworkState } from './useNetworkState';
import { useOperationsQueue } from './useOperationsQueue';
import { useNetworkRetry } from './useNetworkRetry';

interface PendingOperation {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface UseNetworkStatusReturn {
  // Status
  isOnline: boolean;
  isConnecting: boolean;
  lastOnline: Date | null;
  lastOffline: Date | null;
  connectionType: string | null;
  effectiveType: string | null;
  hasBeenOffline: boolean;
  offlineDuration: number;
  
  // Queue management
  pendingOperations: PendingOperation[];
  queueOperation: (operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount'>) => string;
  removeOperation: (id: string) => void;
  clearQueue: () => void;
  
  // Retry management
  retryOperation: (id: string) => Promise<boolean>;
  retryAllOperations: () => Promise<void>;
  
  // Stats
  getStats: () => {
    totalOfflineTime: number;
    offlineEvents: number;
    queuedOperations: number;
    successfulRetries: number;
    failedRetries: number;
  };
}

/**
 * Hook principale per gestione stato rete e operazioni offline
 */
export const useNetworkStatus = (): UseNetworkStatusReturn => {
  
  // Hook per state di rete
  const networkState = useNetworkState();
  
  // Hook per queue operazioni
  const operationsQueue = useOperationsQueue();
  
  // Hook per retry logic
  const networkRetry = useNetworkRetry({
    pendingOperations: operationsQueue.pendingOperations,
    removeOperation: operationsQueue.removeOperation,
    updateOperationRetryCount: operationsQueue.updateOperationRetryCount,
    isOnline: networkState.isOnline
  });

  // Auto-retry operazioni in coda dopo riconnessione
  useEffect(() => {
    if (networkState.isOnline && operationsQueue.pendingOperations.length > 0) {
      // Aspetta 1s per stabilizzare connessione
      const timeout = setTimeout(() => {
        networkRetry.retryAllOperations();
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [networkState.isOnline, operationsQueue.pendingOperations.length, networkRetry.retryAllOperations]);

  // Combina stats da diversi moduli
  const getStats = () => {
    const networkStats = networkState.getStats();
    const retryStats = networkRetry.getRetryStats();
    
    return {
      ...networkStats,
      ...retryStats
    };
  };

  return {
    // Network state
    isOnline: networkState.isOnline,
    isConnecting: networkState.isConnecting,
    lastOnline: networkState.lastOnline,
    lastOffline: networkState.lastOffline,
    connectionType: networkState.connectionType,
    effectiveType: networkState.effectiveType,
    hasBeenOffline: networkState.hasBeenOffline,
    offlineDuration: networkState.offlineDuration,
    
    // Queue management
    pendingOperations: operationsQueue.pendingOperations,
    queueOperation: operationsQueue.queueOperation,
    removeOperation: operationsQueue.removeOperation,
    clearQueue: operationsQueue.clearQueue,
    
    // Retry management
    retryOperation: networkRetry.retryOperation,
    retryAllOperations: networkRetry.retryAllOperations,
    
    // Combined stats
    getStats
  };
};
