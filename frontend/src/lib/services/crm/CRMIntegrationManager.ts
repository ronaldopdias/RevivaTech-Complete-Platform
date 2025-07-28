/**
 * CRM Integration Manager - Orchestrates CRM integrations across multiple providers
 * Built on Service Abstraction Layer with comprehensive management capabilities
 */

import { ServiceManager } from '../serviceManager';
import { CRMService, CRMServiceConfig, CRMContact, CRMDeal, CRMActivity, CRMProvider, CRMServiceResponse, CRMSyncStatus } from './CRMService';
import { EventEmitter } from 'events';

// Integration Status
export interface CRMIntegrationStatus {
  providerId: string;
  provider: CRMProvider;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSync?: Date;
  nextSync?: Date;
  health: 'healthy' | 'unhealthy' | 'degraded';
  contactCount: number;
  dealCount: number;
  activityCount: number;
  errorCount: number;
  syncErrors: string[];
  performance: {
    avgResponseTime: number;
    errorRate: number;
    requestCount: number;
    lastUpdated: Date;
  };
}

// Integration Configuration
export interface CRMIntegrationConfig {
  primary: CRMProvider;
  secondary?: CRMProvider[];
  syncStrategy: 'real-time' | 'batch' | 'manual';
  conflictResolution: 'primary_wins' | 'secondary_wins' | 'newest_wins' | 'manual';
  syncInterval: number; // in milliseconds
  retryAttempts: number;
  batchSize: number;
  enableWebhooks: boolean;
  
  // Data flow configuration
  dataFlow: {
    contacts: {
      enabled: boolean;
      direction: 'bidirectional' | 'to_primary' | 'from_primary';
      fields: string[];
    };
    deals: {
      enabled: boolean;
      direction: 'bidirectional' | 'to_primary' | 'from_primary';
      fields: string[];
    };
    activities: {
      enabled: boolean;
      direction: 'bidirectional' | 'to_primary' | 'from_primary';
      fields: string[];
    };
  };
  
  // Notification settings
  notifications: {
    syncComplete: boolean;
    syncFailed: boolean;
    conflicts: boolean;
    errors: boolean;
  };
}

// Conflict Resolution
export interface CRMConflict {
  id: string;
  type: 'contact' | 'deal' | 'activity';
  objectId: string;
  primaryData: any;
  secondaryData: any;
  conflictFields: string[];
  resolution?: 'primary' | 'secondary' | 'merged';
  resolvedAt?: Date;
  resolvedBy?: string;
  notes?: string;
}

// Sync Report
export interface CRMSyncReport {
  syncId: string;
  startTime: Date;
  endTime: Date;
  status: 'completed' | 'failed' | 'partial';
  providers: CRMProvider[];
  
  results: {
    contactsProcessed: number;
    contactsCreated: number;
    contactsUpdated: number;
    contactsSkipped: number;
    
    dealsProcessed: number;
    dealsCreated: number;
    dealsUpdated: number;
    dealsSkipped: number;
    
    activitiesProcessed: number;
    activitiesCreated: number;
    activitiesUpdated: number;
    activitiesSkipped: number;
    
    conflicts: number;
    errors: number;
  };
  
  errors: Array<{
    provider: CRMProvider;
    operation: string;
    objectId?: string;
    error: string;
    timestamp: Date;
  }>;
  
  conflicts: CRMConflict[];
  performance: {
    totalTime: number;
    avgResponseTime: number;
    slowestOperation: string;
    fastestOperation: string;
  };
}

// Analytics Data
export interface CRMAnalytics {
  totalContacts: number;
  totalDeals: number;
  totalActivities: number;
  
  contactsByProvider: Record<CRMProvider, number>;
  dealsByProvider: Record<CRMProvider, number>;
  activitiesByProvider: Record<CRMProvider, number>;
  
  syncFrequency: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  
  errorRates: Record<CRMProvider, number>;
  performanceMetrics: Record<CRMProvider, {
    avgResponseTime: number;
    successRate: number;
    uptime: number;
  }>;
  
  dataQuality: {
    duplicateContacts: number;
    incompleteContacts: number;
    validEmails: number;
    validPhones: number;
  };
}

/**
 * CRM Integration Manager - Orchestrates multiple CRM integrations
 * Provides unified interface for managing contacts, deals, and activities
 * across multiple CRM providers with conflict resolution and analytics
 */
export class CRMIntegrationManager extends EventEmitter {
  private static instance: CRMIntegrationManager;
  private serviceManager: ServiceManager;
  private integrations: Map<string, CRMService> = new Map();
  private config: CRMIntegrationConfig;
  private conflicts: Map<string, CRMConflict> = new Map();
  private syncReports: CRMSyncReport[] = [];
  private analytics: CRMAnalytics | null = null;
  private syncInterval: NodeJS.Timer | null = null;
  
