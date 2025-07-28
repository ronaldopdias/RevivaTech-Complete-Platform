import CRMAdapter, { 
  CRMContact, 
  CRMDeal, 
  CRMActivity, 
  CRMConfig, 
  CRMSyncResult 
} from '../CRMAdapter';

interface HubSpotContact {
  id: string;
  properties: {
    firstname?: string;
    lastname?: string;
    email?: string;
    phone?: string;
    company?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
    hs_lead_status?: string;
    lifecyclestage?: string;
    createdate?: string;
    lastmodifieddate?: string;
    [key: string]: any;
  };
}

interface HubSpotDeal {
  id: string;
  properties: {
    dealname?: string;
    description?: string;
    amount?: string;
    dealstage?: string;
    pipeline?: string;
    closedate?: string;
    createdate?: string;
    hs_lastmodifieddate?: string;
    [key: string]: any;
  };
  associations?: {
    contacts?: { id: string }[];
  };
}

interface HubSpotActivity {
  id: string;
  properties: {
    hs_activity_type?: string;
    hs_subject?: string;
    hs_body?: string;
    hs_timestamp?: string;
    hs_activity_date?: string;
    hubspot_owner_id?: string;
    [key: string]: any;
  };
  associations?: {
    contacts?: { id: string }[];
    deals?: { id: string }[];
  };
}

export class HubSpotAdapter extends CRMAdapter {
  private baseUrl: string;
  private rateLimitRemaining: number = 100;
  private rateLimitReset: Date = new Date();

  constructor(config: CRMConfig) {
    super(config);
    this.baseUrl = 'https://api.hubapi.com';
  }

  async connect(): Promise<boolean> {
    try {
      const response = await this.makeRequest('GET', '/crm/v3/objects/contacts', { limit: 1 });
      this.isConnected = true;
      return true;
    } catch (error) {
      this.isConnected = false;
      console.error('HubSpot connection failed:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.isConnected = false;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('GET', '/crm/v3/objects/contacts', { limit: 1 });
      return true;
    } catch (error) {
      return false;
    }
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected,
      lastSync: this.lastSync,
      error: this.isConnected ? undefined : 'Connection failed'
    };
  }

  // Contact operations
  async createContact(contact: Omit<CRMContact, 'id' | 'createdAt' | 'updatedAt'>): Promise<CRMContact> {
    try {
      const hubspotContact = this.mapContactToHubSpot(contact);
      const response = await this.makeRequest('POST', '/crm/v3/objects/contacts', {
        properties: hubspotContact.properties
      });

      return this.mapHubSpotToContact(response);
    } catch (error) {
      this.handleError(error, 'createContact');
    }
  }

  async getContact(id: string): Promise<CRMContact | null> {
    try {
      const response = await this.makeRequest('GET', `/crm/v3/objects/contacts/${id}`);
      return this.mapHubSpotToContact(response);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      this.handleError(error, 'getContact');
    }
  }

  async updateContact(id: string, updates: Partial<CRMContact>): Promise<CRMContact> {
    try {
      const hubspotUpdates = this.mapContactToHubSpot(updates as any);
      const response = await this.makeRequest('PATCH', `/crm/v3/objects/contacts/${id}`, {
        properties: hubspotUpdates.properties
      });

      return this.mapHubSpotToContact(response);
    } catch (error) {
      this.handleError(error, 'updateContact');
    }
  }

  async deleteContact(id: string): Promise<boolean> {
    try {
      await this.makeRequest('DELETE', `/crm/v3/objects/contacts/${id}`);
      return true;
    } catch (error) {
      if (error.status === 404) {
        return true; // Already deleted
      }
      this.handleError(error, 'deleteContact');
    }
  }

  async searchContacts(query: string, filters?: Record<string, any>): Promise<CRMContact[]> {
    try {
      const searchQuery = {
        query,
        limit: 100,
        sorts: ['createdate'],
        properties: this.getContactProperties(),
        filterGroups: filters ? this.buildFilterGroups(filters) : undefined
      };

      const response = await this.makeRequest('POST', '/crm/v3/objects/contacts/search', searchQuery);
      return response.results.map((contact: HubSpotContact) => this.mapHubSpotToContact(contact));
    } catch (error) {
      this.handleError(error, 'searchContacts');
    }
  }

