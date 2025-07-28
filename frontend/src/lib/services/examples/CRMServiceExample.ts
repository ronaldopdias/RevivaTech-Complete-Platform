/**
 * CRM Service Example - Advanced CRM Integration with Service Abstraction
 * 
 * This example demonstrates how to integrate multiple CRM providers using
 * the Service Abstraction Layer with proper error handling, retry logic,
 * and health monitoring.
 */

import { AbstractService, ServiceAbstractionConfig } from '../serviceAbstraction';
import { ServiceHealthCheck } from '../types';

// =============================================================================
// CRM Service Configuration
// =============================================================================

export interface CRMServiceConfig extends ServiceAbstractionConfig {
  type: 'CRM';
  options: {
    provider: 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho' | 'freshworks';
    apiUrl?: string;
    apiKey?: string;
    accessToken?: string;
    refreshToken?: string;
    clientId?: string;
    clientSecret?: string;
    subdomain?: string;
    region?: string;
    version?: string;
    
    // Field mappings
    fieldMappings?: {
      contact: Record<string, string>;
      deal: Record<string, string>;
      activity: Record<string, string>;
    };
    
    // Sync settings
    syncSettings?: {
      bidirectional: boolean;
      autoSync: boolean;
      syncInterval: number;
      batchSize: number;
      conflictResolution: 'local_wins' | 'remote_wins' | 'newest_wins';
    };
    
    // Webhook settings
    webhookUrl?: string;
    webhookSecret?: string;
    
    // Rate limiting
    rateLimits?: {
      requestsPerSecond: number;
      burstLimit: number;
      dailyLimit: number;
    };
  };
}

// =============================================================================
// CRM Data Models
// =============================================================================

