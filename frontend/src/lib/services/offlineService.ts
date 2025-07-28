/**
 * Advanced Offline Service for RevivaTech PWA
 * Handles offline data synchronization, background sync, and conflict resolution
 */

export interface OfflineQueueItem {
  id: string;
  type: 'booking' | 'payment' | 'file_upload' | 'status_update';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  url: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
}

export interface SyncResult {
  success: boolean;
  id: string;
  error?: string;
  response?: any;
}

export interface OfflineStorage {
  bookings: Map<string, any>;
  devices: Map<string, any>;
  categories: Map<string, any>;
  userPreferences: Map<string, any>;
  lastSync: number;
}

class OfflineService {
  private db: IDBDatabase | null = null;
  private syncQueue: OfflineQueueItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private storage: OfflineStorage;

  constructor() {
    this.storage = {
      bookings: new Map(),
      devices: new Map(),
      categories: new Map(),
      userPreferences: new Map(),
      lastSync: 0
    };

    this.initializeDB();
    this.setupEventListeners();
    this.loadOfflineData();
  }

  /**
   * Initialize IndexedDB for offline storage
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('RevivaTechOfflineDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('syncQueue')) {
          db.createObjectStore('syncQueue', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('bookings')) {
          const bookingsStore = db.createObjectStore('bookings', { keyPath: 'id' });
          bookingsStore.createIndex('status', 'status', { unique: false });
          bookingsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('devices')) {
          db.createObjectStore('devices', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('categories')) {
          db.createObjectStore('categories', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('files')) {
          const filesStore = db.createObjectStore('files', { keyPath: 'id' });
          filesStore.createIndex('bookingId', 'bookingId', { unique: false });
        }

        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Setup event listeners for online/offline status
   */
  private setupEventListeners(): void {
    window.addEventListener('online', () => {
      console.log('📶 Connection restored - starting sync');
      this.isOnline = true;
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      console.log('📵 Connection lost - switching to offline mode');
      this.isOnline = false;
    });

    // Register for background sync if available
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.sync.register('background-sync');
      });
    }
  }

  /**
   * Load offline data from IndexedDB
   */
  private async loadOfflineData(): Promise<void> {
    if (!this.db) return;

    try {
      // Load sync queue
      const queueData = await this.getFromStore('syncQueue');
      this.syncQueue = queueData || [];

      // Load last sync timestamp
      const metadata = await this.getFromStore('metadata', 'lastSync');
      this.storage.lastSync = metadata?.value || 0;

      console.log(`📦 Loaded ${this.syncQueue.length} items from offline queue`);
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
  }

  /**
   * Add item to sync queue for offline processing
   */
  async addToSyncQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    const queueItem: OfflineQueueItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    this.syncQueue.push(queueItem);
    
    // Save to IndexedDB
    await this.saveToStore('syncQueue', queueItem);

    console.log(`📋 Added item to sync queue: ${queueItem.type} (${queueItem.id})`);

    // Process immediately if online
    if (this.isOnline && !this.syncInProgress) {
      this.processSyncQueue();
    }

    return queueItem.id;
  }

  /**
   * Process sync queue when online
   */
  async processSyncQueue(): Promise<SyncResult[]> {
    if (!this.isOnline || this.syncInProgress || this.syncQueue.length === 0) {
      return [];
    }

    console.log(`🔄 Processing sync queue: ${this.syncQueue.length} items`);
    this.syncInProgress = true;

    const results: SyncResult[] = [];
    const itemsToProcess = [...this.syncQueue];

    for (const item of itemsToProcess) {
      try {
        const result = await this.syncItem(item);
        results.push(result);

        if (result.success) {
          // Remove from queue
          this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
          await this.removeFromStore('syncQueue', item.id);
          console.log(`✅ Synced: ${item.type} (${item.id})`);
        } else {
          // Increment retry count
          item.retryCount++;
          if (item.retryCount >= item.maxRetries) {
            console.error(`❌ Max retries exceeded for: ${item.type} (${item.id})`);
            this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
            await this.removeFromStore('syncQueue', item.id);
          } else {
            await this.saveToStore('syncQueue', item);
            console.warn(`⚠️ Retry ${item.retryCount}/${item.maxRetries}: ${item.type} (${item.id})`);
          }
        }
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        results.push({
          success: false,
          id: item.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    this.syncInProgress = false;
    
    // Update last sync timestamp
    this.storage.lastSync = Date.now();
    await this.saveToStore('metadata', { key: 'lastSync', value: this.storage.lastSync });

    console.log(`🎯 Sync complete: ${results.filter(r => r.success).length}/${results.length} successful`);
    return results;
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: OfflineQueueItem): Promise<SyncResult> {
    try {
      const response = await fetch(item.url, {
        method: item.method,
        headers: {
          'Content-Type': 'application/json',
          ...item.headers
        },
        body: JSON.stringify(item.data)
      });

      if (response.ok) {
        const responseData = await response.json();
        return {
          success: true,
          id: item.id,
          response: responseData
        };
      } else {
        return {
          success: false,
          id: item.id,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }
    } catch (error) {
      return {
        success: false,
        id: item.id,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  /**
   * Save booking offline
   */
  async saveBookingOffline(booking: any): Promise<void> {
    booking.offline = true;
    booking.lastModified = Date.now();
    
    this.storage.bookings.set(booking.id, booking);
    await this.saveToStore('bookings', booking);

    // Add to sync queue
    await this.addToSyncQueue({
      type: 'booking',
      data: booking,
      url: '/api/bookings',
      method: 'POST',
      maxRetries: 3
    });

    console.log(`💾 Saved booking offline: ${booking.id}`);
  }

  /**
   * Get bookings (online + offline)
   */
  async getBookings(): Promise<any[]> {
    const bookings: any[] = [];

    // Get offline bookings
    const offlineBookings = await this.getAllFromStore('bookings');
    bookings.push(...offlineBookings);

    // Get online bookings if connected
    if (this.isOnline) {
      try {
        const response = await fetch('/api/bookings');
        if (response.ok) {
          const onlineBookings = await response.json();
          
          // Merge with offline bookings (avoid duplicates)
          for (const onlineBooking of onlineBookings) {
            const existing = bookings.find(b => b.id === onlineBooking.id);
            if (!existing) {
              bookings.push(onlineBooking);
            } else if (!existing.offline) {
              // Update with online version if not modified offline
              Object.assign(existing, onlineBooking);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch online bookings:', error);
      }
    }

    return bookings.sort((a, b) => (b.lastModified || b.createdAt || 0) - (a.lastModified || a.createdAt || 0));
  }

  /**
   * Cache static data for offline use
   */
  async cacheStaticData(): Promise<void> {
    if (!this.isOnline) return;

    try {
      // Cache devices
      const devicesResponse = await fetch('/api/devices');
      if (devicesResponse.ok) {
        const devices = await devicesResponse.json();
        for (const device of devices) {
          this.storage.devices.set(device.id, device);
          await this.saveToStore('devices', device);
        }
        console.log(`📱 Cached ${devices.length} devices`);
      }

      // Cache categories
      const categoriesResponse = await fetch('/api/categories');
      if (categoriesResponse.ok) {
        const categories = await categoriesResponse.json();
        for (const category of categories) {
          this.storage.categories.set(category.id, category);
          await this.saveToStore('categories', category);
        }
        console.log(`📂 Cached ${categories.length} categories`);
      }
    } catch (error) {
      console.error('Failed to cache static data:', error);
    }
  }

  /**
   * Get cached devices
   */
  async getCachedDevices(): Promise<any[]> {
    return await this.getAllFromStore('devices');
  }

  /**
   * Get cached categories
   */
  async getCachedCategories(): Promise<any[]> {
    return await this.getAllFromStore('categories');
  }

  /**
   * Check if data is stale and needs refresh
   */
  isDataStale(maxAge: number = 24 * 60 * 60 * 1000): boolean {
    return Date.now() - this.storage.lastSync > maxAge;
  }

  /**
   * Get sync queue status
   */
  getSyncStatus(): { queueLength: number; isOnline: boolean; lastSync: number; syncInProgress: boolean } {
    return {
      queueLength: this.syncQueue.length,
      isOnline: this.isOnline,
      lastSync: this.storage.lastSync,
      syncInProgress: this.syncInProgress
    };
  }

  /**
   * Clear all offline data
   */
  async clearOfflineData(): Promise<void> {
    if (!this.db) return;

    const stores = ['syncQueue', 'bookings', 'devices', 'categories', 'files'];
    
    for (const storeName of stores) {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      await store.clear();
    }

    this.syncQueue = [];
    this.storage = {
      bookings: new Map(),
      devices: new Map(),
      categories: new Map(),
      userPreferences: new Map(),
      lastSync: 0
    };

    console.log('🗑️ Cleared all offline data');
  }

  // Helper methods for IndexedDB operations
  private async saveToStore(storeName: string, data: any): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  private async getFromStore(storeName: string, key?: string): Promise<any> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = key ? store.get(key) : store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  private async getAllFromStore(storeName: string): Promise<any[]> {
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  private async removeFromStore(storeName: string, key: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }
}

// Export singleton instance
export const offlineService = new OfflineService();
export default offlineService;