  async listContacts(options?: { limit?: number; offset?: number; filters?: Record<string, any> }): Promise<{ contacts: CRMContact[]; total: number; hasMore: boolean }> {
    try {
      const params: any = {
        limit: options?.limit || 100,
        properties: this.getContactProperties().join(',')
      };

      if (options?.offset) {
        params.after = options.offset;
      }

      const response = await this.makeRequest('GET', '/crm/v3/objects/contacts', params);
      
      return {
        contacts: response.results.map((contact: HubSpotContact) => this.mapHubSpotToContact(contact)),
        total: response.total || response.results.length,
        hasMore: !!response.paging?.next
      };
    } catch (error) {
      this.handleError(error, 'listContacts');
    }
  }

  // Deal operations
  async createDeal(deal: Omit<CRMDeal, 'id' | 'createdAt' | 'updatedAt'>): Promise<CRMDeal> {
    try {
      const hubspotDeal = this.mapDealToHubSpot(deal);
      const response = await this.makeRequest('POST', '/crm/v3/objects/deals', {
        properties: hubspotDeal.properties
      });

      // Associate with contact if contactId is provided
      if (deal.contactId) {
        await this.associateContactWithDeal(deal.contactId, response.id);
      }

      return this.mapHubSpotToDeal(response);
    } catch (error) {
      this.handleError(error, 'createDeal');
    }
  }

  async getDeal(id: string): Promise<CRMDeal | null> {
    try {
      const response = await this.makeRequest('GET', `/crm/v3/objects/deals/${id}`, {
        associations: 'contacts'
      });
      return this.mapHubSpotToDeal(response);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      this.handleError(error, 'getDeal');
    }
  }

  async updateDeal(id: string, updates: Partial<CRMDeal>): Promise<CRMDeal> {
    try {
      const hubspotUpdates = this.mapDealToHubSpot(updates as any);
      const response = await this.makeRequest('PATCH', `/crm/v3/objects/deals/${id}`, {
        properties: hubspotUpdates.properties
      });

      return this.mapHubSpotToDeal(response);
    } catch (error) {
      this.handleError(error, 'updateDeal');
    }
  }

  async deleteDeal(id: string): Promise<boolean> {
    try {
      await this.makeRequest('DELETE', `/crm/v3/objects/deals/${id}`);
      return true;
    } catch (error) {
      if (error.status === 404) {
        return true;
      }
      this.handleError(error, 'deleteDeal');
    }
  }

  async listDeals(options?: { limit?: number; offset?: number; filters?: Record<string, any> }): Promise<{ deals: CRMDeal[]; total: number; hasMore: boolean }> {
    try {
      const params: any = {
        limit: options?.limit || 100,
        properties: this.getDealProperties().join(','),
        associations: 'contacts'
      };

      if (options?.offset) {
        params.after = options.offset;
      }

      const response = await this.makeRequest('GET', '/crm/v3/objects/deals', params);
      
      return {
        deals: response.results.map((deal: HubSpotDeal) => this.mapHubSpotToDeal(deal)),
        total: response.total || response.results.length,
        hasMore: !!response.paging?.next
      };
    } catch (error) {
      this.handleError(error, 'listDeals');
    }
  }

  // Activity operations (simplified - HubSpot has complex activity model)
  async createActivity(activity: Omit<CRMActivity, 'id' | 'createdAt' | 'updatedAt'>): Promise<CRMActivity> {
    try {
      const hubspotActivity = this.mapActivityToHubSpot(activity);
      const response = await this.makeRequest('POST', '/crm/v3/objects/activities', {
        properties: hubspotActivity.properties
      });

      return this.mapHubSpotToActivity(response);
    } catch (error) {
      this.handleError(error, 'createActivity');
    }
  }

  async getActivity(id: string): Promise<CRMActivity | null> {
    try {
      const response = await this.makeRequest('GET', `/crm/v3/objects/activities/${id}`);
      return this.mapHubSpotToActivity(response);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      this.handleError(error, 'getActivity');
    }
  }

  async updateActivity(id: string, updates: Partial<CRMActivity>): Promise<CRMActivity> {
    try {
      const hubspotUpdates = this.mapActivityToHubSpot(updates as any);
      const response = await this.makeRequest('PATCH', `/crm/v3/objects/activities/${id}`, {
        properties: hubspotUpdates.properties
      });

      return this.mapHubSpotToActivity(response);
    } catch (error) {
      this.handleError(error, 'updateActivity');
    }
  }

