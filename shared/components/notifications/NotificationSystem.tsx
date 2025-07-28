'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, 
  X, 
  Check, 
  AlertCircle, 
  Info, 
  CheckCircle,
  Package,
  MessageSquare,
  Calendar,
  CreditCard,
  Settings,
  Volume2,
  VolumeX
} from 'lucide-react';
import { useWebSocket, useWebSocketSubscription } from '../realtime/WebSocketProvider';
import { useAuth } from '../auth/AuthContext';

interface Notification {
  id: string;
  type: 'repair_update' | 'chat_message' | 'quote_ready' | 'appointment_reminder' | 'payment_due' | 'system' | 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionLabel?: string;
  metadata?: {
    repairId?: string;
    conversationId?: string;
    quoteId?: string;
    appointmentId?: string;
    [key: string]: any;
  };
  autoHide?: boolean;
  hideAfter?: number; // milliseconds
}

interface NotificationSystemProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
  defaultAutoHide?: boolean;
  defaultHideAfter?: number;
  enableSound?: boolean;
  enableDesktopNotifications?: boolean;
}

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  position = 'top-right',
  maxNotifications = 10,
  defaultAutoHide = true,
  defaultHideAfter = 5000,
  enableSound = true,
  enableDesktopNotifications = true
}) => {
  const { user } = useAuth();
  const { isConnected, sendMessage } = useWebSocket();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(enableSound);
  const [desktopEnabled, setDesktopEnabled] = useState(enableDesktopNotifications);
  const [permissionGranted, setPermissionGranted] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Request desktop notification permission
  useEffect(() => {
    if (desktopEnabled && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setPermissionGranted(true);
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          setPermissionGranted(permission === 'granted');
        });
      }
    }
  }, [desktopEnabled]);

  // Initialize audio
  useEffect(() => {
    if (soundEnabled) {
      audioRef.current = new Audio('/sounds/notification.mp3');
      audioRef.current.volume = 0.5;
    }
  }, [soundEnabled]);

  // WebSocket subscriptions for real-time notifications
  useWebSocketSubscription('repair_update', (data) => {
    addNotification({
      type: 'repair_update',
      title: 'Repair Status Update',
      message: `Your ${data.deviceType} repair (${data.repairId}) status changed to ${data.newStatus}`,
      priority: 'high',
      actionUrl: `/dashboard/repairs/${data.repairId}`,
      actionLabel: 'View Details',
      metadata: { repairId: data.repairId }
    });
  });

  useWebSocketSubscription('chat_message', (data) => {
    if (data.senderId !== user?.id) { // Don't notify about own messages
      addNotification({
        type: 'chat_message',
        title: 'New Message',
        message: `${data.senderName}: ${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}`,
        priority: 'medium',
        actionUrl: `/dashboard/messages/${data.conversationId}`,
        actionLabel: 'Reply',
        metadata: { conversationId: data.conversationId }
      });
    }
  });

  useWebSocketSubscription('quote_ready', (data) => {
    addNotification({
      type: 'quote_ready',
      title: 'Quote Ready',
      message: `Your repair quote for ${data.deviceType} is ready for review (£${data.amount})`,
      priority: 'high',
      actionUrl: `/dashboard/quotes/${data.quoteId}`,
      actionLabel: 'Review Quote',
      metadata: { quoteId: data.quoteId }
    });
  });

  useWebSocketSubscription('appointment_reminder', (data) => {
    addNotification({
      type: 'appointment_reminder',
      title: 'Appointment Reminder',
      message: `Your ${data.serviceType} appointment is ${data.timeUntil}`,
      priority: 'high',
      actionUrl: `/dashboard/appointments/${data.appointmentId}`,
      actionLabel: 'View Details',
      metadata: { appointmentId: data.appointmentId }
    });
  });

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
      autoHide: notification.autoHide ?? (defaultAutoHide && notification.priority !== 'urgent'),
      hideAfter: notification.hideAfter ?? defaultHideAfter
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev];
      return updated.slice(0, maxNotifications);
    });

    setUnreadCount(prev => prev + 1);

    // Play sound
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Ignore audio play errors
      });
    }

    // Show desktop notification
    if (desktopEnabled && permissionGranted && document.visibilityState === 'hidden') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: newNotification.id
      });
    }

    // Auto-hide notification
    if (newNotification.autoHide) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, newNotification.hideAfter);
    }

    // Send to server for persistence
    if (isConnected) {
      sendMessage({
        type: 'notification_received',
        payload: {
          notificationId: newNotification.id,
          userId: user?.id,
          timestamp: newNotification.timestamp
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'repair_update':
        return <Package className="h-5 w-5" />;
      case 'chat_message':
        return <MessageSquare className="h-5 w-5" />;
      case 'quote_ready':
        return <CreditCard className="h-5 w-5" />;
      case 'appointment_reminder':
        return <Calendar className="h-5 w-5" />;
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5" />;
      case 'error':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getNotificationColor = (type: Notification['type'], priority: Notification['priority']) => {
    if (priority === 'urgent') return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    
    switch (type) {
      case 'repair_update':
        return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'chat_message':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'quote_ready':
        return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20';
      case 'appointment_reminder':
        return 'border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'success':
        return 'border-green-500 bg-green-50 dark:bg-green-900/20';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
      case 'error':
        return 'border-red-500 bg-red-50 dark:bg-red-900/20';
      default:
        return 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      default:
        return 'top-4 right-4';
    }
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Notification Dropdown */}
        {showNotifications && (
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Notifications ({notifications.length})
                </h3>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    title={soundEnabled ? 'Disable sound' : 'Enable sound'}
                  >
                    {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    Mark all read
                  </button>
                  <button
                    onClick={clearAllNotifications}
                    className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`flex-shrink-0 p-2 rounded-full ${getNotificationColor(notification.type, notification.priority)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                              {notification.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              {new Date(notification.timestamp).toLocaleString()}
                            </p>
                          </div>
                          
                          <div className="flex items-center space-x-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={() => markAsRead(notification.id)}
                                className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                                title="Mark as read"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => removeNotification(notification.id)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                              title="Dismiss"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        {notification.actionUrl && notification.actionLabel && (
                          <button
                            onClick={() => {
                              window.location.href = notification.actionUrl!;
                              markAsRead(notification.id);
                            }}
                            className="mt-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                          >
                            {notification.actionLabel} →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      <div
        ref={containerRef}
        className={`fixed ${getPositionClasses()} z-50 space-y-2 pointer-events-none`}
      >
        {notifications
          .filter(n => !n.read && n.autoHide !== false)
          .slice(0, 3) // Show max 3 toasts
          .map((notification) => (
            <div
              key={notification.id}
              className={`max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto border-l-4 ${getNotificationColor(notification.type, notification.priority)}`}
            >
              <div className="p-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="ml-3 w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {notification.title}
                    </p>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {notification.message}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0 flex">
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Click outside to close dropdown */}
      {showNotifications && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </>
  );
};

// Hook for adding notifications programmatically
export const useNotifications = () => {
  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    // This would typically dispatch to a global notification store
    // For now, we'll use a custom event
    const event = new CustomEvent('addNotification', { detail: notification });
    window.dispatchEvent(event);
  };

  return { addNotification };
};

export default NotificationSystem;