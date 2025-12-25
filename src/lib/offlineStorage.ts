/**
 * Offline Storage using IndexedDB
 * Provides persistent storage for menu items, orders, and sync queue
 */

const DB_NAME = 'chiyadani-offline';
const DB_VERSION = 1;

interface SyncQueueItem {
  id: string;
  type: 'order' | 'waiterCall';
  data: any;
  timestamp: number;
  retries: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store for cached menu items
        if (!db.objectStoreNames.contains('menuItems')) {
          db.createObjectStore('menuItems', { keyPath: 'id' });
        }

        // Store for cached categories
        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }

        // Store for offline orders (pending sync)
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for settings cache
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Store for cached images (blob URLs)
        if (!db.objectStoreNames.contains('imageCache')) {
          db.createObjectStore('imageCache', { keyPath: 'url' });
        }
      };
    });

    return this.initPromise;
  }

  private async getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  // Menu Items
  async cacheMenuItems(items: any[]): Promise<void> {
    const store = await this.getStore('menuItems', 'readwrite');
    const tx = store.transaction;
    
    // Clear existing
    store.clear();
    
    // Add new items
    for (const item of items) {
      store.put(item);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getMenuItems(): Promise<any[]> {
    const store = await this.getStore('menuItems');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Categories
  async cacheCategories(categories: any[]): Promise<void> {
    const store = await this.getStore('categories', 'readwrite');
    const tx = store.transaction;
    
    store.clear();
    for (const cat of categories) {
      store.put(cat);
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getCategories(): Promise<any[]> {
    const store = await this.getStore('categories');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Sync Queue (for offline orders)
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    const store = await this.getStore('syncQueue', 'readwrite');
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const queueItem: SyncQueueItem = {
      ...item,
      id,
      timestamp: Date.now(),
      retries: 0
    };

    return new Promise((resolve, reject) => {
      const request = store.put(queueItem);
      request.onsuccess = () => resolve(id);
      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const store = await this.getStore('syncQueue');
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    const store = await this.getStore('syncQueue', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncQueueItem(id: string, updates: Partial<SyncQueueItem>): Promise<void> {
    const store = await this.getStore('syncQueue', 'readwrite');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (item) {
          const updated = { ...item, ...updates };
          const putRequest = store.put(updated);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Settings cache
  async cacheSetting(key: string, value: any): Promise<void> {
    const store = await this.getStore('settings', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value, updatedAt: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(key: string): Promise<any | null> {
    const store = await this.getStore('settings');
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value ?? null);
      request.onerror = () => reject(request.error);
    });
  }

  // Check if we have cached data
  async hasCachedData(): Promise<boolean> {
    try {
      const items = await this.getMenuItems();
      return items.length > 0;
    } catch {
      return false;
    }
  }

  // Clear all caches
  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) return;

    const stores = ['menuItems', 'categories', 'settings', 'imageCache'];
    for (const storeName of stores) {
      const store = await this.getStore(storeName, 'readwrite');
      store.clear();
    }
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();

// Background sync manager
export class BackgroundSync {
  private static isProcessing = false;

  static async processSyncQueue(): Promise<void> {
    if (this.isProcessing) return;
    if (!navigator.onLine) return;

    this.isProcessing = true;

    try {
      const queue = await offlineStorage.getSyncQueue();
      
      for (const item of queue) {
        try {
          // Attempt to sync based on type
          if (item.type === 'order') {
            const response = await fetch('/api/orders', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data)
            });

            if (response.ok) {
              await offlineStorage.removeFromSyncQueue(item.id);
              console.log('Synced offline order:', item.id);
            } else {
              throw new Error(`Failed to sync order: ${response.status}`);
            }
          } else if (item.type === 'waiterCall') {
            const response = await fetch('/api/waiter-calls', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.data)
            });

            if (response.ok) {
              await offlineStorage.removeFromSyncQueue(item.id);
            }
          }
        } catch (error) {
          console.error('Failed to sync item:', item.id, error);
          // Increment retry count
          await offlineStorage.updateSyncQueueItem(item.id, {
            retries: item.retries + 1
          });

          // Remove if too many retries
          if (item.retries >= 5) {
            await offlineStorage.removeFromSyncQueue(item.id);
            console.error('Removed item after max retries:', item.id);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  static startAutoSync(intervalMs = 30000): () => void {
    // Process immediately
    this.processSyncQueue();

    // Set up interval
    const intervalId = setInterval(() => {
      this.processSyncQueue();
    }, intervalMs);

    // Listen for online events
    const onlineHandler = () => {
      console.log('Back online, processing sync queue...');
      this.processSyncQueue();
    };
    window.addEventListener('online', onlineHandler);

    // Return cleanup function
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', onlineHandler);
    };
  }
}
