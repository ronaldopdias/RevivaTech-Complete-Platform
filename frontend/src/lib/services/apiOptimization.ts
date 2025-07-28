/**
 * API Response Optimization and Compression Service
 * Implements response compression, request batching, and API caching
 */

export interface ApiOptimizationConfig {
  compression: {
    enabled: boolean;
    threshold: number; // bytes
    algorithm: 'gzip' | 'brotli' | 'deflate';
  };
  batching: {
    enabled: boolean;
    maxBatchSize: number;
    batchTimeout: number; // ms
  };
  caching: {
    enabled: boolean;
    defaultTtl: number; // ms
    maxCacheSize: number; // bytes
  };
  retry: {
    enabled: boolean;
    maxRetries: number;
    backoffMultiplier: number;
    baseDelay: number; // ms
  };
}

export interface ApiRequest {
  id: string;
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  params?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
  cache?: boolean;
  priority?: 'high' | 'medium' | 'low';
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
  cached: boolean;
  compressed: boolean;
  size: number;
  duration: number;
}

class ApiOptimizationService {
  private config: ApiOptimizationConfig;
  private requestQueue: Map<string, ApiRequest[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private compressionSupport: string[] = [];

  constructor() {
    this.config = this.loadConfig();
    this.detectCompressionSupport();
    this.setupPeriodicCleanup();
  }

  private loadConfig(): ApiOptimizationConfig {
    return {
      compression: {
        enabled: true,
        threshold: 1024, // 1KB
        algorithm: 'gzip'
      },
      batching: {
        enabled: true,
        maxBatchSize: 10,
        batchTimeout: 50 // 50ms
      },
      caching: {
        enabled: true,
        defaultTtl: 300000, // 5 minutes
        maxCacheSize: 10 * 1024 * 1024 // 10MB
      },
      retry: {
        enabled: true,
        maxRetries: 3,
        backoffMultiplier: 2,
        baseDelay: 1000
      }
    };
  }

  private detectCompressionSupport(): void {
    if (typeof window !== 'undefined') {
      const supportedEncodings = [];
      
      // Check for native compression support
      if ('CompressionStream' in window) {
        supportedEncodings.push('gzip', 'deflate');
      }
      
      this.compressionSupport = supportedEncodings;
    }
  }

  /**
   * Optimized API request with all optimizations applied
   */
  async request<T>(request: ApiRequest): Promise<ApiResponse<T>> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(request);

    // Try cache first
    if (request.cache !== false && this.config.caching.enabled) {
      const cached = this.getFromCache<T>(cacheKey);
      if (cached) {
        return {
          data: cached,
          status: 200,
          headers: {},
          cached: true,
          compressed: false,
          size: JSON.stringify(cached).length,
          duration: performance.now() - startTime
        };
      }
    }

    // Handle batching for GET requests
    if (request.method === 'GET' && this.config.batching.enabled) {
      return this.handleBatchedRequest<T>(request, startTime);
    }

    // Execute single request
    return this.executeRequest<T>(request, startTime);
  }

  /**
   * Batch multiple requests together
   */
  async batchRequests<T>(requests: ApiRequest[]): Promise<ApiResponse<T>[]> {
    const batchId = this.generateBatchId();
    const startTime = performance.now();

    try {
      // Group requests by endpoint for batching
      const groupedRequests = this.groupRequestsByEndpoint(requests);
      const results: ApiResponse<T>[] = [];

      for (const [endpoint, endpointRequests] of groupedRequests.entries()) {
        if (endpointRequests.length === 1) {
          // Single request
          const result = await this.executeRequest<T>(endpointRequests[0], startTime);
          results.push(result);
        } else {
          // Batch multiple requests
          const batchResult = await this.executeBatchRequest<T>(endpoint, endpointRequests, startTime);
          results.push(...batchResult);
        }
      }

      return results;
    } catch (error) {
      console.error('Batch request failed:', error);
      throw error;
    }
  }

