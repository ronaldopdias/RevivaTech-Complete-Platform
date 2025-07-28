'use client';

// Advanced Offline Service with Conflict Resolution and Smart Sync
interface SyncQueueItem {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retryCount: number;
  priority: 'high' | 'medium' | 'low';
}

interface ConflictResolution {
  strategy: 'client_wins' | 'server_wins' | 'merge' | 'manual';
  resolvedData?: any;
}

interface SyncResult {
  success: boolean;
  conflicts: any[];
  synchronized: number;
  failed: number;
}

class AdvancedOfflineService {
  private db: IDBDatabase | null = null;
  private syncQueue: SyncQueueItem[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;
  private eventTarget = new EventTarget();

  constructor() {
    this.initializeDB();
    this.setupNetworkListeners();
    this.loadSyncQueue();
  }

  // Initialize IndexedDB with advanced schema
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('RevivaTechAdvanced', 3);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores if they don't exist
        const stores = [
          'bookings',
          'customers', 
          'devices',
          'repairs',
          'offline_queue',
          'conflict_log',
          'sync_metadata'
        ];

        stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            
            // Add indexes for efficient querying
            if (storeName === 'bookings') {
              store.createIndex('customerId', 'customerId', { unique: false });
              store.createIndex('status', 'status', { unique: false });
              store.createIndex('createdAt', 'createdAt', { unique: false });
            }
            
            if (storeName === 'offline_queue') {
              store.createIndex('timestamp', 'timestamp', { unique: false });
              store.createIndex('priority', 'priority', { unique: false });
              store.createIndex('type', 'type', { unique: false });
            }
          }
        });
      };
    });
  }

  // Setup network connectivity listeners
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.eventTarget.dispatchEvent(new CustomEvent('network', { detail: { online: true } }));
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.eventTarget.dispatchEvent(new CustomEvent('network', { detail: { online: false } }));
    });

    // Advanced connection monitoring
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        this.eventTarget.dispatchEvent(new CustomEvent('connection', { 
          detail: { 
            effectiveType: connection.effectiveType,
            downlink: connection.downlink,
            rtt: connection.rtt
          }
        }));
      });
    }
  }

  // Enhanced data storage with conflict detection
  async store(table: string, data: any, syncImmediate: boolean = false): Promise<void> {
    if (!this.db) await this.initializeDB();

    const transaction = this.db!.transaction([table, 'sync_metadata'], 'readwrite');
    const store = transaction.objectStore(table);
    const metaStore = transaction.objectStore('sync_metadata');

    // Add metadata for conflict detection
    const enhancedData = {
      ...data,
      lastModified: Date.now(),
      version: (data.version || 0) + 1,
      clientId: this.getClientId(),
      needsSync: !this.isOnline || syncImmediate
    };

    await store.put(enhancedData);
    
    // Store sync metadata
    await metaStore.put({
      id: `${table}_${data.id}`,
      table,
      recordId: data.id,
      lastSynced: this.isOnline ? Date.now() : 0,
      localVersion: enhancedData.version,
      serverVersion: data.serverVersion || 0
    });

    // Add to sync queue if offline or immediate sync requested
    if (!this.isOnline || syncImmediate) {
      this.addToSyncQueue('update', table, enhancedData, 'medium');
    }

    this.eventTarget.dispatchEvent(new CustomEvent('dataStored', { 
      detail: { table, id: data.id, needsSync: enhancedData.needsSync } 
    }));
  }

  // Retrieve data with freshness indicators
  async retrieve(table: string, id?: string): Promise<any> {
    if (!this.db) await this.initializeDB();

    const transaction = this.db!.transaction([table, 'sync_metadata'], 'readonly');
    const store = transaction.objectStore(table);
    const metaStore = transaction.objectStore('sync_metadata');

    if (id) {
      const data = await this.promisifyRequest(store.get(id));
      if (data) {
        const meta = await this.promisifyRequest(metaStore.get(`${table}_${id}`));
        return {
          ...data,
          _meta: {
            needsSync: data.needsSync || false,
            lastSynced: meta?.lastSynced || 0,
            freshness: this.calculateFreshness(meta?.lastSynced || 0)
          }
        };
      }
      return null;
    } else {
      const allData = await this.promisifyRequest(store.getAll());
      return Promise.all(allData.map(async (item: any) => {
        const meta = await this.promisifyRequest(metaStore.get(`${table}_${item.id}`));
        return {
          ...item,
          _meta: {
            needsSync: item.needsSync || false,
            lastSynced: meta?.lastSynced || 0,
            freshness: this.calculateFreshness(meta?.lastSynced || 0)
          }
        };
      }));
    }
  }

  // Advanced sync with conflict resolution
  async synchronize(): Promise<SyncResult> {
    if (this.syncInProgress) {
      return { success: false, conflicts: [], synchronized: 0, failed: 0 };
    }

    this.syncInProgress = true;
    let synchronized = 0;
    let failed = 0;
    const conflicts: any[] = [];

    try {
      // Process sync queue
      const queue = await this.getSyncQueue();
      
      for (const item of queue) {
        try {
          const result = await this.syncItem(item);
          
          if (result.conflict) {
            conflicts.push(result.conflict);
            
            // Apply conflict resolution strategy
            const resolution = await this.resolveConflict(result.conflict);
            if (resolution.strategy !== 'manual') {
              await this.applySyncResult(item, resolution.resolvedData);
              synchronized++;
            }
          } else {
            await this.applySyncResult(item, result.data);
            synchronized++;
          }
          
          // Remove from queue
          await this.removeFromSyncQueue(item.id);
          
        } catch (error) {
          console.error('Sync item failed:', item, error);
          
          // Increment retry count
          item.retryCount++;
          if (item.retryCount < 3) {
            await this.updateSyncQueueItem(item);
          } else {
            await this.removeFromSyncQueue(item.id);
            failed++;
          }
        }
      }

      // Download server changes
      await this.downloadServerChanges();

      this.eventTarget.dispatchEvent(new CustomEvent('syncComplete', { 
        detail: { synchronized, failed, conflicts: conflicts.length } 
      }));

      return { success: true, conflicts, synchronized, failed };

    } finally {
      this.syncInProgress = false;
    }
  }

  // Smart sync based on connection quality
  async smartSync(): Promise<void> {
    if (!this.isOnline) return;

    const connection = (navigator as any).connection;
    const effectiveType = connection?.effectiveType || '4g';
    
    // Adjust sync strategy based on connection
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        // Only sync high priority items
        await this.syncByPriority('high');
        break;
        
      case '3g':
        // Sync high and medium priority
        await this.syncByPriority(['high', 'medium']);
        break;
        
      case '4g':
      default:
        // Full sync
        await this.synchronize();
        break;
    }
  }

  // Conflict resolution strategies
  private async resolveConflict(conflict: any): Promise<ConflictResolution> {
    const { strategy, clientData, serverData } = conflict;
    
    switch (strategy) {
      case 'client_wins':
        return { strategy: 'client_wins', resolvedData: clientData };
        
      case 'server_wins':
        return { strategy: 'server_wins', resolvedData: serverData };
        
      case 'merge':
        // Intelligent merge based on field types
        const merged = this.mergeData(clientData, serverData);
        return { strategy: 'merge', resolvedData: merged };
        
      case 'manual':
      default:
        // Store conflict for manual resolution
        await this.storeConflict(conflict);
        return { strategy: 'manual' };
    }
  }

  // Intelligent data merging
  private mergeData(clientData: any, serverData: any): any {
    const merged = { ...serverData };
    
    // Merge rules based on field types
    Object.keys(clientData).forEach(key => {
      const clientValue = clientData[key];
      const serverValue = serverData[key];
      
      if (key === 'lastModified' || key === 'updatedAt') {
        // Use latest timestamp
        merged[key] = Math.max(clientValue, serverValue);
      } else if (Array.isArray(clientValue) && Array.isArray(serverValue)) {
        // Merge arrays uniquely
        merged[key] = [...new Set([...serverValue, ...clientValue])];
      } else if (typeof clientValue === 'object' && typeof serverValue === 'object') {
        // Recursively merge objects
        merged[key] = this.mergeData(clientValue, serverValue);
      } else if (clientData.lastModified > serverData.lastModified) {
        // Use client value if it's newer
        merged[key] = clientValue;
      }
    });
    
    return merged;
  }

  // Background sync registration
  async registerBackgroundSync(tag: string): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(tag);
      } catch (error) {
        console.warn('Background sync registration failed:', error);
      }
    }
  }

  // Sync queue management
  private async addToSyncQueue(
    type: SyncQueueItem['type'], 
    table: string, 
    data: any, 
    priority: SyncQueueItem['priority'] = 'medium'
  ): Promise<void> {
    const item: SyncQueueItem = {
      id: `${type}_${table}_${data.id}_${Date.now()}`,
      type,
      table,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      priority
    };

    this.syncQueue.push(item);
    await this.persistSyncQueue();
  }

  private async getSyncQueue(): Promise<SyncQueueItem[]> {
    if (!this.db) await this.initializeDB();
    
    const transaction = this.db!.transaction(['offline_queue'], 'readonly');
    const store = transaction.objectStore('offline_queue');
    const items = await this.promisifyRequest(store.getAll());
    
    // Sort by priority and timestamp
    return items.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return a.timestamp - b.timestamp;
    });
  }

  // Utility methods
  private promisifyRequest(request: IDBRequest): Promise<any> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private calculateFreshness(lastSynced: number): 'fresh' | 'stale' | 'outdated' {
    const now = Date.now();
    const ageMinutes = (now - lastSynced) / (1000 * 60);
    
    if (ageMinutes < 5) return 'fresh';
    if (ageMinutes < 60) return 'stale';
    return 'outdated';
  }

  private getClientId(): string {
    let clientId = localStorage.getItem('reviva_client_id');
    if (!clientId) {
      clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('reviva_client_id', clientId);
    }
    return clientId;
  }

  // Event subscription
  addEventListener(type: string, listener: EventListener): void {
    this.eventTarget.addEventListener(type, listener);
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.eventTarget.removeEventListener(type, listener);
  }

  // Status getters
  isOffline(): boolean {
    return !this.isOnline;
  }

  getPendingSyncCount(): number {
    return this.syncQueue.length;
  }

  getSyncStatus(): string {
    if (this.syncInProgress) return 'syncing';
    if (!this.isOnline) return 'offline';
    if (this.syncQueue.length > 0) return 'pending';
    return 'synchronized';
  }

  // Placeholder methods (implement based on your API)
  private async syncItem(item: SyncQueueItem): Promise<any> {
    // Implement actual API sync logic
    return { success: true, data: item.data };
  }

  private async downloadServerChanges(): Promise<void> {
    // Implement server change download
  }

  private async applySyncResult(item: SyncQueueItem, data: any): Promise<void> {
    // Apply synchronized data to local storage
  }

  private async loadSyncQueue(): Promise<void> {
    // Load queue from IndexedDB
  }

  private async persistSyncQueue(): Promise<void> {
    // Persist queue to IndexedDB
  }

  private async removeFromSyncQueue(id: string): Promise<void> {
    // Remove item from queue
  }

  private async updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
    // Update queue item
  }

  private async syncByPriority(priorities: string | string[]): Promise<void> {
    // Sync only items with specified priorities
  }

  private async storeConflict(conflict: any): Promise<void> {
    // Store conflict for manual resolution
  }
}

