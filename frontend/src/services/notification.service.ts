/**
 * Real-Time Notification Service
 * 
 * Provides comprehensive notification management with:
 * - Real-time notifications via WebSocket
 * - Multiple notification types and priorities
 * - Browser notifications with permission handling
 * - Sound alerts and visual feedback
 * - Notification history and persistence
 * - Custom notification actions
 * 
 * Configuration-driven architecture following Nordic design principles
 */

import { webSocketService, WebSocketEventType } from './websocket.service';

export type NotificationType = 
  | 'booking-update'
  | 'repair-progress'
  | 'quote-request'
  | 'quote-approved'
  | 'quote-rejected'
  | 'device-ready'
  | 'payment-required'
  | 'system-message'
  | 'marketing'
  | 'maintenance';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationAction {
  id: string;
  label: string;
  type: 'button' | 'link';
  url?: string;
  handler?: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  dismissed: boolean;
  persistent: boolean;
  actions?: NotificationAction[];
  data?: any;
  expiresAt?: number;
  bookingId?: string;
  customerId?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  browserNotifications: boolean;
  soundAlerts: boolean;
  types: Record<NotificationType, boolean>;
  priorities: Record<NotificationPriority, boolean>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
}

interface NotificationServiceConfig {
  autoConnect: boolean;
  requestPermission: boolean;
  soundEnabled: boolean;
  maxNotifications: number;
  defaultExpiry: number; // milliseconds
  debug: boolean;
}

type NotificationCallback = (notification: Notification) => void;

class NotificationService {
  private config: NotificationServiceConfig;
  private notifications = new Map<string, Notification>();
  private callbacks = new Set<NotificationCallback>();
  private preferences: NotificationPreferences;
  private isConnected = false;
  private audio: HTMLAudioElement | null = null;

  constructor(config?: Partial<NotificationServiceConfig>) {
    this.config = {
      autoConnect: true,
      requestPermission: true,
      soundEnabled: true,
      maxNotifications: 50,
      defaultExpiry: 24 * 60 * 60 * 1000, // 24 hours
      debug: process.env.NODE_ENV === 'development',
      ...config,
    };

    // Default notification preferences
    this.preferences = {
      enabled: true,
      browserNotifications: true,
      soundAlerts: true,
      types: {
        'booking-update': true,
        'repair-progress': true,
        'quote-request': true,
        'quote-approved': true,
        'quote-rejected': true,
        'device-ready': true,
        'payment-required': true,
        'system-message': true,
        'marketing': false,
        'maintenance': true,
      },
      priorities: {
        'low': true,
        'normal': true,
        'high': true,
        'urgent': true,
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00',
      },
    };

    this.loadPreferences();
    this.setupAudio();
    this.setupWebSocketListeners();

    if (this.config.autoConnect) {
      this.connect();
    }

    if (this.config.requestPermission) {
      this.requestBrowserPermission();
    }
  }

  /**
   * Connect to real-time notifications
   */
  async connect(): Promise<void> {
    try {
      await webSocketService.connect();
      this.isConnected = true;
      this.log('NotificationService connected');
    } catch (error) {
      this.log('Failed to connect NotificationService', error);
      throw error;
    }
  }

  /**
   * Disconnect from real-time notifications
   */
  disconnect(): void {
    this.isConnected = false;
    this.log('NotificationService disconnected');
  }

  /**
   * Subscribe to notification updates
   */
  subscribe(callback: NotificationCallback): () => void {
    this.callbacks.add(callback);
    
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * Show notification
   */
  show(notificationData: Omit<Notification, 'id' | 'timestamp' | 'read' | 'dismissed'>): string {
    const notification: Notification = {
      id: this.generateId(),
      timestamp: Date.now(),
      read: false,
      dismissed: false,
      expiresAt: notificationData.expiresAt || Date.now() + this.config.defaultExpiry,
      ...notificationData,
    };

    // Check if notification should be shown based on preferences
    if (!this.shouldShowNotification(notification)) {
      this.log('Notification filtered by preferences', notification);
      return notification.id;
    }

    // Add to notifications map
    this.notifications.set(notification.id, notification);

    // Cleanup old notifications
    this.cleanupExpiredNotifications();
    this.limitNotificationCount();

    // Show browser notification
    if (this.preferences.browserNotifications && notification.priority !== 'low') {
      this.showBrowserNotification(notification);
    }

    // Play sound alert
    if (this.preferences.soundAlerts && notification.priority !== 'low') {
      this.playSound(notification.priority);
    }

    // Notify callbacks
    this.notifyCallbacks(notification);

    // Save to localStorage for persistence
    this.saveNotifications();

    this.log('Notification shown', notification);
    return notification.id;
  }

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    notification.read = true;
    this.notifications.set(notificationId, notification);
    this.saveNotifications();
    
    this.log('Notification marked as read', notificationId);
    return true;
  }

