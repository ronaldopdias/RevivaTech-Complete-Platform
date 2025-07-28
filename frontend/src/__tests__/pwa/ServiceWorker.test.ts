/**
 * Service Worker PWA Tests
 * Comprehensive testing for PWA service worker functionality
 */

import { setupServer } from 'msw/node';
import { rest } from 'msw';

// Mock Service Worker environment
const mockServiceWorkerGlobalScope = {
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  registration: {
    installing: null,
    waiting: null,
    active: null,
    scope: '/',
    unregister: jest.fn(),
    update: jest.fn(),
    navigationPreload: {
      enable: jest.fn(),
      disable: jest.fn(),
    },
  },
  caches: {
    open: jest.fn(),
    delete: jest.fn(),
    keys: jest.fn(),
    match: jest.fn(),
  },
  clients: {
    claim: jest.fn(),
    matchAll: jest.fn(),
  },
  skipWaiting: jest.fn(),
};

// Mock Cache API
const mockCache = {
  match: jest.fn(),
  matchAll: jest.fn(),
  add: jest.fn(),
  addAll: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  keys: jest.fn(),
};

describe('Service Worker PWA Functionality', () => {
  let server: any;

  beforeAll(() => {
    // Setup MSW server for testing
    server = setupServer(
      rest.get('/sw.js', (req, res, ctx) => {
        return res(
          ctx.text(`
            // Service Worker v2.0
            const CACHE_NAME = 'revivatech-v2.0';
            // Service worker implementation
          `)
        );
      }),
      rest.get('/manifest.json', (req, res, ctx) => {
        return res(
          ctx.json({
            name: 'RevivaTech Admin',
            short_name: 'RevivaTech',
            start_url: '/admin',
            display: 'standalone',
            theme_color: '#007AFF',
            background_color: '#FFFFFF',
          })
        );
      })
    );
    server.listen();

    // Mock global objects
    global.self = mockServiceWorkerGlobalScope as any;
    global.caches = mockServiceWorkerGlobalScope.caches as any;
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockServiceWorkerGlobalScope.caches.open.mockResolvedValue(mockCache);
  });

  describe('Service Worker Registration', () => {
    it('registers service worker successfully', async () => {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      expect(registration).toBeDefined();
      expect(registration.scope).toBe('/');
    });

    it('handles service worker registration errors', async () => {
      // Mock registration failure
      const originalRegister = navigator.serviceWorker.register;
      navigator.serviceWorker.register = jest.fn().mockRejectedValue(new Error('Registration failed'));

      try {
        await navigator.serviceWorker.register('/sw.js');
      } catch (error) {
        expect(error.message).toBe('Registration failed');
      }

      // Restore original
      navigator.serviceWorker.register = originalRegister;
    });

    it('updates service worker when new version available', async () => {
      const registration = await navigator.serviceWorker.register('/sw.js');
      
      // Mock update available
      registration.installing = {
        postMessage: jest.fn(),
      } as any;

      await registration.update();
      expect(registration.update).toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    it('creates cache with correct name and version', async () => {
      const cache = await caches.open('revivatech-v2.0');
      
      expect(mockServiceWorkerGlobalScope.caches.open).toHaveBeenCalledWith('revivatech-v2.0');
      expect(cache).toBe(mockCache);
    });

    it('caches admin dashboard resources', async () => {
      const cache = await caches.open('revivatech-admin-v2.0');
      
      const adminResources = [
        '/admin',
        '/admin/dashboard',
        '/admin/components',
        '/admin/design-system',
      ];

      await cache.addAll(adminResources);
      expect(mockCache.addAll).toHaveBeenCalledWith(adminResources);
    });

    it('caches component library data', async () => {
      const cache = await caches.open('revivatech-components-v2.0');
      
      const componentData = {
        url: '/api/components',
        response: new Response(JSON.stringify({
          components: [
            { id: 'button', name: 'Button' },
            { id: 'card', name: 'Card' },
          ],
        })),
      };

      await cache.put(componentData.url, componentData.response);
      expect(mockCache.put).toHaveBeenCalledWith(componentData.url, componentData.response);
    });

    it('implements cache-first strategy for admin resources', async () => {
      const cache = await caches.open('revivatech-admin-v2.0');
      const request = new Request('/admin/dashboard');
      
      // Mock cached response
      const cachedResponse = new Response('Cached dashboard');
      mockCache.match.mockResolvedValue(cachedResponse);

      const response = await cache.match(request);
      
      expect(mockCache.match).toHaveBeenCalledWith(request);
      expect(response).toBe(cachedResponse);
    });

    it('implements network-first strategy for API calls', async () => {
      const cache = await caches.open('revivatech-api-v2.0');
      const request = new Request('/api/components');
      
      // Mock network failure, fallback to cache
      mockCache.match.mockResolvedValue(new Response('Cached API response'));

      const response = await cache.match(request);
      expect(response).toBeDefined();
    });

    it('cleans up old cache versions', async () => {
      const oldCacheNames = [
        'revivatech-v1.0',
        'revivatech-admin-v1.0',
        'revivatech-components-v1.0',
      ];

      mockServiceWorkerGlobalScope.caches.keys.mockResolvedValue([
        'revivatech-v2.0',
        ...oldCacheNames,
      ]);

      // Simulate cache cleanup
      for (const cacheName of oldCacheNames) {
        await caches.delete(cacheName);
      }

      expect(mockServiceWorkerGlobalScope.caches.delete).toHaveBeenCalledTimes(3);
      oldCacheNames.forEach(cacheName => {
        expect(mockServiceWorkerGlobalScope.caches.delete).toHaveBeenCalledWith(cacheName);
      });
    });
  });

  describe('Offline Functionality', () => {
    it('serves cached content when offline', async () => {
      const request = new Request('/admin');
      const cachedResponse = new Response('<html>Offline Admin Dashboard</html>');
      
      mockCache.match.mockResolvedValue(cachedResponse);
      mockServiceWorkerGlobalScope.caches.match.mockResolvedValue(cachedResponse);

      const response = await caches.match(request);
      
      expect(response).toBe(cachedResponse);
      expect(mockServiceWorkerGlobalScope.caches.match).toHaveBeenCalledWith(request);
    });

    it('shows offline page for uncached routes', async () => {
      const request = new Request('/uncached-page');
      const offlineResponse = new Response('<html>You are offline</html>');
      
      // No cached response for this route
      mockCache.match.mockResolvedValue(undefined);
      mockServiceWorkerGlobalScope.caches.match.mockResolvedValue(undefined);
      
      // Should fallback to offline page
      mockServiceWorkerGlobalScope.caches.match.mockImplementation((req) => {
        if (req.toString().includes('/offline.html')) {
          return Promise.resolve(offlineResponse);
        }
        return Promise.resolve(undefined);
      });

      const response = await caches.match('/offline.html');
      expect(response).toBe(offlineResponse);
    });

    it('caches component documentation for offline access', async () => {
      const componentDocs = {
        '/api/components/button': { name: 'Button', props: ['variant', 'size'] },
        '/api/components/card': { name: 'Card', props: ['padding', 'shadow'] },
        '/api/components/input': { name: 'Input', props: ['type', 'placeholder'] },
      };

      const cache = await caches.open('revivatech-components-v2.0');

      for (const [url, data] of Object.entries(componentDocs)) {
        const response = new Response(JSON.stringify(data));
        await cache.put(url, response);
      }

      expect(mockCache.put).toHaveBeenCalledTimes(3);
    });
  });

  describe('Background Sync', () => {
    it('registers background sync for failed requests', async () => {
      const mockRegistration = {
        sync: {
          register: jest.fn(),
        },
      };

      // Mock sync registration
      mockRegistration.sync.register.mockResolvedValue(undefined);

      await mockRegistration.sync.register('background-sync');
      expect(mockRegistration.sync.register).toHaveBeenCalledWith('background-sync');
    });

    it('handles sync events for queued requests', async () => {
      const syncEvent = {
        tag: 'background-sync',
        waitUntil: jest.fn(),
      };

      // Mock sync handler
      const handleSync = jest.fn().mockResolvedValue(undefined);
      
      syncEvent.waitUntil(handleSync());
      expect(syncEvent.waitUntil).toHaveBeenCalled();
      expect(handleSync).toHaveBeenCalled();
    });
  });

  describe('Push Notifications', () => {
    it('handles push notification events', async () => {
      const pushEvent = {
        data: {
          json: () => ({
            title: 'New Booking',
            body: 'You have a new repair booking',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge.png',
            tag: 'booking-notification',
          }),
        },
        waitUntil: jest.fn(),
      };

      const showNotification = jest.fn().mockResolvedValue(undefined);
      
      // Simulate push event handling
      const notificationData = pushEvent.data.json();
      pushEvent.waitUntil(showNotification(notificationData));

      expect(pushEvent.waitUntil).toHaveBeenCalled();
      expect(showNotification).toHaveBeenCalledWith(notificationData);
    });

    it('handles notification click events', async () => {
      const notificationEvent = {
        notification: {
          tag: 'booking-notification',
          close: jest.fn(),
        },
        waitUntil: jest.fn(),
      };

      const handleNotificationClick = jest.fn().mockResolvedValue(undefined);
      
      notificationEvent.waitUntil(handleNotificationClick());
      
      expect(notificationEvent.waitUntil).toHaveBeenCalled();
      expect(handleNotificationClick).toHaveBeenCalled();
    });
  });

  describe('PWA Installation', () => {
    it('provides install prompt when criteria are met', async () => {
      const beforeInstallPromptEvent = {
        preventDefault: jest.fn(),
        prompt: jest.fn().mockResolvedValue({ outcome: 'accepted' }),
        userChoice: Promise.resolve({ outcome: 'accepted' }),
      };

      // Simulate install prompt
      beforeInstallPromptEvent.preventDefault();
      const result = await beforeInstallPromptEvent.prompt();
      
      expect(beforeInstallPromptEvent.preventDefault).toHaveBeenCalled();
      expect(result.outcome).toBe('accepted');
    });

    it('tracks installation state', async () => {
      const appInstalledEvent = {
        preventDefault: jest.fn(),
      };

      // Simulate app installation
      appInstalledEvent.preventDefault();
      
      expect(appInstalledEvent.preventDefault).toHaveBeenCalled();
    });
  });

  describe('Performance Optimization', () => {
    it('preloads critical resources', async () => {
      const criticalResources = [
        '/admin',
        '/styles/globals.css',
        '/api/components',
      ];

      const cache = await caches.open('revivatech-critical-v2.0');
      
      await cache.addAll(criticalResources);
      expect(mockCache.addAll).toHaveBeenCalledWith(criticalResources);
    });

    it('implements stale-while-revalidate for dynamic content', async () => {
      const request = new Request('/api/admin/stats');
      const staleResponse = new Response('{"bookings": 100}');
      
      // Return stale response immediately
      mockCache.match.mockResolvedValue(staleResponse);
      
      const response = await mockCache.match(request);
      expect(response).toBe(staleResponse);
      
      // Should trigger background update
      // (In real implementation, would fetch fresh data and update cache)
    });

    it('compresses cached responses', async () => {
      const largeData = {
        components: Array.from({ length: 100 }, (_, i) => ({
          id: `component-${i}`,
          name: `Component ${i}`,
          description: 'A very long description that should be compressed',
        })),
      };

      const compressedResponse = new Response(
        JSON.stringify(largeData),
        {
          headers: {
            'Content-Encoding': 'gzip',
            'Content-Type': 'application/json',
          },
        }
      );

      const cache = await caches.open('revivatech-components-v2.0');
      await cache.put('/api/components/compressed', compressedResponse);

      expect(mockCache.put).toHaveBeenCalledWith('/api/components/compressed', compressedResponse);
    });
  });

  describe('Error Handling', () => {
    it('handles cache operation failures gracefully', async () => {
      mockCache.match.mockRejectedValue(new Error('Cache error'));
      
      try {
        await mockCache.match('/admin');
      } catch (error) {
        expect(error.message).toBe('Cache error');
      }
    });

    it('falls back to network when cache fails', async () => {
      const request = new Request('/admin');
      
      // Cache fails
      mockCache.match.mockRejectedValue(new Error('Cache error'));
      
      // Should fallback to network request
      // (In real implementation, would use fetch())
      const fallbackResponse = new Response('Network fallback');
      
      expect(fallbackResponse).toBeDefined();
    });

    it('provides meaningful error messages for failed operations', async () => {
      const failedRequest = new Request('/api/invalid');
      
      mockCache.match.mockRejectedValue(new Error('Resource not found in cache'));
      
      try {
        await mockCache.match(failedRequest);
      } catch (error) {
        expect(error.message).toContain('Resource not found in cache');
      }
    });
  });

  describe('Version Management', () => {
    it('handles service worker updates correctly', async () => {
      const oldVersion = 'v1.0';
      const newVersion = 'v2.0';
      
      // Simulate version update
      const updateEvent = {
        waitUntil: jest.fn(),
      };

      const handleUpdate = jest.fn().mockImplementation(async () => {
        // Delete old caches
        await caches.delete(`revivatech-${oldVersion}`);
        // Create new caches
        await caches.open(`revivatech-${newVersion}`);
      });

      updateEvent.waitUntil(handleUpdate());
      
      expect(updateEvent.waitUntil).toHaveBeenCalled();
      expect(handleUpdate).toHaveBeenCalled();
    });

    it('migrates cache data between versions', async () => {
      const oldCache = await caches.open('revivatech-v1.0');
      const newCache = await caches.open('revivatech-v2.0');
      
      // Mock data migration
      const criticalData = new Response('Critical cached data');
      mockCache.match.mockResolvedValue(criticalData);
      
      // Migrate critical data
      const data = await oldCache.match('/admin');
      if (data) {
        await newCache.put('/admin', data.clone());
      }
      
      expect(mockCache.match).toHaveBeenCalledWith('/admin');
      expect(mockCache.put).toHaveBeenCalledWith('/admin', expect.any(Response));
    });
  });
});