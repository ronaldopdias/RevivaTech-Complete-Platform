/**
 * Network Request Interceptor
 * Monitors all network requests (fetch, XMLHttpRequest) for debugging
 * Provides detailed request/response information and timing
 * Integrates with existing error reporting system
 * Auto-uploads network events for analysis
 */

import { debugUploadService, type DebugEvent } from '../debug/debug-upload-service';

export interface NetworkRequest {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status?: number;
  statusText?: string;
  duration?: number;
  requestHeaders: Record<string, string>;
  responseHeaders: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
  error?: string;
  type: 'fetch' | 'xhr';
  size?: {
    request: number;
    response: number;
  };
  timing?: {
    start: number;
    end: number;
    dns?: number;
    tcp?: number;
    tls?: number;
    request: number;
    response: number;
  };
  metadata?: {
    retryAttempt?: number;
    cached?: boolean;
    fromServiceWorker?: boolean;
    redirected?: boolean;
    cors?: boolean;
  };
}

export interface NetworkConfig {
  enabled: boolean;
  maxRequests: number;
  persistToStorage: boolean;
  trackRequestBodies: boolean;
  trackResponseBodies: boolean;
  trackOnlyFailures: boolean;
  blacklistUrls: string[];
  whitelistUrls: string[];
  enableTiming: boolean;
  enableMetrics: boolean;
  bodyMaxSize: number; // Max size in bytes to track
}

class NetworkInterceptor {
  private requests: NetworkRequest[] = [];
  private originalFetch: typeof window.fetch;
  private originalXHR: typeof XMLHttpRequest;
  private config: NetworkConfig;
  private subscribers: Array<(request: NetworkRequest) => void> = [];
  private pendingRequests: Map<string, NetworkRequest> = new Map();

  constructor(config?: Partial<NetworkConfig>) {
    this.config = {
      enabled: true,
      maxRequests: 500,
      persistToStorage: true,
      trackRequestBodies: true,
      trackResponseBodies: true,
      trackOnlyFailures: false,
      blacklistUrls: [
        '/api/logs', // Prevent infinite loops
        '/api/errors',
        '/_next/',
        '/favicon.ico',
        '.map', // Source maps
      ],
      whitelistUrls: [],
      enableTiming: true,
      enableMetrics: true,
      bodyMaxSize: 10 * 1024, // 10KB max
      ...config,
    };

    if (typeof window !== 'undefined') {
      this.originalFetch = window.fetch.bind(window);
      this.originalXHR = window.XMLHttpRequest;
      this.initialize();
    }
  }

  private initialize(): void {
    if (!this.config.enabled) return;

    this.loadPersistedRequests();
    this.interceptFetch();
    this.interceptXHR();
    this.setupPerformanceObserver();
  }

