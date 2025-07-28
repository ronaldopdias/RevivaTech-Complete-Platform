'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  BellOff, 
  X, 
  Check, 
  Settings, 
  Smartphone, 
  MessageSquare, 
  Mail, 
  Clock,
  Shield,
  Volume2,
  VolumeX,
  Vibrate,
  Moon,
  Sun,
  AlertCircle,
  CheckCircle,
  Info,
  Zap
} from 'lucide-react';
import { EnhancedTouchButton } from '@/components/mobile/AdvancedGestures';
import { AdvancedGestureRecognizer } from '@/components/mobile/AdvancedGestures';

interface MobileNotification {
  id: string;
  type: 'repair_update' | 'booking_confirmed' | 'pickup_ready' | 'payment_due' | 'promotion';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actions?: {
    id: string;
    label: string;
    action: () => void;
    variant: 'primary' | 'secondary' | 'danger';
  }[];
  icon?: string;
  image?: string;
  bookingId?: string;
  category: string;
  autoExpire?: number; // milliseconds
}

interface NotificationPreferences {
  enabled: boolean;
  sound: boolean;
  vibration: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  categories: {
    [key: string]: {
      enabled: boolean;
      priority: 'low' | 'medium' | 'high';
    };
  };
}

interface MobileNotificationManagerProps {
  userId?: string;
  onNotificationAction?: (notificationId: string, action: string) => void;
  className?: string;
}

