'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useWebSocket, useWebSocketSubscription } from '@/lib/realtime/WebSocketProvider';

interface BookingNotificationSystemProps {
  userId?: string;
  onNotificationReceived?: (notification: BookingNotification) => void;
  onNotificationAction?: (notificationId: string, action: string) => void;
  maxNotifications?: number;
  autoHideDelay?: number;
  enableSound?: boolean;
  enableDesktop?: boolean;
  className?: string;
}

interface BookingNotification {
  id: string;
  type: 'booking_confirmed' | 'booking_cancelled' | 'booking_reminder' | 'status_update' | 'payment_required' | 'technician_assigned' | 'repair_completed' | 'quote_ready' | 'photo_analysis_complete';
  title: string;
  message: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  bookingId?: string;
  data?: any;
  actions?: NotificationAction[];
  autoHide?: boolean;
  persistent?: boolean;
  sound?: string;
  icon?: string;
  read?: boolean;
}

interface NotificationAction {
  id: string;
  label: string;
  variant: 'primary' | 'secondary' | 'destructive';
  onClick?: () => void;
}

interface NotificationSettings {
  enableSound: boolean;
  enableDesktop: boolean;
  enableBookingUpdates: boolean;
  enableRepairUpdates: boolean;
  enableQuoteNotifications: boolean;
  enableReminderNotifications: boolean;
  quietHours: { start: string; end: string };
}

const DEFAULT_SETTINGS: NotificationSettings = {
  enableSound: true,
  enableDesktop: true,
  enableBookingUpdates: true,
  enableRepairUpdates: true,
  enableQuoteNotifications: true,
  enableReminderNotifications: true,
  quietHours: { start: '22:00', end: '08:00' },
};

const NOTIFICATION_SOUNDS = {
  booking_confirmed: '/sounds/success.mp3',
  booking_cancelled: '/sounds/warning.mp3',
  booking_reminder: '/sounds/gentle.mp3',
  status_update: '/sounds/notification.mp3',
  payment_required: '/sounds/urgent.mp3',
  technician_assigned: '/sounds/info.mp3',
  repair_completed: '/sounds/completion.mp3',
  quote_ready: '/sounds/notification.mp3',
  photo_analysis_complete: '/sounds/info.mp3',
};

const NOTIFICATION_ICONS = {
  booking_confirmed: '✅',
  booking_cancelled: '❌',
  booking_reminder: '⏰',
  status_update: '🔄',
  payment_required: '💳',
  technician_assigned: '👨‍🔧',
  repair_completed: '🎉',
  quote_ready: '💰',
  photo_analysis_complete: '📷',
};

