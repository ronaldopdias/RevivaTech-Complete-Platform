'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { AuthErrorHandler, type ErrorNotification } from '@/lib/auth/error-handler';
import { authLogger } from '@/lib/auth/logger';

interface ErrorNotificationProps {
  notification: ErrorNotification;
  onDismiss?: (id: string) => void;
  className?: string;
}

export const ErrorNotificationComponent: React.FC<ErrorNotificationProps> = ({
  notification,
  onDismiss,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Auto-hide notification if configured
    if (notification.autoHide && notification.duration) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.autoHide, notification.duration]);

  const handleDismiss = () => {
    if (!notification.dismissible) return;

    setIsAnimating(true);
    setTimeout(() => {
      setIsVisible(false);
      onDismiss?.(notification.id);
      AuthErrorHandler.dismissNotification(notification.id);
    }, 300);
  };

  const handleAction = () => {
    if (notification.action) {
      authLogger.info('ERROR_NOTIFICATION_ACTION_CLICKED', {
        notificationId: notification.id,
        actionLabel: notification.action.label,
      });
      notification.action.handler();
    }
  };

  if (!isVisible) return null;

  const getIconForType = (type: ErrorNotification['type']) => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      default:
        return '❌';
    }
  };

  const getColorClasses = (type: ErrorNotification['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      default:
        return 'bg-red-50 border-red-200 text-red-800';
    }
  };

  const getButtonClasses = (type: ErrorNotification['type']) => {
    switch (type) {
      case 'error':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'info':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'success':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      default:
        return 'bg-red-100 text-red-800 hover:bg-red-200';
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg border p-4 shadow-sm transition-all duration-300',
        getColorClasses(notification.type),
        isAnimating ? 'opacity-0 transform translate-x-full' : 'opacity-100 transform translate-x-0',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <span className="text-lg" role="img" aria-label={notification.type}>
            {getIconForType(notification.type)}
          </span>
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium">
            {notification.title}
          </h3>
          <div className="mt-2 text-sm">
            <p>{notification.message}</p>
          </div>
          
          {notification.action && (
            <div className="mt-4">
              <button
                type="button"
                onClick={handleAction}
                className={cn(
                  'inline-flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors',
                  getButtonClasses(notification.type)
                )}
              >
                {notification.action.label}
              </button>
            </div>
          )}
        </div>
        
        {notification.dismissible && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={handleDismiss}
                className={cn(
                  'inline-flex rounded-md p-1.5 transition-colors',
                  notification.type === 'error' ? 'text-red-500 hover:bg-red-100' :
                  notification.type === 'warning' ? 'text-yellow-500 hover:bg-yellow-100' :
                  notification.type === 'info' ? 'text-blue-500 hover:bg-blue-100' :
                  'text-green-500 hover:bg-green-100'
                )}
                aria-label="Dismiss notification"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ErrorNotificationContainerProps {
  className?: string;
  maxNotifications?: number;
}

export const ErrorNotificationContainer: React.FC<ErrorNotificationContainerProps> = ({
  className,
  maxNotifications = 5,
}) => {
  const [notifications, setNotifications] = useState<ErrorNotification[]>([]);

  useEffect(() => {
    // Poll for new notifications
    const interval = setInterval(() => {
      // Force rebuild with debug check
      if (typeof AuthErrorHandler.getActiveNotifications !== 'function') {
        console.error('AuthErrorHandler.getActiveNotifications is not a function!', AuthErrorHandler);
        return;
      }
      const activeNotifications = AuthErrorHandler.getActiveNotifications();
      setNotifications(activeNotifications.slice(-maxNotifications));
    }, 1000);

    return () => clearInterval(interval);
  }, [maxNotifications]);

  const handleDismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full',
        className
      )}
      aria-live="polite"
      aria-label="Error notifications"
    >
      {notifications.map((notification) => (
        <ErrorNotificationComponent
          key={notification.id}
          notification={notification}
          onDismiss={handleDismiss}
        />
      ))}
    </div>
  );
};

export default ErrorNotificationComponent;