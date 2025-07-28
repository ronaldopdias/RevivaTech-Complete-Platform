import CRMAdapter, { CRMContact, CRMDeal, CRMActivity, CRMSyncResult } from './CRMAdapter';
import { useWebSocket } from '../realtime/WebSocketProvider';

interface SyncJob {
  id: string;
  crmType: string;
  objectType: 'contacts' | 'deals' | 'activities' | 'all';
  direction: 'push' | 'pull' | 'bidirectional';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number; // 0-100
  recordsTotal: number;
  recordsProcessed: number;
  recordsSuccessful: number;
  recordsFailed: number;
  startTime: string;
  endTime?: string;
  errorLog: string[];
  conflictLog: {
    objectId: string;
    localData: any;
    remoteData: any;
    resolution: 'local_wins' | 'remote_wins' | 'manual' | 'skip';
    timestamp: string;
  }[];
}

interface SyncConflict {
  id: string;
  jobId: string;
  objectType: string;
  objectId: string;
  localData: any;
  remoteData: any;
  localTimestamp: string;
  remoteTimestamp: string;
  status: 'pending' | 'resolved' | 'skipped';
  resolution?: 'local_wins' | 'remote_wins' | 'merge' | 'skip';
  resolvedBy?: string;
  resolvedAt?: string;
}

interface SyncMapping {
  crmType: string;
  localField: string;
  remoteField: string;
  transformation?: (value: any) => any;
  direction: 'bidirectional' | 'push_only' | 'pull_only';
}

interface SyncConfig {
  enabled: boolean;
  autoSync: boolean;
  syncInterval: number; // minutes
  batchSize: number;
  maxConcurrentJobs: number;
  conflictResolution: 'local_wins' | 'remote_wins' | 'newest_wins' | 'manual';
  retryAttempts: number;
  retryDelay: number; // milliseconds
  mappings: {
    contacts: SyncMapping[];
    deals: SyncMapping[];
    activities: SyncMapping[];
  };
  filters: {
    contacts?: Record<string, any>;
    deals?: Record<string, any>;
    activities?: Record<string, any>;
  };
}

export class DataSynchronizer {
  private adapters: Map<string, CRMAdapter> = new Map();
  private activeJobs: Map<string, SyncJob> = new Map();
  private jobHistory: SyncJob[] = [];
  private conflicts: Map<string, SyncConflict> = new Map();
  private config: SyncConfig;
  private syncTimer?: NodeJS.Timeout;

  constructor(config: SyncConfig) {
    this.config = config;
    
    if (config.autoSync && config.enabled) {
      this.startAutoSync();
    }
  }

  // Register CRM adapter
  registerAdapter(crmType: string, adapter: CRMAdapter): void {
    this.adapters.set(crmType, adapter);
  }

  // Start a synchronization job
  async startSync(
    crmType: string,
    objectType: 'contacts' | 'deals' | 'activities' | 'all',
    direction: 'push' | 'pull' | 'bidirectional' = 'bidirectional'
  ): Promise<string> {
    const adapter = this.adapters.get(crmType);
    if (!adapter) {
      throw new Error(`No adapter registered for CRM type: ${crmType}`);
    }

    if (this.activeJobs.size >= this.config.maxConcurrentJobs) {
      throw new Error('Maximum concurrent sync jobs reached');
    }

    const job: SyncJob = {
      id: `sync_${crmType}_${objectType}_${Date.now()}`,
      crmType,
      objectType,
      direction,
      status: 'pending',
      progress: 0,
      recordsTotal: 0,
      recordsProcessed: 0,
      recordsSuccessful: 0,
      recordsFailed: 0,
      startTime: new Date().toISOString(),
      errorLog: [],
      conflictLog: []
    };

    this.activeJobs.set(job.id, job);
    
    // Start sync in background
    this.executeSync(job, adapter).catch(error => {
      console.error(`Sync job ${job.id} failed:`, error);
      job.status = 'failed';
      job.endTime = new Date().toISOString();
      job.errorLog.push(error.message);
    });

    return job.id;
  }