  private constructor(config: CRMIntegrationConfig) {
    super();
    this.config = config;
    this.serviceManager = ServiceManager.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(config?: CRMIntegrationConfig): CRMIntegrationManager {
    if (!CRMIntegrationManager.instance) {
      if (!config) {
        throw new Error('Configuration is required for first initialization');
      }
      CRMIntegrationManager.instance = new CRMIntegrationManager(config);
    }
    return CRMIntegrationManager.instance;
  }

  /**
   * Initialize CRM Integration Manager
   */
  async initialize(): Promise<void> {
    try {
      await this.serviceManager.initialize();
      await this.loadIntegrations();
      await this.startSyncProcess();
      
      this.emit('initialized');
    } catch (error) {
      this.emit('initialization_error', error);
      throw error;
    }
  }

  /**
   * Add CRM integration
   */
  async addIntegration(integrationConfig: CRMServiceConfig): Promise<CRMService> {
    try {
      const service = await this.serviceManager.addService(integrationConfig);
      this.integrations.set(integrationConfig.id, service as CRMService);
      
      // Setup event listeners
      service.on('contact_created', (data) => this.handleContactEvent('created', data));
      service.on('contact_updated', (data) => this.handleContactEvent('updated', data));
      service.on('deal_created', (data) => this.handleDealEvent('created', data));
      service.on('deal_updated', (data) => this.handleDealEvent('updated', data));
      service.on('activity_created', (data) => this.handleActivityEvent('created', data));
      service.on('sync_completed', (data) => this.handleSyncEvent('completed', data));
      service.on('sync_failed', (data) => this.handleSyncEvent('failed', data));
      
      this.emit('integration_added', { id: integrationConfig.id, provider: integrationConfig.options.provider });
      return service as CRMService;
    } catch (error) {
      this.emit('integration_error', { id: integrationConfig.id, error });
      throw error;
    }
  }

  /**
   * Remove CRM integration
   */
  async removeIntegration(integrationId: string): Promise<void> {
    try {
      await this.serviceManager.removeService(integrationId);
      this.integrations.delete(integrationId);
      
      this.emit('integration_removed', { id: integrationId });
    } catch (error) {
      this.emit('integration_error', { id: integrationId, error });
      throw error;
    }
  }

  /**
   * Get integration status for all providers
   */
  async getIntegrationStatus(): Promise<CRMIntegrationStatus[]> {
    const statuses: CRMIntegrationStatus[] = [];
    
    for (const [id, service] of this.integrations) {
      const health = await service.healthCheck();
      const metrics = service.getMetrics();
      const config = service.getConfig() as CRMServiceConfig;
      
      statuses.push({
        providerId: id,
        provider: config.options.provider,
        status: health.status === 'healthy' ? 'connected' : 'error',
        health: health.status,
        contactCount: 0, // Would be populated from actual data
        dealCount: 0,
        activityCount: 0,
        errorCount: metrics.failedRequests,
        syncErrors: [],
        performance: {
          avgResponseTime: metrics.avgResponseTime,
          errorRate: metrics.errorRate,
          requestCount: metrics.totalRequests,
          lastUpdated: metrics.lastMetricsUpdate
        }
      });
    }
    
    return statuses;
  }

  /**
   * Create contact across all enabled integrations
   */
  async createContact(contact: CRMContact): Promise<Map<string, CRMServiceResponse<CRMContact>>> {
    const results = new Map<string, CRMServiceResponse<CRMContact>>();
    
    for (const [id, service] of this.integrations) {
      try {
        const result = await service.createContact(contact);
        results.set(id, result);
        
        if (result.success) {
          this.emit('contact_created_multi', { providerId: id, contact: result.data });
        }
      } catch (error) {
        results.set(id, {
          success: false,
          error: error.message,
          metadata: {
            provider: (service.getConfig() as CRMServiceConfig).options.provider,
            requestId: `error-${Date.now()}`,
            timestamp: new Date()
          }
        });
      }
    }
    
    return results;
  }

  /**
   * Update contact across all enabled integrations
   */
  async updateContact(contactId: string, updates: Partial<CRMContact>): Promise<Map<string, CRMServiceResponse<CRMContact>>> {
    const results = new Map<string, CRMServiceResponse<CRMContact>>();
    
    for (const [id, service] of this.integrations) {
      try {
        const result = await service.updateContact(contactId, updates);
        results.set(id, result);
        
        if (result.success) {
          this.emit('contact_updated_multi', { providerId: id, contact: result.data });
        }
      } catch (error) {
        results.set(id, {
          success: false,
          error: error.message,
          metadata: {
            provider: (service.getConfig() as CRMServiceConfig).options.provider,
            requestId: `error-${Date.now()}`,
            timestamp: new Date()
          }
        });
      }
    }
    
    return results;
  }

  /**
   * Get contact from primary integration
   */
  async getContact(contactId: string): Promise<CRMServiceResponse<CRMContact>> {
    const primaryService = this.getPrimaryService();
    if (!primaryService) {
      throw new Error('No primary CRM integration configured');
    }
    
    return await primaryService.getContact(contactId);
  }

  /**
   * Create deal across all enabled integrations
   */
  async createDeal(deal: CRMDeal): Promise<Map<string, CRMServiceResponse<CRMDeal>>> {
    const results = new Map<string, CRMServiceResponse<CRMDeal>>();
    
    for (const [id, service] of this.integrations) {
      try {
        const result = await service.createDeal(deal);
        results.set(id, result);
        
        if (result.success) {
          this.emit('deal_created_multi', { providerId: id, deal: result.data });
        }
      } catch (error) {
        results.set(id, {
          success: false,
          error: error.message,
          metadata: {
            provider: (service.getConfig() as CRMServiceConfig).options.provider,
            requestId: `error-${Date.now()}`,
            timestamp: new Date()
          }
        });
      }
    }
    
    return results;
  }

  /**
   * Update deal across all enabled integrations
   */
  async updateDeal(dealId: string, updates: Partial<CRMDeal>): Promise<Map<string, CRMServiceResponse<CRMDeal>>> {
    const results = new Map<string, CRMServiceResponse<CRMDeal>>();
    
    for (const [id, service] of this.integrations) {
      try {
        const result = await service.updateDeal(dealId, updates);
        results.set(id, result);
        
        if (result.success) {
          this.emit('deal_updated_multi', { providerId: id, deal: result.data });
        }
      } catch (error) {
        results.set(id, {
          success: false,
          error: error.message,
          metadata: {
            provider: (service.getConfig() as CRMServiceConfig).options.provider,
            requestId: `error-${Date.now()}`,
            timestamp: new Date()
          }
        });
      }
    }
    
    return results;
  }

  /**
   * Create activity across all enabled integrations
   */
  async createActivity(activity: CRMActivity): Promise<Map<string, CRMServiceResponse<CRMActivity>>> {
    const results = new Map<string, CRMServiceResponse<CRMActivity>>();
    
    for (const [id, service] of this.integrations) {
      try {
        const result = await service.createActivity(activity);
        results.set(id, result);
        
        if (result.success) {
          this.emit('activity_created_multi', { providerId: id, activity: result.data });
        }
      } catch (error) {
        results.set(id, {
          success: false,
          error: error.message,
          metadata: {
            provider: (service.getConfig() as CRMServiceConfig).options.provider,
            requestId: `error-${Date.now()}`,
            timestamp: new Date()
          }
        });
      }
    }
    
    return results;
  }

  /**
   * Sync data across all integrations
   */
  async syncAll(): Promise<CRMSyncReport> {
    const syncId = this.generateSyncId();
    const startTime = new Date();
    
    const report: CRMSyncReport = {
      syncId,
      startTime,
      endTime: new Date(),
      status: 'completed',
      providers: [],
      results: {
        contactsProcessed: 0,
        contactsCreated: 0,
        contactsUpdated: 0,
        contactsSkipped: 0,
        dealsProcessed: 0,
        dealsCreated: 0,
        dealsUpdated: 0,
        dealsSkipped: 0,
        activitiesProcessed: 0,
        activitiesCreated: 0,
        activitiesUpdated: 0,
        activitiesSkipped: 0,
        conflicts: 0,
        errors: 0
      },
      errors: [],
      conflicts: [],
      performance: {
        totalTime: 0,
        avgResponseTime: 0,
        slowestOperation: '',
        fastestOperation: ''
      }
    };
    
    try {
      this.emit('sync_started', { syncId });
      
      for (const [id, service] of this.integrations) {
        try {
          const config = service.getConfig() as CRMServiceConfig;
          const syncStatus = await service.syncData(this.config.dataFlow.contacts.direction);
          
          report.providers.push(config.options.provider);
          
          // Aggregate results
          report.results.contactsProcessed += syncStatus.contactsProcessed;
          report.results.dealsProcessed += syncStatus.dealsProcessed;
          report.results.activitiesProcessed += syncStatus.activitiesProcessed;
          report.results.errors += syncStatus.errors.length;
          
          // Add errors to report
          syncStatus.errors.forEach(error => {
            report.errors.push({
              provider: config.options.provider,
              operation: 'sync',
              error,
              timestamp: new Date()
            });
          });
          
        } catch (error) {
          report.status = 'partial';
          report.errors.push({
            provider: (service.getConfig() as CRMServiceConfig).options.provider,
            operation: 'sync',
            error: error.message,
            timestamp: new Date()
          });
        }
      }
      
      // Detect and resolve conflicts
      await this.detectConflicts();
      report.conflicts = Array.from(this.conflicts.values());
      report.results.conflicts = report.conflicts.length;
      
      report.endTime = new Date();
      report.performance.totalTime = report.endTime.getTime() - report.startTime.getTime();
      
      this.syncReports.push(report);
      this.emit('sync_completed', { syncId, report });
      
    } catch (error) {
      report.status = 'failed';
      report.endTime = new Date();
      this.emit('sync_failed', { syncId, error, report });
    }
    
    return report;
  }

  /**
   * Resolve conflict
   */
  async resolveConflict(conflictId: string, resolution: 'primary' | 'secondary' | 'merged', resolvedBy: string): Promise<void> {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) {
      throw new Error('Conflict not found');
    }
    
    conflict.resolution = resolution;
    conflict.resolvedAt = new Date();
    conflict.resolvedBy = resolvedBy;
    
    // Apply resolution based on type
    switch (resolution) {
      case 'primary':
        await this.applyPrimaryResolution(conflict);
        break;
      case 'secondary':
        await this.applySecondaryResolution(conflict);
        break;
      case 'merged':
        await this.applyMergedResolution(conflict);
        break;
    }
    
    this.emit('conflict_resolved', { conflictId, resolution });
  }

