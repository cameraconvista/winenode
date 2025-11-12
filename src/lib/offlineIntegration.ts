/**
 * OFFLINE INTEGRATION - WINENODE
 * 
 * Modulo per integrare le funzionalità offline nell'app esistente
 * senza modificare i componenti principali. Approccio non invasivo.
 */

import { offlineCache } from './offlineCache';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

// Feature flags per controllo granulare
export const OFFLINE_FEATURES = {
  CACHE_ENABLED: import.meta.env.VITE_OFFLINE_CACHE_ENABLED !== 'false',
  UI_INDICATORS: import.meta.env.VITE_OFFLINE_UI_INDICATORS !== 'false',
  SERVICE_WORKER: import.meta.env.VITE_OFFLINE_SERVICE_WORKER !== 'false',
  AUTO_SYNC: import.meta.env.VITE_OFFLINE_AUTO_SYNC !== 'false',
} as const;

/**
 * Inizializza le funzionalità offline
 */
export const initializeOfflineFeatures = () => {
  if (import.meta.env.DEV) {
    console.log('🔧 Initializing offline features:', OFFLINE_FEATURES);
  }
  
  // Registra Service Worker se abilitato
  if (OFFLINE_FEATURES.SERVICE_WORKER && 'serviceWorker' in navigator) {
    registerServiceWorker();
  }
  
  // Inizializza cache se abilitato
  if (OFFLINE_FEATURES.CACHE_ENABLED) {
    initializeCache();
  }
  
  // Setup event listeners per debug in development
  if (import.meta.env.DEV) {
    setupDevelopmentHelpers();
  }
};

/**
 * Registra Service Worker
 */
const registerServiceWorker = async () => {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    
    if (import.meta.env.DEV) {
      console.log('✅ Service Worker registered:', registration.scope);
    }
    
    // Gestisci aggiornamenti SW
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Nuovo SW disponibile
            if (import.meta.env.DEV) {
              console.log('🔄 New Service Worker available');
            }
          }
        });
      }
    });
    
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ Service Worker registration failed:', error);
    }
  }
};

/**
 * Inizializza cache con cleanup
 */
const initializeCache = () => {
  try {
    // Cleanup cache scadute all'avvio
    const cleaned = offlineCache.cleanupExpired();
    
    if (import.meta.env.DEV && cleaned > 0) {
      console.log(`🧹 Cache cleanup: ${cleaned} expired entries removed`);
    }
    
    // Setup cleanup periodico (ogni 5 minuti)
    setInterval(() => {
      const cleaned = offlineCache.cleanupExpired();
      if (import.meta.env.DEV && cleaned > 0) {
        console.log(`🧹 Periodic cache cleanup: ${cleaned} entries removed`);
      }
    }, 5 * 60 * 1000);
    
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ Cache initialization failed:', error);
    }
  }
};

/**
 * Setup helper per development
 */
const setupDevelopmentHelpers = () => {
  // Aggiungi helper globali per debug
  if (typeof window !== 'undefined') {
    (window as any).wineNodeOffline = {
      cache: offlineCache,
      features: OFFLINE_FEATURES,
      clearCache: () => {
        offlineCache.clear();
        console.log('🧹 Cache cleared manually');
      },
      getCacheStats: () => {
        const stats = offlineCache.getStats();
        console.table(stats);
        return stats;
      },
      simulateOffline: () => {
        console.log('🔌 To simulate offline: disconnect WiFi or use DevTools Network tab');
      }
    };
    
    console.log('🛠️ Development helpers available:');
    console.log('- wineNodeOffline.clearCache() - Clear all cache');
    console.log('- wineNodeOffline.getCacheStats() - Show cache statistics');
    console.log('- wineNodeOffline.simulateOffline() - Instructions for offline testing');
  }
  
  // Log network status changes
  window.addEventListener('online', () => {
    console.log('🌐 Network: ONLINE');
  });
  
  window.addEventListener('offline', () => {
    console.log('📡 Network: OFFLINE');
  });
};

/**
 * Wrapper per fetch con cache fallback
 */
export const fetchWithOfflineSupport = async <T>(
  url: string,
  options: RequestInit = {},
  cacheKey?: string,
  cacheTTL: number = 300000 // 5 min default
): Promise<T> => {
  
  if (!OFFLINE_FEATURES.CACHE_ENABLED) {
    // Se cache disabilitata, usa fetch normale
    const response = await fetch(url, options);
    return response.json();
  }
  
  const finalCacheKey = cacheKey || `fetch_${url}`;
  
  try {
    // Prova fetch normale prima
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Cache successful response
    if (options.method === 'GET' || !options.method) {
      offlineCache.set(finalCacheKey, data, cacheTTL);
    }
    
    return data;
    
  } catch (error) {
    // Fallback su cache se disponibile
    const cached = offlineCache.get<T>(finalCacheKey);
    
    if (cached !== null) {
      if (import.meta.env.DEV) {
        console.log(`📱 Using cached data for ${url} (network failed)`);
      }
      return cached;
    }
    
    // Nessun cache disponibile, rilancia errore
    throw error;
  }
};

/**
 * Hook per status offline semplificato
 */
export const useOfflineStatus = () => {
  if (!OFFLINE_FEATURES.CACHE_ENABLED) {
    return {
      isOnline: navigator.onLine,
      isOfflineMode: false,
      hasCache: false
    };
  }
  
  try {
    const { isOnline, pendingOperations } = useNetworkStatus();
    
    return {
      isOnline,
      isOfflineMode: !isOnline,
      hasCache: true,
      pendingOperations: pendingOperations.length,
      hasPendingOperations: pendingOperations.length > 0
    };
  } catch (error) {
    // Fallback se hook non disponibile
    return {
      isOnline: navigator.onLine,
      isOfflineMode: !navigator.onLine,
      hasCache: false
    };
  }
};

/**
 * Utility per pre-cache dati critici
 */
export const preCacheCriticalData = async () => {
  if (!OFFLINE_FEATURES.CACHE_ENABLED) return;
  
  try {
    // Qui si potrebbero pre-cachare dati critici
    // Per ora è un placeholder per implementazioni future
    
    if (import.meta.env.DEV) {
      console.log('💾 Pre-caching critical data...');
    }
    
    // Esempio: pre-cache tipologie (dati statici)
    // const tipologie = await fetchWithOfflineSupport('/api/tipologie', {}, 'tipologie', CACHE_TTL.tipologie);
    
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('⚠️ Pre-cache failed:', error);
    }
  }
};

// Auto-inizializzazione se in browser
if (typeof window !== 'undefined') {
  // Inizializza quando DOM è pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeOfflineFeatures);
  } else {
    initializeOfflineFeatures();
  }
}