  // Execute synchronization
  private async executeSync(job: SyncJob, adapter: CRMAdapter): Promise<void> {
    try {
      job.status = 'running';
      this.broadcastJobUpdate(job);

      let result: CRMSyncResult;

      switch (job.objectType) {
        case 'contacts':
          result = await this.syncContacts(job, adapter);
          break;
        case 'deals':
          result = await this.syncDeals(job, adapter);
          break;
        case 'activities':
          result = await this.syncActivities(job, adapter);
          break;
        case 'all':
          result = await this.syncAll(job, adapter);
          break;
        default:
          throw new Error(`Unsupported object type: ${job.objectType}`);
      }

      job.status = result.success ? 'completed' : 'failed';
      job.progress = 100;
      job.endTime = new Date().toISOString();
      
      if (result.errors) {
        job.errorLog.push(...result.errors);
      }

    } catch (error) {
      job.status = 'failed';
      job.endTime = new Date().toISOString();
      job.errorLog.push(error.message);
    } finally {
      // Move job to history and remove from active jobs
      this.jobHistory.unshift(job);
      this.activeJobs.delete(job.id);
      
      // Keep only last 100 jobs in history
      if (this.jobHistory.length > 100) {
        this.jobHistory = this.jobHistory.slice(0, 100);
      }

      this.broadcastJobUpdate(job);
    }
  }