// Create singleton instance
export const advancedOfflineService = new AdvancedOfflineService();

// React hook for offline service
export function useAdvancedOffline() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [syncStatus, setSyncStatus] = React.useState<string>('synchronized');
  const [pendingSync, setPendingSync] = React.useState(0);

  React.useEffect(() => {
    const handleNetwork = (event: any) => {
      setIsOnline(event.detail.online);
    };

    const handleSyncComplete = (event: any) => {
      setSyncStatus('synchronized');
      setPendingSync(0);
    };

    advancedOfflineService.addEventListener('network', handleNetwork);
    advancedOfflineService.addEventListener('syncComplete', handleSyncComplete);

    // Update status periodically
    const statusInterval = setInterval(() => {
      setSyncStatus(advancedOfflineService.getSyncStatus());
      setPendingSync(advancedOfflineService.getPendingSyncCount());
    }, 1000);

    return () => {
      advancedOfflineService.removeEventListener('network', handleNetwork);
      advancedOfflineService.removeEventListener('syncComplete', handleSyncComplete);
      clearInterval(statusInterval);
    };
  }, []);

  return {
    isOnline,
    syncStatus,
    pendingSync,
    store: advancedOfflineService.store.bind(advancedOfflineService),
    retrieve: advancedOfflineService.retrieve.bind(advancedOfflineService),
    synchronize: advancedOfflineService.synchronize.bind(advancedOfflineService),
    smartSync: advancedOfflineService.smartSync.bind(advancedOfflineService)
  };
}

export default advancedOfflineService;