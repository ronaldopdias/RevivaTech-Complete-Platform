/**
 * Unit Tests for Push Notification Service
 * Tests push notification functionality, subscription management, and analytics
 */

import { PushNotificationService } from '@/lib/services/pushNotificationService';
import { NotificationAnalyticsService } from '@/lib/services/notificationAnalyticsService';

// Mock dependencies
jest.mock('@/lib/services/notificationAnalyticsService');
jest.mock('@/lib/prisma/client');

describe('PushNotificationService', () => {
  let service: PushNotificationService;
  let mockAnalytics: jest.Mocked<NotificationAnalyticsService>;
  let mockServiceWorker: jest.Mocked<ServiceWorkerRegistration>;
  let mockPushManager: jest.Mocked<PushManager>;
  let mockPushSubscription: jest.Mocked<PushSubscription>;

  beforeEach(() => {
    // Mock service worker
    mockPushSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/test',
      options: { userVisibleOnly: true },
      getKey: jest.fn(),
      toJSON: jest.fn(() => ({
        endpoint: 'https://fcm.googleapis.com/fcm/send/test',
        keys: {
          p256dh: 'test-p256dh',
          auth: 'test-auth'
        }
      })),
      unsubscribe: jest.fn()
    } as any;

    mockPushManager = {
      subscribe: jest.fn().mockResolvedValue(mockPushSubscription),
      getSubscription: jest.fn().mockResolvedValue(mockPushSubscription),
      permissionState: jest.fn().mockResolvedValue('granted'),
      supportedContentEncodings: ['aes128gcm']
    } as any;

    mockServiceWorker = {
      pushManager: mockPushManager,
      active: { postMessage: jest.fn() },
      installing: null,
      waiting: null,
      scope: 'http://localhost:3010/',
      unregister: jest.fn(),
      update: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn()
    } as any;

    // Mock analytics service
    mockAnalytics = {
      trackNotificationSent: jest.fn(),
      trackNotificationDelivered: jest.fn(),
      trackNotificationClicked: jest.fn(),
      trackNotificationDismissed: jest.fn(),
      getNotificationMetrics: jest.fn(),
      getEngagementRates: jest.fn(),
      getDeliveryRates: jest.fn()
    } as any;

    // Mock global objects
    global.navigator = {
      serviceWorker: {
        register: jest.fn().mockResolvedValue(mockServiceWorker),
        ready: Promise.resolve(mockServiceWorker),
        getRegistration: jest.fn().mockResolvedValue(mockServiceWorker),
        controller: null,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      },
      permissions: {
        query: jest.fn().mockResolvedValue({ state: 'granted' })
      }
    } as any;

    global.Notification = {
      permission: 'granted',
      requestPermission: jest.fn().mockResolvedValue('granted'),
      prototype: {
        close: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      }
    } as any;

    service = new PushNotificationService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('initializes service worker and push manager', async () => {
      await service.initialize();
      
      expect(global.navigator.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
      expect(service.isSupported()).toBe(true);
    });

    test('handles service worker registration failure', async () => {
      const error = new Error('Service Worker registration failed');
      global.navigator.serviceWorker.register = jest.fn().mockRejectedValue(error);
      
      await expect(service.initialize()).rejects.toThrow(error);
    });

    test('detects push notification support', () => {
      expect(service.isSupported()).toBe(true);
      
      // Test unsupported environment
      delete (global.navigator as any).serviceWorker;
      expect(service.isSupported()).toBe(false);
    });
  });

  describe('Permission Management', () => {
    test('requests notification permission', async () => {
      const permission = await service.requestPermission();
      
      expect(global.Notification.requestPermission).toHaveBeenCalled();
      expect(permission).toBe('granted');
    });

    test('handles permission denial', async () => {
      global.Notification.requestPermission = jest.fn().mockResolvedValue('denied');
      
      const permission = await service.requestPermission();
      expect(permission).toBe('denied');
    });

    test('checks current permission status', () => {
      expect(service.getPermissionStatus()).toBe('granted');
      
      global.Notification.permission = 'denied';
      expect(service.getPermissionStatus()).toBe('denied');
    });
  });

  describe('Subscription Management', () => {
    test('subscribes to push notifications', async () => {
      await service.initialize();
      
      const subscription = await service.subscribe('test-user-123');
      
      expect(mockPushManager.subscribe).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: expect.any(String)
      });
      expect(subscription).toBe(mockPushSubscription);
    });

    test('handles subscription failure', async () => {
      await service.initialize();
      const error = new Error('Subscription failed');
      mockPushManager.subscribe = jest.fn().mockRejectedValue(error);
      
      await expect(service.subscribe('test-user-123')).rejects.toThrow(error);
    });

    test('gets existing subscription', async () => {
      await service.initialize();
      
      const subscription = await service.getSubscription();
      
      expect(mockPushManager.getSubscription).toHaveBeenCalled();
      expect(subscription).toBe(mockPushSubscription);
    });

    test('unsubscribes from push notifications', async () => {
      await service.initialize();
      mockPushSubscription.unsubscribe = jest.fn().mockResolvedValue(true);
      
      const result = await service.unsubscribe();
      
      expect(mockPushSubscription.unsubscribe).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('Push Notification Sending', () => {
    const mockNotification = {
      id: 'test-notification-id',
      title: 'Test Notification',
      body: 'This is a test notification',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      data: { 
        url: '/dashboard',
        bookingId: 'booking-123'
      }
    };

    beforeEach(async () => {
      await service.initialize();
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });
    });

    test('sends push notification to user', async () => {
      await service.sendNotification('test-user-123', mockNotification);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'test-user-123',
          notification: mockNotification
        })
      });
    });

    test('sends push notification to multiple users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      
      await service.sendBulkNotification(userIds, mockNotification);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/push/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userIds,
          notification: mockNotification
        })
      });
    });

    test('handles notification sending failure', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });
      
      await expect(service.sendNotification('test-user-123', mockNotification))
        .rejects.toThrow('Failed to send push notification: 500 Internal Server Error');
    });
  });

  describe('Specialized Notifications', () => {
    beforeEach(async () => {
      await service.initialize();
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });
    });

    test('sends repair status update notification', async () => {
      const statusUpdate = {
        bookingId: 'booking-123',
        status: 'in-progress',
        message: 'Your device repair is now in progress',
        estimatedCompletion: '2024-01-15T14:30:00Z'
      };
      
      await service.sendRepairStatusUpdate('user-123', statusUpdate);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-123',
          notification: {
            title: 'Repair Status Update',
            body: statusUpdate.message,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: {
              type: 'repair_status',
              bookingId: statusUpdate.bookingId,
              status: statusUpdate.status,
              url: '/dashboard'
            }
          }
        })
      });
    });

    test('sends payment confirmation notification', async () => {
      const paymentData = {
        bookingId: 'booking-123',
        amount: 299.99,
        currency: 'GBP',
        paymentMethod: 'card'
      };
      
      await service.sendPaymentConfirmation('user-123', paymentData);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-123',
          notification: {
            title: 'Payment Confirmed',
            body: `Your payment of £299.99 has been confirmed`,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: {
              type: 'payment_confirmation',
              bookingId: paymentData.bookingId,
              amount: paymentData.amount,
              url: '/dashboard'
            }
          }
        })
      });
    });

    test('sends appointment reminder notification', async () => {
      const appointmentData = {
        bookingId: 'booking-123',
        scheduledTime: '2024-01-15T14:30:00Z',
        reminderTime: 30, // minutes
        location: 'RevivaTech Store London'
      };
      
      await service.sendAppointmentReminder('user-123', appointmentData);
      
      expect(global.fetch).toHaveBeenCalledWith('/api/notifications/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-123',
          notification: {
            title: 'Appointment Reminder',
            body: `Your appointment is in 30 minutes at RevivaTech Store London`,
            icon: '/icon-192x192.png',
            badge: '/badge-72x72.png',
            data: {
              type: 'appointment_reminder',
              bookingId: appointmentData.bookingId,
              scheduledTime: appointmentData.scheduledTime,
              url: '/dashboard'
            }
          }
        })
      });
    });
  });

  describe('Analytics Integration', () => {
    beforeEach(async () => {
      await service.initialize();
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });
    });

    test('tracks notification delivery', async () => {
      const notification = {
        id: 'test-notification-id',
        title: 'Test Notification',
        body: 'Test message'
      };
      
      await service.sendNotification('user-123', notification);
      
      // Analytics should be called after successful send
      expect(mockAnalytics.trackNotificationSent).toHaveBeenCalledWith({
        notificationId: notification.id,
        userId: 'user-123',
        type: 'push',
        title: notification.title
      });
    });

    test('tracks notification click events', async () => {
      const clickData = {
        notificationId: 'test-notification-id',
        userId: 'user-123',
        timestamp: Date.now()
      };
      
      await service.trackNotificationClick(clickData);
      
      expect(mockAnalytics.trackNotificationClicked).toHaveBeenCalledWith(clickData);
    });

    test('tracks notification dismissal', async () => {
      const dismissData = {
        notificationId: 'test-notification-id',
        userId: 'user-123',
        timestamp: Date.now()
      };
      
      await service.trackNotificationDismiss(dismissData);
      
      expect(mockAnalytics.trackNotificationDismissed).toHaveBeenCalledWith(dismissData);
    });
  });

  describe('Error Handling', () => {
    test('handles service worker unavailability', async () => {
      delete (global.navigator as any).serviceWorker;
      
      await expect(service.initialize()).rejects.toThrow('Service workers are not supported');
    });

    test('handles push manager unavailability', async () => {
      mockServiceWorker.pushManager = null as any;
      
      await service.initialize();
      await expect(service.subscribe('user-123')).rejects.toThrow('Push messaging is not supported');
    });

    test('handles network failures gracefully', async () => {
      await service.initialize();
      
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));
      
      await expect(service.sendNotification('user-123', {
        title: 'Test',
        body: 'Test message'
      })).rejects.toThrow('Network error');
    });
  });

  describe('Configuration', () => {
    test('uses correct VAPID keys', () => {
      const vapidKey = service.getVapidPublicKey();
      
      expect(vapidKey).toBeTruthy();
      expect(typeof vapidKey).toBe('string');
      expect(vapidKey.length).toBeGreaterThan(80); // Base64 encoded key should be quite long
    });

    test('configures notification defaults', () => {
      const defaults = service.getNotificationDefaults();
      
      expect(defaults).toEqual({
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        requireInteraction: false,
        silent: false,
        vibrate: [100, 50, 100]
      });
    });
  });

  describe('Subscription Validation', () => {
    test('validates subscription before sending', async () => {
      await service.initialize();
      
      // Mock invalid subscription
      mockPushManager.getSubscription = jest.fn().mockResolvedValue(null);
      
      await expect(service.sendNotification('user-123', {
        title: 'Test',
        body: 'Test message'
      })).rejects.toThrow('No active push subscription found');
    });

    test('refreshes expired subscription', async () => {
      await service.initialize();
      
      // Mock expired subscription
      const expiredSubscription = {
        ...mockPushSubscription,
        expirationTime: Date.now() - 1000 // Expired 1 second ago
      };
      
      mockPushManager.getSubscription = jest.fn().mockResolvedValue(expiredSubscription);
      
      await service.refreshSubscription('user-123');
      
      expect(mockPushManager.subscribe).toHaveBeenCalled();
    });
  });
});