  // Sync contacts
  private async syncContacts(job: SyncJob, adapter: CRMAdapter): Promise<CRMSyncResult> {
    let recordsProcessed = 0;
    let recordsSuccessful = 0;
    let recordsFailed = 0;
    const errors: string[] = [];

    try {
      if (job.direction === 'pull' || job.direction === 'bidirectional') {
        // Pull contacts from CRM
        const { contacts, total } = await adapter.listContacts({ 
          limit: this.config.batchSize,
          filters: this.config.filters.contacts 
        });
        
        job.recordsTotal += total;

        for (const remoteContact of contacts) {
          try {
            await this.processContactSync(remoteContact, 'pull', job);
            recordsSuccessful++;
          } catch (error) {
            recordsFailed++;
            errors.push(`Contact ${remoteContact.id}: ${error.message}`);
          }
          
          recordsProcessed++;
          job.recordsProcessed = recordsProcessed;
          job.progress = Math.floor((recordsProcessed / job.recordsTotal) * 100);
          
          if (recordsProcessed % 10 === 0) {
            this.broadcastJobUpdate(job);
          }
        }
      }

      if (job.direction === 'push' || job.direction === 'bidirectional') {
        // Push local contacts to CRM
        const localContacts = await this.getLocalContacts(this.config.filters.contacts);
        
        if (job.direction === 'push') {
          job.recordsTotal = localContacts.length;
        }

        for (const localContact of localContacts) {
          try {
            await this.processContactSync(localContact, 'push', job, adapter);
            recordsSuccessful++;
          } catch (error) {
            recordsFailed++;
            errors.push(`Local contact ${localContact.id}: ${error.message}`);
          }
          
          recordsProcessed++;
          job.recordsProcessed = recordsProcessed;
          job.progress = Math.floor((recordsProcessed / job.recordsTotal) * 100);
          
          if (recordsProcessed % 10 === 0) {
            this.broadcastJobUpdate(job);
          }
        }
      }

      return {
        success: recordsFailed === 0,
        recordsProcessed,
        recordsCreated: recordsSuccessful,
        recordsUpdated: 0,
        recordsFailed,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      return {
        success: false,
        message: `Contact sync failed: ${error.message}`,
        errors: [error.message]
      };
    }
  }

  // Process individual contact sync
  private async processContactSync(
    contact: CRMContact, 
    direction: 'push' | 'pull',
    job: SyncJob,
    adapter?: CRMAdapter
  ): Promise<void> {
    if (direction === 'pull') {
      // Check if contact exists locally
      const localContact = await this.findLocalContactByEmail(contact.email);
      
      if (localContact) {
        // Check for conflicts
        const conflict = this.detectContactConflict(localContact, contact);
        if (conflict) {
          await this.handleSyncConflict(conflict, job);
          return;
        }
        
        // Update local contact
        await this.updateLocalContact(localContact.id, contact);
      } else {
        // Create new local contact
        await this.createLocalContact(contact);
      }
    } else if (direction === 'push' && adapter) {
      // Check if contact exists in CRM
      const remoteContacts = await adapter.searchContacts(contact.email);
      
      if (remoteContacts.length > 0) {
        // Update existing contact
        const remoteContact = remoteContacts[0];
        const conflict = this.detectContactConflict(contact, remoteContact);
        
        if (conflict) {
          await this.handleSyncConflict(conflict, job);
          return;
        }
        
        await adapter.updateContact(remoteContact.id, contact);
      } else {
        // Create new contact in CRM
        await adapter.createContact(contact);
      }
    }
  }

  // Sync deals
  private async syncDeals(job: SyncJob, adapter: CRMAdapter): Promise<CRMSyncResult> {
    // Similar implementation to syncContacts but for deals
    return {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0
    };
  }

  // Sync activities
  private async syncActivities(job: SyncJob, adapter: CRMAdapter): Promise<CRMSyncResult> {
    // Similar implementation to syncContacts but for activities
    return {
      success: true,
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0
    };
  }

  // Sync all object types
  private async syncAll(job: SyncJob, adapter: CRMAdapter): Promise<CRMSyncResult> {
    const contactResult = await this.syncContacts(job, adapter);
    const dealResult = await this.syncDeals(job, adapter);
    const activityResult = await this.syncActivities(job, adapter);

    return {
      success: contactResult.success && dealResult.success && activityResult.success,
      recordsProcessed: (contactResult.recordsProcessed || 0) + (dealResult.recordsProcessed || 0) + (activityResult.recordsProcessed || 0),
      recordsCreated: (contactResult.recordsCreated || 0) + (dealResult.recordsCreated || 0) + (activityResult.recordsCreated || 0),
      recordsUpdated: (contactResult.recordsUpdated || 0) + (dealResult.recordsUpdated || 0) + (activityResult.recordsUpdated || 0),
      recordsFailed: (contactResult.recordsFailed || 0) + (dealResult.recordsFailed || 0) + (activityResult.recordsFailed || 0),
      errors: [...(contactResult.errors || []), ...(dealResult.errors || []), ...(activityResult.errors || [])]
    };
  }

  // Conflict detection and resolution
  private detectContactConflict(localContact: CRMContact, remoteContact: CRMContact): SyncConflict | null {
    const localTimestamp = new Date(localContact.updatedAt);
    const remoteTimestamp = new Date(remoteContact.updatedAt);

    // Check if there are actual differences
    const hasChanges = localContact.firstName !== remoteContact.firstName ||
                      localContact.lastName !== remoteContact.lastName ||
                      localContact.phone !== remoteContact.phone ||
                      JSON.stringify(localContact.address) !== JSON.stringify(remoteContact.address);

    if (!hasChanges) {
      return null; // No conflict
    }

    // If auto-resolution is configured
    if (this.config.conflictResolution === 'newest_wins') {
      return localTimestamp > remoteTimestamp ? null : null; // Auto-resolve
    }

    if (this.config.conflictResolution === 'local_wins' || this.config.conflictResolution === 'remote_wins') {
      return null; // Auto-resolve based on preference
    }

    // Manual resolution required
    return {
      id: `conflict_${localContact.id}_${remoteContact.id}_${Date.now()}`,
      jobId: '', // Will be set by caller
      objectType: 'contact',
      objectId: localContact.id,
      localData: localContact,
      remoteData: remoteContact,
      localTimestamp: localContact.updatedAt,
      remoteTimestamp: remoteContact.updatedAt,
      status: 'pending'
    };
  }

  private async handleSyncConflict(conflict: SyncConflict, job: SyncJob): Promise<void> {
    conflict.jobId = job.id;
    this.conflicts.set(conflict.id, conflict);
    
    job.conflictLog.push({
      objectId: conflict.objectId,
      localData: conflict.localData,
      remoteData: conflict.remoteData,
      resolution: 'manual',
      timestamp: new Date().toISOString()
    });

    // Auto-resolve based on configuration
    if (this.config.conflictResolution !== 'manual') {
      await this.resolveConflict(conflict.id, this.config.conflictResolution);
    }
  }

  // Resolve sync conflict
  async resolveConflict(
    conflictId: string, 
    resolution: 'local_wins' | 'remote_wins' | 'merge' | 'skip',
    resolvedBy?: string
  ): Promise<void> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    conflict.resolution = resolution;
    conflict.resolvedBy = resolvedBy || 'system';
    conflict.resolvedAt = new Date().toISOString();
    conflict.status = resolution === 'skip' ? 'skipped' : 'resolved';

    switch (resolution) {
      case 'local_wins':
        await this.applyLocalData(conflict);
        break;
      case 'remote_wins':
        await this.applyRemoteData(conflict);
        break;
      case 'merge':
        await this.mergeConflictData(conflict);
        break;
      case 'skip':
        // Do nothing
        break;
    }
  }

