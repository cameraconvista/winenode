/**
 * OFFLINE CACHE CORE - WINENODE
 * 
 * Funzionalità core del sistema cache offline.
 * Governance: Max 200 righe per file.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  version: string;
  ttl: number;
  checksum?: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  lastCleanup: number;
}

export class OfflineCacheCore {
  private storage: Storage;
  private prefix: string;
  private stats: CacheStats;
  private maxSize: number;
  
  constructor(
    storage: Storage = localStorage,
    prefix: string = 'winenode_cache_',
    maxSize: number = 5 * 1024 * 1024 // 5MB default
  ) {
    this.storage = storage;
    this.prefix = prefix;
    this.maxSize = maxSize;
    this.stats = this.loadStats();
  }
  
  /**
   * Salva dati in cache con TTL
   */
  set<T>(key: string, data: T, ttl: number = 3600000): boolean {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: '1.0',
        ttl,
        checksum: this.calculateChecksum(data)
      };
      
      const serialized = JSON.stringify(entry);
      const fullKey = this.prefix + key;
      
      // Verifica dimensioni
      if (serialized.length > this.maxSize / 10) { // Max 10% della cache per singolo item
        if (import.meta.env.DEV) {
          console.warn(`Cache item too large: ${key} (${serialized.length} bytes)`);
        }
        return false;
      }
      
      this.storage.setItem(fullKey, serialized);
      this.updateStats('set', serialized.length);
      
      return true;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Cache set error:', error);
      }
      return false;
    }
  }
  
  /**
   * Recupera dati dalla cache
   */
  get<T>(key: string): T | null {
    try {
      const fullKey = this.prefix + key;
      const stored = this.storage.getItem(fullKey);
      
      if (!stored) {
        this.stats.misses++;
        return null;
      }
      
      const entry: CacheEntry<T> = JSON.parse(stored);
      
      // Verifica scadenza
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.storage.removeItem(fullKey);
        this.stats.misses++;
        return null;
      }
      
      // Verifica integrità (opzionale)
      if (entry.checksum && entry.checksum !== this.calculateChecksum(entry.data)) {
        if (import.meta.env.DEV) {
          console.warn(`Cache checksum mismatch for key: ${key}`);
        }
        this.storage.removeItem(fullKey);
        this.stats.misses++;
        return null;
      }
      
      this.stats.hits++;
      return entry.data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Cache get error:', error);
      }
      this.stats.misses++;
      return null;
    }
  }
  
  /**
   * Rimuove item dalla cache
   */
  remove(key: string): boolean {
    try {
      const fullKey = this.prefix + key;
      this.storage.removeItem(fullKey);
      return true;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Cache remove error:', error);
      }
      return false;
    }
  }
  
  /**
   * Invalida item (alias per remove)
   */
  invalidate(key: string): boolean {
    return this.remove(key);
  }
  
  /**
   * Verifica se item esiste ed è valido
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  /**
   * Pulisce cache scaduta
   */
  cleanupExpired(): number {
    let cleanedCount = 0;
    
    try {
      const keys = Object.keys(this.storage);
      const prefixedKeys = keys.filter(k => k.startsWith(this.prefix));
      
      for (const fullKey of prefixedKeys) {
        try {
          const stored = this.storage.getItem(fullKey);
          if (!stored) continue;
          
          const entry: CacheEntry<any> = JSON.parse(stored);
          
          if (Date.now() - entry.timestamp > entry.ttl) {
            this.storage.removeItem(fullKey);
            cleanedCount++;
          }
        } catch (error) {
          // Item corrotto, rimuovi
          this.storage.removeItem(fullKey);
          cleanedCount++;
        }
      }
      
      this.stats.lastCleanup = Date.now();
      this.saveStats();
      
      if (import.meta.env.DEV && cleanedCount > 0) {
        console.log(`Cache cleanup: removed ${cleanedCount} expired items`);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Cache cleanup error:', error);
      }
    }
    
    return cleanedCount;
  }
  
  /**
   * Calcola checksum semplice per verifica integrità
   */
  private calculateChecksum(data: any): string {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }
  
  /**
   * Carica statistiche
   */
  private loadStats(): CacheStats {
    try {
      const stored = this.storage.getItem(this.prefix + 'stats');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Failed to load cache stats:', error);
      }
    }
    
    return {
      hits: 0,
      misses: 0,
      size: 0,
      lastCleanup: Date.now()
    };
  }
  
  /**
   * Salva statistiche
   */
  private saveStats(): void {
    try {
      this.storage.setItem(this.prefix + 'stats', JSON.stringify(this.stats));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Failed to save cache stats:', error);
      }
    }
  }
  
  /**
   * Aggiorna statistiche
   */
  private updateStats(operation: 'set' | 'get', size?: number): void {
    if (operation === 'set' && size) {
      this.stats.size += size;
    }
    this.saveStats();
  }
  
  /**
   * Ottiene statistiche correnti
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }
}
