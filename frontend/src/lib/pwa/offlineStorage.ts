/**
 * Advanced Offline Storage Manager
 * Handles IndexedDB operations for offline booking, caching, and sync
 */

export interface OfflineBooking {
  id: string;
  timestamp: number;
  data: {
    deviceType: string;
    device: any;
    issues: string[];
    photos: string[]; // Base64 encoded images
    customerInfo: {
      name: string;
      email: string;
      phone: string;
      address: string;
    };
    estimatedCost: number;
    priority: 'low' | 'medium' | 'high';
  };
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  retryCount: number;
  lastRetry?: number;
}

export interface CachedResponse {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  data: any;
  timestamp: number;
  expiresAt: number;
}

export interface SyncQueue {
  id: string;
  type: 'booking' | 'message' | 'analytics' | 'photo-upload';
  data: any;
  timestamp: number;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  retryCount: number;
  maxRetries: number;
  lastError?: string;
}

class OfflineStorageManager {
  private db: IDBDatabase | null = null;
  private dbName = 'revivatech-offline';
  private version = 1;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Offline Bookings Store
        if (!db.objectStoreNames.contains('offline-bookings')) {
          const bookingStore = db.createObjectStore('offline-bookings', { keyPath: 'id' });
          bookingStore.createIndex('status', 'status', { unique: false });
          bookingStore.createIndex('timestamp', 'timestamp', { unique: false });
          bookingStore.createIndex('priority', 'data.priority', { unique: false });
        }

