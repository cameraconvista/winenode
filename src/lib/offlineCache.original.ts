/**
 * OFFLINE CACHE MANAGER - WINENODE
 * 
 * Sistema di cache locale trasparente per funzionalità offline.
 * Implementazione non distruttiva che si aggiunge sopra la logica esistente.
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

export class OfflineCache {
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
    
    // Cleanup automatico all'inizializzazione
    this.cleanupExpired();
  }
  
  /**
   * Salva dati in cache con TTL
   */
  set<T>(key: string, data: T, ttl: number = 3600000): boolean {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: '1.0.0',
        ttl,
        checksum: this.calculateChecksum(data)
      };
      
      const serialized = JSON.stringify(entry);
      
      // Verifica spazio disponibile
      if (this.getStorageSize() + serialized.length > this.maxSize) {
        this.cleanup();
      }
      
      this.storage.setItem(this.prefix + key, serialized);
      this.updateStats('set');
      
      if (import.meta.env.DEV) {
        console.debug(`💾 Cache SET: ${key} (${(serialized.length / 1024).toFixed(1)}KB)`);
      }
      
      return true;
    } catch (error) {
      console.warn('⚠️ Cache set failed:', error);
      return false;
    }
  }
  
  /**
   * Recupera dati dalla cache
   */
  get<T>(key: string): T | null {
    try {
      const item = this.storage.getItem(this.prefix + key);
      if (!item) {
        this.updateStats('miss');
        return null;
      }
      
      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Verifica scadenza
      if (Date.now() - entry.timestamp > entry.ttl) {
        this.invalidate(key);
        this.updateStats('miss');
        
        if (import.meta.env.DEV) {
          console.debug(`⏰ Cache EXPIRED: ${key}`);
        }
        
        return null;
      }
      
      // Verifica integrità (opzionale)
      if (entry.checksum && entry.checksum !== this.calculateChecksum(entry.data)) {
        console.warn(`🔒 Cache integrity check failed for: ${key}`);
        this.invalidate(key);
        this.updateStats('miss');
        return null;
      }
      
      this.updateStats('hit');
      
      if (import.meta.env.DEV) {
        console.debug(`✅ Cache HIT: ${key}`);
      }
      
      return entry.data;
    } catch (error) {
      console.warn('⚠️ Cache get failed:', error);
      this.invalidate(key);
      this.updateStats('miss');
      return null;
    }
  }
  
  /**
   * Invalida una chiave specifica
   */
  invalidate(key: string): void {
    try {
      this.storage.removeItem(this.prefix + key);
      
      if (import.meta.env.DEV) {
        console.debug(`🗑️ Cache INVALIDATED: ${key}`);
      }
    } catch (error) {
      console.warn('⚠️ Cache invalidate failed:', error);
    }
  }
  
  /**
   * Verifica se una chiave è scaduta
   */
  isStale(key: string): boolean {
    try {
      const item = this.storage.getItem(this.prefix + key);
      if (!item) return true;
      
      const entry: CacheEntry<any> = JSON.parse(item);
      return Date.now() - entry.timestamp > entry.ttl;
    } catch (error) {
      return true;
    }
  }
  
  /**
   * Pulisce tutte le chiavi scadute
   */
  cleanupExpired(): number {
    let cleaned = 0;
    
    try {
      const keys = this.getAllKeys();
      
      for (const fullKey of keys) {
        const key = fullKey.replace(this.prefix, '');
        if (this.isStale(key)) {
          this.invalidate(key);
          cleaned++;
        }
      }
      
      this.stats.lastCleanup = Date.now();
      this.saveStats();
      
      if (import.meta.env.DEV && cleaned > 0) {
        console.debug(`🧹 Cache cleanup: ${cleaned} expired entries removed`);
      }
    } catch (error) {
      console.warn('⚠️ Cache cleanup failed:', error);
    }
    
    return cleaned;
  }
  
  /**
   * Cleanup intelligente per liberare spazio
   */
  cleanup(): void {
    // Prima pulisce gli scaduti
    this.cleanupExpired();
    
    // Se ancora troppo pieno, rimuove i più vecchi
    if (this.getStorageSize() > this.maxSize * 0.8) {
      const keys = this.getAllKeys();
      const entries = keys.map(fullKey => {
        const key = fullKey.replace(this.prefix, '');
        const item = this.storage.getItem(fullKey);
        if (!item) return null;
        
        try {
          const entry = JSON.parse(item);
          return { key, timestamp: entry.timestamp, fullKey };
        } catch {
          return null;
        }
      }).filter(Boolean);
      
      // Ordina per timestamp (più vecchi prima)
      entries.sort((a, b) => a!.timestamp - b!.timestamp);
      
      // Rimuove il 25% più vecchio
      const toRemove = Math.ceil(entries.length * 0.25);
      for (let i = 0; i < toRemove; i++) {
        if (entries[i]) {
          this.invalidate(entries[i]!.key);
        }
      }
      
      if (import.meta.env.DEV) {
        console.debug(`🧹 Cache LRU cleanup: ${toRemove} old entries removed`);
      }
    }
  }
  
  /**
   * Ottiene tutte le chiavi cache
   */
  private getAllKeys(): string[] {
    const keys: string[] = [];
    
    try {
      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key && key.startsWith(this.prefix)) {
          keys.push(key);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to get cache keys:', error);
    }
    
    return keys;
  }
  
  /**
   * Calcola dimensione storage utilizzata
   */
  private getStorageSize(): number {
    let size = 0;
    
    try {
      const keys = this.getAllKeys();
      for (const key of keys) {
        const item = this.storage.getItem(key);
        if (item) {
          size += item.length;
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to calculate storage size:', error);
    }
    
    return size;
  }
  
  /**
   * Calcola checksum semplice per verifica integrità
   */
  private calculateChecksum(data: any): string {
    try {
      const str = JSON.stringify(data);
      let hash = 0;
      
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      
      return hash.toString(36);
    } catch {
      return '';
    }
  }
  
  /**
   * Aggiorna statistiche cache
   */
  private updateStats(operation: 'hit' | 'miss' | 'set'): void {
    switch (operation) {
      case 'hit':
        this.stats.hits++;
        break;
      case 'miss':
        this.stats.misses++;
        break;
      case 'set':
        this.stats.size = this.getStorageSize();
        break;
    }
    
    // Salva stats ogni 10 operazioni
    if ((this.stats.hits + this.stats.misses) % 10 === 0) {
      this.saveStats();
    }
  }
  
  /**
   * Carica statistiche cache
   */
  private loadStats(): CacheStats {
    try {
      const stored = this.storage.getItem(this.prefix + '__stats__');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('⚠️ Failed to load cache stats:', error);
    }
    
    return {
      hits: 0,
      misses: 0,
      size: 0,
      lastCleanup: Date.now()
    };
  }
  
  /**
   * Salva statistiche cache
   */
  private saveStats(): void {
    try {
      this.storage.setItem(this.prefix + '__stats__', JSON.stringify(this.stats));
    } catch (error) {
      console.warn('⚠️ Failed to save cache stats:', error);
    }
  }
  
  /**
   * Ottiene statistiche cache per debugging
   */
  getStats(): CacheStats & { hitRate: number; sizeKB: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      sizeKB: Math.round(this.stats.size / 1024 * 100) / 100
    };
  }
  
  /**
   * Pulisce completamente la cache
   */
  clear(): void {
    try {
      const keys = this.getAllKeys();
      for (const key of keys) {
        this.storage.removeItem(key);
      }
      
      this.stats = {
        hits: 0,
        misses: 0,
        size: 0,
        lastCleanup: Date.now()
      };
      
      this.saveStats();
      
      if (import.meta.env.DEV) {
        console.debug('🧹 Cache cleared completely');
      }
    } catch (error) {
      console.warn('⚠️ Cache clear failed:', error);
    }
  }
}

// Istanza singleton per uso globale
export const offlineCache = new OfflineCache();

// Configurazioni TTL per diversi tipi di dati
export const CACHE_TTL = {
  // Dati statici (cambiano raramente)
  tipologie: 24 * 60 * 60 * 1000,    // 24h
  fornitori: 12 * 60 * 60 * 1000,    // 12h
  
  // Dati semi-statici (cambiano occasionalmente)
  vini: 30 * 60 * 1000,              // 30min
  
  // Dati dinamici (cambiano frequentemente)
  giacenze: 5 * 60 * 1000,           // 5min
  ordini: 10 * 60 * 1000,            // 10min
  
  // Dati critici (cambiano molto spesso)
  realtime: 1 * 60 * 1000,           // 1min
} as const;
