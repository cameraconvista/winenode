/**
 * NETWORK STATE HOOK - WINENODE
 * 
 * Hook per gestione state di rete e detection.
 * Governance: Max 200 righe per file.
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

interface UseNetworkStateReturn extends NetworkStatus {
  hasBeenOffline: boolean;
  offlineDuration: number;
  handleOnline: () => void;
  handleOffline: () => void;
  getStats: () => {
    totalOfflineTime: number;
    offlineEvents: number;
  };
}

// Helper per ottenere tipo connessione
const getConnectionType = (): string | null => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection?.type || null;
  }
  return null;
};

// Helper per ottenere effective type
const getEffectiveType = (): string | null => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    return connection?.effectiveType || null;
  }
  return null;
};

export const useNetworkState = (): UseNetworkStateReturn => {
  // State principale
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(() => ({
    isOnline: navigator.onLine,
    isConnecting: false,
    lastOnline: navigator.onLine ? new Date() : null,
    lastOffline: !navigator.onLine ? new Date() : null,
    connectionType: getConnectionType(),
    effectiveType: getEffectiveType()
  }));

  // Refs per gestione eventi
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statsRef = useRef({
    totalOfflineTime: 0,
    offlineEvents: 0
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
    ...networkStatus,
    hasBeenOffline,
    offlineDuration,
    handleOnline,
    handleOffline,
    getStats
  };
};
