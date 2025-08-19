/**
 * Debug Upload Service
 * Automatically uploads debug events from client to server for analysis
 * Provides batch uploading with smart queueing and error handling
 */

export interface DebugEvent {
  id?: string;
  timestamp?: string;
  type: 'console' | 'network' | 'auth' | 'error' | 'performance' | 'custom';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  message: string;
  data?: any;
  sessionId?: string;
  userId?: string;
}

export interface UploadConfig {
  enabled: boolean;
  apiEndpoint: string;
  batchSize: number;
  uploadInterval: number; // milliseconds
  maxQueueSize: number;
  retryAttempts: number;
  retryDelay: number;
  uploadOnError: boolean;
  uploadOnWarning: boolean;
  uploadInProduction: boolean;
  maxEventDataSize: number; // bytes - max size for individual event data
  maxBatchSize: number; // bytes - max size for entire batch
}

export interface UploadStats {
  totalEvents: number;
  uploadedEvents: number;
  failedEvents: number;
  queuedEvents: number;
  lastUpload: string | null;
  uploadErrors: string[];
}

class DebugUploadService {
  private config: UploadConfig;
  private queue: DebugEvent[] = [];
  private uploadInterval: NodeJS.Timeout | null = null;
  private sessionId: string;
  private userId: string | null = null;
  private stats: UploadStats;
  private subscribers: Array<(stats: UploadStats) => void> = [];
  private isUploading = false;
  private lastUploadTime: number = 0;
  private readonly minUploadInterval = 1000; // 1 second minimum between uploads

  constructor(config?: Partial<UploadConfig>) {
    this.config = {
      enabled: true,
      apiEndpoint: '/api/debug/logs',
      batchSize: 50,
      uploadInterval: 30000, // 30 seconds
      maxQueueSize: 500,
      retryAttempts: 3,
      retryDelay: 5000,
      uploadOnError: true,
      uploadOnWarning: false,
      uploadInProduction: process.env.NODE_ENV === 'production',
      maxEventDataSize: 1024 * 1024, // 1MB per event
      maxBatchSize: 10 * 1024 * 1024, // 10MB per batch
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.stats = {
      totalEvents: 0,
      uploadedEvents: 0,
      failedEvents: 0,
      queuedEvents: 0,
      lastUpload: null,
      uploadErrors: [],
    };

    if (typeof window !== 'undefined' && this.config.enabled) {
      this.initialize();
    }
  }

  private initialize(): void {
    // Start periodic upload
    this.startPeriodicUpload();

    // Upload before page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.uploadBatch();
      });