  private async handleBatchedRequest<T>(request: ApiRequest, startTime: number): Promise<ApiResponse<T>> {
    const endpoint = request.endpoint;
    
    if (!this.requestQueue.has(endpoint)) {
      this.requestQueue.set(endpoint, []);
    }

    const queue = this.requestQueue.get(endpoint)!;
    queue.push(request);

    // Set batch timer if not already set
    if (!this.batchTimers.has(endpoint)) {
      const timer = setTimeout(() => {
        this.processBatch(endpoint);
      }, this.config.batching.batchTimeout);
      
      this.batchTimers.set(endpoint, timer);
    }

    // If queue is full, process immediately
    if (queue.length >= this.config.batching.maxBatchSize) {
      clearTimeout(this.batchTimers.get(endpoint)!);
      this.batchTimers.delete(endpoint);
      await this.processBatch(endpoint);
    }

    // Return a promise that resolves when the batch is processed
    return new Promise((resolve, reject) => {
      request.resolve = resolve;
      request.reject = reject;
    });
  }

  private async processBatch(endpoint: string): Promise<void> {
    const queue = this.requestQueue.get(endpoint);
    if (!queue || queue.length === 0) return;

    this.requestQueue.delete(endpoint);
    this.batchTimers.delete(endpoint);

    try {
      const batchResults = await this.executeBatchRequest(endpoint, queue, performance.now());
      
      // Resolve individual promises
      queue.forEach((request, index) => {
        if (request.resolve) {
          request.resolve(batchResults[index]);
        }
      });
    } catch (error) {
      // Reject all promises in the batch
      queue.forEach(request => {
        if (request.reject) {
          request.reject(error);
        }
      });
    }
  }

  private async executeRequest<T>(request: ApiRequest, startTime: number): Promise<ApiResponse<T>> {
    const { endpoint, method, params, body, headers = {}, timeout = 10000 } = request;

    // Build URL with params
    const url = new URL(endpoint, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...this.getCompressionHeaders(),
        ...headers
      },
      signal: AbortSignal.timeout(timeout)
    };

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      const serializedBody = JSON.stringify(body);
      