  /**
   * Dismiss notification
   */
  dismiss(notificationId: string): boolean {
    const notification = this.notifications.get(notificationId);
    if (!notification) return false;

    notification.dismissed = true;
    this.notifications.set(notificationId, notification);
    this.saveNotifications();
    
    this.log('Notification dismissed', notificationId);
    return true;
  }

  /**
   * Remove notification
   */
  remove(notificationId: string): boolean {
    const removed = this.notifications.delete(notificationId);
    if (removed) {
      this.saveNotifications();
      this.log('Notification removed', notificationId);
    }
    return removed;
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications.clear();
    this.saveNotifications();
    this.log('All notifications cleared');
  }

  /**
   * Get all notifications
   */
  getAll(): Notification[] {
    return Array.from(this.notifications.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get unread notifications
   */
  getUnread(): Notification[] {
    return this.getAll().filter(n => !n.read && !n.dismissed);
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.getUnread().length;
  }

  /**
   * Get notifications by type
   */
  getByType(type: NotificationType): Notification[] {
    return this.getAll().filter(n => n.type === type);
  }

  /**
   * Get notifications by booking ID
   */
  getByBookingId(bookingId: string): Notification[] {
    return this.getAll().filter(n => n.bookingId === bookingId);
  }

  /**
   * Execute notification action
   */
  executeAction(notificationId: string, actionId: string): void {
    const notification = this.notifications.get(notificationId);
    if (!notification || !notification.actions) return;

    const action = notification.actions.find(a => a.id === actionId);
    if (!action) return;

    if (action.handler) {
      action.handler();
    } else if (action.url) {
      window.open(action.url, action.type === 'link' ? '_blank' : '_self');
    }

    // Mark notification as read when action is executed
    this.markAsRead(notificationId);
    
    this.log('Notification action executed', { notificationId, actionId });
  }

  /**
   * Update notification preferences
   */
  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
    this.savePreferences();
    this.log('Notification preferences updated', this.preferences);
  }

  /**
   * Get current preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Request browser notification permission
   */
  async requestBrowserPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      this.log('Browser notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    this.log('Browser notification permission', permission);
    return permission;
  }

  /**
   * Test notification (for preferences/testing)
   */
  test(type: NotificationType = 'system-message'): void {
    this.show({
      type,
      priority: 'normal',
      title: 'Test Notification',
      message: 'This is a test notification to verify your settings.',
      persistent: false,
      data: { test: true },
    });
  }

  // Private methods

  private setupWebSocketListeners(): void {
    webSocketService.addEventListener('connection-state', (state) => {
      this.isConnected = state === 'connected';
      this.log('WebSocket connection state changed', state);
    });

    // Subscribe to notification events
    webSocketService.subscribe('notification', (data) => {
      this.handleWebSocketNotification(data);
    });
  }

  private handleWebSocketNotification(data: any): void {
    this.log('Received WebSocket notification', data);
    
    if (data.type && data.title && data.message) {
      this.show({
        type: data.type,
        priority: data.priority || 'normal',
        title: data.title,
        message: data.message,
        persistent: data.persistent || false,
        actions: data.actions,
        data: data.data,
        bookingId: data.bookingId,
        customerId: data.customerId,
      });
    }
  }

  private shouldShowNotification(notification: Notification): boolean {
    // Check if notifications are enabled
    if (!this.preferences.enabled) return false;

    // Check if this type is enabled
    if (!this.preferences.types[notification.type]) return false;

    // Check if this priority is enabled
    if (!this.preferences.priorities[notification.priority]) return false;

    // Check quiet hours
    if (this.preferences.quietHours.enabled && this.isQuietHour()) {
      return notification.priority === 'urgent';
    }

    return true;
  }

  private isQuietHour(): boolean {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = this.preferences.quietHours.start;
    const end = this.preferences.quietHours.end;
    
    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    } else {
      // Quiet hours span midnight
      return currentTime >= start || currentTime <= end;
    }
  }