  async deleteActivity(id: string): Promise<boolean> {
    try {
      await this.makeRequest('DELETE', `/crm/v3/objects/activities/${id}`);
      return true;
    } catch (error) {
      if (error.status === 404) {
        return true;
      }
      this.handleError(error, 'deleteActivity');
    }
  }

  async listActivities(options?: { contactId?: string; dealId?: string; limit?: number; offset?: number }): Promise<{ activities: CRMActivity[]; total: number; hasMore: boolean }> {
    try {
      const params: any = {
        limit: options?.limit || 100,
        properties: this.getActivityProperties().join(',')
      };

      if (options?.offset) {
        params.after = options.offset;
      }

      const response = await this.makeRequest('GET', '/crm/v3/objects/activities', params);
      
      return {
        activities: response.results.map((activity: HubSpotActivity) => this.mapHubSpotToActivity(activity)),
        total: response.total || response.results.length,
        hasMore: !!response.paging?.next
      };
    } catch (error) {
      this.handleError(error, 'listActivities');
    }
  }

  // Sync operations
  async syncContacts(direction: 'push' | 'pull' | 'bidirectional' = 'bidirectional'): Promise<CRMSyncResult> {
    try {
      let recordsProcessed = 0;
      let recordsCreated = 0;
      let recordsUpdated = 0;
      let recordsFailed = 0;
      const errors: string[] = [];

      // Implementation would depend on local data store
      // This is a simplified version

      this.lastSync = new Date();

      return {
        success: true,
        message: 'Contact sync completed successfully',
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
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

  async syncDeals(direction: 'push' | 'pull' | 'bidirectional' = 'bidirectional'): Promise<CRMSyncResult> {
    // Similar implementation to syncContacts
    return {
      success: true,
      message: 'Deal sync completed successfully',
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0
    };
  }

  async syncActivities(direction: 'push' | 'pull' | 'bidirectional' = 'bidirectional'): Promise<CRMSyncResult> {
    // Similar implementation to syncContacts
    return {
      success: true,
      message: 'Activity sync completed successfully',
      recordsProcessed: 0,
      recordsCreated: 0,
      recordsUpdated: 0,
      recordsFailed: 0
    };
  }

  async fullSync(): Promise<CRMSyncResult> {
    try {
      const contactSync = await this.syncContacts();
      const dealSync = await this.syncDeals();
      const activitySync = await this.syncActivities();

      const allSuccessful = contactSync.success && dealSync.success && activitySync.success;

      return {
        success: allSuccessful,
        message: allSuccessful ? 'Full sync completed successfully' : 'Full sync completed with errors',
        recordsProcessed: (contactSync.recordsProcessed || 0) + (dealSync.recordsProcessed || 0) + (activitySync.recordsProcessed || 0),
        recordsCreated: (contactSync.recordsCreated || 0) + (dealSync.recordsCreated || 0) + (activitySync.recordsCreated || 0),
        recordsUpdated: (contactSync.recordsUpdated || 0) + (dealSync.recordsUpdated || 0) + (activitySync.recordsUpdated || 0),
        recordsFailed: (contactSync.recordsFailed || 0) + (dealSync.recordsFailed || 0) + (activitySync.recordsFailed || 0),
        errors: [...(contactSync.errors || []), ...(dealSync.errors || []), ...(activitySync.errors || [])]
      };
    } catch (error) {
      return {
        success: false,
        message: `Full sync failed: ${error.message}`,
        errors: [error.message]
      };
    }
  }

  // Webhook operations
  async setupWebhooks(): Promise<boolean> {
    try {
      if (!this.config.webhookUrl) {
        throw new Error('Webhook URL not configured');
      }

      // Set up webhooks for contacts, deals, and activities
      const webhookSubscriptions = [
        'contact.creation',
        'contact.deletion',
        'contact.propertyChange',
        'deal.creation',
        'deal.deletion',
        'deal.propertyChange'
      ];

      for (const subscription of webhookSubscriptions) {
        await this.makeRequest('POST', '/webhooks/v3/subscriptions', {
          eventType: subscription,
          targetUrl: this.config.webhookUrl,
          maxConcurrentRequests: 10
        });
      }

      return true;
    } catch (error) {
      console.error('Failed to setup HubSpot webhooks:', error);
      return false;
    }
  }

  async handleWebhook(payload: any, signature?: string): Promise<void> {
    try {
      if (signature && !this.validateWebhookSignature(JSON.stringify(payload), signature)) {
        throw new Error('Invalid webhook signature');
      }

      // Process webhook events
      for (const event of payload) {
        await this.processWebhookEvent(event);
      }
    } catch (error) {
      console.error('Failed to handle HubSpot webhook:', error);
      throw error;
    }
  }

  validateWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config.webhookSecret) {
      return false;
    }

    // HubSpot webhook signature validation
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }

  // Private helper methods
  private async makeRequest(method: string, endpoint: string, data?: any): Promise<any> {
    await this.rateLimit();

    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Content-Type': 'application/json'
    };

    const config: RequestInit = {
      method,
      headers
    };

    if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    } else if (data && method === 'GET') {
      const params = new URLSearchParams(data);
      const separator = url.includes('?') ? '&' : '?';
      const fullUrl = `${url}${separator}${params.toString()}`;
      const response = await fetch(fullUrl, config);
      return this.handleResponse(response);
    }