  /**
   * Get analytics data
   */
  async getAnalytics(): Promise<CRMAnalytics> {
    if (!this.analytics) {
      await this.calculateAnalytics();
    }
    return this.analytics!;
  }

  /**
   * Get sync reports
   */
  getSyncReports(limit: number = 10): CRMSyncReport[] {
    return this.syncReports
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  /**
   * Get conflicts
   */
  getConflicts(): CRMConflict[] {
    return Array.from(this.conflicts.values());
  }

  /**
   * Get unresolved conflicts
   */
  getUnresolvedConflicts(): CRMConflict[] {
    return Array.from(this.conflicts.values()).filter(c => !c.resolution);
  }

  // Private methods
  private async loadIntegrations(): Promise<void> {
    // Load existing integrations from service manager
    const services = this.serviceManager.getServicesByType('CRM');
    
    for (const service of services) {
      this.integrations.set(service.getConfig().id, service as CRMService);
    }
  }

  private async startSyncProcess(): Promise<void> {
    if (this.config.syncStrategy === 'batch' && this.config.syncInterval > 0) {
      this.syncInterval = setInterval(async () => {
        try {
          await this.syncAll();
        } catch (error) {
          this.emit('sync_error', error);
        }
      }, this.config.syncInterval);
    }
  }

  private getPrimaryService(): CRMService | null {
    for (const [id, service] of this.integrations) {
      const config = service.getConfig() as CRMServiceConfig;
      if (config.options.provider === this.config.primary) {
        return service;
      }
    }
    return null;
  }

  private async detectConflicts(): Promise<void> {
    // Implementation for detecting conflicts between CRM systems
    // This would compare data across integrations and identify conflicts
  }

  private async applyPrimaryResolution(conflict: CRMConflict): Promise<void> {
    // Apply primary data to secondary systems
  }

  private async applySecondaryResolution(conflict: CRMConflict): Promise<void> {
    // Apply secondary data to primary system
  }

  private async applyMergedResolution(conflict: CRMConflict): Promise<void> {
    // Merge data from both systems
  }

  private async calculateAnalytics(): Promise<void> {
    // Calculate analytics from all integrations
    this.analytics = {
      totalContacts: 0,
      totalDeals: 0,
      totalActivities: 0,
      contactsByProvider: {} as Record<CRMProvider, number>,
      dealsByProvider: {} as Record<CRMProvider, number>,
      activitiesByProvider: {} as Record<CRMProvider, number>,
      syncFrequency: {
        daily: 0,
        weekly: 0,
        monthly: 0
      },
      errorRates: {} as Record<CRMProvider, number>,
      performanceMetrics: {} as Record<CRMProvider, {
        avgResponseTime: number;
        successRate: number;
        uptime: number;
      }>,
      dataQuality: {
        duplicateContacts: 0,
        incompleteContacts: 0,
        validEmails: 0,
        validPhones: 0
      }
    };
  }

  private handleContactEvent(eventType: 'created' | 'updated', data: any): void {
    this.emit(`contact_${eventType}_global`, data);
  }

  private handleDealEvent(eventType: 'created' | 'updated', data: any): void {
    this.emit(`deal_${eventType}_global`, data);
  }

  private handleActivityEvent(eventType: 'created' | 'updated', data: any): void {
    this.emit(`activity_${eventType}_global`, data);
  }

  private handleSyncEvent(eventType: 'completed' | 'failed', data: any): void {
    this.emit(`sync_${eventType}_global`, data);
  }

  private generateSyncId(): string {
    return `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

export default CRMIntegrationManager;