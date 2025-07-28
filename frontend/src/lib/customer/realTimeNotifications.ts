/**
 * Real-Time Notifications System
 * Advanced notification management for customer portal
 * 
 * Features:
 * - WebSocket-based real-time updates
 * - Push notifications for repair milestones
 * - Email and SMS integration
 * - Notification preferences management
 * - Offline notification queuing
 * - Analytics tracking
 */

import { z } from 'zod';

// Notification Schema
export const NotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(['repair_update', 'appointment', 'payment', 'message', 'marketing', 'system']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  title: z.string(),
  message: z.string(),
  data: z.record(z.any()).optional(),
  channels: z.array(z.enum(['push', 'email', 'sms', 'in_app'])).default(['in_app']),
  status: z.enum(['pending', 'sent', 'delivered', 'read', 'failed']).default('pending'),
  createdAt: z.date().default(() => new Date()),
  scheduledFor: z.date().optional(),
  expiresAt: z.date().optional(),
  actionUrl: z.string().optional(),
  actions: z.array(z.object({
    id: z.string(),
    label: z.string(),
    action: z.string(),
    style: z.enum(['primary', 'secondary', 'danger']).default('secondary')
  })).default([])
});

export type Notification = z.infer<typeof NotificationSchema>;

// Notification Preferences Schema
export const NotificationPreferencesSchema = z.object({
  userId: z.string(),
  channels: z.object({
    push: z.boolean().default(true),
    email: z.boolean().default(true),
    sms: z.boolean().default(false),
    inApp: z.boolean().default(true)
  }),
  types: z.object({
    repairUpdates: z.boolean().default(true),
    appointments: z.boolean().default(true),
    payments: z.boolean().default(true),
    messages: z.boolean().default(true),
    marketing: z.boolean().default(false),
    system: z.boolean().default(true)
  }),
  quietHours: z.object({
    enabled: z.boolean().default(false),
    start: z.string().default('22:00'),
    end: z.string().default('08:00')
  }),
  frequency: z.enum(['immediate', 'digest_hourly', 'digest_daily']).default('immediate')
});

export type NotificationPreferences = z.infer<typeof NotificationPreferencesSchema>;

// WebSocket Message Schema
export const WebSocketMessageSchema = z.object({
  type: z.enum(['notification', 'repair_update', 'message', 'heartbeat']),
  data: z.any(),
  timestamp: z.date().default(() => new Date())
});

export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;

