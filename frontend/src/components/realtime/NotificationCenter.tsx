'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, X, Check, Settings, Volume2, VolumeX } from 'lucide-react';
import { useWebSocket, useWebSocketSubscription } from '@/lib/realtime/WebSocketProvider';
import { useAuth } from '@/lib/auth/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

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
  hideAfter?: number;
  persistent?: boolean;
}

interface NotificationCenterProps {
  className?: string;
  maxNotifications?: number;
  enableSound?: boolean;
  enableDesktop?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export default function NotificationCenter({
  className = '',
  maxNotifications = 50,
  enableSound = true,
  enableDesktop = true,
  position = 'top-right'
}: NotificationCenterProps) {
  const { user } = useAuth();
  const { isConnected, sendMessage } = useWebSocket();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(enableSound);
  const [desktopEnabled, setDesktopEnabled] = useState(enableDesktop);
  const [permissionGranted, setPermissionGranted] = useState(false);

  // Check desktop notification permission
  useEffect(() => {
    if (desktopEnabled && 'Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
      
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((permission) => {
          setPermissionGranted(permission === 'granted');
        });
      }
    }
  }, [desktopEnabled]);

  // Load existing notifications
  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id]);

  const loadNotifications = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/notifications?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  // WebSocket subscriptions for real-time notifications
  useWebSocketSubscription('notification', (data) => {
    handleNewNotification(data);
  });

  useWebSocketSubscription('repair_update', (data) => {
    handleNewNotification({
      type: 'repair_update',
      title: 'Repair Status Update',
      message: `Your ${data.deviceType} repair status changed to ${data.newStatus}`,
      priority: 'high',
      actionUrl: `/dashboard/repairs/${data.repairId}`,
      actionLabel: 'View Details',
      metadata: { repairId: data.repairId },
      ...data
    });
  });

  useWebSocketSubscription('chat_message', (data) => {
    if (data.senderId !== user?.id) {
      handleNewNotification({
        type: 'chat_message',
        title: 'New Message',
        message: `${data.senderName}: ${data.content.substring(0, 50)}${data.content.length > 50 ? '...' : ''}`,
        priority: 'medium',
        actionUrl: `/dashboard/messages/${data.conversationId}`,
        actionLabel: 'Reply',
        metadata: { conversationId: data.conversationId },
        ...data
      });
    }
  });

  useWebSocketSubscription('quote_ready', (data) => {
    handleNewNotification({
      type: 'quote_ready',
      title: 'Quote Ready',
      message: `Your repair quote for ${data.deviceType} is ready for review (£${data.amount})`,
      priority: 'high',
      actionUrl: `/dashboard/quotes/${data.quoteId}`,
      actionLabel: 'Review Quote',
      metadata: { quoteId: data.quoteId },
      ...data
    });
  });

  useWebSocketSubscription('appointment_reminder', (data) => {
    handleNewNotification({
      type: 'appointment_reminder',
      title: 'Appointment Reminder',
      message: `Your ${data.serviceType} appointment is ${data.timeUntil}`,
      priority: 'high',
      actionUrl: `/dashboard/appointments/${data.appointmentId}`,
      actionLabel: 'View Details',
      metadata: { appointmentId: data.appointmentId },
      ...data
    });
  });

  const handleNewNotification = useCallback((notification: Partial<Notification>) => {
    const newNotification: Notification = {
      id: notification.id || `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: notification.timestamp || new Date().toISOString(),
      read: notification.read || false,
      autoHide: notification.autoHide ?? (notification.priority !== 'urgent'),
      hideAfter: notification.hideAfter || 5000,
      persistent: notification.persistent || false,
      ...notification
    } as Notification;

    setNotifications(prev => {
      const updated = [newNotification, ...prev.filter(n => n.id !== newNotification.id)];
      return updated.slice(0, maxNotifications);
    });

    if (!newNotification.read) {
      setUnreadCount(prev => prev + 1);
    }

    // Play sound
    if (soundEnabled && !newNotification.read) {
      playNotificationSound(newNotification.type);
    }

    // Show desktop notification
    if (desktopEnabled && permissionGranted && document.visibilityState === 'hidden' && !newNotification.read) {
      showDesktopNotification(newNotification);
    }

    // Auto-hide toast notifications
    if (newNotification.autoHide && !newNotification.persistent) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, newNotification.hideAfter);
    }

    // Send acknowledgment back to server
    if (isConnected && user?.id) {
      sendMessage({
        type: 'notification_received',
        payload: {
          notificationId: newNotification.id,
          userId: user.id,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date().toISOString()
      });
    }
  }, [soundEnabled, desktopEnabled, permissionGranted, maxNotifications, isConnected, user?.id]);

  const playNotificationSound = (type: Notification['type']) => {
    const soundMap = {
      repair_update: '/sounds/notification.mp3',
      chat_message: '/sounds/message.mp3',
      quote_ready: '/sounds/success.mp3',
      appointment_reminder: '/sounds/gentle.mp3',
      payment_due: '/sounds/urgent.mp3',
      system: '/sounds/system.mp3',
      info: '/sounds/info.mp3',
      success: '/sounds/success.mp3',
      warning: '/sounds/warning.mp3',
      error: '/sounds/error.mp3'
    };

    try {
      const audio = new Audio(soundMap[type] || '/sounds/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
    } catch (error) {
      // Sound file not available
    }
  };

  const showDesktopNotification = (notification: Notification) => {
    try {
      const desktopNotif = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.persistent
      });

      desktopNotif.onclick = () => {
        window.focus();
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
        markAsRead(notification.id);
        desktopNotif.close();
      };

      if (notification.autoHide) {
        setTimeout(() => {
          desktopNotif.close();
        }, notification.hideAfter);
      }
    } catch (error) {
      console.warn('Could not show desktop notification:', error);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Update on server
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id })
      });
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    const iconMap = {
      repair_update: '🔧',
      chat_message: '💬',
      quote_ready: '💰',
      appointment_reminder: '📅',
      payment_due: '💳',
      system: '⚙️',
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    return iconMap[type] || '📢';
  };

  const getNotificationColor = (type: Notification['type'], priority: Notification['priority']) => {
    if (priority === 'urgent') return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    
    const colorMap = {
      repair_update: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
      chat_message: 'border-green-500 bg-green-50 dark:bg-green-900/20',
      quote_ready: 'border-purple-500 bg-purple-50 dark:bg-purple-900/20',
      appointment_reminder: 'border-orange-500 bg-orange-50 dark:bg-orange-900/20',
      payment_due: 'border-red-500 bg-red-50 dark:bg-red-900/20',
      system: 'border-gray-500 bg-gray-50 dark:bg-gray-900/20',
      info: 'border-blue-500 bg-blue-50 dark:bg-blue-900/20',
      success: 'border-green-500 bg-green-50 dark:bg-green-900/20',
      warning: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
      error: 'border-red-500 bg-red-50 dark:bg-red-900/20'
    };
    return colorMap[type] || 'border-gray-500 bg-gray-50 dark:bg-gray-900/20';
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={cn("relative", className)}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        aria-label="Open notifications"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
        {isConnected && (
          <span className="absolute -bottom-1 -right-1 bg-green-500 rounded-full h-2 w-2"></span>
        )}
      </button>

      {/* Notification Dropdown */}
      {showDropdown && (
        <>
          <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
            {/* Header */}
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
              
              {/* Connection Status */}
              <div className="flex items-center mt-2 text-xs">
                <span className={cn(
                  "inline-block w-2 h-2 rounded-full mr-2",
                  isConnected ? "bg-green-500" : "bg-red-500"
                )}></span>
                <span className="text-gray-500 dark:text-gray-400">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            {/* Notifications List */}
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
                    className={cn(
                      "p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors",
                      !notification.read && "bg-blue-50 dark:bg-blue-900/10"
                    )}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={cn(
                        "flex-shrink-0 p-2 rounded-full text-sm",
                        getNotificationColor(notification.type, notification.priority)
                      )}>
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
                              {formatTimestamp(notification.timestamp)}
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
                              setShowDropdown(false);
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

          {/* Click outside to close */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />
        </>
      )}
    </div>
  );
}