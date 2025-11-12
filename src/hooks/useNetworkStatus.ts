/**
 * NETWORK STATUS HOOK - WINENODE
 * 
 * Hook per monitoraggio stato connessione e gestione operazioni offline.
 * Implementazione non invasiva che monitora la rete senza interferire con la logica esistente.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isConnecting: boolean;
  lastOnline: Date | null;
  lastOffline: Date | null;
  connectionType: string | null;
  effectiveType: string | null;
}

interface PendingOperation {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

interface UseNetworkStatusReturn extends NetworkStatus {
  // Status helpers
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
  // State principale
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => ({
    isOnline: navigator.onLine,
    isConnecting: false,
    lastOnline: navigator.onLine ? new Date() : null,
    lastOffline: !navigator.onLine ? new Date() : null,
    connectionType: getConnectionType(),
    effectiveType: getEffectiveType()
  }));
  
  // Queue operazioni offline
  const [pendingOperations, setPendingOperations] = useState<PendingOperation[]>(() => {
    return loadPersistedQueue();
  });
  
  // Refs per gestione eventi
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statsRef = useRef({
    totalOfflineTime: 0,
    offlineEvents: 0,
    queuedOperations: 0,
    successfulRetries: 0,
    failedRetries: 0
  });
  
  /**
   * Gestisce cambio stato online
   */
  const handleOnline = useCallback(() => {
    const now = new Date();
    
    setNetworkStatus(prev => {
      // Calcola durata offline
      if (prev.lastOffline) {
        const offlineTime = now.getTime() - prev.lastOffline.getTime();
        statsRef.current.totalOfflineTime += offlineTime;
        
        if (import.meta.env.DEV) {
          console.log(`🌐 Back online after ${Math.round(offlineTime / 1000)}s offline`);
        }
      }
      
      return {
        ...prev,
        isOnline: true,
        isConnecting: false,
        lastOnline: now,
        connectionType: getConnectionType(),
        effectiveType: getEffectiveType()
      };
    });
    
    // Auto-retry operazioni in coda dopo riconnessione
    setTimeout(() => {
      retryAllOperations();
    }, 1000); // Aspetta 1s per stabilizzare connessione
    
  }, []);
  
  /**
   * Gestisce cambio stato offline
   */
  const handleOffline = useCallback(() => {
    const now = new Date();
    
    setNetworkStatus(prev => ({
      ...prev,
      isOnline: false,
      isConnecting: false,
      lastOffline: now,
      connectionType: null,
      effectiveType: null
    }));
    
    statsRef.current.offlineEvents++;
    
    if (import.meta.env.DEV) {
      console.log('📡 Connection lost - entering offline mode');
    }
  }, []);
  
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
    
    statsRef.current.queuedOperations++;
    
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
      setPendingOperations(prev => 
        prev.map(op => 
          op.id === id 
            ? { ...op, retryCount: op.retryCount + 1 }
            : op
        )
      );
      
      // Qui si dovrebbe implementare la logica specifica per ogni tipo di operazione
      // Per ora simula successo/fallimento
      const success = Math.random() > 0.3; // 70% successo simulato
      
      if (success) {
        removeOperation(id);
        statsRef.current.successfulRetries++;
        
        if (import.meta.env.DEV) {
          console.log(`✅ Operation retry successful: ${operation.type}`);
        }
        
        return true;
      } else {
        statsRef.current.failedRetries++;
        
        if (import.meta.env.DEV) {
          console.warn(`⚠️ Operation retry failed: ${operation.type} (attempt ${operation.retryCount + 1}/${operation.maxRetries})`);
        }
        
        return false;
      }
    } catch (error) {
      statsRef.current.failedRetries++;
      
      if (import.meta.env.DEV) {
        console.error(`❌ Operation retry error: ${operation.type}`, error);
      }
      
      return false;
    }
  }, [pendingOperations, removeOperation]);
  
  /**
   * Riprova tutte le operazioni in coda
   */
  const retryAllOperations = useCallback(async (): Promise<void> => {
    if (!networkStatus.isOnline || pendingOperations.length === 0) return;
    
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
  }, [networkStatus.isOnline, pendingOperations, retryOperation]);
  
  /**
   * Ottiene statistiche utilizzo
   */
  const getStats = useCallback(() => {
    return { ...statsRef.current };
  }, []);
  
  // Effect per gestione eventi browser
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [handleOnline, handleOffline]);
  
  // Effect per monitoraggio connessione avanzato (se supportato)
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      const handleConnectionChange = () => {
        setNetworkStatus(prev => ({
          ...prev,
          connectionType: getConnectionType(),
          effectiveType: getEffectiveType()
        }));
      };
      
      connection?.addEventListener('change', handleConnectionChange);
      
      return () => {
        connection?.removeEventListener('change', handleConnectionChange);
      };
    }
  }, []);
  
  // Computed values
  const hasBeenOffline = networkStatus.lastOffline !== null;
  const offlineDuration = networkStatus.lastOffline && !networkStatus.isOnline
    ? Date.now() - networkStatus.lastOffline.getTime()
    : 0;
  
  return {
    // Status
    ...networkStatus,
    hasBeenOffline,
    offlineDuration,
    
    // Queue management
    pendingOperations,
    queueOperation,
    removeOperation,
    clearQueue,
    
    // Retry management
    retryOperation,
    retryAllOperations,
    
    // Stats
    getStats
  };
};

/**
 * Ottiene tipo di connessione se supportato
 */
function getConnectionType(): string | null {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection?.type || null;
  }
  return null;
}

/**
 * Ottiene tipo effettivo di connessione se supportato
 */
function getEffectiveType(): string | null {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection?.effectiveType || null;
  }
  return null;
}

/**
 * Carica coda operazioni da localStorage
 */
function loadPersistedQueue(): PendingOperation[] {
  try {
    const stored = localStorage.getItem('winenode_offline_queue');
    if (stored) {
      const parsed = JSON.parse(stored);
      
      // Filtra operazioni troppo vecchie (>24h)
      const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
      return parsed.filter((op: PendingOperation) => op.timestamp > dayAgo);
    }
  } catch (error) {
    console.warn('⚠️ Failed to load persisted queue:', error);
  }
  
  return [];
}

/**
 * Persiste coda operazioni in localStorage
 */
function persistQueue(queue: PendingOperation[]): void {
  try {
    localStorage.setItem('winenode_offline_queue', JSON.stringify(queue));
  } catch (error) {
    console.warn('⚠️ Failed to persist queue:', error);
  }
}

/**
 * Hook semplificato per solo stato online/offline
 */
export const useOnlineStatus = () => {
  const { isOnline, isConnecting, lastOnline, lastOffline } = useNetworkStatus();
  
  return {
    isOnline,
    isConnecting,
    lastOnline,
    lastOffline
  };
};