        // Cache Store
        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'id' });
          cacheStore.createIndex('url', 'url', { unique: false });
          cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
        }

        // Sync Queue Store
        if (!db.objectStoreNames.contains('sync-queue')) {
          const syncStore = db.createObjectStore('sync-queue', { keyPath: 'id' });
          syncStore.createIndex('type', 'type', { unique: false });
          syncStore.createIndex('status', 'status', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Analytics Store
        if (!db.objectStoreNames.contains('analytics')) {
          const analyticsStore = db.createObjectStore('analytics', { keyPath: 'id' });
          analyticsStore.createIndex('event', 'event', { unique: false });
          analyticsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        console.log('📦 IndexedDB stores created/upgraded');
      };
    });
  }

  // Offline Booking Management
  async saveOfflineBooking(booking: Omit<OfflineBooking, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<string> {
    if (!this.db) await this.initDB();

    const id = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlineBooking: OfflineBooking = {
      id,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
      ...booking
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline-bookings'], 'readwrite');
      const store = transaction.objectStore('offline-bookings');
      const request = store.add(offlineBooking);

      request.onsuccess = () => {
        console.log('📱 Offline booking saved:', id);
        
        // Trigger background sync if available
        this.requestBackgroundSync('offline-bookings');
        
        resolve(id);
      };

      request.onerror = () => {
        console.error('❌ Failed to save offline booking:', request.error);
        reject(request.error);
      };
    });
  }

  async getOfflineBookings(status?: OfflineBooking['status']): Promise<OfflineBooking[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline-bookings'], 'readonly');
      const store = transaction.objectStore('offline-bookings');
      
      let request: IDBRequest;
      if (status) {
        const index = store.index('status');
        request = index.getAll(status);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  async updateBookingStatus(id: string, status: OfflineBooking['status'], error?: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline-bookings'], 'readwrite');
      const store = transaction.objectStore('offline-bookings');
      const request = store.get(id);

      request.onsuccess = () => {
        const booking = request.result;
        if (booking) {
          booking.status = status;
          if (status === 'failed') {
            booking.retryCount++;
            booking.lastRetry = Date.now();
          }
          
          const updateRequest = store.put(booking);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Booking not found'));
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async deleteBooking(id: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline-bookings'], 'readwrite');
      const store = transaction.objectStore('offline-bookings');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('🗑️ Offline booking deleted:', id);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Cache Management
  async cacheResponse(url: string, method: string, data: any, headers: Record<string, string> = {}, ttl: number = 3600000): Promise<void> {
    if (!this.db) await this.initDB();

    const id = `cache_${btoa(url + method).replace(/[+/=]/g, '')}`;
    const cachedResponse: CachedResponse = {
      id,
      url,
      method,
      headers,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(cachedResponse);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getCachedResponse(url: string, method: string): Promise<CachedResponse | null> {
    if (!this.db) await this.initDB();

    const id = `cache_${btoa(url + method).replace(/[+/=]/g, '')}`;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(id);

      request.onsuccess = () => {
        const result = request.result;
        if (result && result.expiresAt > Date.now()) {
          resolve(result);
        } else {
          if (result) {
            // Delete expired cache
            this.deleteCachedResponse(id);
          }
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  async deleteCachedResponse(id: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync Queue Management
  async addToSyncQueue(type: SyncQueue['type'], data: any, maxRetries: number = 3): Promise<string> {
    if (!this.db) await this.initDB();

    const id = `sync_${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const syncItem: SyncQueue = {
      id,
      type,
      data,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
      maxRetries
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync-queue'], 'readwrite');
      const store = transaction.objectStore('sync-queue');
      const request = store.add(syncItem);

      request.onsuccess = () => {
        console.log(`🔄 Added to sync queue (${type}):`, id);
        this.requestBackgroundSync(type);
        resolve(id);
      };

      request.onerror = () => reject(request.error);
    });
  }

  async getSyncQueue(status?: SyncQueue['status']): Promise<SyncQueue[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync-queue'], 'readonly');
      const store = transaction.objectStore('sync-queue');
      
      let request: IDBRequest;
      if (status) {
        const index = store.index('status');
        request = index.getAll(status);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async updateSyncItem(id: string, status: SyncQueue['status'], error?: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['sync-queue'], 'readwrite');
      const store = transaction.objectStore('sync-queue');
      const request = store.get(id);

      request.onsuccess = () => {
        const item = request.result;
        if (item) {
          item.status = status;
          if (status === 'failed') {
            item.retryCount++;
            item.lastError = error;
          }
          
          const updateRequest = store.put(item);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error('Sync item not found'));
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Analytics Storage
  async storeAnalyticsEvent(event: string, data: any): Promise<void> {
    if (!this.db) await this.initDB();

    const id = `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const analyticsEvent = {
      id,
      event,
      data,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['analytics'], 'readwrite');
      const store = transaction.objectStore('analytics');
      const request = store.add(analyticsEvent);

      request.onsuccess = () => {
        this.addToSyncQueue('analytics', analyticsEvent);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Background Sync Request
  private async requestBackgroundSync(tag: string): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
        console.log(`🔄 Background sync requested: ${tag}`);
      } catch (error) {
        console.warn('Background sync not available:', error);
      }
    }
  }

  // Cleanup expired data
  async cleanup(): Promise<void> {
    if (!this.db) await this.initDB();

    const now = Date.now();
    const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

    // Clean expired cache
    const cacheTransaction = this.db!.transaction(['cache'], 'readwrite');
    const cacheStore = cacheTransaction.objectStore('cache');
    const cacheIndex = cacheStore.index('expiresAt');
    const expiredCache = cacheIndex.getAllKeys(IDBKeyRange.upperBound(now));

    expiredCache.onsuccess = () => {
      expiredCache.result.forEach(key => {
        cacheStore.delete(key);
      });
    };

    // Clean old completed sync items
    const syncTransaction = this.db!.transaction(['sync-queue'], 'readwrite');
    const syncStore = syncTransaction.objectStore('sync-queue');
    const syncCursor = syncStore.openCursor();

    syncCursor.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;
      if (cursor) {
        const item = cursor.value;
        if (item.status === 'completed' && item.timestamp < oneWeekAgo) {
          cursor.delete();
        }
        cursor.continue();
      }
    };

    console.log('🧹 Storage cleanup completed');
  }

  // Get storage usage statistics
  async getStorageStats(): Promise<{
    offlineBookings: number;
    cacheEntries: number;
    syncQueueItems: number;
    analyticsEvents: number;
  }> {
    if (!this.db) await this.initDB();

    const counts = await Promise.all([
      this.getCount('offline-bookings'),
      this.getCount('cache'),
      this.getCount('sync-queue'),
      this.getCount('analytics')
    ]);

    return {
      offlineBookings: counts[0],
      cacheEntries: counts[1],
      syncQueueItems: counts[2],
      analyticsEvents: counts[3]
    };
  }

  private async getCount(storeName: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Export singleton instance
export const offlineStorage = new OfflineStorageManager();

// Utility functions
export async function saveOfflineBooking(bookingData: any): Promise<string> {
  return offlineStorage.saveOfflineBooking({
    data: bookingData
  });
}

export async function getPendingBookings(): Promise<OfflineBooking[]> {
  return offlineStorage.getOfflineBookings('pending');
}

export async function cacheApiResponse(url: string, method: string, data: any, ttl?: number): Promise<void> {
  return offlineStorage.cacheResponse(url, method, data, {}, ttl);
}

export async function getCachedApiResponse(url: string, method: string): Promise<any> {
  const cached = await offlineStorage.getCachedResponse(url, method);
  return cached?.data || null;
}

export async function trackOfflineEvent(event: string, data: any): Promise<void> {
  return offlineStorage.storeAnalyticsEvent(event, data);
}

export default offlineStorage;