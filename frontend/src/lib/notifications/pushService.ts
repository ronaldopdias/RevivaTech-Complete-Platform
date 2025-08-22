'use client';

// RevivaTech Push Notification Service
// Phase 6: Mobile PWA Enhancement - Complete push notification implementation

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  timestamp?: number;
}

export interface PushSubscriptionInfo {
  id: string;
  userId?: string;
  deviceType?: string;
  isActive: boolean;
  createdAt: Date;
}

class PushNotificationService {
  private vapidPublicKey: string | null = null;
  private currentSubscription: PushSubscription | null = null;
  private subscriptionId: string | null = null;
  private isInitialized = false;

  async initialize(): Promise<boolean> {
    try {

      // Check if service worker and push notifications are supported
      if (!this.isSupported()) {
        console.warn('📱 PushService: Push notifications not supported');
        return false;
      }

      // Get VAPID public key from server
      await this.loadVapidKey();
      
      // Check for existing subscription
      await this.checkExistingSubscription();

      this.isInitialized = true;
      console.log('📱 PushService: Initialized successfully');
      return true;
    } catch (error) {
      console.error('📱 PushService: Initialization failed:', error);
      return false;
    }
  }

  isSupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  }

  async getPermissionStatus(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        console.warn('📱 PushService: Push notifications not supported');
        return false;
      }

      const permission = await Notification.requestPermission();
      console.log('📱 PushService: Permission result:', permission);
      
      if (permission === 'granted') {
        // Automatically subscribe when permission is granted
        await this.subscribe();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('📱 PushService: Permission request failed:', error);
      return false;
    }
  }

  async subscribe(userId?: string): Promise<string | null> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      if (!this.vapidPublicKey) {
        throw new Error('VAPID public key not loaded');
      }

      const permission = await this.getPermissionStatus();
      if (permission !== 'granted') {
        console.warn('📱 PushService: Permission not granted');
        return null;
      }

      // Register service worker if not already registered
      const registration = await this.getServiceWorkerRegistration();
      if (!registration) {
        throw new Error('Service worker not available');
      }

      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      console.log('📱 PushService: Browser subscription created');

      // Send subscription to server
      const response = await fetch('/api/push-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'subscribe',
          data: {
            subscription: subscription.toJSON(),
            userId: userId || 'anonymous',
            deviceType: this.detectDeviceType(),
            timestamp: new Date().toISOString()
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Subscription failed: ${response.statusText}`);
      }

      const result = await response.json();
      this.currentSubscription = subscription;
      this.subscriptionId = result.subscriptionId;

      // Store subscription info locally
      localStorage.setItem('push-subscription-id', this.subscriptionId);
      localStorage.setItem('push-enabled', 'true');

      console.log(`📱 PushService: Subscribed successfully (${result.subscriptionId})`);
      
      // Send welcome notification
      await this.sendTestNotification();

      return this.subscriptionId;
    } catch (error) {
      console.error('📱 PushService: Subscription failed:', error);
      return null;
    }
  }

  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.currentSubscription || !this.subscriptionId) {
        console.warn('📱 PushService: No active subscription to unsubscribe');
        return false;
      }

      // Unsubscribe from browser
      await this.currentSubscription.unsubscribe();

      // Notify server
      const response = await fetch('/api/push-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'unsubscribe',
          data: {
            subscriptionId: this.subscriptionId
          }
        })
      });

      if (response.ok) {
        console.log('📱 PushService: Unsubscribed successfully');
      }

      // Clear local state
      this.currentSubscription = null;
      this.subscriptionId = null;
      localStorage.removeItem('push-subscription-id');
      localStorage.removeItem('push-enabled');

      return true;
    } catch (error) {
      console.error('📱 PushService: Unsubscribe failed:', error);
      return false;
    }
  }

  async isSubscribed(): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        return false;
      }

      const registration = await this.getServiceWorkerRegistration();
      if (!registration) {
        return false;
      }

      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('📱 PushService: Error checking subscription:', error);
      return false;
    }
  }

  async sendTestNotification(): Promise<boolean> {
    try {
      if (!this.subscriptionId) {
        console.warn('📱 PushService: No subscription ID for test notification');
        return false;
      }

      const response = await fetch('/api/push-notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'test-notification',
          data: {
            subscriptionId: this.subscriptionId
          }
        })
      });

      const result = await response.json();
      if (result.success) {
        console.log('📱 PushService: Test notification sent');
        return true;
      } else {
        console.error('📱 PushService: Test notification failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('📱 PushService: Test notification error:', error);
      return false;
    }
  }

  // Utility methods for notification templates
  createBookingNotification(bookingId: string, deviceName: string, status: string): NotificationPayload {
    const statusMessages = {
      confirmed: {
        title: '✅ Booking Confirmed',
        body: `Your ${deviceName} repair has been scheduled. We'll keep you updated on progress.`
      },
      in_progress: {
        title: '🔧 Repair In Progress',
        body: `Our technicians are now working on your ${deviceName}. Estimated completion soon.`
      },
      completed: {
        title: '🎉 Repair Complete',
        body: `Great news! Your ${deviceName} repair is finished and ready for pickup.`
      },
      ready_for_pickup: {
        title: '📦 Ready for Pickup',
        body: `Your ${deviceName} is repaired and ready for collection. Schedule your pickup now.`
      }
    };

    const message = statusMessages[status as keyof typeof statusMessages] || {
      title: '📱 Booking Update',
      body: `Your ${deviceName} repair status has been updated.`
    };

    return {
      ...message,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: `booking-${bookingId}`,
      data: {
        type: 'booking',
        bookingId,
        status,
        url: `/dashboard/bookings/${bookingId}`
      },
      actions: [
        {
          action: 'view',
          title: 'View Details',
          icon: '/icons/action-view.png'
        },
        {
          action: 'track',
          title: 'Track Progress',
          icon: '/icons/action-track.png'
        }
      ],
      requireInteraction: true,
      vibrate: [200, 100, 200]
    };
  }

  createQuoteNotification(quoteId: string, amount: number): NotificationPayload {
    return {
      title: '💰 Quote Ready',
      body: `Your repair quote of £${amount} is ready for review. Tap to approve or discuss.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      tag: `quote-${quoteId}`,
      data: {
        type: 'quote',
        quoteId,
        amount,
        url: `/dashboard/quotes/${quoteId}`
      },
      actions: [
        {
          action: 'approve',
          title: 'Approve Quote',
          icon: '/icons/action-approve.png'
        },
        {
          action: 'discuss',
          title: 'Discuss',
          icon: '/icons/action-chat.png'
        }
      ],
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200]
    };
  }

  createPromotionNotification(title: string, description: string, code?: string): NotificationPayload {
    return {
      title: `🎉 ${title}`,
      body: description,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-promotion.png',
      tag: `promotion-${Date.now()}`,
      data: {
        type: 'promotion',
        code,
        url: '/services'
      },
      actions: [
        {
          action: 'explore',
          title: 'Explore Offers',
          icon: '/icons/action-explore.png'
        },
        {
          action: 'book',
          title: 'Book Now',
          icon: '/icons/action-book.png'
        }
      ],
      requireInteraction: false,
      vibrate: [100, 50, 100]
    };
  }

  // Private helper methods

  private async loadVapidKey(): Promise<void> {
    try {
      const response = await fetch('/api/push-notifications?action=vapid-public-key');
      const data = await response.json();
      this.vapidPublicKey = data.publicKey;
    } catch (error) {
      console.error('📱 PushService: Failed to load VAPID key:', error);
      throw error;
    }
  }

  private async checkExistingSubscription(): Promise<void> {
    const storedId = localStorage.getItem('push-subscription-id');
    const isEnabled = localStorage.getItem('push-enabled') === 'true';

    if (storedId && isEnabled) {
      this.subscriptionId = storedId;
      
      const registration = await this.getServiceWorkerRegistration();
      if (registration) {
        this.currentSubscription = await registration.pushManager.getSubscription();
      }
      
      console.log('📱 PushService: Existing subscription found:', storedId);
    }
  }

  private async getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration | null> {
    try {
      if ('serviceWorker' in navigator) {
        // Try to get existing registration
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          return registration;
        }

        // Register service worker if not found
        return await navigator.serviceWorker.register('/sw.js');
      }
      return null;
    } catch (error) {
      console.error('📱 PushService: Service worker registration error:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private detectDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('mobile') || userAgent.includes('android')) {
      return 'mobile';
    } else if (userAgent.includes('tablet') || userAgent.includes('ipad')) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }

  // Public API for external use
  getSubscriptionId(): string | null {
    return this.subscriptionId;
  }

  getPermissionStatusSync(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  async getStats(): Promise<any> {
    try {
      const response = await fetch('/api/push-notifications?action=stats');
      return await response.json();
    } catch (error) {
      console.error('📱 PushService: Failed to get stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const pushService = new PushNotificationService();

// React hook for easy integration
import { useEffect, useState } from 'react';

export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializePush = async () => {
      setIsLoading(true);
      
      setIsSupported(pushService.isSupported());
      setPermission(pushService.getPermissionStatusSync());
      
      if (pushService.isSupported()) {
        await pushService.initialize();
        const subscribed = await pushService.isSubscribed();
        setIsSubscribed(subscribed);
      }
      
      setIsLoading(false);
    };

    initializePush();
  }, []);

  const subscribe = async (userId?: string) => {
    const result = await pushService.subscribe(userId);
    if (result) {
      setIsSubscribed(true);
      setPermission('granted');
    }
    return result;
  };

  const unsubscribe = async () => {
    const result = await pushService.unsubscribe();
    if (result) {
      setIsSubscribed(false);
    }
    return result;
  };

  const requestPermission = async () => {
    const granted = await pushService.requestPermission();
    setPermission(pushService.getPermissionStatusSync());
    if (granted) {
      setIsSubscribed(true);
    }
    return granted;
  };

  const sendTest = () => pushService.sendTestNotification();

  return {
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    unsubscribe,
    requestPermission,
    sendTest,
    service: pushService
  };
}