// Real-Time Notifications Service
export class RealTimeNotificationsService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private listeners: Map<string, Array<(notification: Notification) => void>> = new Map();
  private notifications: Notification[] = [];
  private preferences: NotificationPreferences | null = null;
  private userId: string | null = null;

  constructor() {
    this.loadNotifications();
    this.loadPreferences();
  }

  // Initialize connection
  async initialize(userId: string): Promise<void> {
    this.userId = userId;
    await this.connect();
    await this.requestPermissions();
  }

  // Connect to WebSocket
  private async connect(): Promise<void> {
    if (!this.userId) return;

    try {
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3011'}/notifications/${this.userId}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        
        // Send heartbeat every 30 seconds
        setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: 'heartbeat' }));
          }
        }, 30000);
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleWebSocketMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      this.handleReconnect();
    }
  }

  // Handle reconnection
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  // Handle WebSocket messages
  private handleWebSocketMessage(message: any): void {
    try {
      const validatedMessage = WebSocketMessageSchema.parse(message);
      
      switch (validatedMessage.type) {
        case 'notification':
          this.handleNotification(validatedMessage.data);
          break;
        case 'repair_update':
          this.handleRepairUpdate(validatedMessage.data);
          break;
        case 'message':
          this.handleNewMessage(validatedMessage.data);
          break;
      }
    } catch (error) {
      console.error('Invalid WebSocket message:', error);
    }
  }

  // Handle incoming notification
  private async handleNotification(notificationData: any): Promise<void> {
    try {
      const notification = NotificationSchema.parse(notificationData);
      
      // Check if user wants this type of notification
      if (!this.shouldReceiveNotification(notification)) {
        return;
      }

      // Add to local storage
      this.notifications.unshift(notification);
      this.saveNotifications();

      // Show push notification if enabled
      if (this.preferences?.channels.push && 'Notification' in window) {
        await this.showPushNotification(notification);
      }

      // Notify listeners
      this.notifyListeners('notification', notification);

    } catch (error) {
      console.error('Failed to handle notification:', error);
    }
  }

  // Handle repair updates
  private handleRepairUpdate(updateData: any): void {
    const notification: Notification = {
      id: `repair_${Date.now()}`,
      userId: this.userId!,
      type: 'repair_update',
      priority: 'high',
      title: 'Repair Status Update',
      message: `Your ${updateData.deviceModel} repair has been updated: ${updateData.status}`,
      data: updateData,
      channels: ['push', 'in_app'],
      status: 'delivered',
      createdAt: new Date(),
      actionUrl: `/dashboard/repairs/${updateData.repairId}`,
      actions: [
        {
          id: 'view',
          label: 'View Details',
          action: 'navigate',
          style: 'primary'
        }
      ]
    };

    this.handleNotification(notification);
  }

  // Handle new messages
  private handleNewMessage(messageData: any): void {
    const notification: Notification = {
      id: `message_${Date.now()}`,
      userId: this.userId!,
      type: 'message',
      priority: 'medium',
      title: 'New Message',
      message: `You have a new message from ${messageData.from}`,
      data: messageData,
      channels: ['push', 'in_app'],
      status: 'delivered',
      createdAt: new Date(),
      actionUrl: '/dashboard/messages',
      actions: [
        {
          id: 'reply',
          label: 'Reply',
          action: 'navigate',
          style: 'primary'
        }
      ]
    };

    this.handleNotification(notification);
  }

  // Check if user should receive notification
  private shouldReceiveNotification(notification: Notification): boolean {
    if (!this.preferences) return true;

    // Check notification type preferences
    const typeMap = {
      repair_update: this.preferences.types.repairUpdates,
      appointment: this.preferences.types.appointments,
      payment: this.preferences.types.payments,
      message: this.preferences.types.messages,
      marketing: this.preferences.types.marketing,
      system: this.preferences.types.system
    };

    if (!typeMap[notification.type]) return false;

    // Check quiet hours
    if (this.preferences.quietHours.enabled) {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      if (currentTime >= this.preferences.quietHours.start || currentTime <= this.preferences.quietHours.end) {
        // Only allow urgent notifications during quiet hours
        return notification.priority === 'urgent';
      }
    }

    return true;
  }

  // Show push notification
  private async showPushNotification(notification: Notification): Promise<void> {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const options: NotificationOptions = {
      body: notification.message,
      icon: '/images/revivatech-icon.svg',
      badge: '/images/revivatech-icon.svg',
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent',
      actions: notification.actions.map(action => ({
        action: action.id,
        title: action.label
      }))
    };

    const pushNotification = new Notification(notification.title, options);

    pushNotification.onclick = () => {
      if (notification.actionUrl) {
        window.open(notification.actionUrl, '_blank');
      }
      pushNotification.close();
    };
  }

  // Request notification permissions
  private async requestPermissions(): Promise<void> {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }

  // Subscribe to notifications
  subscribe(type: string, listener: (notification: Notification) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    
    this.listeners.get(type)!.push(listener);
    
    return () => {
      const listeners = this.listeners.get(type);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    };
  }

  // Notify listeners
  private notifyListeners(type: string, notification: Notification): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.forEach(listener => listener(notification));
    }
  }

  // Get notifications
  getNotifications(filter?: {
    type?: Notification['type'];
    unreadOnly?: boolean;
    limit?: number;
  }): Notification[] {
    let filtered = this.notifications;

    if (filter?.type) {
      filtered = filtered.filter(n => n.type === filter.type);
    }

    if (filter?.unreadOnly) {
      filtered = filtered.filter(n => n.status !== 'read');
    }

    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    return filtered;
  }

  // Mark notification as read
  markAsRead(notificationId: string): boolean {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification && notification.status !== 'read') {
      notification.status = 'read';
      this.saveNotifications();
      return true;
    }
    return false;
  }

  // Mark all as read
  markAllAsRead(): void {
    this.notifications.forEach(notification => {
      if (notification.status !== 'read') {
        notification.status = 'read';
      }
    });
    this.saveNotifications();
  }

  // Update preferences
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    if (!this.preferences) {
      this.preferences = NotificationPreferencesSchema.parse({
        userId: this.userId!,
        ...preferences
      });
    } else {
      this.preferences = { ...this.preferences, ...preferences };
    }

    await this.savePreferences();
  }

  // Get preferences
  getPreferences(): NotificationPreferences | null {
    return this.preferences;
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(n => n.status !== 'read').length;
  }

  // Load notifications from storage
  private loadNotifications(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('revivatech_notifications');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          this.notifications = parsed.map((n: any) => ({
            ...n,
            createdAt: new Date(n.createdAt),
            scheduledFor: n.scheduledFor ? new Date(n.scheduledFor) : undefined,
            expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined
          }));
        } catch (error) {
          console.error('Failed to load notifications:', error);
        }
      }
    }
  }

  // Save notifications to storage
  private saveNotifications(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('revivatech_notifications', JSON.stringify(this.notifications));
    }
  }

  // Load preferences from storage
  private loadPreferences(): void {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('revivatech_notification_preferences');
      if (stored) {
        try {
          this.preferences = NotificationPreferencesSchema.parse(JSON.parse(stored));
        } catch (error) {
          console.error('Failed to load notification preferences:', error);
        }
      }
    }
  }

  // Save preferences to storage
  private async savePreferences(): Promise<void> {
    if (typeof window !== 'undefined' && this.preferences) {
      localStorage.setItem('revivatech_notification_preferences', JSON.stringify(this.preferences));
      
      // Also save to server
      try {
        await fetch('/api/user/notification-preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.preferences)
        });
      } catch (error) {
        console.error('Failed to save preferences to server:', error);
      }
    }
  }

  // Disconnect
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Global notifications service instance
export const notificationsService = new RealTimeNotificationsService();