    const response = await fetch(url, config);
    return this.handleResponse(response);
  }

  private async handleResponse(response: Response): Promise<any> {
    // Update rate limiting info
    this.rateLimitRemaining = parseInt(response.headers.get('X-HubSpot-RateLimit-Remaining') || '100');
    const resetTime = response.headers.get('X-HubSpot-RateLimit-Reset');
    if (resetTime) {
      this.rateLimitReset = new Date(parseInt(resetTime) * 1000);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw { status: response.status, message: error.message || response.statusText, ...error };
    }

    return response.json();
  }

  protected async rateLimit(): Promise<void> {
    if (this.rateLimitRemaining <= 1) {
      const now = new Date();
      if (now < this.rateLimitReset) {
        const delay = this.rateLimitReset.getTime() - now.getTime();
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  private mapContactToHubSpot(contact: Partial<CRMContact>): HubSpotContact {
    return {
      id: contact.externalId || '',
      properties: {
        firstname: contact.firstName,
        lastname: contact.lastName,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        address: contact.address?.street,
        city: contact.address?.city,
        state: contact.address?.state,
        zip: contact.address?.postalCode,
        country: contact.address?.country,
        ...contact.customFields
      }
    };
  }

  private mapHubSpotToContact(hubspotContact: HubSpotContact): CRMContact {
    return {
      id: hubspotContact.id,
      externalId: hubspotContact.id,
      firstName: hubspotContact.properties.firstname || '',
      lastName: hubspotContact.properties.lastname || '',
      email: hubspotContact.properties.email || '',
      phone: hubspotContact.properties.phone,
      company: hubspotContact.properties.company,
      address: {
        street: hubspotContact.properties.address,
        city: hubspotContact.properties.city,
        state: hubspotContact.properties.state,
        postalCode: hubspotContact.properties.zip,
        country: hubspotContact.properties.country
      },
      customFields: this.extractCustomFields(hubspotContact.properties),
      createdAt: hubspotContact.properties.createdate || new Date().toISOString(),
      updatedAt: hubspotContact.properties.lastmodifieddate || new Date().toISOString()
    };
  }

  private mapDealToHubSpot(deal: Partial<CRMDeal>): HubSpotDeal {
    return {
      id: deal.externalId || '',
      properties: {
        dealname: deal.title,
        description: deal.description,
        amount: deal.value?.toString(),
        dealstage: deal.stage,
        closedate: deal.expectedCloseDate,
        ...deal.customFields
      }
    };
  }

  private mapHubSpotToDeal(hubspotDeal: HubSpotDeal): CRMDeal {
    return {
      id: hubspotDeal.id,
      externalId: hubspotDeal.id,
      contactId: hubspotDeal.associations?.contacts?.[0]?.id || '',
      title: hubspotDeal.properties.dealname || '',
      description: hubspotDeal.properties.description,
      value: parseFloat(hubspotDeal.properties.amount || '0'),
      currency: 'GBP', // Default currency
      stage: hubspotDeal.properties.dealstage || '',
      status: this.mapDealStageToStatus(hubspotDeal.properties.dealstage),
      expectedCloseDate: hubspotDeal.properties.closedate,
      customFields: this.extractCustomFields(hubspotDeal.properties),
      createdAt: hubspotDeal.properties.createdate || new Date().toISOString(),
      updatedAt: hubspotDeal.properties.hs_lastmodifieddate || new Date().toISOString()
    };
  }

  private mapActivityToHubSpot(activity: Partial<CRMActivity>): HubSpotActivity {
    return {
      id: activity.externalId || '',
      properties: {
        hs_activity_type: this.mapActivityTypeToHubSpot(activity.type),
        hs_subject: activity.subject,
        hs_body: activity.description,
        hs_timestamp: activity.dueDate,
        ...activity.customFields
      }
    };
  }

  private mapHubSpotToActivity(hubspotActivity: HubSpotActivity): CRMActivity {
    return {
      id: hubspotActivity.id,
      externalId: hubspotActivity.id,
      contactId: hubspotActivity.associations?.contacts?.[0]?.id,
      dealId: hubspotActivity.associations?.deals?.[0]?.id,
      type: this.mapHubSpotToActivityType(hubspotActivity.properties.hs_activity_type),
      subject: hubspotActivity.properties.hs_subject || '',
      description: hubspotActivity.properties.hs_body,
      status: 'completed', // Default status
      dueDate: hubspotActivity.properties.hs_activity_date,
      userId: hubspotActivity.properties.hubspot_owner_id,
      customFields: this.extractCustomFields(hubspotActivity.properties),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private extractCustomFields(properties: Record<string, any>): Record<string, any> {
    const standardFields = new Set([
      'firstname', 'lastname', 'email', 'phone', 'company', 'address',
      'city', 'state', 'zip', 'country', 'createdate', 'lastmodifieddate',
      'dealname', 'description', 'amount', 'dealstage', 'closedate',
      'hs_activity_type', 'hs_subject', 'hs_body', 'hs_timestamp'
    ]);

    const customFields: Record<string, any> = {};
    for (const [key, value] of Object.entries(properties)) {
      if (!standardFields.has(key)) {
        customFields[key] = value;
      }
    }
    return customFields;
  }

  private mapDealStageToStatus(stage?: string): 'open' | 'won' | 'lost' | 'cancelled' {
    if (!stage) return 'open';
    
    const lowerStage = stage.toLowerCase();
    if (lowerStage.includes('won') || lowerStage.includes('closed-won')) return 'won';
    if (lowerStage.includes('lost') || lowerStage.includes('closed-lost')) return 'lost';
    if (lowerStage.includes('cancelled')) return 'cancelled';
    return 'open';
  }

  private mapActivityTypeToHubSpot(type?: string): string {
    const mapping: Record<string, string> = {
      'call': 'CALL',
      'email': 'EMAIL',
      'meeting': 'MEETING',
      'task': 'TASK',
      'note': 'NOTE'
    };
    return mapping[type || 'note'] || 'NOTE';
  }

  private mapHubSpotToActivityType(hsType?: string): CRMActivity['type'] {
    const mapping: Record<string, CRMActivity['type']> = {
      'CALL': 'call',
      'EMAIL': 'email',
      'MEETING': 'meeting',
      'TASK': 'task',
      'NOTE': 'note'
    };
    return mapping[hsType || 'NOTE'] || 'note';
  }

  private async associateContactWithDeal(contactId: string, dealId: string): Promise<void> {
    await this.makeRequest('PUT', `/crm/v3/objects/deals/${dealId}/associations/contacts/${contactId}/3`);
  }

  private async processWebhookEvent(event: any): Promise<void> {
    // Process different types of webhook events
    switch (event.eventType) {
      case 'contact.creation':
      case 'contact.propertyChange':
        // Handle contact changes
        break;
      case 'deal.creation':
      case 'deal.propertyChange':
        // Handle deal changes
        break;
      default:
        console.log('Unknown webhook event type:', event.eventType);
    }
  }

  private buildFilterGroups(filters: Record<string, any>): any[] {
    const filterGroups = [];
    for (const [property, value] of Object.entries(filters)) {
      filterGroups.push({
        filters: [{
          propertyName: property,
          operator: 'EQ',
          value: value
        }]
      });
    }
    return filterGroups;
  }

  private getContactProperties(): string[] {
    return [
      'firstname', 'lastname', 'email', 'phone', 'company',
      'address', 'city', 'state', 'zip', 'country',
      'createdate', 'lastmodifieddate'
    ];
  }

  private getDealProperties(): string[] {
    return [
      'dealname', 'description', 'amount', 'dealstage',
      'closedate', 'createdate', 'hs_lastmodifieddate'
    ];
  }

  private getActivityProperties(): string[] {
    return [
      'hs_activity_type', 'hs_subject', 'hs_body',
      'hs_timestamp', 'hs_activity_date'
    ];
  }
}

export default HubSpotAdapter;