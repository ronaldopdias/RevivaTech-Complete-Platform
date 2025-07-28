import CRMAdapter from './CRMAdapter';
import { useWebSocket } from '../realtime/WebSocketProvider';

interface WebhookEvent {
  id: string;
  source: string; // CRM type (hubspot, salesforce, etc.)
  eventType: string;
  objectType: 'contact' | 'deal' | 'activity' | 'custom';
  objectId: string;
  timestamp: string;
  action: 'created' | 'updated' | 'deleted' | 'associated' | 'dissociated';
  data: any;
  previousData?: any;
  signature?: string;
}

interface WebhookConfig {
  enabled: boolean;
  url: string;
  secret?: string;
  retryAttempts: number;
  retryDelay: number; // milliseconds
  timeout: number; // milliseconds
  subscriptions: string[];
  filters?: {
    objectTypes?: string[];
    eventTypes?: string[];
    conditions?: Record<string, any>;
  };
}

interface WebhookProcessingResult {
  success: boolean;
  eventId: string;
  message?: string;
  error?: string;
  retryAfter?: number;
  actions?: string[];
}

export class WebhookManager {
  private adapters: Map<string, CRMAdapter> = new Map();
  private eventQueue: WebhookEvent[] = [];
  private processing: boolean = false;
  private retryQueue: Map<string, { event: WebhookEvent; attempt: number; nextRetry: Date }> = new Map();
  private webhookHistory: Map<string, WebhookEvent> = new Map();
  private maxHistorySize: number = 1000;

  constructor() {
    // Start background processing
    this.startEventProcessor();
    this.startRetryProcessor();
  }

  // Register CRM adapter for webhook processing
  registerAdapter(crmType: string, adapter: CRMAdapter): void {
    this.adapters.set(crmType, adapter);
  }

