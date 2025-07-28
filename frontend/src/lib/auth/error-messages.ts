/**
 * Professional authentication error message mapping
 * Enterprise-grade user-friendly error handling for RevivaTech
 */

export interface AuthError {
  title: string
  message: string
  action?: string
  severity: 'error' | 'warning' | 'info'
  recoverable: boolean
}

/**
 * Comprehensive error message mapping for all authentication scenarios
 */
export const AUTH_ERROR_MESSAGES: Record<string, AuthError> = {
  // Credential validation errors
  VALIDATION_ERROR: {
    title: 'Invalid Input',
    message: 'Please enter a valid email address and password.',
    action: 'Check your email format and ensure password is not empty.',
    severity: 'warning',
    recoverable: true
  },

  INVALID_CREDENTIALS: {
    title: 'Login Failed',
    message: 'The email or password you entered is incorrect.',
    action: 'Please check your credentials and try again, or reset your password if you\'ve forgotten it.',
    severity: 'error',
    recoverable: true
  },

  // Account security errors
  ACCOUNT_LOCKED: {
    title: 'Account Temporarily Locked',
    message: 'Your account has been temporarily locked due to multiple failed login attempts.',
    action: 'Please wait 15 minutes before trying again, or contact support for immediate assistance.',
    severity: 'warning',
    recoverable: true
  },

  TOO_MANY_ATTEMPTS: {
    title: 'Too Many Login Attempts',
    message: 'You\'ve made too many login attempts in a short time.',
    action: 'Please wait a few minutes before trying again.',
    severity: 'warning',
    recoverable: true
  },

  ACCOUNT_DISABLED: {
    title: 'Account Disabled',
    message: 'Your account has been disabled.',
    action: 'Please contact our support team for assistance.',
    severity: 'error',
    recoverable: false
  },

  EMAIL_NOT_VERIFIED: {
    title: 'Email Verification Required',
    message: 'Please verify your email address before signing in.',
    action: 'Check your email for a verification link, or request a new verification email.',
    severity: 'warning',
    recoverable: true
  },

  // Technical errors
  NETWORK_ERROR: {
    title: 'Connection Problem',
    message: 'Unable to connect to our servers.',
    action: 'Please check your internet connection and try again.',
    severity: 'error',
    recoverable: true
  },

  SERVER_ERROR: {
    title: 'Server Issue',
    message: 'Our servers are experiencing technical difficulties.',
    action: 'Please try again in a few minutes. If the problem persists, contact support.',
    severity: 'error',
    recoverable: true
  },

  SERVICE_UNAVAILABLE: {
    title: 'Service Temporarily Unavailable',
    message: 'Our authentication service is temporarily down for maintenance.',
    action: 'Please try again in a few minutes.',
    severity: 'warning',
    recoverable: true
  },

  INVALID_RESPONSE: {
    title: 'Authentication Error',
    message: 'Received an unexpected response from the server.',
    action: 'Please try again. If the problem continues, contact support.',
    severity: 'error',
    recoverable: true
  },

  TIMEOUT_ERROR: {
    title: 'Request Timeout',
    message: 'The login request took too long to complete.',
    action: 'Please check your connection and try again.',
    severity: 'warning',
    recoverable: true
  },

  // Session errors
  SESSION_EXPIRED: {
    title: 'Session Expired',
    message: 'Your session has expired for security reasons.',
    action: 'Please sign in again to continue.',
    severity: 'info',
    recoverable: true
  },

  INVALID_SESSION: {
    title: 'Invalid Session',
    message: 'Your session is no longer valid.',
    action: 'Please sign in again.',
    severity: 'warning',
    recoverable: true
  },

  // Authorization errors
  ACCESS_DENIED: {
    title: 'Access Denied',
    message: 'You don\'t have permission to access this resource.',
    action: 'Contact your administrator if you believe this is an error.',
    severity: 'warning',
    recoverable: false
  },

  INSUFFICIENT_PERMISSIONS: {
    title: 'Insufficient Permissions',
    message: 'Your account doesn\'t have the required permissions for this action.',
    action: 'Contact your administrator to request access.',
    severity: 'warning',
    recoverable: false
  },

  // Generic fallback
  UNKNOWN_ERROR: {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred during authentication.',
    action: 'Please try again. If the problem persists, contact our support team.',
    severity: 'error',
    recoverable: true
  }
}

/**
 * Get user-friendly error message from error code
 */
export function getAuthErrorMessage(errorCode: string): AuthError {
  return AUTH_ERROR_MESSAGES[errorCode] || AUTH_ERROR_MESSAGES.UNKNOWN_ERROR
}

/**
 * Extract error code from NextAuth.js error
 */
export function extractErrorCode(error: any): string {
  if (typeof error === 'string') {
    return error
  }
  
  if (error?.message) {
    return error.message
  }
  
  if (error?.error) {
    return error.error
  }
  
  return 'UNKNOWN_ERROR'
}

/**
 * Check if error is recoverable (user can retry)
 */
export function isRecoverableError(errorCode: string): boolean {
  return getAuthErrorMessage(errorCode).recoverable
}

/**
 * Get error severity level
 */
export function getErrorSeverity(errorCode: string): 'error' | 'warning' | 'info' {
  return getAuthErrorMessage(errorCode).severity
}