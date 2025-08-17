/**
 * Better Auth Error Handler - Simple Implementation
 * Provides basic error handling for authentication flows
 * Simplified replacement for removed auth error-handler module
 */

export interface AuthError {
  id: string
  type: 'SIGNIN_FAILED' | 'SIGNUP_FAILED' | 'SESSION_EXPIRED' | 'NETWORK_ERROR' | 'VALIDATION_ERROR'
  message: string
  timestamp: string
  metadata?: Record<string, any>
  recoverable?: boolean
}

export interface ErrorNotification {
  id: string
  type: 'error' | 'warning' | 'info'
  title: string
  message: string
  actions?: Array<{
    label: string
    action: () => void
  }>
  dismissible?: boolean
  autoHide?: boolean
  duration?: number
}

class SimpleAuthErrorHandler {
  private errors: AuthError[] = []
  private notifications: ErrorNotification[] = []
  private listeners: Array<(error: AuthError) => void> = []

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  reportError(type: AuthError['type'], message: string, metadata?: Record<string, any>): AuthError {
    const error: AuthError = {
      id: this.generateId(),
      type,
      message,
      timestamp: new Date().toISOString(),
      metadata,
      recoverable: type !== 'SESSION_EXPIRED'
    }

    this.errors.push(error)
    
    // Notify listeners
    this.listeners.forEach(listener => listener(error))

    return error
  }

  createNotification(
    type: ErrorNotification['type'], 
    title: string, 
    message: string, 
    options?: Partial<ErrorNotification>
  ): ErrorNotification {
    const notification: ErrorNotification = {
      id: this.generateId(),
      type,
      title,
      message,
      dismissible: true,
      autoHide: type === 'info',
      duration: type === 'info' ? 5000 : 0,
      ...options
    }

    this.notifications.push(notification)
    return notification
  }

  getErrors(): AuthError[] {
    return [...this.errors]
  }

  getNotifications(): ErrorNotification[] {
    return [...this.notifications]
  }

  getActiveNotifications(): ErrorNotification[] {
    // Return notifications that are not auto-hidden or have been dismissed
    return this.notifications.filter(notification => {
      // If autoHide is false, it's always active
      if (!notification.autoHide) return true
      
      // If autoHide is true, check if duration has passed
      if (notification.duration && notification.duration > 0) {
        const createdTime = new Date(notification.id).getTime() || Date.now()
        const now = Date.now()
        return (now - createdTime) < notification.duration
      }
      
      return true
    })
  }

  clearErrors(): void {
    this.errors = []
  }

  clearNotifications(): void {
    this.notifications = []
  }

  dismissNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id)
  }

  onError(listener: (error: AuthError) => void): () => void {
    this.listeners.push(listener)
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  // Utility method to handle common auth errors
  handleAuthError(error: any): AuthError {
    let errorType: AuthError['type'] = 'NETWORK_ERROR'
    let message = 'An authentication error occurred'

    if (error?.message?.includes('Invalid credentials')) {
      errorType = 'SIGNIN_FAILED'
      message = 'Invalid email or password'
    } else if (error?.message?.includes('Email already exists')) {
      errorType = 'SIGNUP_FAILED'
      message = 'An account with this email already exists'
    } else if (error?.message?.includes('Session expired')) {
      errorType = 'SESSION_EXPIRED'
      message = 'Your session has expired. Please sign in again.'
    } else if (error?.message?.includes('validation')) {
      errorType = 'VALIDATION_ERROR'
      message = 'Please check your input and try again'
    }

    return this.reportError(errorType, message, { originalError: error })
  }
}

// Export singleton instance
export const AuthErrorHandler = new SimpleAuthErrorHandler()
export type { AuthError, ErrorNotification }