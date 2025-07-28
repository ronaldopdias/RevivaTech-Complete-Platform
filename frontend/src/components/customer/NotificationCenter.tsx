'use client';

/**
 * Real-time Notification Center Component
 * 
 * Features:
 * - WebSocket-powered live notifications
 * - Multiple notification types (repair, payment, system)
 * - Smart grouping and categorization
 * - Read/unread status management
 * - Push notification integration
 * - Notification history and persistence
 * - Action buttons for quick responses
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import useWebSocket from '@/hooks/useWebSocket';

interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  action: () => void;
}

interface Notification {
  id: string;
  type: 'repair-update' | 'payment' | 'message' | 'system' | 'appointment' | 'urgent';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  relatedId?: string; // repair ID, booking ID, etc.
  actions?: NotificationAction[];
  metadata?: {
    deviceName?: string;
    technician?: string;
    estimatedTime?: string;
    amount?: number;
    currency?: string;
  };
  expiresAt?: string;
  persistent?: boolean; // true for important notifications that shouldn't auto-dismiss
}

interface NotificationCenterProps {
  customerId?: string;
  maxNotifications?: number;
  autoMarkAsRead?: boolean;
  enablePushNotifications?: boolean;
  enableSound?: boolean;
  onNotificationClick?: (notification: Notification) => void;
  className?: string;
}

export default function NotificationCenter({
  customerId,
  maxNotifications = 50,
  autoMarkAsRead = false,
  enablePushNotifications = true,
  enableSound = true,
  onNotificationClick,
  className = ''
}: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'urgent'>('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(enableSound);
  const [pushEnabled, setPushEnabled] = useState(enablePushNotifications);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastNotificationCount = useRef(0);

  // WebSocket connection for real-time notifications
  const { 
    isConnected, 
    sendMessage, 
    lastMessage,
    error: wsError 
  } = useWebSocket({
    url: 'ws://localhost:3011',
    shouldReconnect: true,
    reconnectAttempts: 5,
    reconnectInterval: 3000,
  });

  // Load initial notifications
  const loadNotifications = useCallback(async () => {
    try {
      // Mock notifications - replace with real API call
      const mockNotifications: Notification[] = [
        {
          id: 'notif-001',
          type: 'repair-update',
          title: 'Repair Progress Update',
          message: 'Your MacBook Pro screen replacement is now 65% complete',
          timestamp: '2025-07-14T14:25:00Z',
          read: false,
          priority: 'normal',
          category: 'Repairs',
          relatedId: 'repair-001',
          metadata: {
            deviceName: 'MacBook Pro 16" M1 Max',
            technician: 'Sarah Johnson',
            estimatedTime: '2025-07-14T16:30:00Z'
          },
          actions: [
            {
              id: 'view-repair',
              label: 'View Details',
              type: 'primary',
              action: () => console.log('View repair details')
            }
          ]
        },
        {
          id: 'notif-002',
          type: 'message',
          title: 'New Message from Technician',
          message: 'Hi! The screen assembly is being installed now. Everything is going smoothly.',
          timestamp: '2025-07-14T14:00:00Z',
          read: false,
          priority: 'high',
          category: 'Messages',
          relatedId: 'repair-001',
          metadata: {
            technician: 'Sarah Johnson',
            deviceName: 'MacBook Pro 16" M1 Max'
          },
          actions: [
            {
              id: 'reply',
              label: 'Reply',
              type: 'primary',
              action: () => console.log('Open reply dialog')
            },
            {
              id: 'view-thread',
              label: 'View Thread',
              type: 'secondary',
              action: () => console.log('View message thread')
            }
          ]
        },
        {
          id: 'notif-003',
          type: 'payment',
          title: 'Payment Reminder',
          message: 'Partial payment due for iPhone 14 Pro battery replacement',
          timestamp: '2025-07-14T13:30:00Z',
          read: true,
          priority: 'normal',
          category: 'Payments',
          relatedId: 'repair-002',
          metadata: {
            deviceName: 'iPhone 14 Pro',
            amount: 45,
            currency: 'GBP'
          },
          actions: [
            {
              id: 'pay-now',
              label: 'Pay Now',
              type: 'primary',
              action: () => console.log('Open payment dialog')
            },
            {
              id: 'view-invoice',
              label: 'View Invoice',
              type: 'secondary',
              action: () => console.log('View invoice')
            }
          ]
        },
        {
          id: 'notif-004',
          type: 'appointment',
          title: 'Pickup Reminder',
          message: 'Your MacBook Pro will be ready for collection tomorrow at 4:30 PM',
          timestamp: '2025-07-14T12:00:00Z',
          read: true,
          priority: 'normal',
          category: 'Appointments',
          relatedId: 'repair-001',
          metadata: {
            deviceName: 'MacBook Pro 16" M1 Max',
            estimatedTime: '2025-07-15T16:30:00Z'
          },
          actions: [
            {
              id: 'confirm-pickup',
              label: 'Confirm',
              type: 'primary',
              action: () => console.log('Confirm pickup time')
            },
            {
              id: 'reschedule',
              label: 'Reschedule',
              type: 'secondary',
              action: () => console.log('Reschedule pickup')
            }
          ]
        },
        {
          id: 'notif-005',
          type: 'system',
          title: 'Welcome to RevivaTech',
          message: 'Your account has been created. Track your repairs in real-time!',
          timestamp: '2025-07-13T09:00:00Z',
          read: true,
          priority: 'low',
          category: 'System',
          persistent: true
        }
      ];

      setNotifications(mockNotifications);
      lastNotificationCount.current = mockNotifications.filter(n => !n.read).length;
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, []);

  // Handle real-time notification updates
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = typeof lastMessage === 'string' ? JSON.parse(lastMessage) : lastMessage;
        
        if (data.type === 'notification') {
          console.log('Real-time notification received:', data);
          
          const newNotification: Notification = {
            id: data.id || `notif-${Date.now()}`,
            type: data.notificationType || 'system',
            title: data.title,
            message: data.message,
            timestamp: data.timestamp || new Date().toISOString(),
            read: false,
            priority: data.priority || 'normal',
            category: data.category,
            relatedId: data.relatedId,
            metadata: data.metadata,
            actions: data.actions,
            expiresAt: data.expiresAt,
            persistent: data.persistent
          };

          setNotifications(prev => {
            // Add new notification at the top
            const updated = [newNotification, ...prev];
            
            // Remove expired notifications
            const filtered = updated.filter(n => 
              !n.expiresAt || new Date(n.expiresAt) > new Date()
            );
            
            // Limit total notifications
            const limited = filtered.slice(0, maxNotifications);
            
            // Play sound for new notifications
            if (soundEnabled && !newNotification.read) {
              playNotificationSound();
            }
            
            // Show push notification
            if (pushEnabled && newNotification.priority === 'urgent') {
              showPushNotification(newNotification);
            }
            
            return limited;
          });
        }
        
        // Handle notification read/unread updates
        if (data.type === 'notification-update') {
          setNotifications(prev => 
            prev.map(n => 
              n.id === data.notificationId 
                ? { ...n, read: data.read, ...data.updates }
                : n
            )
          );
        }
      } catch (err) {
        console.warn('Failed to parse notification message:', err);
      }
    }
  }, [lastMessage, maxNotifications, soundEnabled, pushEnabled]);

  // Subscribe to notifications when connected
  useEffect(() => {
    if (isConnected && customerId) {
      sendMessage({
        type: 'subscribe',
        channel: `notifications:${customerId}`,
        timestamp: new Date().toISOString()
      });

      return () => {
        sendMessage({
          type: 'unsubscribe',
          channel: `notifications:${customerId}`,
          timestamp: new Date().toISOString()
        });
      };
    }
  }, [isConnected, customerId, sendMessage]);

  // Load initial notifications
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Request notification permission
  useEffect(() => {
    if (pushEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setPushEnabled(permission === 'granted');
      });
    }
  }, [pushEnabled]);

  // Initialize audio for notifications
  useEffect(() => {
    if (soundEnabled && !audioRef.current) {
      audioRef.current = new Audio('/sounds/notification.mp3');
      audioRef.current.volume = 0.5;
    }
  }, [soundEnabled]);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current && soundEnabled) {
      audioRef.current.play().catch(err => {
        console.warn('Failed to play notification sound:', err);
      });
    }
  }, [soundEnabled]);

  const showPushNotification = useCallback((notification: Notification) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const pushNotif = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/badge.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
        timestamp: new Date(notification.timestamp).getTime()
      });

      pushNotif.onclick = () => {
        window.focus();
        onNotificationClick?.(notification);
        pushNotif.close();
      };

      // Auto-close after 5 seconds for non-urgent notifications
      if (notification.priority !== 'urgent') {
        setTimeout(() => pushNotif.close(), 5000);
      }
    }
  }, [onNotificationClick]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );

    // Send read status to server
    if (isConnected) {
      sendMessage({
        type: 'notification-read',
        notificationId: notificationId,
        timestamp: new Date().toISOString()
      });
    }
  }, [isConnected, sendMessage]);

  const markAllAsRead = useCallback(() => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
    
    setNotifications(prev => 
      prev.map(n => ({ ...n, read: true }))
    );

    // Send batch read status to server
    if (isConnected && unreadIds.length > 0) {
      sendMessage({
        type: 'notifications-read-batch',
        notificationIds: unreadIds,
        timestamp: new Date().toISOString()
      });
    }
  }, [notifications, isConnected, sendMessage]);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
    
    // Send delete to server
    if (isConnected) {
      sendMessage({
        type: 'notification-delete',
        notificationId: notificationId,
        timestamp: new Date().toISOString()
      });
    }
  }, [isConnected, sendMessage]);

  const getNotificationIcon = (type: Notification['type']) => {
    const icons = {
      'repair-update': '🔧',
      'payment': '💳',
      'message': '💬',
      'system': 'ℹ️',
      'appointment': '📅',
      'urgent': '🚨'
    };
    return icons[type] || 'ℹ️';
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    const colors = {
      low: 'border-l-gray-400',
      normal: 'border-l-blue-400',
      high: 'border-l-yellow-400',
      urgent: 'border-l-red-400'
    };
    return colors[priority];
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'urgent':
        return notification.priority === 'urgent' || notification.priority === 'high';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-800">
                {unreadCount} new
              </Badge>
            )}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
              >
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'all' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'unread' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('urgent')}
            className={`px-3 py-1 rounded-full text-sm ${
              filter === 'urgent' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            Urgent ({notifications.filter(n => n.priority === 'urgent' || n.priority === 'high').length})
          </button>
        </div>

        {/* Settings */}
        <div className="flex items-center space-x-4 text-sm">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={soundEnabled}
              onChange={(e) => setSoundEnabled(e.target.checked)}
            />
            <span>Sound</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={pushEnabled}
              onChange={(e) => setPushEnabled(e.target.checked)}
            />
            <span>Push Notifications</span>
          </label>
        </div>
      </Card>

      {/* Notifications List */}
      <div className={`space-y-3 ${isExpanded ? 'max-h-none' : 'max-h-96 overflow-y-auto'}`}>
        {filteredNotifications.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} ${
                !notification.read ? 'bg-blue-50' : 'bg-white'
              } cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => {
                if (!notification.read) markAsRead(notification.id);
                onNotificationClick?.(notification);
              }}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 text-xl">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900 truncate">
                      {notification.title}
                    </h4>
                    <div className="flex items-center space-x-2 ml-2">
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.message}
                  </p>
                  
                  {notification.metadata && (
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      {notification.metadata.deviceName && (
                        <span>📱 {notification.metadata.deviceName}</span>
                      )}
                      {notification.metadata.technician && (
                        <span>👨‍🔧 {notification.metadata.technician}</span>
                      )}
                      {notification.metadata.amount && (
                        <span>💰 {notification.metadata.currency || '£'}{notification.metadata.amount}</span>
                      )}
                    </div>
                  )}
                  
                  {notification.actions && notification.actions.length > 0 && (
                    <div className="flex items-center space-x-2 mt-3">
                      {notification.actions.map((action) => (
                        <Button
                          key={action.id}
                          variant={action.type === 'primary' ? 'default' : 'outline'}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            action.action();
                          }}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                  className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* WebSocket Error */}
      {wsError && (
        <Card className="p-4 border-yellow-200 bg-yellow-50">
          <div className="flex items-center space-x-2">
            <span className="text-yellow-600">⚠️</span>
            <div>
              <p className="text-sm font-medium text-yellow-800">Live Notifications Unavailable</p>
              <p className="text-xs text-yellow-700">Some notifications may be delayed</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// Export types for use in other components
export type { Notification, NotificationAction };