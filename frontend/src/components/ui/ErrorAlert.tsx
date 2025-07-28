'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, XCircle, Info, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { AuthError } from '@/lib/auth/error-messages'

interface ErrorAlertProps {
  error: AuthError
  onDismiss?: () => void
  onRetry?: () => void
  autoDismiss?: boolean
  autoDismissDelay?: number
  className?: string
}

/**
 * Professional error alert component for authentication errors
 * Enterprise-grade error presentation with recovery options
 */
export function ErrorAlert({
  error,
  onDismiss,
  onRetry,
  autoDismiss = false,
  autoDismissDelay = 5000,
  className = ''
}: ErrorAlertProps) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoDismiss && autoDismissDelay > 0) {
      const timer = setTimeout(() => {
        handleDismiss()
      }, autoDismissDelay)

      return () => clearTimeout(timer)
    }
  }, [autoDismiss, autoDismissDelay])

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss?.()
  }

  const handleRetry = () => {
    onRetry?.()
  }

  if (!isVisible) return null

  // Icon and color mapping based on severity
  const severityConfig = {
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      iconColor: 'text-red-400',
      titleColor: 'text-red-800',
      messageColor: 'text-red-700'
    },
    warning: {
      icon: AlertTriangle,
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      iconColor: 'text-amber-400',
      titleColor: 'text-amber-800',
      messageColor: 'text-amber-700'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      iconColor: 'text-blue-400',
      titleColor: 'text-blue-800',
      messageColor: 'text-blue-700'
    }
  }

  const config = severityConfig[error.severity]
  const IconComponent = config.icon

  return (
    <div 
      className={`relative rounded-lg border p-4 ${config.bgColor} ${config.borderColor} ${className}`}
      role="alert"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <IconComponent className={`h-5 w-5 ${config.iconColor}`} aria-hidden="true" />
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${config.titleColor}`}>
            {error.title}
          </h3>
          
          <p className={`mt-1 text-sm ${config.messageColor}`}>
            {error.message}
          </p>
          
          {error.action && (
            <p className={`mt-2 text-xs ${config.messageColor} opacity-90`}>
              {error.action}
            </p>
          )}
          
          {(error.recoverable && onRetry) && (
            <div className="mt-3 flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                className="text-xs"
                icon={{ component: RefreshCw, position: 'left' }}
              >
                Try Again
              </Button>
            </div>
          )}
        </div>
        
        {onDismiss && (
          <div className="ml-auto pl-3">
            <button
              type="button"
              onClick={handleDismiss}
              className={`inline-flex rounded-md p-1.5 ${config.iconColor} hover:${config.bgColor} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-${error.severity === 'error' ? 'red' : error.severity === 'warning' ? 'amber' : 'blue'}-50 focus:ring-${error.severity === 'error' ? 'red' : error.severity === 'warning' ? 'amber' : 'blue'}-600`}
              aria-label="Dismiss error"
            >
              <span className="sr-only">Dismiss</span>
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Simplified error alert for inline form validation
 */
export function InlineErrorAlert({ 
  message, 
  className = '' 
}: { 
  message: string
  className?: string 
}) {
  return (
    <div 
      className={`flex items-center p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg ${className}`}
      role="alert"
      aria-live="polite"
    >
      <XCircle className="h-4 w-4 mr-2 text-red-400 flex-shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  )
}

/**
 * Success alert for positive feedback
 */
export function SuccessAlert({ 
  message, 
  onDismiss,
  className = '' 
}: { 
  message: string
  onDismiss?: () => void
  className?: string 
}) {
  return (
    <div 
      className={`flex items-center justify-between p-3 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg ${className}`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center">
        <div className="h-4 w-4 mr-2 text-green-400 flex-shrink-0">✓</div>
        <span>{message}</span>
      </div>
      
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-green-400 hover:text-green-600 p-1"
          aria-label="Dismiss success message"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}