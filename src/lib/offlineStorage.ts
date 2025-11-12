/**
 * OFFLINE STORAGE - WINENODE
 * 
 * IndexedDB wrapper per persistenza robusta delle operazioni offline.
 * Governance: Max 200 righe per file.
 */

interface PendingOperation {
  id: string;
  type: 'UPDATE_INVENTORY' | 'UPDATE_MIN_STOCK' | 'UPDATE_WINE';
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

class OfflineStorage {
  private dbName = 'winenode_offline';
  private version = 1;
  private db: IDBDatabase | null = null;

  /**
   * Inizializza IndexedDB
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store per operazioni in coda
        if (!db.objectStoreNames.contains('pending_operations')) {
          const operationsStore = db.createObjectStore('pending_operations', { keyPath: 'id' });
          operationsStore.createIndex('timestamp', 'timestamp');
          operationsStore.createIndex('status', 'status');
        }

        // Store per stato offline
        if (!db.objectStoreNames.contains('offline_state')) {
          db.createObjectStore('offline_state', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Aggiunge operazione alla coda
   */
  async addPendingOperation(operation: Omit<PendingOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<string> {
    if (!this.db) await this.init();

    const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullOperation: PendingOperation = {
      ...operation,
      id,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pending_operations'], 'readwrite');
      const store = transaction.objectStore('pending_operations');
      const request = store.add(fullOperation);

      request.onsuccess = () => {
        if (import.meta.env.DEV) {
          console.log(`📥 Operation queued: ${operation.type} (${id})`);
        }
        resolve(id);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Recupera operazioni in coda
   */
  async getPendingOperations(): Promise<PendingOperation[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pending_operations'], 'readonly');
      const store = transaction.objectStore('pending_operations');
      const index = store.index('status');
      const request = index.getAll('pending');

      request.onsuccess = () => {
        const operations = request.result.sort((a, b) => a.timestamp - b.timestamp);
        resolve(operations);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Aggiorna stato operazione
   */
  async updateOperationStatus(id: string, status: PendingOperation['status'], retryCount?: number): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pending_operations'], 'readwrite');
      const store = transaction.objectStore('pending_operations');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const operation = getRequest.result;
        if (operation) {
          operation.status = status;
          if (retryCount !== undefined) {
            operation.retryCount = retryCount;
          }

          const putRequest = store.put(operation);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Rimuove operazione completata
   */
  async removeOperation(id: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pending_operations'], 'readwrite');
      const store = transaction.objectStore('pending_operations');
      const request = store.delete(id);

      request.onsuccess = () => {
        if (import.meta.env.DEV) {
          console.log(`✅ Operation removed: ${id}`);
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Salva stato offline
   */
  async saveOfflineState(key: string, data: any): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_state'], 'readwrite');
      const store = transaction.objectStore('offline_state');
      const request = store.put({ key, data, timestamp: Date.now() });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Recupera stato offline
   */
  async getOfflineState(key: string): Promise<any> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_state'], 'readonly');
      const store = transaction.objectStore('offline_state');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.data : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Ottiene statistiche storage
   */
  async getStats(): Promise<{ pendingCount: number; completedCount: number; failedCount: number }> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pending_operations'], 'readonly');
      const store = transaction.objectStore('pending_operations');
      const request = store.getAll();

      request.onsuccess = () => {
        const operations = request.result;
        const stats = {
          pendingCount: operations.filter(op => op.status === 'pending').length,
          completedCount: operations.filter(op => op.status === 'completed').length,
          failedCount: operations.filter(op => op.status === 'failed').length
        };
        resolve(stats);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();

// Export types
export type { PendingOperation };