  // Get sync status
  getSyncStatus(): {
    activeJobs: SyncJob[];
    recentJobs: SyncJob[];
    pendingConflicts: SyncConflict[];
    totalSynced: number;
  } {
    return {
      activeJobs: Array.from(this.activeJobs.values()),
      recentJobs: this.jobHistory.slice(0, 10),
      pendingConflicts: Array.from(this.conflicts.values()).filter(c => c.status === 'pending'),
      totalSynced: this.jobHistory.filter(j => j.status === 'completed').length
    };
  }

  // Cancel sync job
  async cancelSync(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId);
    if (!job) {
      return false;
    }

    job.status = 'cancelled';
    job.endTime = new Date().toISOString();
    
    this.jobHistory.unshift(job);
    this.activeJobs.delete(jobId);
    
    this.broadcastJobUpdate(job);
    return true;
  }

  // Auto-sync management
  private startAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      for (const [crmType] of this.adapters.entries()) {
        try {
          await this.startSync(crmType, 'all', 'bidirectional');
        } catch (error) {
          console.error(`Auto-sync failed for ${crmType}:`, error);
        }
      }
    }, this.config.syncInterval * 60 * 1000);
  }

  stopAutoSync(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = undefined;
    }
  }

  updateConfig(updates: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...updates };
    
    if (updates.autoSync !== undefined) {
      if (updates.autoSync && this.config.enabled) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    }
  }

  // Private helper methods for database operations
  private async getLocalContacts(filters?: Record<string, any>): Promise<CRMContact[]> {
    // Implementation would fetch from local database
    return [];
  }

  private async findLocalContactByEmail(email: string): Promise<CRMContact | null> {
    // Implementation would search local database
    return null;
  }

  private async createLocalContact(contact: CRMContact): Promise<void> {
    // Implementation would create in local database
  }

  private async updateLocalContact(id: string, updates: Partial<CRMContact>): Promise<void> {
    // Implementation would update local database
  }

  private async applyLocalData(conflict: SyncConflict): Promise<void> {
    // Apply local data to remote system
  }

  private async applyRemoteData(conflict: SyncConflict): Promise<void> {
    // Apply remote data to local system
  }

  private async mergeConflictData(conflict: SyncConflict): Promise<void> {
    // Merge local and remote data intelligently
  }

  private broadcastJobUpdate(job: SyncJob): void {
    // Broadcast job updates via WebSocket
    console.log(`Sync job ${job.id}: ${job.status} - ${job.progress}%`);
  }
}

export default DataSynchronizer;