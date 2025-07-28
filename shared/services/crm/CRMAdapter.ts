export interface CRMContact {
  id: string;
  externalId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
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
  createdAt: string;
  updatedAt: string;
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
  expectedCloseDate?: string;
  actualCloseDate?: string;
  status: 'open' | 'won' | 'lost' | 'cancelled';
  customFields?: Record<string, any>;
  tags?: string[];
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CRMActivity {
  id: string;
  externalId?: string;
  contactId?: string;
  dealId?: string;
  type: 'call' | 'email' | 'meeting' | 'task' | 'note' | 'repair' | 'quote' | 'appointment';
  subject: string;
  description?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  dueDate?: string;
  completedDate?: string;
  userId?: string;
  customFields?: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CRMSyncResult {
  success: boolean;
  message?: string;
  data?: any;
  errors?: string[];
  recordsProcessed?: number;
  recordsCreated?: number;
  recordsUpdated?: number;
  recordsFailed?: number;
}

export interface CRMConfig {
  type: 'hubspot' | 'salesforce' | 'pipedrive' | 'zoho' | 'freshworks' | 'custom';
  apiUrl: string;
  apiKey?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  subdomain?: string;
  customFields?: Record<string, string>;
  mappings?: {
    contactFields?: Record<string, string>;
    dealFields?: Record<string, string>;
    activityFields?: Record<string, string>;
  };
  syncSettings?: {
    bidirectional?: boolean;
    autoSync?: boolean;
    syncInterval?: number; // minutes
    batchSize?: number;
    conflictResolution?: 'local_wins' | 'remote_wins' | 'newest_wins' | 'manual';
  };
  webhookUrl?: string;
  webhookSecret?: string;
}

export abstract class CRMAdapter {
  protected config: CRMConfig;
  protected isConnected: boolean = false;
  protected lastSync?: Date;

  constructor(config: CRMConfig) {
    this.config = config;
  }

  // Connection management
  abstract connect(): Promise<boolean>;
  abstract disconnect(): Promise<void>;
  abstract testConnection(): Promise<boolean>;
  abstract getConnectionStatus(): { connected: boolean; lastSync?: Date; error?: string };

  // Contact operations
  abstract createContact(contact: Omit<CRMContact, 'id' | 'createdAt' | 'updatedAt'>): Promise<CRMContact>;
  abstract getContact(id: string): Promise<CRMContact | null>;
  abstract updateContact(id: string, updates: Partial<CRMContact>): Promise<CRMContact>;
  abstract deleteContact(id: string): Promise<boolean>;
  abstract searchContacts(query: string, filters?: Record<string, any>): Promise<CRMContact[]>;
  abstract listContacts(options?: { limit?: number; offset?: number; filters?: Record<string, any> }): Promise<{ contacts: CRMContact[]; total: number; hasMore: boolean }>;

  // Deal operations
  abstract createDeal(deal: Omit<CRMDeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<CRMDeal>;
  abstract getDeal(id: string): Promise<CRMDeal | null>;
  abstract updateDeal(id: string, updates: Partial<CRMDeal>): Promise<CRMDeal>;
  abstract deleteDeal(id: string): Promise<boolean>;
  abstract listDeals(options?: { limit?: number; offset?: number; filters?: Record<string, any> }): Promise<{ deals: CRMDeal[]; total: number; hasMore: boolean }>;

  // Activity operations
  abstract createActivity(activity: Omit<CRMActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<CRMActivity>;
  abstract getActivity(id: string): Promise<CRMActivity | null>;
  abstract updateActivity(id: string, updates: Partial<CRMActivity>): Promise<CRMActivity>;
  abstract deleteActivity(id: string): Promise<boolean>;
  abstract listActivities(options?: { contactId?: string; dealId?: string; limit?: number; offset?: number }): Promise<{ activities: CRMActivity[]; total: number; hasMore: boolean }>;

  // Sync operations
  abstract syncContacts(direction?: 'push' | 'pull' | 'bidirectional'): Promise<CRMSyncResult>;
  abstract syncDeals(direction?: 'push' | 'pull' | 'bidirectional'): Promise<CRMSyncResult>;
  abstract syncActivities(direction?: 'push' | 'pull' | 'bidirectional'): Promise<CRMSyncResult>;
  abstract fullSync(): Promise<CRMSyncResult>;

  // Webhook handling
  abstract setupWebhooks(): Promise<boolean>;
  abstract handleWebhook(payload: any, signature?: string): Promise<void>;
  abstract validateWebhookSignature(payload: string, signature: string): boolean;

  // Utility methods
  protected mapLocalToRemote(data: any, mappings: Record<string, string>): any {
    const mapped: any = {};
    for (const [localField, remoteField] of Object.entries(mappings)) {
      if (data[localField] !== undefined) {
        mapped[remoteField] = data[localField];
      }
    }
    return mapped;
  }

  protected mapRemoteToLocal(data: any, mappings: Record<string, string>): any {
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

  protected generateExternalId(localId: string): string {
    return `revivatech_${localId}`;
  }

  protected parseExternalId(externalId: string): string | null {
    if (externalId.startsWith('revivatech_')) {
      return externalId.replace('revivatech_', '');
    }
    return null;
  }

  // Error handling
  protected handleError(error: any, operation: string): never {
    console.error(`CRM ${this.config.type} error in ${operation}:`, error);
    throw new Error(`CRM operation failed: ${operation} - ${error.message || error}`);
  }

  // Rate limiting (override in specific adapters)
  protected async rateLimit(): Promise<void> {
    // Default implementation - no rate limiting
    return Promise.resolve();
  }

  // Configuration
  getConfig(): CRMConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<CRMConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// Factory for creating CRM adapters
export class CRMAdapterFactory {
  private static adapters: Map<string, typeof CRMAdapter> = new Map();

  static register(type: string, adapterClass: typeof CRMAdapter): void {
    this.adapters.set(type, adapterClass);
  }

  static create(config: CRMConfig): CRMAdapter {
    const AdapterClass = this.adapters.get(config.type);
    if (!AdapterClass) {
      throw new Error(`Unsupported CRM type: ${config.type}`);
    }
    return new AdapterClass(config);
  }

  static getSupportedTypes(): string[] {
    return Array.from(this.adapters.keys());
  }
}

export default CRMAdapter;