  private interceptFetch(): void {
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const requestId = this.generateId();
      const startTime = performance.now();
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
      
      if (this.shouldIgnoreUrl(url)) {
        return this.originalFetch(input, init);
      }

      const method = init?.method || 'GET';
      const requestHeaders = this.extractHeaders(init?.headers);
      
      const request: NetworkRequest = {
        id: requestId,
        timestamp: new Date().toISOString(),
        method: method.toUpperCase(),
        url,
        type: 'fetch',
        requestHeaders,
        responseHeaders: {},
        timing: { start: startTime, end: 0, request: 0, response: 0 },
        metadata: {},
      };

      // Track request body
      if (this.config.trackRequestBodies && init?.body) {
        try {
          request.requestBody = await this.serializeBody(init.body);
          request.size = { 
            request: this.getBodySize(init.body),
            response: 0 
          };
        } catch (error) {
          request.requestBody = '[Unable to serialize]';
        }
      }

      this.pendingRequests.set(requestId, request);

      try {
        const requestEndTime = performance.now();
        const response = await this.originalFetch(input, init);
        const responseStartTime = performance.now();
        
        // Clone response for body reading
        const responseClone = response.clone();
        
        // Update request with response data
        request.status = response.status;
        request.statusText = response.statusText;
        request.duration = responseStartTime - startTime;
        request.responseHeaders = this.extractResponseHeaders(response.headers);
        
        if (this.config.enableTiming && request.timing) {
          request.timing.end = responseStartTime;
          request.timing.request = requestEndTime - startTime;
          request.timing.response = responseStartTime - requestEndTime;
        }

        // Track response metadata
        if (this.config.enableMetrics && request.metadata) {
          request.metadata.cached = response.headers.get('cf-cache-status') === 'HIT';
          request.metadata.fromServiceWorker = (response as any).fromServiceWorker;
          request.metadata.redirected = response.redirected;
          request.metadata.cors = response.type === 'cors';
        }

        // Track response body
        if (this.config.trackResponseBodies && this.shouldTrackResponse(response)) {
          try {
            const responseText = await responseClone.text();
            if (responseText.length <= this.config.bodyMaxSize) {
              try {
                request.responseBody = JSON.parse(responseText);
              } catch {
                request.responseBody = responseText;
              }
            } else {
              request.responseBody = `[Response too large: ${responseText.length} bytes]`;
            }
            
            if (request.size) {
              request.size.response = responseText.length;
            }
          } catch (error) {
            request.responseBody = '[Unable to read response]';
          }
        }

        this.pendingRequests.delete(requestId);
        this.addRequest(request);

        return response;
      } catch (error) {
        const errorEndTime = performance.now();
        
        request.error = error instanceof Error ? error.message : String(error);
        request.duration = errorEndTime - startTime;
        request.status = 0;
        
        if (this.config.enableTiming && request.timing) {
          request.timing.end = errorEndTime;
          request.timing.request = errorEndTime - startTime;
        }

        this.pendingRequests.delete(requestId);
        this.addRequest(request);

        throw error;
      }
    };
  }

  private interceptXHR(): void {
    const self = this;

    window.XMLHttpRequest = class extends self.originalXHR {
      private _requestId: string;
      private _startTime: number;
      private _url: string;
      private _method: string;
      private _requestHeaders: Record<string, string> = {};
      private _requestBody: any;

      constructor() {
        super();
        this._requestId = self.generateId();
        this._startTime = 0;
        this._url = '';
        this._method = 'GET';

        // Override open method
        const originalOpen = this.open;
        this.open = function(method: string, url: string | URL, async?: boolean, user?: string, password?: string) {
          this._method = method.toUpperCase();
          this._url = typeof url === 'string' ? url : url.href;
          return originalOpen.call(this, method, url, async, user, password);
        };

        // Override setRequestHeader
        const originalSetRequestHeader = this.setRequestHeader;
        this.setRequestHeader = function(name: string, value: string) {
          this._requestHeaders[name] = value;
          return originalSetRequestHeader.call(this, name, value);
        };

        // Override send method
        const originalSend = this.send;
        this.send = function(body?: Document | BodyInit | null) {
          if (self.shouldIgnoreUrl(this._url)) {
            return originalSend.call(this, body);
          }

          this._startTime = performance.now();
          this._requestBody = body;

          const request: NetworkRequest = {
            id: this._requestId,
            timestamp: new Date().toISOString(),
            method: this._method,
            url: this._url,
            type: 'xhr',
            requestHeaders: { ...this._requestHeaders },
            responseHeaders: {},
            timing: { start: this._startTime, end: 0, request: 0, response: 0 },
            metadata: {},
          };

          // Track request body
          if (self.config.trackRequestBodies && body) {
            try {
              request.requestBody = self.serializeBodySync(body);
              request.size = { 
                request: self.getBodySize(body),
                response: 0 
              };
            } catch (error) {
              request.requestBody = '[Unable to serialize]';
            }
          }

          self.pendingRequests.set(this._requestId, request);

          // Handle response
          const handleResponse = () => {
            const endTime = performance.now();
            
            request.status = this.status;
            request.statusText = this.statusText;
            request.duration = endTime - this._startTime;
            request.responseHeaders = self.extractXHRHeaders(this);

            if (self.config.enableTiming && request.timing) {
              request.timing.end = endTime;
              request.timing.response = endTime - this._startTime;
            }

            // Track response body
            if (self.config.trackResponseBodies && this.responseText) {
              if (this.responseText.length <= self.config.bodyMaxSize) {
                try {
                  request.responseBody = JSON.parse(this.responseText);
                } catch {
                  request.responseBody = this.responseText;
                }
              } else {
                request.responseBody = `[Response too large: ${this.responseText.length} bytes]`;
              }

              if (request.size) {
                request.size.response = this.responseText.length;
              }
            }

            self.pendingRequests.delete(this._requestId);
            self.addRequest(request);
          };

          // Handle error
          const handleError = () => {
            const endTime = performance.now();
            
            request.error = 'Network Error';
            request.duration = endTime - this._startTime;
            request.status = this.status || 0;

            if (self.config.enableTiming && request.timing) {
              request.timing.end = endTime;
            }

            self.pendingRequests.delete(this._requestId);
            self.addRequest(request);
          };

          this.addEventListener('load', handleResponse);
          this.addEventListener('error', handleError);
          this.addEventListener('abort', handleError);
          this.addEventListener('timeout', handleError);

          return originalSend.call(this, body);
        };
      }
    };
  }

  private setupPerformanceObserver(): void {
    if (!this.config.enableTiming || typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation' || entry.entryType === 'resource') {
            this.updateTimingFromPerformanceEntry(entry);
          }
        }
      });

      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      // PerformanceObserver not fully supported
    }
  }

  private updateTimingFromPerformanceEntry(entry: PerformanceEntry): void {
    const resourceEntry = entry as PerformanceResourceTiming;
    const matchingRequest = this.requests.find(req => req.url === resourceEntry.name);
    
    if (matchingRequest && matchingRequest.timing) {
      matchingRequest.timing.dns = resourceEntry.domainLookupEnd - resourceEntry.domainLookupStart;
      matchingRequest.timing.tcp = resourceEntry.connectEnd - resourceEntry.connectStart;
      
      if (resourceEntry.secureConnectionStart > 0) {
        matchingRequest.timing.tls = resourceEntry.connectEnd - resourceEntry.secureConnectionStart;
      }
    }
  }

  private shouldIgnoreUrl(url: string): boolean {
    // Check blacklist
    if (this.config.blacklistUrls.some(pattern => url.includes(pattern))) {
      return true;
    }

    // Check whitelist (if configured)
    if (this.config.whitelistUrls.length > 0) {
      return !this.config.whitelistUrls.some(pattern => url.includes(pattern));
    }

    return false;
  }

  private shouldTrackResponse(response: Response): boolean {
    // Don't track large responses or binary content
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('image/') || 
        contentType.includes('video/') || 
        contentType.includes('audio/') ||
        contentType.includes('application/octet-stream')) {
      return false;
    }

    // Only track if not configured to track failures only, or if it's a failure
    return !this.config.trackOnlyFailures || response.status >= 400;
  }

  private extractHeaders(headers?: HeadersInit): Record<string, string> {
    if (!headers) return {};

    if (headers instanceof Headers) {
      const result: Record<string, string> = {};
      headers.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    }

    if (Array.isArray(headers)) {
      const result: Record<string, string> = {};
      headers.forEach(([key, value]) => {
        result[key] = value;
      });
      return result;
    }

    return headers as Record<string, string>;
  }

  private extractResponseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  private extractXHRHeaders(xhr: XMLHttpRequest): Record<string, string> {
    const result: Record<string, string> = {};
    const allHeaders = xhr.getAllResponseHeaders();
    
    if (allHeaders) {
      allHeaders.split('\r\n').forEach(line => {
        const [key, ...valueParts] = line.split(': ');
        if (key && valueParts.length > 0) {
          result[key.toLowerCase()] = valueParts.join(': ');
        }
      });
    }

    return result;
  }

  private async serializeBody(body: BodyInit): Promise<any> {
    if (!body) return null;

    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return body;
      }
    }

    if (body instanceof FormData) {
      const result: Record<string, any> = {};
      body.forEach((value, key) => {
        result[key] = value instanceof File ? `[File: ${value.name}]` : value;
      });
      return result;
    }

    if (body instanceof URLSearchParams) {
      const result: Record<string, string> = {};
      body.forEach((value, key) => {
        result[key] = value;
      });
      return result;
    }

    if (body instanceof Blob) {
      return `[Blob: ${body.size} bytes, type: ${body.type}]`;
    }

    if (body instanceof ArrayBuffer) {
      return `[ArrayBuffer: ${body.byteLength} bytes]`;
    }

    return '[Unknown body type]';
  }

  private serializeBodySync(body: Document | BodyInit | null): any {
    if (!body) return null;

    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        return body;
      }
    }

    if (body instanceof FormData) {
      return '[FormData]';
    }

    if (body instanceof Document) {
      return '[Document]';
    }

    return '[Unknown body type]';
  }

  private getBodySize(body: any): number {
    if (!body) return 0;
    
    if (typeof body === 'string') {
      return new Blob([body]).size;
    }
    
    if (body instanceof Blob) {
      return body.size;
    }
    
    if (body instanceof ArrayBuffer) {
      return body.byteLength;
    }
    
    return 0;
  }

  private generateId(): string {
    return `net_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private addRequest(request: NetworkRequest): void {
    this.requests.push(request);

    // Trim requests if we exceed max
    if (this.requests.length > this.config.maxRequests) {
      this.requests = this.requests.slice(-this.config.maxRequests);
    }

    this.notifySubscribers(request);
    this.persistRequests();

    // Upload to debug capture system for analysis
    this.uploadToDebugCapture(request);
  }

  private uploadToDebugCapture(request: NetworkRequest): void {
    // Convert network request to debug event format
    const severity = this.mapRequestToSeverity(request);
    
    const debugEvent: DebugEvent = {
      type: 'network',
      severity,
      source: 'network-interceptor',
      message: `${request.method} ${request.url} - ${request.status || 'PENDING'}${request.error ? ` (${request.error})` : ''}`,
      data: {
        id: request.id,
        method: request.method,
        url: request.url,
        status: request.status,
        statusText: request.statusText,
        duration: request.duration,
        error: request.error,
        timing: request.timing,
        size: request.size,
        requestHeaders: request.requestHeaders,
        responseHeaders: request.responseHeaders,
        // Exclude bodies to prevent large payloads and PII issues
        hasRequestBody: !!request.requestBody,
        hasResponseBody: !!request.responseBody,
      },
      timestamp: request.timestamp,
    };

    // Upload to debug capture system
    debugUploadService.addEvent(debugEvent);
  }

  private mapRequestToSeverity(request: NetworkRequest): DebugEvent['severity'] {
    // Error cases
    if (request.error || (request.status && request.status >= 500)) {
      return 'high';
    }
    
    // Client errors
    if (request.status && request.status >= 400) {
      return 'medium';
    }
    
    // Slow requests (>5 seconds)
    if (request.duration && request.duration > 5000) {
      return 'medium';
    }
    
    // Normal requests
    return 'low';
  }

  private notifySubscribers(request: NetworkRequest): void {
    this.subscribers.forEach(callback => {
      try {
        callback(request);
      } catch (error) {
        console.error('Error in network subscriber:', error);
      }
    });
  }

  private persistRequests(): void {
    if (!this.config.persistToStorage || typeof window === 'undefined') return;

    try {
      const recentRequests = this.requests.slice(-50); // Store only last 50
      localStorage.setItem('revivatech_network_requests', JSON.stringify(recentRequests));
    } catch (error) {
      // Storage might be full or unavailable
    }
  }

  private loadPersistedRequests(): void {
    if (!this.config.persistToStorage || typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem('revivatech_network_requests');
      if (stored) {
        const requests = JSON.parse(stored);
        this.requests = requests.map((req: any) => ({
          ...req,
          id: req.id || this.generateId(),
        }));
      }
    } catch (error) {
      // Ignore parsing errors
    }
  }

  // Public API

  /**
   * Get all network requests
   */
  getRequests(limit?: number): NetworkRequest[] {
    return limit ? this.requests.slice(-limit) : [...this.requests];
  }

  /**
   * Get requests by status code
   */
  getRequestsByStatus(status: number): NetworkRequest[] {
    return this.requests.filter(req => req.status === status);
  }

  /**
   * Get failed requests (4xx, 5xx, or errors)
   */
  getFailedRequests(): NetworkRequest[] {
    return this.requests.filter(req => 
      (req.status && req.status >= 400) || req.error
    );
  }

  /**
   * Get slow requests (above threshold)
   */
  getSlowRequests(thresholdMs = 1000): NetworkRequest[] {
    return this.requests.filter(req => 
      req.duration && req.duration > thresholdMs
    );
  }

  /**
   * Search requests by URL
   */
  searchRequests(query: string, caseSensitive = false): NetworkRequest[] {
    const searchQuery = caseSensitive ? query : query.toLowerCase();
    return this.requests.filter(req => {
      const url = caseSensitive ? req.url : req.url.toLowerCase();
      return url.includes(searchQuery);
    });
  }

  /**
   * Subscribe to new network requests
   */
  subscribe(callback: (request: NetworkRequest) => void): () => void {
    this.subscribers.push(callback);
    
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }

  /**
   * Clear all requests
   */
  clear(): void {
    this.requests = [];
    this.pendingRequests.clear();
    
    if (this.config.persistToStorage && typeof window !== 'undefined') {
      localStorage.removeItem('revivatech_network_requests');
    }
  }

  /**
   * Export requests as JSON
   */
  export(): string {
    return JSON.stringify({
      requests: this.requests,
      metadata: {
        exportedAt: new Date().toISOString(),
        totalRequests: this.requests.length,
        config: this.config,
      },
    }, null, 2);
  }

  /**
   * Get network statistics
   */
  getStats(): {
    total: number;
    byMethod: Record<string, number>;
    byStatus: Record<string, number>;
    averageResponseTime: number;
    failureRate: number;
    totalDataTransferred: number;
  } {
    const byMethod = this.requests.reduce((acc, req) => {
      acc[req.method] = (acc[req.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byStatus = this.requests.reduce((acc, req) => {
      const status = req.status ? `${Math.floor(req.status / 100)}xx` : 'error';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalDuration = this.requests
      .filter(req => req.duration)
      .reduce((sum, req) => sum + (req.duration || 0), 0);

    const validRequests = this.requests.filter(req => req.duration);
    const averageResponseTime = validRequests.length > 0 ? totalDuration / validRequests.length : 0;

    const failedRequests = this.getFailedRequests().length;
    const failureRate = this.requests.length > 0 ? (failedRequests / this.requests.length) * 100 : 0;

    const totalDataTransferred = this.requests
      .filter(req => req.size)
      .reduce((sum, req) => sum + (req.size!.request + req.size!.response), 0);

    return {
      total: this.requests.length,
      byMethod,
      byStatus,
      averageResponseTime: Math.round(averageResponseTime),
      failureRate: Math.round(failureRate * 100) / 100,
      totalDataTransferred,
    };
  }

  /**
   * Enable/disable the interceptor
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    
    if (!enabled) {
      // Restore original methods
      if (typeof window !== 'undefined') {
        window.fetch = this.originalFetch;
        window.XMLHttpRequest = this.originalXHR;
      }
    } else {
      // Re-initialize
      this.initialize();
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<NetworkConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Create singleton instance
export const networkInterceptor = new NetworkInterceptor();

// Convenience exports
export const getNetworkRequests = (limit?: number) => networkInterceptor.getRequests(limit);
export const getFailedRequests = () => networkInterceptor.getFailedRequests();
export const getSlowRequests = (threshold?: number) => networkInterceptor.getSlowRequests(threshold);
export const searchNetworkRequests = (query: string) => networkInterceptor.searchRequests(query);
export const clearNetworkRequests = () => networkInterceptor.clear();
export const exportNetworkRequests = () => networkInterceptor.export();
export const subscribeToNetworkRequests = (callback: (request: NetworkRequest) => void) => 
  networkInterceptor.subscribe(callback);

export default networkInterceptor;