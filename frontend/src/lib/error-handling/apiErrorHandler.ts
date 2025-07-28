import { errorReporting, trackApiCall } from './errorReporting';

export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
  timestamp?: string;
  requestId?: string;
}

export class ApiErrorHandler {
  static async handleResponse<T>(
    response: Response,
    requestStartTime: number = Date.now()
  ): Promise<T> {
    const duration = Date.now() - requestStartTime;
    const { method, url } = response.request || { method: 'GET', url: response.url };

    // Track the API call
    trackApiCall(method, url, response.status, duration);

    if (!response.ok) {
      let errorData: any;
      
      try {
        errorData = await response.json();
      } catch (parseError) {
        errorData = {
          message: `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        };
      }

      const apiError = this.createApiError(errorData, response.status);
      
      // Report error for monitoring
      await errorReporting.reportError(apiError, {
        severity: this.getErrorSeverity(response.status),
        context: {
          method,
          url,
          status: response.status,
          duration,
          responseHeaders: Object.fromEntries(response.headers.entries()),
        },
        tags: ['api_error', `http_${response.status}`],
      });

      throw apiError;
    }

    try {
      return await response.json();
    } catch (parseError) {
      const error = new Error('Failed to parse response JSON');
      await errorReporting.reportError(error, {
        severity: 'medium',
        context: {
          method,
          url,
          status: response.status,
          duration,
        },
        tags: ['api_error', 'json_parse_error'],
      });
      throw error;
    }
  }

  static createApiError(errorData: any, status: number): ApiError {
    const error = new Error(errorData.message || `API Error: ${status}`) as ApiError;
    error.name = 'ApiError';
    error.status = status;
    error.code = errorData.code || errorData.error;
    error.details = errorData.details;
    error.timestamp = new Date().toISOString();
    error.requestId = errorData.requestId || errorData.traceId;
    
    return error;
  }

  static getErrorSeverity(status: number): 'low' | 'medium' | 'high' | 'critical' {
    if (status >= 500) return 'high';
    if (status >= 400) return 'medium';
    return 'low';
  }

  static getErrorMessage(error: ApiError): string {
    // User-friendly error messages based on status codes
    switch (error.status) {
      case 400:
        return error.details?.length 
          ? 'Please check the information you entered and try again.'
          : 'Invalid request. Please check your input and try again.';
      
      case 401:
        return 'You need to log in to access this feature.';
      
      case 403:
        return 'You don\'t have permission to perform this action.';
      
      case 404:
        return 'The requested resource was not found.';
      
      case 409:
        return 'This action conflicts with existing data. Please refresh and try again.';
      
      case 422:
        return 'Please check the information you entered and try again.';
      
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      
      case 500:
        return 'Server error. Our team has been notified. Please try again later.';
      
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again in a few minutes.';
      
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  static getErrorTitle(error: ApiError): string {
    switch (error.status) {
      case 400:
        return 'Invalid Request';
      case 401:
        return 'Authentication Required';
      case 403:
        return 'Access Denied';
      case 404:
        return 'Not Found';
      case 409:
        return 'Conflict';
      case 422:
        return 'Validation Error';
      case 429:
        return 'Rate Limited';
      case 500:
        return 'Server Error';
      case 502:
      case 503:
      case 504:
        return 'Service Unavailable';
      default:
        return 'Error';
    }
  }

  static shouldRetry(error: ApiError): boolean {
    // Retry for certain status codes
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(error.status || 0);
  }

  static getRetryDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    return Math.min(1000 * Math.pow(2, attempt), 16000);
  }
}

// Enhanced fetch wrapper with automatic error handling
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = '', defaultHeaders: Record<string, string> = {}) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...defaultHeaders,
    };
  }

  async request<T = any>(
    endpoint: string,
    options: RequestInit & {
      retries?: number;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const {
      retries = 3,
      timeout = 10000,
      headers = {},
      ...fetchOptions
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    let lastError: ApiError | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const requestStartTime = Date.now();
        
        const response = await fetch(url, {
          ...fetchOptions,
          headers: requestHeaders,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        return await ApiErrorHandler.handleResponse<T>(response, requestStartTime);

      } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
          const timeoutError = new Error('Request timeout') as ApiError;
          timeoutError.name = 'TimeoutError';
          timeoutError.status = 408;
          lastError = timeoutError;
        } else if (error instanceof Error) {
          lastError = error as ApiError;
        } else {
          lastError = new Error('Unknown error') as ApiError;
        }

        // Don't retry if it's not a retryable error or if it's the last attempt
        if (attempt === retries || !ApiErrorHandler.shouldRetry(lastError)) {
          break;
        }

        // Wait before retrying
        const delay = ApiErrorHandler.getRetryDelay(attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  // Convenience methods
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  async patch<T>(endpoint: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Set authentication token
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Remove authentication token
  clearAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }
}

// Default API client instance
export const apiClient = new ApiClient('/api');

export default ApiErrorHandler;