export interface CRMContact {
  id: string;
  externalId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  jobTitle?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  customFields?: Record<string, any>;
  tags?: string[];
  source?: string;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CRMDeal {
  id: string;
  externalId?: string;
  contactId: string;
  title: string;
  description?: string;
  value: number;
  currency: string;
  stage: string;
  probability?: number;
  expectedCloseDate?: Date;
  actualCloseDate?: Date;
  status: 'open' | 'won' | 'lost' | 'cancelled';
  customFields?: Record<string, any>;
  tags?: string[];
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CRMActivity {
  id: string;
  externalId?: string;
  contactId?: string;
  dealId?: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note' | 'repair' | 'quote';
  subject: string;
  description?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  dueDate?: Date;
  completedDate?: Date;
  userId?: string;
  customFields?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CRMSyncResult {
  success: boolean;
  message?: string;
  data?: any;
  errors?: string[];
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  duration: number;
}

export interface CRMWebhookEvent {
  id: string;
  event: string;
  objectType: 'contact' | 'deal' | 'activity';
  objectId: string;
  data: any;
  timestamp: Date;
  signature?: string;
}

// =============================================================================
// CRM Service Implementation
// =============================================================================

export class CRMService extends AbstractService {
  private config: CRMServiceConfig;
  private apiClient: any;
  private syncStatus: Map<string, Date> = new Map();
  private rateLimitStatus: { requests: number; lastReset: Date } = { 
    requests: 0, 
    lastReset: new Date() 
  };

  constructor(config: CRMServiceConfig) {
    super(config);
    this.config = config;
    this.validateConfiguration();
  }

  // =============================================================================
  // Lifecycle Methods
  // =============================================================================

  protected async doConnect(): Promise<boolean> {
    try {
      this.log('info', 'Connecting to CRM service', { provider: this.config.options.provider });
      
      // Initialize API client based on provider
      switch (this.config.options.provider) {
        case 'hubspot':
          this.apiClient = await this.initializeHubSpot();
          break;
        case 'salesforce':
          this.apiClient = await this.initializeSalesforce();
          break;
        case 'pipedrive':
          this.apiClient = await this.initializePipedrive();
          break;
        case 'zoho':
          this.apiClient = await this.initializeZoho();
          break;
        case 'freshworks':
          this.apiClient = await this.initializeFreshworks();
          break;
        default:
          throw new Error(`Unsupported CRM provider: ${this.config.options.provider}`);
      }
      
      // Test connection
      await this.testConnection();
      
      this.log('info', 'CRM service connected successfully');
      return true;
    } catch (error) {
      this.log('error', 'Failed to connect to CRM service', { error: error.message });
      throw error;
    }
  }

  protected async doDisconnect(): Promise<void> {
    try {
      this.log('info', 'Disconnecting from CRM service');
      
      if (this.apiClient) {
        // Cleanup API client
        this.apiClient = null;
      }
      
      this.log('info', 'CRM service disconnected');
    } catch (error) {
      this.log('error', 'Error disconnecting from CRM service', { error: error.message });
      throw error;
    }
  }

  protected async doHealthCheck(): Promise<ServiceHealthCheck> {
    const startTime = Date.now();
    
    try {
      // Test API connection
      await this.testConnection();
      
      // Check rate limit status
      const rateLimitStatus = this.checkRateLimit();
      
      const responseTime = Date.now() - startTime;
      
      return {
        service: this.config.name,
        status: 'healthy',
        responseTime,
        timestamp: new Date(),
        metadata: {
          provider: this.config.options.provider,
          connected: !!this.apiClient,
          rateLimitStatus,
          lastSync: this.syncStatus.get('lastSync'),
          syncEnabled: this.config.options.syncSettings?.autoSync
        }
      };
    } catch (error) {
      return {
        service: this.config.name,
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        error: error.message,
        metadata: {
          provider: this.config.options.provider,
          connected: false
        }
      };
    }
  }

  // =============================================================================
  // Contact Operations
  // =============================================================================

  async createContact(contactData: Omit<CRMContact, 'id' | 'createdAt' | 'updatedAt'>): Promise<CRMContact> {
    return await this.withCircuitBreaker(async () => {
      return await this.withTimeout(async () => {
        return await this.withRetry(async () => {
          // Check rate limit
          await this.enforceRateLimit();
          
          // Map fields for target CRM
          const mappedData = this.mapFieldsForProvider(contactData, 'contact');
          
          // Create contact via API
          const result = await this.callCRMAPI('POST', '/contacts', mappedData);
          
          // Map response back to our format
          const contact = this.mapFieldsFromProvider(result, 'contact');
          
          this.log('info', 'Contact created successfully', { contactId: contact.id });
          return contact;
        });
      });
    });
  }

  async getContact(contactId: string): Promise<CRMContact | null> {
    return await this.withCircuitBreaker(async () => {
      return await this.withTimeout(async () => {
        try {
          await this.enforceRateLimit();
          
          const result = await this.callCRMAPI('GET', `/contacts/${contactId}`);
          
          if (!result) {
            return null;
          }
          
          return this.mapFieldsFromProvider(result, 'contact');
        } catch (error) {
          if (error.status === 404) {
            return null;
          }
          throw error;
        }
      });
    });
  }

  async updateContact(contactId: string, updates: Partial<CRMContact>): Promise<CRMContact> {
    return await this.withCircuitBreaker(async () => {
      return await this.withTimeout(async () => {
        return await this.withRetry(async () => {
          await this.enforceRateLimit();
          
          const mappedUpdates = this.mapFieldsForProvider(updates, 'contact');
          const result = await this.callCRMAPI('PUT', `/contacts/${contactId}`, mappedUpdates);
          
          const contact = this.mapFieldsFromProvider(result, 'contact');
          
          this.log('info', 'Contact updated successfully', { contactId });
          return contact;
        });
      });
    });
  }

  async deleteContact(contactId: string): Promise<boolean> {
    return await this.withCircuitBreaker(async () => {
      return await this.withTimeout(async () => {
        try {
          await this.enforceRateLimit();
          
          await this.callCRMAPI('DELETE', `/contacts/${contactId}`);
          
          this.log('info', 'Contact deleted successfully', { contactId });
          return true;
        } catch (error) {
          if (error.status === 404) {
            return false;
          }
          throw error;
        }
      });
    });
  }

  async searchContacts(query: string, filters?: Record<string, any>): Promise<CRMContact[]> {
    return await this.withCircuitBreaker(async () => {
      return await this.withTimeout(async () => {
        await this.enforceRateLimit();
        
        const searchParams = {
          q: query,
          ...filters
        };
        
        const result = await this.callCRMAPI('GET', '/contacts/search', searchParams);
        
        if (!result.contacts) {
          return [];
        }
        
        return result.contacts.map((contact: any) => this.mapFieldsFromProvider(contact, 'contact'));
      });
    });
  }

  // =============================================================================
  // Deal Operations
  // =============================================================================

  async createDeal(dealData: Omit<CRMDeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<CRMDeal> {
    return await this.withCircuitBreaker(async () => {
      return await this.withTimeout(async () => {
        return await this.withRetry(async () => {
          await this.enforceRateLimit();
          
          const mappedData = this.mapFieldsForProvider(dealData, 'deal');
          const result = await this.callCRMAPI('POST', '/deals', mappedData);
          
          const deal = this.mapFieldsFromProvider(result, 'deal');
          
          this.log('info', 'Deal created successfully', { dealId: deal.id });
          return deal;
        });
      });
    });
  }

  async getDeal(dealId: string): Promise<CRMDeal | null> {
    return await this.withCircuitBreaker(async () => {
      return await this.withTimeout(async () => {
        try {
          await this.enforceRateLimit();
          
          const result = await this.callCRMAPI('GET', `/deals/${dealId}`);
          
          if (!result) {
            return null;
          }
          
          return this.mapFieldsFromProvider(result, 'deal');
        } catch (error) {
          if (error.status === 404) {
            return null;
          }
          throw error;
        }
      });
    });
  }

  async updateDeal(dealId: string, updates: Partial<CRMDeal>): Promise<CRMDeal> {
    return await this.withCircuitBreaker(async () => {
      return await this.withTimeout(async () => {
        return await this.withRetry(async () => {
          await this.enforceRateLimit();
          
          const mappedUpdates = this.mapFieldsForProvider(updates, 'deal');
          const result = await this.callCRMAPI('PUT', `/deals/${dealId}`, mappedUpdates);
          
          const deal = this.mapFieldsFromProvider(result, 'deal');
          
          this.log('info', 'Deal updated successfully', { dealId });
          return deal;
        });
      });
    });
  }

  // =============================================================================
  // Activity Operations
  // =============================================================================

  async createActivity(activityData: Omit<CRMActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<CRMActivity> {
    return await this.withCircuitBreaker(async () => {
      return await this.withTimeout(async () => {
        return await this.withRetry(async () => {
          await this.enforceRateLimit();
          
          const mappedData = this.mapFieldsForProvider(activityData, 'activity');
          const result = await this.callCRMAPI('POST', '/activities', mappedData);
          
          const activity = this.mapFieldsFromProvider(result, 'activity');
          
          this.log('info', 'Activity created successfully', { activityId: activity.id });
          return activity;
        });
      });
    });
  }

  // =============================================================================
  // Sync Operations
  // =============================================================================

  async syncContacts(direction: 'push' | 'pull' | 'bidirectional' = 'bidirectional'): Promise<CRMSyncResult> {
    return await this.withCircuitBreaker(async () => {
      const startTime = Date.now();
      
      this.log('info', 'Starting contact sync', { direction });
      
      try {
        let result: CRMSyncResult;
        
        switch (direction) {
          case 'push':
            result = await this.pushContacts();
            break;
          case 'pull':
            result = await this.pullContacts();
            break;
          case 'bidirectional':
            const pushResult = await this.pushContacts();
            const pullResult = await this.pullContacts();
            result = this.mergeSyncResults(pushResult, pullResult);
            break;
        }
        
        result.duration = Date.now() - startTime;
        
        this.syncStatus.set('lastSync', new Date());
        this.syncStatus.set('contacts', new Date());
        
        this.log('info', 'Contact sync completed', { result });
        return result;
      } catch (error) {
        this.log('error', 'Contact sync failed', { error: error.message });
        throw error;
      }
    });
  }

  async syncDeals(direction: 'push' | 'pull' | 'bidirectional' = 'bidirectional'): Promise<CRMSyncResult> {
    return await this.withCircuitBreaker(async () => {
      const startTime = Date.now();
      
      this.log('info', 'Starting deal sync', { direction });
      
      try {
        let result: CRMSyncResult;
        
        switch (direction) {
          case 'push':
            result = await this.pushDeals();
            break;
          case 'pull':
            result = await this.pullDeals();
            break;
          case 'bidirectional':
            const pushResult = await this.pushDeals();
            const pullResult = await this.pullDeals();
            result = this.mergeSyncResults(pushResult, pullResult);
            break;
        }
        
        result.duration = Date.now() - startTime;
        
        this.syncStatus.set('lastSync', new Date());
        this.syncStatus.set('deals', new Date());
        
        this.log('info', 'Deal sync completed', { result });
        return result;
      } catch (error) {
        this.log('error', 'Deal sync failed', { error: error.message });
        throw error;
      }
    });
  }

  async fullSync(): Promise<CRMSyncResult> {
    return await this.withCircuitBreaker(async () => {
      const startTime = Date.now();
      
      this.log('info', 'Starting full sync');
      
      try {
        const contactsResult = await this.syncContacts();
        const dealsResult = await this.syncDeals();
        
        const result = this.mergeSyncResults(contactsResult, dealsResult);
        result.duration = Date.now() - startTime;
        
        this.syncStatus.set('lastSync', new Date());
        this.syncStatus.set('fullSync', new Date());
        
        this.log('info', 'Full sync completed', { result });
        return result;
      } catch (error) {
        this.log('error', 'Full sync failed', { error: error.message });
        throw error;
      }
    });
  }

  // =============================================================================
  // Webhook Operations
  // =============================================================================

  async setupWebhooks(): Promise<boolean> {
    return await this.withCircuitBreaker(async () => {
      if (!this.config.options.webhookUrl) {
        throw new Error('Webhook URL not configured');
      }
      
      await this.enforceRateLimit();
      
      const webhookConfig = {
        url: this.config.options.webhookUrl,
        events: ['contact.created', 'contact.updated', 'deal.created', 'deal.updated', 'activity.created'],
        secret: this.config.options.webhookSecret
      };
      
      await this.callCRMAPI('POST', '/webhooks', webhookConfig);
      
      this.log('info', 'Webhooks configured successfully');
      return true;
    });
  }

  async handleWebhook(payload: any, signature?: string): Promise<void> {
    try {
      // Validate webhook signature
      if (signature && !this.validateWebhookSignature(payload, signature)) {
        throw new Error('Invalid webhook signature');
      }
      
      const event: CRMWebhookEvent = {
        id: payload.id || `webhook-${Date.now()}`,
        event: payload.event,
        objectType: payload.objectType,
        objectId: payload.objectId,
        data: payload.data,
        timestamp: new Date(payload.timestamp || Date.now()),
        signature
      };
      
      this.log('info', 'Processing webhook event', { event: event.event, objectType: event.objectType });
      
      // Process event based on type
      await this.processWebhookEvent(event);
      
      this.emit('webhook-processed', { event });
    } catch (error) {
      this.log('error', 'Webhook processing failed', { error: error.message });
      throw error;
    }
  }

  validateWebhookSignature(payload: any, signature: string): boolean {
    if (!this.config.options.webhookSecret) {
      return true; // No secret configured, skip validation
    }
    
    // Implement signature validation logic based on CRM provider
    // This is a simplified example
    const expectedSignature = this.generateWebhookSignature(JSON.stringify(payload));
    return signature === expectedSignature;
  }

  // =============================================================================
  // Provider-Specific Initialization
  // =============================================================================

  private async initializeHubSpot(): Promise<any> {
    if (!this.config.options.apiKey) {
      throw new Error('HubSpot API key required');
    }
    
    return {
      type: 'hubspot',
      apiKey: this.config.options.apiKey,
      baseUrl: 'https://api.hubapi.com'
    };
  }

  private async initializeSalesforce(): Promise<any> {
    if (!this.config.options.clientId || !this.config.options.clientSecret) {
      throw new Error('Salesforce OAuth credentials required');
    }
    
    return {
      type: 'salesforce',
      clientId: this.config.options.clientId,
      clientSecret: this.config.options.clientSecret,
      baseUrl: `https://${this.config.options.subdomain}.salesforce.com`
    };
  }

  private async initializePipedrive(): Promise<any> {
    if (!this.config.options.apiKey) {
      throw new Error('Pipedrive API key required');
    }
    
    return {
      type: 'pipedrive',
      apiKey: this.config.options.apiKey,
      baseUrl: `https://${this.config.options.subdomain}.pipedrive.com/api/v1`
    };
  }

  private async initializeZoho(): Promise<any> {
    if (!this.config.options.accessToken) {
      throw new Error('Zoho access token required');
    }
    
    return {
      type: 'zoho',
      accessToken: this.config.options.accessToken,
      baseUrl: `https://www.zohoapis.${this.config.options.region || 'com'}/crm/v2`
    };
  }

  private async initializeFreshworks(): Promise<any> {
    if (!this.config.options.apiKey) {
      throw new Error('Freshworks API key required');
    }
    
    return {
      type: 'freshworks',
      apiKey: this.config.options.apiKey,
      baseUrl: `https://${this.config.options.subdomain}.freshworks.com/crm/sales/api`
    };
  }

  // =============================================================================
  // Helper Methods
  // =============================================================================

  private async testConnection(): Promise<void> {
    // Test API connection based on provider
    await this.callCRMAPI('GET', '/ping');
  }

  private async callCRMAPI(method: string, endpoint: string, data?: any): Promise<any> {
    if (!this.apiClient) {
      throw new Error('CRM API client not initialized');
    }
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Increment rate limit counter
    this.rateLimitStatus.requests++;
    
    // Simulate response based on endpoint
    if (endpoint === '/ping') {
      return { status: 'ok' };
    }
    
    if (endpoint.startsWith('/contacts') && method === 'POST') {
      return {
        id: `contact-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    if (endpoint.startsWith('/deals') && method === 'POST') {
      return {
        id: `deal-${Date.now()}`,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
    
    return data;
  }

  private async enforceRateLimit(): Promise<void> {
    const rateLimits = this.config.options.rateLimits;
    if (!rateLimits) {
      return;
    }
    
    const now = new Date();
    const secondsSinceReset = (now.getTime() - this.rateLimitStatus.lastReset.getTime()) / 1000;
    
    // Reset counter every second
    if (secondsSinceReset >= 1) {
      this.rateLimitStatus.requests = 0;
      this.rateLimitStatus.lastReset = now;
    }
    
    if (this.rateLimitStatus.requests >= rateLimits.requestsPerSecond) {
      const waitTime = 1000 - (secondsSinceReset * 1000);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  private checkRateLimit(): any {
    const rateLimits = this.config.options.rateLimits;
    if (!rateLimits) {
      return { enabled: false };
    }
    
    return {
      enabled: true,
      current: this.rateLimitStatus.requests,
      limit: rateLimits.requestsPerSecond,
      remaining: Math.max(0, rateLimits.requestsPerSecond - this.rateLimitStatus.requests)
    };
  }

  private mapFieldsForProvider(data: any, objectType: string): any {
    const mappings = this.config.options.fieldMappings?.[objectType as keyof typeof this.config.options.fieldMappings];
    if (!mappings) {
      return data;
    }
    
    const mapped: any = {};
    for (const [localField, remoteField] of Object.entries(mappings)) {
      if (data[localField] !== undefined) {
        mapped[remoteField] = data[localField];
      }
    }
    
    return mapped;
  }

  private mapFieldsFromProvider(data: any, objectType: string): any {
    const mappings = this.config.options.fieldMappings?.[objectType as keyof typeof this.config.options.fieldMappings];
    if (!mappings) {
      return data;
    }
    
    const mapped: any = {};
    const reverseMappings = Object.fromEntries(
      Object.entries(mappings).map(([local, remote]) => [remote, local])
    );
    
    for (const [remoteField, localField] of Object.entries(reverseMappings)) {
      if (data[remoteField] !== undefined) {
        mapped[localField] = data[remoteField];
      }
    }
    
    return mapped;
  }

  private async pushContacts(): Promise<CRMSyncResult> {
    // Simulate pushing contacts to CRM
    return {
      success: true,
      recordsProcessed: 10,
      recordsCreated: 5,
      recordsUpdated: 3,
      recordsFailed: 2,
      duration: 0
    };
  }

  private async pullContacts(): Promise<CRMSyncResult> {
    // Simulate pulling contacts from CRM
    return {
      success: true,
      recordsProcessed: 15,
      recordsCreated: 8,
      recordsUpdated: 5,
      recordsFailed: 2,
      duration: 0
    };
  }

  private async pushDeals(): Promise<CRMSyncResult> {
    // Simulate pushing deals to CRM
    return {
      success: true,
      recordsProcessed: 5,
      recordsCreated: 2,
      recordsUpdated: 2,
      recordsFailed: 1,
      duration: 0
    };
  }

  private async pullDeals(): Promise<CRMSyncResult> {
    // Simulate pulling deals from CRM
    return {
      success: true,
      recordsProcessed: 7,
      recordsCreated: 3,
      recordsUpdated: 3,
      recordsFailed: 1,
      duration: 0
    };
  }

  private mergeSyncResults(result1: CRMSyncResult, result2: CRMSyncResult): CRMSyncResult {
    return {
      success: result1.success && result2.success,
      recordsProcessed: result1.recordsProcessed + result2.recordsProcessed,
      recordsCreated: result1.recordsCreated + result2.recordsCreated,
      recordsUpdated: result1.recordsUpdated + result2.recordsUpdated,
      recordsFailed: result1.recordsFailed + result2.recordsFailed,
      duration: Math.max(result1.duration, result2.duration)
    };
  }

  private async processWebhookEvent(event: CRMWebhookEvent): Promise<void> {
    switch (event.event) {
      case 'contact.created':
      case 'contact.updated':
        await this.processContactWebhook(event);
        break;
      case 'deal.created':
      case 'deal.updated':
        await this.processDealWebhook(event);
        break;
      case 'activity.created':
        await this.processActivityWebhook(event);
        break;
      default:
        this.log('warn', 'Unknown webhook event', { event: event.event });
    }
  }

  private async processContactWebhook(event: CRMWebhookEvent): Promise<void> {
    // Process contact webhook
    this.log('info', 'Processing contact webhook', { event: event.event, contactId: event.objectId });
  }

  private async processDealWebhook(event: CRMWebhookEvent): Promise<void> {
    // Process deal webhook
    this.log('info', 'Processing deal webhook', { event: event.event, dealId: event.objectId });
  }

  private async processActivityWebhook(event: CRMWebhookEvent): Promise<void> {
    // Process activity webhook
    this.log('info', 'Processing activity webhook', { event: event.event, activityId: event.objectId });
  }

  private generateWebhookSignature(payload: string): string {
    // Implement signature generation based on CRM provider
    // This is a simplified example
    const crypto = require('crypto');
    const secret = this.config.options.webhookSecret || '';
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  private validateConfiguration(): void {
    if (!this.config.options.provider) {
      throw new Error('CRM provider is required');
    }
    
    const provider = this.config.options.provider;
    
    switch (provider) {
      case 'hubspot':
        if (!this.config.options.apiKey) {
          throw new Error('HubSpot API key is required');
        }
        break;
      case 'salesforce':
        if (!this.config.options.clientId || !this.config.options.clientSecret) {
          throw new Error('Salesforce OAuth credentials are required');
        }
        break;
      case 'pipedrive':
        if (!this.config.options.apiKey) {
          throw new Error('Pipedrive API key is required');
        }
        break;
      case 'zoho':
        if (!this.config.options.accessToken) {
          throw new Error('Zoho access token is required');
        }
        break;
      case 'freshworks':
        if (!this.config.options.apiKey) {
          throw new Error('Freshworks API key is required');
        }
        break;
    }
  }
}

// =============================================================================
// Factory Helper
// =============================================================================

export function createCRMService(config: Partial<CRMServiceConfig>): CRMService {
  const fullConfig: CRMServiceConfig = {
    id: config.id || 'crm-service',
    type: 'CRM',
    name: config.name || 'CRM Service',
    description: config.description || 'CRM integration service',
    enabled: config.enabled !== false,
    priority: config.priority || 1,
    timeout: config.timeout || 30000,
    retryAttempts: config.retryAttempts || 3,
    retryDelay: config.retryDelay || 1000,
    circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
    healthCheckInterval: config.healthCheckInterval || 60000,
    environment: config.environment || 'development',
    version: config.version || '1.0.0',
    createdAt: new Date(),
    updatedAt: new Date(),
    options: {
      provider: 'hubspot',
      syncSettings: {
        bidirectional: true,
        autoSync: false,
        syncInterval: 300000, // 5 minutes
        batchSize: 100,
        conflictResolution: 'newest_wins'
      },
      rateLimits: {
        requestsPerSecond: 10,
        burstLimit: 100,
        dailyLimit: 40000
      },
      ...config.options
    }
  };
  
  return new CRMService(fullConfig);
}

export default CRMService;