  private showBrowserNotification(notification: Notification): void {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent',
      silent: notification.priority === 'low',
    });

    browserNotification.onclick = () => {
      this.markAsRead(notification.id);
      browserNotification.close();
      
      // Focus window
      if (window.focus) {
        window.focus();
      }
    };

    // Auto-close after delay unless urgent
    if (notification.priority !== 'urgent') {
      setTimeout(() => {
        browserNotification.close();
      }, 5000);
    }
  }

  private playSound(priority: NotificationPriority): void {
    if (!this.audio || !this.preferences.soundAlerts) return;

    try {
      this.audio.currentTime = 0;
      this.audio.volume = priority === 'urgent' ? 0.8 : 0.4;
      this.audio.play().catch(() => {
        // Ignore autoplay errors
      });
    } catch (error) {
      this.log('Error playing notification sound', error);
    }
  }

  private setupAudio(): void {
    if (!this.config.soundEnabled) return;

    try {
      this.audio = new Audio('/sounds/notification.mp3');
      this.audio.preload = 'auto';
    } catch (error) {
      this.log('Error setting up notification audio', error);
    }
  }

  private notifyCallbacks(notification: Notification): void {
    this.callbacks.forEach((callback) => {
      try {
        callback(notification);
      } catch (error) {
        this.log('Error in notification callback', error);
      }
    });
  }

  private cleanupExpiredNotifications(): void {
    const now = Date.now();
    const expired: string[] = [];

    this.notifications.forEach((notification, id) => {
      if (notification.expiresAt && notification.expiresAt < now) {
        expired.push(id);
      }
    });

    expired.forEach(id => this.notifications.delete(id));
    
    if (expired.length > 0) {
      this.log('Cleaned up expired notifications', expired.length);
    }
  }

  private limitNotificationCount(): void {
    const notifications = this.getAll();
    if (notifications.length <= this.config.maxNotifications) return;

    // Remove oldest non-persistent notifications
    const nonPersistent = notifications
      .filter(n => !n.persistent)
      .sort((a, b) => a.timestamp - b.timestamp);

    const toRemove = nonPersistent.slice(0, notifications.length - this.config.maxNotifications);
    toRemove.forEach(n => this.notifications.delete(n.id));
    
    if (toRemove.length > 0) {
      this.log('Removed old notifications to maintain limit', toRemove.length);
    }
  }

  private saveNotifications(): void {
    try {
      const data = Array.from(this.notifications.entries());
      localStorage.setItem('revivatech_notifications', JSON.stringify(data));
    } catch (error) {
      this.log('Error saving notifications', error);
    }
  }

  private loadNotifications(): void {
    try {
      const data = localStorage.getItem('revivatech_notifications');
      if (data) {
        const notifications = JSON.parse(data);
        this.notifications = new Map(notifications);
        this.cleanupExpiredNotifications();
      }
    } catch (error) {
      this.log('Error loading notifications', error);
    }
  }

  private savePreferences(): void {
    try {
      localStorage.setItem('revivatech_notification_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      this.log('Error saving preferences', error);
    }
  }

  private loadPreferences(): void {
    try {
      const data = localStorage.getItem('revivatech_notification_preferences');
      if (data) {
        const preferences = JSON.parse(data);
        this.preferences = { ...this.preferences, ...preferences };
      }
    } catch (error) {
      this.log('Error loading preferences', error);
    }
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(message: string, data?: any): void {
    if (this.config.debug) {
      console.log(`[NotificationService] ${message}`, data || '');
    }
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Initialize from localStorage
(notificationService as any).loadNotifications();

export default NotificationService;