      if (this.shouldCompress(serializedBody)) {
        requestOptions.body = await this.compressData(serializedBody);
        requestOptions.headers!['Content-Encoding'] = this.config.compression.algorithm;
      } else {
        requestOptions.body = serializedBody;
      }
    }

    // Execute request with retry logic
    const response = await this.executeWithRetry(url.toString(), requestOptions);
    const responseData = await this.processResponse<T>(response);

    const duration = performance.now() - startTime;
    const size = JSON.stringify(responseData).length;

    // Cache successful responses
    if (request.cache !== false && response.ok && this.config.caching.enabled) {
      this.setCache(this.generateCacheKey(request), responseData, this.config.caching.defaultTtl);
    }

    return {
      data: responseData,
      status: response.status,
      headers: this.parseHeaders(response.headers),
      cached: false,
      compressed: response.headers.get('content-encoding') !== null,
      size,
      duration
    };
  }

  private async executeBatchRequest<T>(
    endpoint: string, 
    requests: ApiRequest[], 
    startTime: number
  ): Promise<ApiResponse<T>[]> {
    // Create batch request payload
    const batchPayload = {
      requests: requests.map(req => ({
        id: req.id,
        method: req.method,
        endpoint: req.endpoint,
        params: req.params,
        body: req.body
      }))
    };

    const batchRequest: ApiRequest = {
      id: this.generateBatchId(),
      endpoint: `${endpoint}/batch`,
      method: 'POST',
      body: batchPayload,
      cache: false
    };

    const batchResponse = await this.executeRequest<{ results: T[] }>(batchRequest, startTime);
    
    // Map batch response back to individual responses
    return batchResponse.data.results.map((data, index) => ({
      data,
      status: 200,
      headers: {},
      cached: false,
      compressed: batchResponse.compressed,
      size: JSON.stringify(data).length,
      duration: batchResponse.duration / requests.length
    }));
  }

  private async executeWithRetry(url: string, options: RequestInit): Promise<Response> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.config.retry.maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        
        // Retry on 5xx errors and specific 4xx errors
        if (response.ok || (!this.shouldRetry(response.status) && attempt === 0)) {
          return response;
        }
        
        if (attempt < this.config.retry.maxRetries) {
          await this.delay(this.calculateBackoff(attempt));
          continue;
        }
        
        return response;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < this.config.retry.maxRetries) {
          await this.delay(this.calculateBackoff(attempt));
          continue;
        }
      }
    }
    
    throw lastError || new Error('Request failed after retries');
  }

  private shouldRetry(status: number): boolean {
    return status >= 500 || status === 408 || status === 429;
  }

  private calculateBackoff(attempt: number): number {
    return this.config.retry.baseDelay * Math.pow(this.config.retry.backoffMultiplier, attempt);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private shouldCompress(data: string): boolean {
    return this.config.compression.enabled && 
           data.length >= this.config.compression.threshold &&
           this.compressionSupport.length > 0;
  }

  private async compressData(data: string): Promise<Uint8Array> {
    if (!('CompressionStream' in window)) {
      return new TextEncoder().encode(data);
    }

    const stream = new CompressionStream(this.config.compression.algorithm);
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();
    
    writer.write(new TextEncoder().encode(data));
    writer.close();
    
    const chunks: Uint8Array[] = [];
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) chunks.push(value);
    }
    
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    
    return result;
  }

  private async processResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      return response.json();
    } else if (contentType.includes('text/')) {
      return response.text() as any;
    } else {
      return response.arrayBuffer() as any;
    }
  }

  private getCompressionHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.compressionSupport.length > 0) {
      headers['Accept-Encoding'] = this.compressionSupport.join(', ');
    }
    
    return headers;
  }

  private parseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  private generateCacheKey(request: ApiRequest): string {
    const keyData = {
      endpoint: request.endpoint,
      method: request.method,
      params: request.params,
      body: request.body
    };
    return btoa(JSON.stringify(keyData));
  }

  private generateBatchId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    this.enforceMaxCacheSize();
  }

  private enforceMaxCacheSize(): void {
    const currentSize = this.getCacheSize();
    
    if (currentSize > this.config.caching.maxCacheSize) {
      // Remove oldest entries until under limit
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      let removedSize = 0;
      for (const [key, value] of entries) {
        this.cache.delete(key);
        removedSize += JSON.stringify(value.data).length;
        
        if (currentSize - removedSize <= this.config.caching.maxCacheSize) {
          break;
        }
      }
    }
  }

  private getCacheSize(): number {
    let size = 0;
    for (const [_, value] of this.cache.entries()) {
      size += JSON.stringify(value.data).length;
    }
    return size;
  }

  private groupRequestsByEndpoint(requests: ApiRequest[]): Map<string, ApiRequest[]> {
    const groups = new Map<string, ApiRequest[]>();
    
    for (const request of requests) {
      const endpoint = request.endpoint;
      if (!groups.has(endpoint)) {
        groups.set(endpoint, []);
      }
      groups.get(endpoint)!.push(request);
    }
    
    return groups;
  }

  private setupPeriodicCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60000); // Every minute
  }

  private cleanupExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Public API methods
   */
  
  getCacheStats(): {
    entries: number;
    size: number;
    hitRate: number;
  } {
    return {
      entries: this.cache.size,
      size: this.getCacheSize(),
      hitRate: 0 // Would track in real implementation
    };
  }

  clearCache(): void {
    this.cache.clear();
  }

  updateConfig(updates: Partial<ApiOptimizationConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// Export singleton instance
export const apiOptimization = new ApiOptimizationService();