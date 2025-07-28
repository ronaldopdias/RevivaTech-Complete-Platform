/**
 * Enhanced Authentication Error Handler
 * Provides comprehensive error categorization and user-friendly messages
 */

export interface AuthError {
  code: string;
  message: string;
  details?: any;
  category: 'network' | 'authentication' | 'authorization' | 'validation' | 'server' | 'client';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userMessage: string;
  retryable: boolean;
  suggestedAction?: string;
}

export class AuthErrorHandler {
  /**
   * Categorize and enhance error information
   */
  static handleError(error: any, context?: string): AuthError {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        code: 'NETWORK_ERROR',
        message: error.message,
        category: 'network',
        severity: 'high',
        userMessage: 'Unable to connect to the server. Please check your internet connection.',
        retryable: true,
        suggestedAction: 'Check your internet connection and try again.',
      };
    }

    // Timeout errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      return {
        code: 'TIMEOUT_ERROR',
        message: error.message || 'Request timed out',
        category: 'network',
        severity: 'medium',
        userMessage: 'The request took too long to complete.',
        retryable: true,
        suggestedAction: 'Please try again. If the problem persists, check your connection.',
      };
    }

    // API response errors
    if (error.code) {
      return this.handleApiError(error, context);
    }

    // HTTP status errors
    if (error.status) {
      return this.handleHttpError(error, context);
    }

    // Generic errors
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred',
      details: error,
      category: 'client',
      severity: 'medium',
      userMessage: 'An unexpected error occurred. Please try again.',
      retryable: true,
      suggestedAction: 'Try refreshing the page or contact support if the problem persists.',
    };
  }

  /**
   * Handle API-specific errors
   */
  private static handleApiError(error: any, context?: string): AuthError {
    const errorMap: Record<string, Partial<AuthError>> = {
      'INVALID_CREDENTIALS': {
        category: 'authentication',
        severity: 'medium',
        userMessage: 'Invalid email or password. Please check your credentials and try again.',
        retryable: true,
        suggestedAction: 'Verify your email and password are correct.',
      },
      'ACCOUNT_INACTIVE': {
        category: 'authorization',
        severity: 'high',
        userMessage: 'Your account has been suspended or deactivated.',
        retryable: false,
        suggestedAction: 'Contact support to reactivate your account.',
      },
      'EMAIL_EXISTS': {
        category: 'validation',
        severity: 'medium',
        userMessage: 'An account with this email already exists.',
        retryable: false,
        suggestedAction: 'Try logging in instead, or use a different email address.',
      },
      'VALIDATION_ERROR': {
        category: 'validation',
        severity: 'low',
        userMessage: 'Please check your input and try again.',
        retryable: true,
        suggestedAction: 'Ensure all required fields are filled correctly.',
      },
      'RATE_LIMITED': {
        category: 'server',
        severity: 'medium',
        userMessage: 'Too many attempts. Please wait before trying again.',
        retryable: true,
        suggestedAction: 'Wait a few minutes before attempting to log in again.',
      },
      'TOKEN_EXPIRED': {
        category: 'authentication',
        severity: 'medium',
        userMessage: 'Your session has expired. Please log in again.',
        retryable: true,
        suggestedAction: 'Please log in again to continue.',
      },
      'INVALID_TOKEN': {
        category: 'authentication',
        severity: 'medium',
        userMessage: 'Your session is invalid. Please log in again.',
        retryable: true,
        suggestedAction: 'Please log in again to continue.',
      },
      'INSUFFICIENT_PERMISSIONS': {
        category: 'authorization',
        severity: 'high',
        userMessage: 'You do not have permission to access this resource.',
        retryable: false,
        suggestedAction: 'Contact an administrator if you believe this is an error.',
      },
    };

    const baseError = errorMap[error.code] || {};

    return {
      code: error.code,
      message: error.message || 'API error occurred',
      details: error.details,
      category: baseError.category || 'server',
      severity: baseError.severity || 'medium',
      userMessage: baseError.userMessage || error.message || 'An error occurred with the server.',
      retryable: baseError.retryable ?? true,
      suggestedAction: baseError.suggestedAction,
    };
  }

  /**
   * Handle HTTP status errors
   */
  private static handleHttpError(error: any, context?: string): AuthError {
    const status = error.status || error.statusCode;

    const statusMap: Record<number, Partial<AuthError>> = {
      400: {
        category: 'validation',
        severity: 'low',
        userMessage: 'Invalid request. Please check your input.',
        retryable: true,
      },
      401: {
        category: 'authentication',
        severity: 'medium',
        userMessage: 'Authentication failed. Please check your credentials.',
        retryable: true,
        suggestedAction: 'Verify your email and password are correct.',
      },
      403: {
        category: 'authorization',
        severity: 'high',
        userMessage: 'Access denied. You do not have permission to perform this action.',
        retryable: false,
        suggestedAction: 'Contact an administrator if you believe this is an error.',
      },
      404: {
        category: 'client',
        severity: 'medium',
        userMessage: 'The requested resource was not found.',
        retryable: false,
        suggestedAction: 'Please check the URL or contact support.',
      },
      429: {
        category: 'server',
        severity: 'medium',
        userMessage: 'Too many requests. Please wait before trying again.',
        retryable: true,
        suggestedAction: 'Wait a few minutes before trying again.',
      },
      500: {
        category: 'server',
        severity: 'high',
        userMessage: 'Internal server error. Please try again later.',
        retryable: true,
        suggestedAction: 'Try again in a few minutes. Contact support if the problem persists.',
      },
      502: {
        category: 'network',
        severity: 'high',
        userMessage: 'Server is temporarily unavailable.',
        retryable: true,
        suggestedAction: 'Please try again in a few minutes.',
      },
      503: {
        category: 'server',
        severity: 'high',
        userMessage: 'Service is temporarily unavailable.',
        retryable: true,
        suggestedAction: 'Please try again in a few minutes.',
      },
    };

    const baseError = statusMap[status] || {
      category: 'server',
      severity: 'medium',
      userMessage: 'An error occurred with the server.',
      retryable: true,
    };

    return {
      code: `HTTP_${status}`,
      message: error.message || `HTTP ${status} error`,
      details: error,
      category: baseError.category!,
      severity: baseError.severity!,
      userMessage: baseError.userMessage!,
      retryable: baseError.retryable ?? true,
      suggestedAction: baseError.suggestedAction,
    };
  }

  /**
   * Get retry delay based on error type and attempt count
   */
  static getRetryDelay(error: AuthError, attemptCount: number): number {
    if (!error.retryable) return 0;

    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds

    let multiplier = 1;
    
    switch (error.category) {
      case 'network':
        multiplier = 2; // Exponential backoff for network errors
        break;
      case 'server':
        multiplier = 1.5; // Moderate backoff for server errors
        break;
      default:
        multiplier = 1; // Linear backoff for other errors
    }

    const delay = Math.min(baseDelay * Math.pow(multiplier, attemptCount), maxDelay);
    return delay;
  }

  /**
   * Check if error should trigger automatic retry
   */
  static shouldAutoRetry(error: AuthError, attemptCount: number): boolean {
    if (!error.retryable || attemptCount >= 3) return false;

    // Auto-retry network and server errors
    return error.category === 'network' || error.category === 'server';
  }

  /**
   * Format error for logging
   */
  static formatForLogging(error: AuthError, context?: string): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      context,
      code: error.code,
      category: error.category,
      severity: error.severity,
      message: error.message,
      userMessage: error.userMessage,
      retryable: error.retryable,
      details: error.details,
    }, null, 2);
  }

  /**
   * Create user-friendly error message with action button
   */
  static createUserFeedback(error: AuthError): {
    title: string;
    message: string;
    action?: string;
    variant: 'error' | 'warning' | 'info';
  } {
    const variant = error.severity === 'critical' || error.severity === 'high' ? 'error' :
                   error.severity === 'medium' ? 'warning' : 'info';

    return {
      title: this.getErrorTitle(error),
      message: error.userMessage,
      action: error.suggestedAction,
      variant,
    };
  }

  private static getErrorTitle(error: AuthError): string {
    switch (error.category) {
      case 'network':
        return 'Connection Problem';
      case 'authentication':
        return 'Authentication Failed';
      case 'authorization':
        return 'Access Denied';
      case 'validation':
        return 'Invalid Input';
      case 'server':
        return 'Server Error';
      default:
        return 'Error';
    }
  }
}