      // Upload when page becomes hidden (mobile apps, tab switching)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.uploadBatch();
        }
      });
    }
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `debug_event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateEventSize(event: DebugEvent): number {
    try {
      return new TextEncoder().encode(JSON.stringify(event)).length;
    } catch {
      // Fallback estimation
      return JSON.stringify(event).length * 2; // UTF-16 approximation
    }
  }

  private truncateEventData(event: DebugEvent): DebugEvent {
    const truncatedEvent = { ...event };
    
    if (truncatedEvent.data && typeof truncatedEvent.data === 'object') {
      const dataStr = JSON.stringify(truncatedEvent.data);
      if (dataStr.length > this.config.maxEventDataSize / 2) {
        truncatedEvent.data = {
          ...truncatedEvent.data,
          _truncated: true,
          _originalSize: dataStr.length,
          _truncatedData: dataStr.substring(0, this.config.maxEventDataSize / 4) + '...[TRUNCATED]'
        };
      }
    }
    
    if (truncatedEvent.message && truncatedEvent.message.length > 1000) {
      truncatedEvent.message = truncatedEvent.message.substring(0, 1000) + '...[TRUNCATED]';
    }
    
    return truncatedEvent;
  }

  private startPeriodicUpload(): void {
    if (this.uploadInterval) {
      clearInterval(this.uploadInterval);
    }

    this.uploadInterval = setInterval(() => {
      if (this.queue.length > 0) {
        this.uploadBatch();
      }
    }, this.config.uploadInterval);
  }

  /**
   * Add a debug event to the upload queue
   */
  addEvent(event: DebugEvent): void {
    if (!this.config.enabled) return;

    // Skip if production and not enabled
    if (process.env.NODE_ENV === 'production' && !this.config.uploadInProduction) {
      return;
    }

    // Filter events based on severity
    if (!this.config.uploadOnWarning && event.severity === 'medium') {
      return;
    }

    if (!this.config.uploadOnError && (event.severity === 'high' || event.severity === 'critical')) {
      // Always upload errors regardless of setting for critical debugging
    }

    // Enrich event with metadata
    let enrichedEvent: DebugEvent = {
      ...event,
      id: event.id || this.generateEventId(),
      timestamp: event.timestamp || new Date().toISOString(),
      sessionId: event.sessionId || this.sessionId,
      userId: event.userId || this.userId,
    };

    // Check and truncate event data if too large
    const eventSize = this.calculateEventSize(enrichedEvent);
    if (eventSize > this.config.maxEventDataSize) {
      enrichedEvent = this.truncateEventData(enrichedEvent);
    }

    // Add to queue
    this.queue.push(enrichedEvent);
    this.stats.totalEvents++;
    this.stats.queuedEvents = this.queue.length;

    // Trim queue if too large
    if (this.queue.length > this.config.maxQueueSize) {
      const removed = this.queue.splice(0, this.queue.length - this.config.maxQueueSize);
      this.stats.failedEvents += removed.length;
      this.stats.queuedEvents = this.queue.length;
    }

    // Upload immediately if queue is full or high/critical severity
    if (this.queue.length >= this.config.batchSize || 
        event.severity === 'high' || 
        event.severity === 'critical') {
      this.uploadBatch();
    }

    this.notifySubscribers();
  }

  /**
   * Upload queued events to server
   */
  async uploadBatch(): Promise<void> {
    if (!this.config.enabled || this.queue.length === 0 || this.isUploading) {
      return;
    }

    // Rate limiting: Check if enough time has passed since last upload
    const now = Date.now();
    if (now - this.lastUploadTime < this.minUploadInterval) {
      return;
    }

    this.isUploading = true;
    this.lastUploadTime = now;
    
    // Smart chunking: Take events until we reach size or count limit
    const eventsToUpload: DebugEvent[] = [];
    let currentBatchSize = 0;
    let eventsProcessed = 0;
    
    while (eventsProcessed < this.config.batchSize && 
           eventsProcessed < this.queue.length && 
           currentBatchSize < this.config.maxBatchSize) {
      
      const event = this.queue[eventsProcessed];
      const eventSize = this.calculateEventSize(event);
      
      // If adding this event would exceed batch size limit, stop
      if (currentBatchSize + eventSize > this.config.maxBatchSize && eventsToUpload.length > 0) {
        break;
      }
      
      eventsToUpload.push(event);
      currentBatchSize += eventSize;
      eventsProcessed++;
    }
    
    // Remove processed events from queue
    this.queue.splice(0, eventsProcessed);
    this.stats.queuedEvents = this.queue.length;

    try {
      const response = await this.uploadWithRetry(eventsToUpload);
      
      if (response.success) {
        this.stats.uploadedEvents += eventsToUpload.length;
        this.stats.lastUpload = new Date().toISOString();
        
        // Clear old upload errors on success
        if (this.stats.uploadErrors.length > 0) {
          this.stats.uploadErrors = [];
        }
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      // Re-queue events on failure
      this.queue.unshift(...eventsToUpload);
      this.stats.failedEvents += eventsToUpload.length;
      this.stats.queuedEvents = this.queue.length;
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown upload error';
      this.stats.uploadErrors.push(`${new Date().toISOString()}: ${errorMessage}`);
      
      // Keep only last 5 errors
      if (this.stats.uploadErrors.length > 5) {
        this.stats.uploadErrors = this.stats.uploadErrors.slice(-5);
      }

      console.error('Debug upload failed:', error);
    } finally {
      this.isUploading = false;
      this.notifySubscribers();
    }
  }

  private async uploadWithRetry(events: DebugEvent[]): Promise<{ success: boolean; message?: string }> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.config.retryAttempts; attempt++) {
      try {
        const apiBaseUrl = this.getApiBaseUrl();
        const response = await fetch(`${apiBaseUrl}${this.config.apiEndpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        return { success: true, message: result.message };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        
        if (attempt < this.config.retryAttempts) {
          await this.delay(this.config.retryDelay * (attempt + 1)); // Exponential backoff
        }
      }
    }

    throw lastError;
  }

  private getApiBaseUrl(): string {
    if (typeof window === 'undefined') {
      // Server-side: Use correct backend container name for server-to-server communication
      return 'http://revivatech_backend:3011';
    }
    
    // Client-side: Use relative URLs to leverage frontend proxy (avoids HTTPS/HTTP mismatch)
    // The frontend Next.js server will proxy these requests to the backend via rewrites
    return ''; // Empty string means relative URLs
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private notifySubscribers(): void {
    this.subscribers.forEach(callback => {
      try {
        callback({ ...this.stats });
      } catch (error) {
        console.error('Error in debug upload service subscriber:', error);
      }
    });
  }

  /**
   * Set user ID for event correlation
   */
  setUserId(userId: string | null): void {
    this.userId = userId;
  }

  /**
   * Get current upload statistics
   */
  getStats(): UploadStats {
    return { ...this.stats };
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length;
  }

  /**
   * Force upload all queued events
   */
  async flush(): Promise<void> {
    while (this.queue.length > 0 && !this.isUploading) {
      await this.uploadBatch();
    }
  }

  /**
   * Clear all queued events
   */
  clearQueue(): void {
    this.stats.failedEvents += this.queue.length;
    this.queue = [];
    this.stats.queuedEvents = 0;
    this.notifySubscribers();
  }

  /**
   * Subscribe to upload statistics changes
   */
  subscribe(callback: (stats: UploadStats) => void): () => void {
    this.subscribers.push(callback);
    
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<UploadConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (this.config.enabled && !this.uploadInterval) {
      this.startPeriodicUpload();
    } else if (!this.config.enabled && this.uploadInterval) {
      clearInterval(this.uploadInterval);
      this.uploadInterval = null;
    }
  }

  /**
   * Enable/disable upload service
   */
  setEnabled(enabled: boolean): void {
    this.updateConfig({ enabled });
  }

  /**
   * Get current configuration
   */
  getConfig(): UploadConfig {
    return { ...this.config };
  }

  /**
   * Check if service is currently uploading
   */
  isCurrentlyUploading(): boolean {
    return this.isUploading;
  }

  /**
   * Export current queue for debugging
   */
  exportQueue(): string {
    return JSON.stringify({
      queue: this.queue,
      stats: this.stats,
      config: this.config,
      sessionId: this.sessionId,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.uploadInterval) {
      clearInterval(this.uploadInterval);
      this.uploadInterval = null;
    }
    
    // Final upload attempt
    if (this.queue.length > 0) {
      this.uploadBatch().catch(() => {
        // Ignore errors during cleanup
      });
    }
    
    this.subscribers = [];
  }
}

// Create singleton instance
export const debugUploadService = new DebugUploadService();

// Convenience functions
export const uploadDebugEvent = (event: DebugEvent) => debugUploadService.addEvent(event);
export const flushDebugEvents = () => debugUploadService.flush();
export const getDebugUploadStats = () => debugUploadService.getStats();

export default debugUploadService;