export function MobileNotificationManager({ 
  userId, 
  onNotificationAction, 
  className = '' 
}: MobileNotificationManagerProps) {
  const [notifications, setNotifications] = useState<MobileNotification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    sound: true,
    vibration: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    categories: {
      'repair_update': { enabled: true, priority: 'high' },
      'booking_confirmed': { enabled: true, priority: 'medium' },
      'pickup_ready': { enabled: true, priority: 'high' },
      'payment_due': { enabled: true, priority: 'medium' },
      'promotion': { enabled: true, priority: 'low' }
    }
  });
  const [showSettings, setShowSettings] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isQuietHours, setIsQuietHours] = useState(false);
  const [activeNotification, setActiveNotification] = useState<MobileNotification | null>(null);

  // Initialize notification system
  useEffect(() => {
    checkPermissionStatus();
    loadNotifications();
    checkQuietHours();
    
    // Set up interval to check quiet hours
    const interval = setInterval(checkQuietHours, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  // Update unread count
  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const checkPermissionStatus = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
    }
  }, []);

  const checkQuietHours = useCallback(() => {
    if (!preferences.quietHours.enabled) {
      setIsQuietHours(false);
      return;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = preferences.quietHours.start;
    const end = preferences.quietHours.end;
    
    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
      setIsQuietHours(currentTime >= start || currentTime <= end);
    } else {
      setIsQuietHours(currentTime >= start && currentTime <= end);
    }
  }, [preferences.quietHours]);

  const loadNotifications = useCallback(async () => {
    // Mock data for demo - in real app, this would fetch from API
    const mockNotifications: MobileNotification[] = [
      {
        id: '1',
        type: 'repair_update',
        title: 'Repair Update',
        message: 'Your iPhone 15 Pro screen replacement is now complete! Ready for pickup.',
        timestamp: Date.now() - 300000, // 5 minutes ago
        read: false,
        priority: 'high',
        category: 'repair_update',
        bookingId: 'booking-123',
        icon: '🔧',
        actions: [
          {
            id: 'view',
            label: 'View Details',
            action: () => console.log('View repair details'),
            variant: 'primary'
          },
          {
            id: 'schedule',
            label: 'Schedule Pickup',
            action: () => console.log('Schedule pickup'),
            variant: 'secondary'
          }
        ]
      },
      {
        id: '2',
        type: 'booking_confirmed',
        title: 'Booking Confirmed',
        message: 'Your MacBook Pro repair has been confirmed for tomorrow at 2:00 PM.',
        timestamp: Date.now() - 3600000, // 1 hour ago
        read: false,
        priority: 'medium',
        category: 'booking_confirmed',
        bookingId: 'booking-124',
        icon: '✅'
      },
      {
        id: '3',
        type: 'promotion',
        title: 'Special Offer',
        message: '20% off all battery replacements this week! Book now and save.',
        timestamp: Date.now() - 86400000, // 1 day ago
        read: true,
        priority: 'low',
        category: 'promotion',
        icon: '🎉',
        autoExpire: 604800000 // 7 days
      }
    ];

    setNotifications(mockNotifications);
  }, []);

  const showNotification = useCallback((notification: MobileNotification) => {
    if (!preferences.enabled || isQuietHours) return;

    const categoryPrefs = preferences.categories[notification.category];
    if (!categoryPrefs?.enabled) return;

    // Show native notification if permission granted
    if (permissionStatus === 'granted') {
      const notif = new Notification(notification.title, {
        body: notification.message,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: notification.id,
        data: { notificationId: notification.id, bookingId: notification.bookingId },
        requireInteraction: notification.priority === 'urgent',
        silent: !preferences.sound
      });

      notif.onclick = () => {
        markAsRead(notification.id);
        notif.close();
      };

      // Auto-close after 5 seconds for non-urgent notifications
      if (notification.priority !== 'urgent') {
        setTimeout(() => notif.close(), 5000);
      }
    }

    // Show in-app notification
    setActiveNotification(notification);
    
    // Play sound if enabled
    if (preferences.sound) {
      playNotificationSound(notification.priority);
    }
    
    // Vibrate if enabled
    if (preferences.vibration && 'vibrate' in navigator) {
      const patterns = {
        low: [100],
        medium: [100, 100, 100],
        high: [200, 100, 200],
        urgent: [200, 100, 200, 100, 200]
      };
      navigator.vibrate(patterns[notification.priority]);
    }

    // Auto-hide in-app notification after delay
    setTimeout(() => {
      setActiveNotification(null);
    }, notification.priority === 'urgent' ? 10000 : 5000);
  }, [preferences, permissionStatus, isQuietHours]);

  const playNotificationSound = (priority: string) => {
    try {
      const audio = new Audio(`/sounds/notification-${priority}.mp3`);
      audio.play().catch(e => console.log('Sound play failed:', e));
    } catch (e) {
      console.log('Sound not available');
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const handleNotificationAction = (notificationId: string, actionId: string) => {
    const notification = notifications.find(n => n.id === notificationId);
    const action = notification?.actions?.find(a => a.id === actionId);
    
    if (action) {
      action.action();
      onNotificationAction?.(notificationId, actionId);
    }
    
    markAsRead(notificationId);
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      repair_update: '🔧',
      booking_confirmed: '✅',
      pickup_ready: '📦',
      payment_due: '💳',
      promotion: '🎉'
    };
    return icons[type as keyof typeof icons] || '📱';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  return (
    <div className={className}>
      {/* Notification Bell with Badge */}
      <div className="relative">
        <EnhancedTouchButton
          onClick={() => setShowSettings(!showSettings)}
          className="relative w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"
        >
          {preferences.enabled && !isQuietHours ? (
            <Bell className="w-6 h-6 text-gray-700" />
          ) : (
            <BellOff className="w-6 h-6 text-gray-500" />
          )}
          
          {unreadCount > 0 && (
            <motion.div
              className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 15 }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
          
          {isQuietHours && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
              <Moon className="w-2 h-2 text-white" />
            </div>
          )}
        </EnhancedTouchButton>
      </div>

      {/* In-App Notification Popup */}
      <AnimatePresence>
        {activeNotification && (
          <motion.div
            className="fixed top-safe-area-inset-top left-4 right-4 z-50"
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <AdvancedGestureRecognizer
              onGesture={(event) => {
                if (event.type === 'swipe' && event.data.direction === 'up') {
                  setActiveNotification(null);
                }
              }}
              config={{ enableSwipe: true, enableHaptics: true }}
            >
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">{getNotificationIcon(activeNotification.type)}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {activeNotification.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-3">
                        {activeNotification.message}
                      </p>
                      
                      {activeNotification.actions && (
                        <div className="flex gap-2">
                          {activeNotification.actions.map((action) => (
                            <EnhancedTouchButton
                              key={action.id}
                              onClick={() => handleNotificationAction(activeNotification.id, action.id)}
                              variant={action.variant}
                              className="px-3 py-1 text-sm rounded-lg"
                            >
                              {action.label}
                            </EnhancedTouchButton>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <EnhancedTouchButton
                      onClick={() => setActiveNotification(null)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </EnhancedTouchButton>
                  </div>
                </div>
                
                <div className="h-1 bg-gray-100">
                  <motion.div
                    className="h-full bg-primary-500"
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 5, ease: 'linear' }}
                  />
                </div>
              </div>
            </AdvancedGestureRecognizer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-y-auto safe-area-pb"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Notifications</h2>
                  <EnhancedTouchButton
                    onClick={() => setShowSettings(false)}
                    className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </EnhancedTouchButton>
                </div>

                {/* Notification List */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Recent Notifications</h3>
                    <div className="flex gap-2">
                      <EnhancedTouchButton
                        onClick={markAllAsRead}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg"
                        disabled={unreadCount === 0}
                      >
                        Mark All Read
                      </EnhancedTouchButton>
                      <EnhancedTouchButton
                        onClick={clearAllNotifications}
                        className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg"
                        disabled={notifications.length === 0}
                      >
                        Clear All
                      </EnhancedTouchButton>
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          layout
                          className={`p-3 rounded-xl border transition-all ${
                            notification.read 
                              ? 'bg-gray-50 border-gray-200' 
                              : 'bg-white border-primary-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-lg">{getNotificationIcon(notification.type)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-sm truncate">{notification.title}</h4>
                                <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(notification.priority)}`}>
                                  {notification.priority}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {formatTimestamp(notification.timestamp)}
                                </span>
                                <div className="flex gap-2">
                                  {!notification.read && (
                                    <EnhancedTouchButton
                                      onClick={() => markAsRead(notification.id)}
                                      className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                                    >
                                      Mark Read
                                    </EnhancedTouchButton>
                                  )}
                                  <EnhancedTouchButton
                                    onClick={() => deleteNotification(notification.id)}
                                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded"
                                  >
                                    Delete
                                  </EnhancedTouchButton>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notification Settings */}
                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">Notification Settings</h3>
                  
                  <div className="space-y-4">
                    {/* Master Toggle */}
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Enable Notifications</span>
                      <EnhancedTouchButton
                        onClick={() => setPreferences(prev => ({ ...prev, enabled: !prev.enabled }))}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          preferences.enabled ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          preferences.enabled ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </EnhancedTouchButton>
                    </div>

                    {/* Sound Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-gray-500" />
                        <span>Sound</span>
                      </div>
                      <EnhancedTouchButton
                        onClick={() => setPreferences(prev => ({ ...prev, sound: !prev.sound }))}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          preferences.sound ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          preferences.sound ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </EnhancedTouchButton>
                    </div>

                    {/* Vibration Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Vibrate className="w-4 h-4 text-gray-500" />
                        <span>Vibration</span>
                      </div>
                      <EnhancedTouchButton
                        onClick={() => setPreferences(prev => ({ ...prev, vibration: !prev.vibration }))}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          preferences.vibration ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                          preferences.vibration ? 'translate-x-6' : 'translate-x-0'
                        }`} />
                      </EnhancedTouchButton>
                    </div>

                    {/* Quiet Hours */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Moon className="w-4 h-4 text-gray-500" />
                          <span>Quiet Hours</span>
                        </div>
                        <EnhancedTouchButton
                          onClick={() => setPreferences(prev => ({ 
                            ...prev, 
                            quietHours: { ...prev.quietHours, enabled: !prev.quietHours.enabled }
                          }))}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            preferences.quietHours.enabled ? 'bg-green-500' : 'bg-gray-300'
                          }`}
                        >
                          <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                            preferences.quietHours.enabled ? 'translate-x-6' : 'translate-x-0'
                          }`} />
                        </EnhancedTouchButton>
                      </div>
                      
                      {preferences.quietHours.enabled && (
                        <div className="pl-6 space-y-2">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <label className="block text-sm text-gray-600 mb-1">Start</label>
                              <input
                                type="time"
                                value={preferences.quietHours.start}
                                onChange={(e) => setPreferences(prev => ({
                                  ...prev,
                                  quietHours: { ...prev.quietHours, start: e.target.value }
                                }))}
                                className="w-full p-2 border border-gray-300 rounded-lg mobile-input"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-sm text-gray-600 mb-1">End</label>
                              <input
                                type="time"
                                value={preferences.quietHours.end}
                                onChange={(e) => setPreferences(prev => ({
                                  ...prev,
                                  quietHours: { ...prev.quietHours, end: e.target.value }
                                }))}
                                className="w-full p-2 border border-gray-300 rounded-lg mobile-input"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MobileNotificationManager;