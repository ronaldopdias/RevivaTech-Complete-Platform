import { 
  ServiceConfig, 
  RequestConfig, 
  ApiResponse, 
  ApiError as ApiErrorType, 
  CircuitBreakerState,
  BaseService,
  ServiceHealthCheck 
} from './types';

// Cache implementation
class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  set(key: string, data: any, ttl: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl * 1000, // Convert to milliseconds
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }
}

// Rate limiter implementation
class RateLimiter {
  private requests = new Map<string, number[]>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string = 'default'): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    let requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    if (requests.length >= this.maxRequests) {
      return false;
    }

    requests.push(now);
    this.requests.set(key, requests);
    return true;
  }

  reset(key?: string): void {
    if (key) {
      this.requests.delete(key);
    } else {
      this.requests.clear();
    }
  }
}

export class ApiClient extends BaseService {
  private cache: ApiCache;
  private rateLimiter?: RateLimiter;
  private interceptors: {
    request: Array<(config: RequestConfig) => RequestConfig | Promise<RequestConfig>>;
    response: Array<(response: ApiResponse) => ApiResponse | Promise<ApiResponse>>;
    error: Array<(error: ApiError) => ApiError | Promise<ApiError>>;
  };

  constructor(config: ServiceConfig) {
    super(config);
    
    this.cache = new ApiCache(config.cache?.maxSize || 100);
    
    if (config.rateLimiting?.enabled) {
      this.rateLimiter = new RateLimiter(
        config.rateLimiting.maxRequests,
        config.rateLimiting.windowMs
      );
    }

    this.interceptors = {
      request: [],
      response: [],
      error: [],
    };
  }

  // Interceptor management
  addRequestInterceptor(interceptor: (config: RequestConfig) => RequestConfig | Promise<RequestConfig>): void {
    this.interceptors.request.push(interceptor);
  }

  addResponseInterceptor(interceptor: (response: ApiResponse) => ApiResponse | Promise<ApiResponse>): void {
    this.interceptors.response.push(interceptor);
  }

  addErrorInterceptor(interceptor: (error: ApiError) => ApiError | Promise<ApiError>): void {
    this.interceptors.error.push(interceptor);
  }

  // Circuit breaker logic
  private isCircuitOpen(): boolean {
    if (this.circuitBreaker.state === 'open') {
      const now = new Date();
      if (this.circuitBreaker.nextAttemptTime && now < this.circuitBreaker.nextAttemptTime) {
        return true;
      }
      // Try to transition to half-open
      this.circuitBreaker.state = 'half-open';
    }
    return false;
  }

  private recordSuccess(): void {
    this.circuitBreaker.failureCount = 0;
    this.circuitBreaker.state = 'closed';
    this.circuitBreaker.lastFailureTime = undefined;
    this.circuitBreaker.nextAttemptTime = undefined;
  }

  private recordFailure(): void {
    this.circuitBreaker.failureCount += 1;
    this.circuitBreaker.lastFailureTime = new Date();

    // Open circuit if failure threshold is reached (5 failures)
    if (this.circuitBreaker.failureCount >= 5) {
      this.circuitBreaker.state = 'open';
      // Wait 60 seconds before attempting again
      this.circuitBreaker.nextAttemptTime = new Date(Date.now() + 60000);
    }
  }

  // Main request method
  async request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    // Check circuit breaker
    if (this.isCircuitOpen()) {
      throw new ApiError({
        message: 'Service temporarily unavailable (circuit breaker open)',
        code: 'CIRCUIT_BREAKER_OPEN',
        config,
      });
    }

    // Check rate limiting
    if (this.rateLimiter && !this.rateLimiter.isAllowed()) {
      throw new ApiError({
        message: 'Rate limit exceeded',
        status: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        config,
      });
    }

    // Apply request interceptors
    let processedConfig = config;
    for (const interceptor of this.interceptors.request) {
      processedConfig = await interceptor(processedConfig);
    }