export default function BookingNotificationSystem({
  userId,
  onNotificationReceived,
  onNotificationAction,
  maxNotifications = 5,
  autoHideDelay = 5000,
  enableSound = true,
  enableDesktop = true,
  className
}: BookingNotificationSystemProps) {
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [desktopPermission, setDesktopPermission] = useState<NotificationPermission>('default');

  const { isConnected, sendMessage } = useWebSocket();

  // Check desktop notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setDesktopPermission(Notification.permission);
    }
  }, []);

  // Request desktop notification permission
  const requestDesktopPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setDesktopPermission(permission);
    }
  };

  // WebSocket subscription for booking notifications
  useWebSocketSubscription('booking_notification', (data: BookingNotification) => {
    handleNewNotification(data);
  });

  // WebSocket subscription for repair status updates
  useWebSocketSubscription('repair_status_notification', (data: BookingNotification) => {
    handleNewNotification({ ...data, type: 'status_update' });
  });

  // WebSocket subscription for quote notifications
  useWebSocketSubscription('quote_notification', (data: BookingNotification) => {
    handleNewNotification({ ...data, type: 'quote_ready' });
  });

  // WebSocket subscription for photo analysis complete
  useWebSocketSubscription('photo_analysis_notification', (data: BookingNotification) => {
    handleNewNotification({ ...data, type: 'photo_analysis_complete' });
  });

  // Handle new notifications
  const handleNewNotification = useCallback((notification: BookingNotification) => {
    // Check if notification type is enabled
    if (!isNotificationTypeEnabled(notification.type)) {
      return;
    }

    // Check quiet hours
    if (isQuietHours()) {
      notification.sound = undefined; // Disable sound during quiet hours
    }

    // Add notification icon if not provided
    if (!notification.icon) {
      notification.icon = NOTIFICATION_ICONS[notification.type] || '📢';
    }

    // Set auto-hide based on severity
    if (notification.autoHide === undefined) {
      notification.autoHide = notification.severity !== 'error' && !notification.persistent;
    }

    // Add to notifications list
    setNotifications(prev => {
      const filtered = prev.filter(n => n.id !== notification.id);
      const updated = [notification, ...filtered].slice(0, maxNotifications);
      return updated;
    });

    // Play sound
    if (settings.enableSound && enableSound && notification.sound) {
      playNotificationSound(notification.sound);
    }

    // Show desktop notification
    if (settings.enableDesktop && enableDesktop && desktopPermission === 'granted') {
      showDesktopNotification(notification);
    }

    // Auto-hide notification
    if (notification.autoHide) {
      setTimeout(() => {
        dismissNotification(notification.id);
      }, autoHideDelay);
    }

    // Notify parent component
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  }, [settings, enableSound, enableDesktop, desktopPermission, maxNotifications, autoHideDelay, onNotificationReceived]);

  const isNotificationTypeEnabled = (type: BookingNotification['type']): boolean => {
    switch (type) {
      case 'booking_confirmed':
      case 'booking_cancelled':
        return settings.enableBookingUpdates;
      case 'status_update':
      case 'technician_assigned':
      case 'repair_completed':
        return settings.enableRepairUpdates;
      case 'quote_ready':
      case 'payment_required':
        return settings.enableQuoteNotifications;
      case 'booking_reminder':
        return settings.enableReminderNotifications;
      case 'photo_analysis_complete':
        return true; // Always enabled for photo analysis
      default:
        return true;
    }
  };

  const isQuietHours = (): boolean => {
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();
    const startTime = parseInt(settings.quietHours.start.replace(':', ''));
    const endTime = parseInt(settings.quietHours.end.replace(':', ''));

    if (startTime > endTime) {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    } else {
      return currentTime >= startTime && currentTime <= endTime;
    }
  };

  const playNotificationSound = (soundFile: string) => {
    try {
      const audio = new Audio(soundFile);
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.warn('Could not play notification sound:', error);
      });
    } catch (error) {
      console.warn('Notification sound not available:', error);
    }
  };

  const showDesktopNotification = (notification: BookingNotification) => {
    try {
      const desktopNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        timestamp: new Date(notification.timestamp).getTime(),
        requireInteraction: notification.persistent,
      });

      desktopNotification.onclick = () => {
        window.focus();
        markAsRead(notification.id);
        desktopNotification.close();
      };

      if (notification.autoHide) {
        setTimeout(() => {
          desktopNotification.close();
        }, autoHideDelay);
      }
    } catch (error) {
      console.warn('Could not show desktop notification:', error);
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const handleNotificationAction = (notificationId: string, actionId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    if (!notification) return;

    const action = notification.actions?.find(a => a.id === actionId);
    if (action?.onClick) {
      action.onClick();
    }

    if (onNotificationAction) {
      onNotificationAction(notificationId, actionId);
    }

    // Dismiss notification after action (unless persistent)
    if (!notification.persistent) {
      dismissNotification(notificationId);
    }
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getSeverityColor = (severity: BookingNotification['severity']): string => {
    switch (severity) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'info':
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const getSeverityTextColor = (severity: BookingNotification['severity']): string => {
    switch (severity) {
      case 'success': return 'text-green-800';
      case 'warning': return 'text-yellow-800';
      case 'error': return 'text-red-800';
      case 'info':
      default: return 'text-blue-800';
    }
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

  // Test notification function (for development)
  const sendTestNotification = (type: BookingNotification['type']) => {
    const testNotifications: Record<BookingNotification['type'], Partial<BookingNotification>> = {
      booking_confirmed: {
        title: 'Booking Confirmed',
        message: 'Your repair appointment has been confirmed for tomorrow at 2:00 PM',
        severity: 'success',
      },
      booking_cancelled: {
        title: 'Booking Cancelled',
        message: 'Your appointment has been cancelled. Please reschedule.',
        severity: 'warning',
      },
      booking_reminder: {
        title: 'Appointment Reminder',
        message: 'Your repair appointment is tomorrow at 2:00 PM',
        severity: 'info',
      },
      status_update: {
        title: 'Repair Status Update',
        message: 'Your device repair is now in progress',
        severity: 'info',
      },
      payment_required: {
        title: 'Payment Required',
        message: 'Please complete payment to proceed with your repair',
        severity: 'warning',
        persistent: true,
      },
      technician_assigned: {
        title: 'Technician Assigned',
        message: 'John Smith has been assigned to your repair',
        severity: 'info',
      },
      repair_completed: {
        title: 'Repair Completed',
        message: 'Great news! Your device repair has been completed',
        severity: 'success',
      },
      quote_ready: {
        title: 'Quote Ready',
        message: 'Your repair quote is ready for review',
        severity: 'info',
      },
      photo_analysis_complete: {
        title: 'Photo Analysis Complete',
        message: 'We\'ve analyzed your device photos and detected possible issues',
        severity: 'info',
      },
    };

    const baseNotification = testNotifications[type];
    const notification: BookingNotification = {
      id: `test_${Date.now()}`,
      type,
      timestamp: new Date().toISOString(),
      ...baseNotification,
    } as BookingNotification;

    handleNewNotification(notification);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Notifications List */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                "p-4 border-l-4 shadow-lg transition-all duration-300",
                getSeverityColor(notification.severity),
                !notification.read && "ring-2 ring-blue-200"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-lg flex-shrink-0">
                  {notification.icon}
                </span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={cn(
                      "font-medium text-sm",
                      getSeverityTextColor(notification.severity)
                    )}>
                      {notification.title}
                    </h4>
                    <button
                      onClick={() => dismissNotification(notification.id)}
                      className="text-gray-400 hover:text-gray-600 ml-2"
                    >
                      ×
                    </button>
                  </div>
                  
                  <p className={cn(
                    "text-sm mb-2",
                    getSeverityTextColor(notification.severity)
                  )}>
                    {notification.message}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(notification.timestamp)}
                    </span>
                    
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                  
                  {notification.actions && notification.actions.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {notification.actions.map((action) => (
                        <Button
                          key={action.id}
                          variant={action.variant === 'destructive' ? 'outline' : action.variant}
                          size="sm"
                          onClick={() => handleNotificationAction(notification.id, action.id)}
                          className="text-xs"
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
          
          {notifications.length > 0 && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="flex-1 text-xs"
              >
                Mark All Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllNotifications}
                className="flex-1 text-xs"
              >
                Clear All
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <Card className="p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Notification Settings
              </h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Desktop Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Desktop Notifications</div>
                  <div className="text-sm text-gray-600">
                    Show notifications on your desktop
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {desktopPermission !== 'granted' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={requestDesktopPermission}
                    >
                      Enable
                    </Button>
                  )}
                  <input
                    type="checkbox"
                    checked={settings.enableDesktop && desktopPermission === 'granted'}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      enableDesktop: e.target.checked
                    }))}
                    disabled={desktopPermission !== 'granted'}
                    className="w-4 h-4"
                  />
                </div>
              </div>

              {/* Sound Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Sound Notifications</div>
                  <div className="text-sm text-gray-600">
                    Play sound when notifications arrive
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableSound}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    enableSound: e.target.checked
                  }))}
                  className="w-4 h-4"
                />
              </div>

              {/* Notification Types */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Notification Types</h4>
                
                {[
                  { key: 'enableBookingUpdates', label: 'Booking Updates', desc: 'Confirmations and cancellations' },
                  { key: 'enableRepairUpdates', label: 'Repair Updates', desc: 'Status changes and completion' },
                  { key: 'enableQuoteNotifications', label: 'Quote Notifications', desc: 'Quotes and payment requests' },
                  { key: 'enableReminderNotifications', label: 'Reminders', desc: 'Appointment reminders' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{label}</div>
                      <div className="text-xs text-gray-600">{desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings[key as keyof NotificationSettings] as boolean}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        [key]: e.target.checked
                      }))}
                      className="w-4 h-4"
                    />
                  </div>
                ))}
              </div>

              {/* Quiet Hours */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Quiet Hours</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-gray-600">Start</label>
                    <input
                      type="time"
                      value={settings.quietHours.start}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, start: e.target.value }
                      }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">End</label>
                    <input
                      type="time"
                      value={settings.quietHours.end}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        quietHours: { ...prev.quietHours, end: e.target.value }
                      }))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Test Notifications */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Test Notifications</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.keys(NOTIFICATION_ICONS).map((type) => (
                    <Button
                      key={type}
                      variant="outline"
                      size="sm"
                      onClick={() => sendTestNotification(type as BookingNotification['type'])}
                      className="text-xs"
                    >
                      {type.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Settings Trigger (Optional - usually called from parent) */}
      {process.env.NODE_ENV === 'development' && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(true)}
          className="fixed bottom-4 right-4 z-40"
        >
          ⚙️ Notifications
        </Button>
      )}
    </div>
  );
}