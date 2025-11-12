/**
 * OFFLINE CACHE REFACTORED - WINENODE
 * 
 * Wrapper e utilities per il sistema cache offline.
 * Governance: Max 200 righe per file.
 */

import { OfflineCacheCore } from './offlineCacheCore';

// Istanza singleton della cache
const cacheInstance = new OfflineCacheCore();

// TTL predefiniti per diversi tipi di dati
export const CACHE_TTL = {
  vini: 30 * 60 * 1000,        // 30 minuti
  fornitori: 60 * 60 * 1000,   // 1 ora
  giacenze: 5 * 60 * 1000,     // 5 minuti (più volatile)
  ordini: 15 * 60 * 1000,      // 15 minuti
  configurazione: 24 * 60 * 60 * 1000, // 24 ore
  default: 60 * 60 * 1000      // 1 ora default
};

/**
 * Wrapper semplificato per l'uso comune della cache
 */
export class OfflineCache {
  /**
   * Salva dati in cache
   */
  static set<T>(key: string, data: T, ttl: number = CACHE_TTL.default): boolean {
    return cacheInstance.set(key, data, ttl);
  }
  
  /**
   * Recupera dati dalla cache
   */
  static get<T>(key: string): T | null {
    return cacheInstance.get<T>(key);
  }
  
  /**
   * Rimuove item dalla cache
   */
  static remove(key: string): boolean {
    return cacheInstance.remove(key);
  }
  
  /**
   * Invalida item (alias per remove)
   */
  static invalidate(key: string): boolean {
    return cacheInstance.invalidate(key);
  }
  
  /**
   * Verifica se item esiste ed è valido
   */
  static has(key: string): boolean {
    return cacheInstance.has(key);
  }
  
  /**
   * Pulisce cache scaduta
   */
  static cleanupExpired(): number {
    return cacheInstance.cleanupExpired();
  }
  
  /**
   * Ottiene statistiche cache
   */
  static getStats() {
    return cacheInstance.getStats();
  }
  
  /**
   * Pulisce completamente la cache
   */
  static clear(): boolean {
    try {
      const keys = Object.keys(localStorage);
      const prefixedKeys = keys.filter(k => k.startsWith('winenode_cache_'));
      
      for (const key of prefixedKeys) {
        localStorage.removeItem(key);
      }
      
      if (import.meta.env.DEV) {
        console.log(`Cache cleared: removed ${prefixedKeys.length} items`);
      }
      
      return true;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Cache clear error:', error);
      }
      return false;
    }
  }
  
  /**
   * Ottiene dimensione totale cache in bytes
   */
  static getSize(): number {
    try {
      let totalSize = 0;
      const keys = Object.keys(localStorage);
      const prefixedKeys = keys.filter(k => k.startsWith('winenode_cache_'));
      
      for (const key of prefixedKeys) {
        const item = localStorage.getItem(key);
        if (item) {
          totalSize += item.length;
        }
      }
      
      return totalSize;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Cache size calculation error:', error);
      }
      return 0;
    }
  }
  
  /**
   * Ottiene hit rate della cache
   */
  static getHitRate(): number {
    const stats = cacheInstance.getStats();
    const total = stats.hits + stats.misses;
    return total > 0 ? (stats.hits / total) * 100 : 0;
  }
  
  /**
   * Verifica se la cache è disponibile
   */
  static isAvailable(): boolean {
    try {
      const testKey = 'winenode_cache_test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Ottiene informazioni dettagliate sulla cache
   */
  static getInfo() {
    const stats = cacheInstance.getStats();
    const size = OfflineCache.getSize();
    const hitRate = OfflineCache.getHitRate();
    
    return {
      available: OfflineCache.isAvailable(),
      stats,
      size: {
        bytes: size,
        kb: Math.round(size / 1024),
        mb: Math.round(size / (1024 * 1024))
      },
      hitRate: Math.round(hitRate * 100) / 100,
      lastCleanup: new Date(stats.lastCleanup)
    };
  }
}

// Export dell'istanza singleton per uso avanzato
export const offlineCache = cacheInstance;

// Export default per compatibilità
export default OfflineCache;