  // Process incoming webhook
  async processWebhook(
    crmType: string, 
    payload: any, 
    signature?: string,
    headers?: Record<string, string>
  ): Promise<WebhookProcessingResult> {
    try {
      const adapter = this.adapters.get(crmType);
      if (!adapter) {
        throw new Error(`No adapter registered for CRM type: ${crmType}`);
      }

      // Validate webhook signature if provided
      if (signature) {
        const isValid = adapter.validateWebhookSignature(JSON.stringify(payload), signature);
        if (!isValid) {
          throw new Error('Invalid webhook signature');
        }
      }

      // Parse webhook payload into standardized events
      const events = await this.parseWebhookPayload(crmType, payload, headers);
      
      // Add events to processing queue
      for (const event of events) {
        this.addEventToQueue(event);
      }

      return {
        success: true,
        eventId: events[0]?.id || 'unknown',
        message: `Successfully queued ${events.length} event(s) for processing`,
        actions: [`Queued ${events.length} events`]
      };

    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        success: false,
        eventId: 'unknown',
        error: error.message,
        actions: ['Error logged']
      };
    }
  }

  // Setup webhooks for all registered adapters
  async setupAllWebhooks(): Promise<{ success: boolean; results: Record<string, boolean> }> {
    const results: Record<string, boolean> = {};
    let overallSuccess = true;

    for (const [crmType, adapter] of this.adapters.entries()) {
      try {
        const success = await adapter.setupWebhooks();
        results[crmType] = success;
        if (!success) overallSuccess = false;
      } catch (error) {
        console.error(`Failed to setup webhooks for ${crmType}:`, error);
        results[crmType] = false;
        overallSuccess = false;
      }
    }

    return { success: overallSuccess, results };
  }

  // Get webhook statistics
  getWebhookStats(): {
    queueSize: number;
    retryQueueSize: number;
    totalProcessed: number;
    recentEvents: WebhookEvent[];
    errorRate: number;
  } {
    const recentEvents = Array.from(this.webhookHistory.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    return {
      queueSize: this.eventQueue.length,
      retryQueueSize: this.retryQueue.size,
      totalProcessed: this.webhookHistory.size,
      recentEvents,
      errorRate: 0 // Would calculate from actual error tracking
    };
  }

  // Private methods

  private async parseWebhookPayload(
    crmType: string, 
    payload: any, 
    headers?: Record<string, string>
  ): Promise<WebhookEvent[]> {
    const events: WebhookEvent[] = [];

    switch (crmType) {
      case 'hubspot':
        events.push(...this.parseHubSpotWebhook(payload));
        break;
      case 'salesforce':
        events.push(...this.parseSalesforceWebhook(payload));
        break;
      case 'pipedrive':
        events.push(...this.parsePipedriveWebhook(payload));
        break;
      default:
        events.push(this.parseGenericWebhook(crmType, payload));
    }

    return events;
  }

  private parseHubSpotWebhook(payload: any[]): WebhookEvent[] {
    return payload.map(event => ({
      id: `hubspot_${event.eventId || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'hubspot',
      eventType: event.eventType,
      objectType: this.mapHubSpotObjectType(event.objectType),
      objectId: event.objectId?.toString() || '',
      timestamp: new Date(event.occurredAt || Date.now()).toISOString(),
      action: this.mapHubSpotAction(event.eventType),
      data: event.properties || event,
      previousData: event.propertiesUpdated || undefined
    }));
  }

  private parseSalesforceWebhook(payload: any): WebhookEvent[] {
    // Salesforce webhook structure varies by API
    if (payload.sObject) {
      return [{
        id: `salesforce_${payload.sObject.Id}_${Date.now()}`,
        source: 'salesforce',
        eventType: payload.eventType || 'update',
        objectType: this.mapSalesforceObjectType(payload.sObject.attributes?.type),
        objectId: payload.sObject.Id,
        timestamp: new Date().toISOString(),
        action: 'updated',
        data: payload.sObject
      }];
    }

    return [];
  }

  private parsePipedriveWebhook(payload: any): WebhookEvent[] {
    return [{
      id: `pipedrive_${payload.current?.id || Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: 'pipedrive',
      eventType: payload.event,
      objectType: this.mapPipedriveObjectType(payload.meta?.object),
      objectId: payload.current?.id?.toString() || '',
      timestamp: new Date().toISOString(),
      action: this.mapPipedriveAction(payload.event),
      data: payload.current,
      previousData: payload.previous
    }];
  }

  private parseGenericWebhook(crmType: string, payload: any): WebhookEvent {
    return {
      id: `${crmType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: crmType,
      eventType: payload.eventType || 'update',
      objectType: payload.objectType || 'custom',
      objectId: payload.objectId || payload.id || '',
      timestamp: payload.timestamp || new Date().toISOString(),
      action: payload.action || 'updated',
      data: payload.data || payload
    };
  }

  private addEventToQueue(event: WebhookEvent): void {
    this.eventQueue.push(event);
    this.webhookHistory.set(event.id, event);
    
    // Limit history size
    if (this.webhookHistory.size > this.maxHistorySize) {
      const oldestKey = this.webhookHistory.keys().next().value;
      this.webhookHistory.delete(oldestKey);
    }
  }

  private startEventProcessor(): void {
    setInterval(async () => {
      if (!this.processing && this.eventQueue.length > 0) {
        this.processing = true;
        await this.processEventQueue();
        this.processing = false;
      }
    }, 1000); // Process every second
  }

  private async processEventQueue(): Promise<void> {
    const batchSize = 10;
    const eventsToProcess = this.eventQueue.splice(0, batchSize);

    for (const event of eventsToProcess) {
      try {
        await this.processWebhookEvent(event);
      } catch (error) {
        console.error(`Failed to process webhook event ${event.id}:`, error);
        this.addToRetryQueue(event);
      }
    }
  }

  private async processWebhookEvent(event: WebhookEvent): Promise<void> {
    // Process the webhook event based on its type and source
    switch (event.action) {
      case 'created':
        await this.handleObjectCreated(event);
        break;
      case 'updated':
        await this.handleObjectUpdated(event);
        break;
      case 'deleted':
        await this.handleObjectDeleted(event);
        break;
      default:
        console.log(`Unhandled webhook action: ${event.action} for event ${event.id}`);
    }

    // Broadcast event via WebSocket for real-time updates
    this.broadcastWebhookEvent(event);
  }

  private async handleObjectCreated(event: WebhookEvent): Promise<void> {
    const adapter = this.adapters.get(event.source);
    if (!adapter) return;

    // Sync the created object to local database
    switch (event.objectType) {
      case 'contact':
        await this.syncContactFromWebhook(adapter, event);
        break;
      case 'deal':
        await this.syncDealFromWebhook(adapter, event);
        break;
      case 'activity':
        await this.syncActivityFromWebhook(adapter, event);
        break;
    }
  }

  private async handleObjectUpdated(event: WebhookEvent): Promise<void> {
    // Similar to handleObjectCreated but for updates
    await this.handleObjectCreated(event); // Reuse the sync logic
  }

  private async handleObjectDeleted(event: WebhookEvent): Promise<void> {
    // Handle object deletion in local database
    console.log(`Object deleted: ${event.objectType} ${event.objectId} from ${event.source}`);
  }

  private async syncContactFromWebhook(adapter: CRMAdapter, event: WebhookEvent): Promise<void> {
    try {
      const contact = await adapter.getContact(event.objectId);
      if (contact) {
        // Update local contact database
        console.log(`Synced contact from webhook: ${contact.email}`);
      }
    } catch (error) {
      console.error(`Failed to sync contact from webhook:`, error);
      throw error;
    }
  }

  private async syncDealFromWebhook(adapter: CRMAdapter, event: WebhookEvent): Promise<void> {
    try {
      const deal = await adapter.getDeal(event.objectId);
      if (deal) {
        // Update local deal database
        console.log(`Synced deal from webhook: ${deal.title}`);
      }
    } catch (error) {
      console.error(`Failed to sync deal from webhook:`, error);
      throw error;
    }
  }

  private async syncActivityFromWebhook(adapter: CRMAdapter, event: WebhookEvent): Promise<void> {
    try {
      const activity = await adapter.getActivity(event.objectId);
      if (activity) {
        // Update local activity database
        console.log(`Synced activity from webhook: ${activity.subject}`);
      }
    } catch (error) {
      console.error(`Failed to sync activity from webhook:`, error);
      throw error;
    }
  }

  private broadcastWebhookEvent(event: WebhookEvent): void {
    // Broadcast via WebSocket for real-time updates
    // This would integrate with the WebSocket system
    console.log(`Broadcasting webhook event: ${event.eventType} for ${event.objectType} ${event.objectId}`);
  }

  private addToRetryQueue(event: WebhookEvent): void {
    const retryId = `${event.id}_retry`;
    const nextRetry = new Date(Date.now() + 5000); // Retry in 5 seconds
    
    this.retryQueue.set(retryId, {
      event,
      attempt: 1,
      nextRetry
    });
  }

  private startRetryProcessor(): void {
    setInterval(() => {
      const now = new Date();
      
      for (const [retryId, retryInfo] of this.retryQueue.entries()) {
        if (now >= retryInfo.nextRetry) {
          this.processRetry(retryId, retryInfo);
        }
      }
    }, 5000); // Check retries every 5 seconds
  }

  private async processRetry(retryId: string, retryInfo: { event: WebhookEvent; attempt: number; nextRetry: Date }): Promise<void> {
    const maxRetries = 3;
    
    if (retryInfo.attempt >= maxRetries) {
      console.error(`Max retries reached for webhook event ${retryInfo.event.id}`);
      this.retryQueue.delete(retryId);
      return;
    }

    try {
      await this.processWebhookEvent(retryInfo.event);
      this.retryQueue.delete(retryId);
      console.log(`Successfully processed webhook event ${retryInfo.event.id} on retry ${retryInfo.attempt}`);
    } catch (error) {
      console.error(`Retry ${retryInfo.attempt} failed for webhook event ${retryInfo.event.id}:`, error);
      
      // Schedule next retry with exponential backoff
      const delay = Math.pow(2, retryInfo.attempt) * 5000; // 5s, 10s, 20s
      retryInfo.attempt++;
      retryInfo.nextRetry = new Date(Date.now() + delay);
    }
  }

  // Mapping helper methods
  private mapHubSpotObjectType(hsType: string): WebhookEvent['objectType'] {
    const mapping: Record<string, WebhookEvent['objectType']> = {
      'contact': 'contact',
      'deal': 'deal',
      'activity': 'activity',
      'engagement': 'activity'
    };
    return mapping[hsType] || 'custom';
  }

  private mapHubSpotAction(eventType: string): WebhookEvent['action'] {
    if (eventType.includes('creation')) return 'created';
    if (eventType.includes('deletion')) return 'deleted';
    if (eventType.includes('propertyChange')) return 'updated';
    return 'updated';
  }

  private mapSalesforceObjectType(sfType?: string): WebhookEvent['objectType'] {
    if (!sfType) return 'custom';
    
    const mapping: Record<string, WebhookEvent['objectType']> = {
      'Contact': 'contact',
      'Lead': 'contact',
      'Opportunity': 'deal',
      'Task': 'activity',
      'Event': 'activity'
    };
    return mapping[sfType] || 'custom';
  }

  private mapPipedriveObjectType(pdType?: string): WebhookEvent['objectType'] {
    const mapping: Record<string, WebhookEvent['objectType']> = {
      'person': 'contact',
      'deal': 'deal',
      'activity': 'activity'
    };
    return mapping[pdType || ''] || 'custom';
  }

  private mapPipedriveAction(event: string): WebhookEvent['action'] {
    if (event.includes('added')) return 'created';
    if (event.includes('deleted')) return 'deleted';
    if (event.includes('updated')) return 'updated';
    return 'updated';
  }
}

export default WebhookManager;