    // Check cache for GET requests
    if (processedConfig.method === 'GET' && processedConfig.cache !== false) {
      const cacheKey = this.generateCacheKey(processedConfig);
      const cachedResponse = this.cache.get(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    // Perform request with retry logic
    const maxRetries = processedConfig.retryAttempts ?? this.config.retryAttempts;
    let lastError: ApiError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.performRequest<T>(processedConfig);
        
        // Apply response interceptors
        let processedResponse = response;
        for (const interceptor of this.interceptors.response) {
          processedResponse = await interceptor(processedResponse);
        }

        // Cache successful GET responses
        if (processedConfig.method === 'GET' && processedConfig.cache !== false && response.status < 300) {
          const cacheKey = this.generateCacheKey(processedConfig);
          const cacheTtl = processedConfig.cacheTtl ?? this.config.cache?.ttl ?? 300;
          this.cache.set(cacheKey, processedResponse, cacheTtl);
        }

        // Record success for circuit breaker
        this.recordSuccess();

        return processedResponse;
      } catch (error) {
        lastError = error instanceof ApiError ? error : new ApiError({
          message: error instanceof Error ? error.message : 'Unknown error',
          originalError: error instanceof Error ? error : undefined,
          config: processedConfig,
        });

        // Apply error interceptors
        for (const interceptor of this.interceptors.error) {
          lastError = await interceptor(lastError);
        }

        // Don't retry for certain status codes
        if (lastError.status && [400, 401, 403, 404, 422].includes(lastError.status)) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt);
          await this.sleep(delay);
        }
      }
    }

    // Record failure for circuit breaker
    this.recordFailure();

    throw lastError!;
  }

  // Perform the actual HTTP request
  private async performRequest<T>(config: RequestConfig): Promise<ApiResponse<T>> {
    const url = new URL(config.url, this.config.baseUrl);
    
    // Add query parameters
    if (config.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    // Prepare headers
    const headers: Record<string, string> = {
      ...this.config.headers,
      ...config.headers,
    };

    // Add authentication
    if (this.config.auth) {
      switch (this.config.auth.type) {
        case 'bearer':
          if (this.config.auth.token) {
            headers.Authorization = `Bearer ${this.config.auth.token}`;
          }
          break;
        case 'apiKey':
          if (this.config.auth.apiKey) {
            headers['X-API-Key'] = this.config.auth.apiKey;
          }
          break;
        case 'basic':
          if (this.config.auth.username && this.config.auth.password) {
            const credentials = btoa(`${this.config.auth.username}:${this.config.auth.password}`);
            headers.Authorization = `Basic ${credentials}`;
          }
          break;
      }
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method: config.method,
      headers,
      signal: AbortSignal.timeout(config.timeout ?? this.config.timeout),
    };

    // Add body for non-GET requests
    if (config.data && config.method !== 'GET') {
      if (config.data instanceof FormData) {
        requestOptions.body = config.data;
      } else {
        headers['Content-Type'] = 'application/json';
        requestOptions.body = JSON.stringify(config.data);
      }
    }

    // Perform the fetch request
    const response = await fetch(url.toString(), requestOptions);

    // Parse response
    let data: T;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else if (contentType?.includes('text/')) {
      data = await response.text() as unknown as T;
    } else {
      data = await response.blob() as unknown as T;
    }

    // Check for HTTP errors
    if (!response.ok) {
      throw new ApiError({
        message: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
        data,
        config,
      });
    }

    return {
      data,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      config,
    };
  }

  // Health check implementation
  async healthCheck(): Promise<ServiceHealthCheck> {
    const startTime = Date.now();
    
    try {
      await this.request({
        url: '/health',
        method: 'GET',
        timeout: 5000,
        retryAttempts: 0,
        cache: false,
      });

      return {
        service: 'api-client',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        service: 'api-client',
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        timestamp: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Utility methods
  private generateCacheKey(config: RequestConfig): string {
    const key = `${config.method}:${config.url}`;
    if (config.params) {
      const params = new URLSearchParams(config.params).toString();
      return `${key}?${params}`;
    }
    return key;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public utility methods
  clearCache(): void {
    this.cache.clear();
  }

  resetRateLimit(): void {
    this.rateLimiter?.reset();
  }

  resetCircuitBreaker(): void {
    this.circuitBreaker = {
      state: 'closed',
      failureCount: 0,
    };
  }

  getCircuitBreakerState(): CircuitBreakerState {
    return { ...this.circuitBreaker };
  }

  // Convenience methods
  async get<T = any>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'GET', ...config });
  }

  async post<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'POST', data, ...config });
  }

  async put<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'PUT', data, ...config });
  }

  async patch<T = any>(url: string, data?: any, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'PATCH', data, ...config });
  }

  async delete<T = any>(url: string, config?: Partial<RequestConfig>): Promise<ApiResponse<T>> {
    return this.request<T>({ url, method: 'DELETE', ...config });
  }

  // Auth token management
  setAuthToken(token: string | undefined): void {
    if (token) {
      this.config.auth = {
        type: 'bearer',
        token: token,
      };
    } else {
      // Clear auth token
      if (this.config.auth) {
        delete this.config.auth.token;
      }
    }
  }

  getAuthToken(): string | undefined {
    return this.config.auth?.token;
  }
}

// Custom error class
class ApiError extends Error implements ApiErrorType {
  status?: number;
  code?: string;
  data?: any;
  config?: RequestConfig;
  originalError?: Error;

  constructor(params: {
    message: string;
    status?: number;
    code?: string;
    data?: any;
    config?: RequestConfig;
    originalError?: Error;
  }) {
    super(params.message);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code;
    this.data = params.data;
    this.config = params.config;
    this.originalError = params.originalError;
  }
}

export { ApiError };