// RevivaTech Enhanced Service Worker v2.0
// Phase 6: Mobile & PWA Optimization
// Provides intelligent offline functionality, component caching, and background sync

const CACHE_VERSION = 'revivatech-v2-mobile-pwa-auth-fix-26jul';
const COMPONENT_CACHE = 'components-v2';
const DESIGN_SYSTEM_CACHE = 'design-system-v2';
const ADMIN_CACHE = 'admin-v2';
const OFFLINE_URL = '/offline';

// Static files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/offline',
  '/book-repair',
  '/services',
  '/contact',
  '/dashboard',
  '/admin',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-144x144.png'
];

// Component and design system specific URLs
const COMPONENT_URLS = [
  '/admin', // Admin dashboard
  '/_next/static/css/', // Component styles
  '/_next/static/chunks/', // Component JavaScript
];

// Design system assets
const DESIGN_SYSTEM_URLS = [
  '/styles/mobile-optimizations.css',
  '/styles/globals.css'
];

// API endpoints to cache for offline functionality
const API_CACHE_URLS = [
  '/api/devices',
  '/api/categories',
  '/api/services/categories',
  '/api/components', // Component library data
  '/api/health'
];

// Enhanced install event with intelligent caching
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker v2.0: Installing with mobile PWA optimizations...');
  
  event.waitUntil(
    (async () => {
      try {
        // Create multiple cache storage for different content types
        const staticCache = await caches.open(CACHE_VERSION);
        const componentCache = await caches.open(COMPONENT_CACHE);
        const designSystemCache = await caches.open(DESIGN_SYSTEM_CACHE);
        const adminCache = await caches.open(ADMIN_CACHE);
        
        console.log('📦 Service Worker: Caching static resources');
        await staticCache.addAll(STATIC_CACHE_URLS);
        
        console.log('🎨 Service Worker: Caching design system assets');
        for (const url of DESIGN_SYSTEM_URLS) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await designSystemCache.put(url, response.clone());
            }
          } catch (error) {
            console.warn(`Failed to cache design system asset: ${url}`, error);
          }
        }
        
        console.log('🔧 Service Worker: Caching admin dashboard');
        try {
          const adminResponse = await fetch('/admin');
          if (adminResponse.ok) {
            await adminCache.put('/admin', adminResponse.clone());
          }
        } catch (error) {
          console.warn('Failed to cache admin dashboard:', error);
        }
        
        console.log('📡 Service Worker: Caching API endpoints');
        for (const url of API_CACHE_URLS) {
          try {
            const response = await fetch(url);
            if (response.ok) {
              await staticCache.put(url, response.clone());
            }
          } catch (error) {
            console.warn(`Failed to cache API endpoint: ${url}`, error);
          }
        }
        
        // Cache component showcase data
        console.log('📋 Service Worker: Caching component library data');
        try {
          const componentData = {
            timestamp: Date.now(),
            components: [
              {
                id: 'button',
                name: 'Button',
                description: 'Highly configurable button component with multiple variants',
                category: 'ui',
                status: 'stable',
                cached: true
              },
              {
                id: 'card',
                name: 'Card',
                description: 'Flexible card component with slot-based composition',
                category: 'ui', 
                status: 'stable',
                cached: true
              },
              {
                id: 'input',
                name: 'Input',
                description: 'Advanced input component with validation states',
                category: 'forms',
                status: 'stable', 
                cached: true
              }
            ]
          };
          
          const componentResponse = new Response(JSON.stringify(componentData), {
            headers: { 'Content-Type': 'application/json' }
          });
          await componentCache.put('/api/components/cached', componentResponse);
        } catch (error) {
          console.warn('Failed to cache component data:', error);
        }
        
        console.log('✅ Service Worker v2.0: Installation complete with enhanced caching');
      } catch (error) {
        console.error('❌ Service Worker: Installation failed', error);
      }
    })()
  );
  
  // Force waiting service worker to become active
  self.skipWaiting();
});

// Enhanced activate event with intelligent cache cleanup
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker v2.0: Activating with mobile PWA optimizations...');
  
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        
        // Clean up old caches but preserve current version caches
        const validCaches = [CACHE_VERSION, COMPONENT_CACHE, DESIGN_SYSTEM_CACHE, ADMIN_CACHE];
        const oldCaches = cacheNames.filter(name => 
          !validCaches.includes(name) && (
            name.startsWith('revivatech-') || 
            name.startsWith('components-') || 
            name.startsWith('design-system-') ||
            name.startsWith('admin-')
          )
        );
        
        await Promise.all(
          oldCaches.map(name => {
            console.log(`🗑️ Service Worker: Deleting old cache: ${name}`);
            return caches.delete(name);
          })
        );
        
        // Notify clients about update
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: 'v2.0-mobile-pwa',
            features: [
              'Enhanced mobile experience', 
              'Offline component access',
              'Improved caching strategy',
              'Better PWA functionality'
            ]
          });
        });
        
        console.log('✅ Service Worker v2.0: Activation complete');
      } catch (error) {
        console.error('❌ Service Worker: Activation failed', error);
      }
    })()
  );
  
  // Take control of all clients immediately
  self.clients.claim();
});

// Enhanced fetch event with intelligent caching strategies
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension and other non-http requests
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    (async () => {
      try {
        const url = new URL(event.request.url);
        
        // Strategy 1: Admin Dashboard - Cache-first for better mobile performance
        if (url.pathname.startsWith('/admin')) {
          console.log('📱 Service Worker: Handling admin dashboard request');
          
          // Try cache first for admin dashboard
          const adminCache = await caches.open(ADMIN_CACHE);
          const cachedResponse = await adminCache.match(event.request);
          
          if (cachedResponse) {
            console.log('📱 Service Worker: Serving cached admin dashboard');
            
            // Update cache in background
            fetch(event.request).then(response => {
              if (response.ok) {
                adminCache.put(event.request, response.clone());
              }
            }).catch(error => console.log('Background update failed:', error));
            
            return cachedResponse;
          }
          
          // Fallback to network
          try {
            const networkResponse = await fetch(event.request);
            if (networkResponse.ok) {
              adminCache.put(event.request, networkResponse.clone());
              return networkResponse;
            }
          } catch (error) {
            console.log('📱 Service Worker: Network failed, serving offline page');
            return caches.match(OFFLINE_URL);
          }
        }
        
        // Strategy 2: Component Library API - Network-first with offline fallback
        if (event.request.url.includes('/api/components')) {
          console.log('📋 Service Worker: Handling component API request');
          
          try {
            const networkResponse = await fetch(event.request);
            if (networkResponse.ok) {
              // Cache successful component API responses
              const componentCache = await caches.open(COMPONENT_CACHE);
              componentCache.put(event.request, networkResponse.clone());
              return networkResponse;
            }
          } catch (error) {
            // Network failed, try component cache
            const componentCache = await caches.open(COMPONENT_CACHE);
            const cachedResponse = await componentCache.match(event.request);
            
            if (cachedResponse) {
              console.log('📋 Service Worker: Serving cached component data');
              return cachedResponse;
            }
            
            // Fallback to cached component data
            const offlineComponentData = await componentCache.match('/api/components/cached');
            if (offlineComponentData) {
              console.log('📋 Service Worker: Serving offline component library');
              return offlineComponentData;
            }
          }
        }
        
        // Strategy 3: Design System Assets - Cache-first
        if (DESIGN_SYSTEM_URLS.some(url => event.request.url.includes(url.replace('/', '')))) {
          console.log('🎨 Service Worker: Handling design system asset');
          
          const designSystemCache = await caches.open(DESIGN_SYSTEM_CACHE);
          const cachedResponse = await designSystemCache.match(event.request);
          
          if (cachedResponse) {
            return cachedResponse;
          }
          
          try {
            const networkResponse = await fetch(event.request);
            if (networkResponse.ok) {
              designSystemCache.put(event.request, networkResponse.clone());
              return networkResponse;
            }
          } catch (error) {
            console.warn('Failed to fetch design system asset:', error);
          }
        }
        
        // Strategy 4: General API endpoints - Network-first
        if (event.request.url.includes('/api/')) {
          try {
            const networkResponse = await fetch(event.request);
            if (networkResponse.ok) {
              // Cache successful API responses
              const cache = await caches.open(CACHE_VERSION);
              cache.put(event.request, networkResponse.clone());
              return networkResponse;
            }
          } catch (error) {
            // Network failed, try cache
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
              console.log(`📱 Service Worker: Serving cached API response: ${event.request.url}`);
              return cachedResponse;
            }
          }
        }
        
        // For navigation requests, try network first, then cache, then offline page
        if (event.request.mode === 'navigate') {
          try {
            const networkResponse = await fetch(event.request);
            return networkResponse;
          } catch (error) {
            const cachedResponse = await caches.match(event.request);
            if (cachedResponse) {
              console.log(`📱 Service Worker: Serving cached page: ${event.request.url}`);
              return cachedResponse;
            }
            
            // Show offline page
            console.log(`📱 Service Worker: Serving offline page for: ${event.request.url}`);
            return caches.match(OFFLINE_URL);
          }
        }
        
        // For other requests (assets, etc.), try cache first, then network
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }
        
        const networkResponse = await fetch(event.request);
        
        // Cache successful responses for future use
        if (networkResponse.ok && event.request.url.startsWith(self.location.origin)) {
          const cache = await caches.open(CACHE_VERSION);
          cache.put(event.request, networkResponse.clone());
        }
        
        return networkResponse;
        
      } catch (error) {
        console.error(`❌ Service Worker: Fetch failed for ${event.request.url}`, error);
        
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match(OFFLINE_URL);
        }
        
        throw error;
      }
    })()
  );
});

// Background Sync - queue actions when offline
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-booking') {
    event.waitUntil(syncBookings());
  }
  
  if (event.tag === 'background-messages') {
    event.waitUntil(syncMessages());
  }
});

// Enhanced booking sync with retry logic and error handling
async function syncBookings() {
  try {
    console.log('📋 Service Worker: Syncing pending bookings...');
    
    const pendingBookings = await getPendingBookings();
    console.log(`Found ${pendingBookings.length} pending bookings`);
    
    for (const booking of pendingBookings) {
      // Skip if too many retries
      if (booking.retryCount >= 3) {
        console.warn(`Skipping booking ${booking.id} - max retries exceeded`);
        continue;
      }
      
      // Skip if recently failed (exponential backoff)
      const backoffDelay = Math.pow(2, booking.retryCount) * 60000; // 1min, 2min, 4min
      if (booking.lastRetry && Date.now() - booking.lastRetry < backoffDelay) {
        console.log(`Skipping booking ${booking.id} - backoff period`);
        continue;
      }
      
      try {
        await updateBookingStatus(booking.id, 'syncing');
        
        // Prepare booking data with photo handling
        const bookingData = { ...booking.data };
        
        // Handle photo uploads if present
        if (bookingData.photos && bookingData.photos.length > 0) {
          const photoUploadPromises = bookingData.photos.map(async (photo, index) => {
            if (photo.startsWith('data:')) {
              // Convert base64 to blob and upload
              const response = await fetch(photo);
              const blob = await response.blob();
              
              const formData = new FormData();
              formData.append('photo', blob, `device-photo-${index}.jpg`);
              formData.append('bookingId', booking.id);
              
              const uploadResponse = await fetch('/api/upload/photo', {
                method: 'POST',
                body: formData
              });
              
              if (uploadResponse.ok) {
                const result = await uploadResponse.json();
                return result.url;
              }
              throw new Error('Photo upload failed');
            }
            return photo; // Already uploaded URL
          });
          
          try {
            bookingData.photos = await Promise.all(photoUploadPromises);
          } catch (photoError) {
            console.warn('Photo upload failed, proceeding without photos:', photoError);
            bookingData.photos = [];
          }
        }
        
        // Submit booking
        const response = await fetch('/api/bookings', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'X-Sync-Request': 'true',
            'X-Client-Id': booking.id
          },
          body: JSON.stringify({
            ...bookingData,
            syncId: booking.id,
            offlineTimestamp: booking.timestamp
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          await removePendingBooking(booking.id);
          
          console.log('✅ Service Worker: Booking synced successfully:', result.id);
          
          // Show success notification with booking details
          await self.registration.showNotification('Booking Confirmed! 🎉', {
            body: `Your ${bookingData.device?.name || 'device'} repair has been scheduled. Booking ID: ${result.bookingNumber}`,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            tag: `booking-success-${booking.id}`,
            data: {
              bookingId: result.id,
              url: `/dashboard/bookings/${result.id}`,
              notificationId: `booking-sync-${booking.id}`
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
            vibrate: [200, 100, 200, 100, 200]
          });
          
          // Track successful sync
          await trackSyncEvent('booking-sync-success', {
            bookingId: result.id,
            offlineTime: Date.now() - booking.timestamp,
            retryCount: booking.retryCount
          });
          
        } else {
          const errorText = await response.text();
          console.error('❌ Service Worker: Booking sync failed:', response.status, errorText);
          
          await updateBookingStatus(booking.id, 'failed');
          
          // Show error notification for final failure
          if (booking.retryCount >= 2) {
            await self.registration.showNotification('Booking Sync Failed', {
              body: 'Unable to submit your booking. Please check your connection and try again.',
              icon: '/icons/icon-192x192.png',
              badge: '/icons/badge-error.png',
              tag: `booking-error-${booking.id}`,
              data: {
                bookingId: booking.id,
                url: '/book-repair?retry=true'
              },
              actions: [
                {
                  action: 'retry',
                  title: 'Retry Now',
                  icon: '/icons/action-retry.png'
                },
                {
                  action: 'contact',
                  title: 'Contact Support',
                  icon: '/icons/action-support.png'
                }
              ]
            });
          }
        }
        
      } catch (networkError) {
        console.error('❌ Service Worker: Network error syncing booking:', networkError);
        await updateBookingStatus(booking.id, 'failed');
        
        // Track sync failure
        await trackSyncEvent('booking-sync-error', {
          bookingId: booking.id,
          error: networkError.message,
          retryCount: booking.retryCount
        });
      }
    }
    
    console.log('✅ Service Worker: Booking sync completed');
    
  } catch (error) {
    console.error('❌ Service Worker: Background sync failed', error);
    throw error;
  }
}

// Track sync events for analytics
async function trackSyncEvent(event, data) {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['sync-queue'], 'readwrite');
    const store = transaction.objectStore('sync-queue');
    
    const analyticsEvent = {
      id: `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'analytics',
      data: {
        event,
        ...data,
        timestamp: Date.now(),
        userAgent: navigator.userAgent
      },
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
      maxRetries: 3
    };
    
    store.add(analyticsEvent);
  } catch (error) {
    console.warn('Failed to track sync event:', error);
  }
}

// Sync pending messages when back online
async function syncMessages() {
  try {
    console.log('💬 Service Worker: Syncing pending messages...');
    // Implementation for message syncing
  } catch (error) {
    console.error('❌ Service Worker: Message sync failed', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('🔔 Service Worker: Push message received');
  
  let notificationData = {
    title: 'RevivaTech',
    body: 'You have a new update',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      url: '/dashboard'
    },
    actions: []
  };
  
  // Parse notification data
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        title: data.title || notificationData.title,
        body: data.body || data.message || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        image: data.image,
        tag: data.tag || `revivatech-${Date.now()}`,
        requireInteraction: data.requireInteraction || false,
        silent: data.silent || false,
        vibrate: data.vibrate || notificationData.vibrate,
        timestamp: data.timestamp || Date.now(),
        data: {
          ...notificationData.data,
          ...data.data,
          notificationId: data.notificationId,
          bookingId: data.bookingId,
          url: data.data?.url || data.url || notificationData.data.url
        }
      };

      // Add custom actions if provided
      if (data.actions && Array.isArray(data.actions)) {
        notificationData.actions = data.actions.map(action => ({
          action: action.action || action.id,
          title: action.title || action.label,
          icon: action.icon
        }));
      } else {
        // Default actions based on notification type
        notificationData.actions = [
          {
            action: 'view',
            title: 'View Details',
            icon: '/icons/action-view.png'
          },
          {
            action: 'dismiss',
            title: 'Dismiss',
            icon: '/icons/action-close.png'
          }
        ];
      }
    } catch (error) {
      console.error('Error parsing push notification data:', error);
    }
  }
  
  event.waitUntil(
    (async () => {
      try {
        await self.registration.showNotification(notificationData.title, notificationData);
        
        // Track notification delivery
        if (notificationData.data.notificationId) {
          await trackNotificationEvent(
            notificationData.data.notificationId,
            'delivered',
            notificationData.data
          );
        }
      } catch (error) {
        console.error('Failed to show notification:', error);
      }
    })()
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Notification clicked:', event);
  
  const notificationData = event.notification.data || {};
  const action = event.action;
  
  event.notification.close();
  
  // Track notification click
  if (notificationData.notificationId) {
    trackNotificationEvent(
      notificationData.notificationId,
      'clicked',
      { action, ...notificationData }
    );
  }
  
  event.waitUntil(
    (async () => {
      try {
        let targetUrl = '/dashboard';
        
        // Handle different actions
        switch (action) {
          case 'view':
          case 'explore':
            targetUrl = notificationData.url || '/dashboard';
            break;
          case 'approve':
            targetUrl = `/dashboard?action=approve&booking=${notificationData.bookingId}`;
            break;
          case 'decline':
            targetUrl = `/dashboard?action=decline&booking=${notificationData.bookingId}`;
            break;
          case 'pay-now':
            targetUrl = `/payment?booking=${notificationData.bookingId}`;
            break;
          case 'track':
            targetUrl = `/dashboard/repairs/${notificationData.bookingId}`;
            break;
          case 'schedule-pickup':
            targetUrl = `/dashboard/schedule-pickup?booking=${notificationData.bookingId}`;
            break;
          case 'dismiss':
            // Just dismiss the notification
            return;
          default:
            // Default action - open relevant page
            targetUrl = notificationData.url || '/dashboard';
        }
        
        // Try to focus existing window first
        const windowClients = await clients.matchAll({ type: 'window' });
        const existingClient = windowClients.find(client => 
          client.url.includes(self.location.origin)
        );
        
        if (existingClient) {
          await existingClient.focus();
          // Navigate to target URL
          existingClient.postMessage({
            type: 'NAVIGATE',
            url: targetUrl,
            notificationData
          });
        } else {
          // Open new window
          await clients.openWindow(targetUrl);
        }
      } catch (error) {
        console.error('Error handling notification click:', error);
        // Fallback to opening dashboard
        await clients.openWindow('/dashboard');
      }
    })()
  );
});

// Message handling between service worker and main thread
self.addEventListener('message', (event) => {
  console.log('💬 Service Worker: Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  
  if (event.data.type === 'CACHE_BOOKING') {
    event.waitUntil(cachePendingBooking(event.data.booking));
  }
});

// Enhanced IndexedDB operations with proper implementation
async function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('revivatech-offline', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('offline-bookings')) {
        const bookingStore = db.createObjectStore('offline-bookings', { keyPath: 'id' });
        bookingStore.createIndex('status', 'status', { unique: false });
        bookingStore.createIndex('timestamp', 'timestamp', { unique: false });
      }
      
      if (!db.objectStoreNames.contains('sync-queue')) {
        const syncStore = db.createObjectStore('sync-queue', { keyPath: 'id' });
        syncStore.createIndex('type', 'type', { unique: false });
        syncStore.createIndex('status', 'status', { unique: false });
      }
    };
  });
}

async function getPendingBookings() {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['offline-bookings'], 'readonly');
    const store = transaction.objectStore('offline-bookings');
    const index = store.index('status');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll('pending');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to get pending bookings:', error);
    return [];
  }
}

async function removePendingBooking(id) {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['offline-bookings'], 'readwrite');
    const store = transaction.objectStore('offline-bookings');
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log(`✅ Removed pending booking: ${id}`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to remove pending booking:', error);
  }
}

async function updateBookingStatus(id, status) {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['offline-bookings'], 'readwrite');
    const store = transaction.objectStore('offline-bookings');
    
    return new Promise((resolve, reject) => {
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const booking = getRequest.result;
        if (booking) {
          booking.status = status;
          booking.lastRetry = Date.now();
          if (status === 'failed') {
            booking.retryCount = (booking.retryCount || 0) + 1;
          }
          
          const putRequest = store.put(booking);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Booking not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (error) {
    console.error('Failed to update booking status:', error);
  }
}

async function cachePendingBooking(booking) {
  try {
    const db = await openOfflineDB();
    const transaction = db.transaction(['offline-bookings'], 'readwrite');
    const store = transaction.objectStore('offline-bookings');
    
    const offlineBooking = {
      id: `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
      data: booking
    };
    
    return new Promise((resolve, reject) => {
      const request = store.add(offlineBooking);
      request.onsuccess = () => {
        console.log('📱 Cached pending booking:', offlineBooking.id);
        resolve(offlineBooking.id);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Failed to cache pending booking:', error);
    throw error;
  }
}

// Track notification events for analytics
async function trackNotificationEvent(notificationId, eventType, metadata = {}) {
  if (!notificationId) return;
  
  try {
    await fetch('/api/notifications/analytics', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'track-event',
        data: {
          notificationId,
          userId: metadata.userId || 'unknown',
          eventType,
          timestamp: new Date().toISOString(),
          metadata
        }
      })
    });
  } catch (error) {
    console.error('Failed to track notification event:', error);
  }
}

console.log('🚀 Service Worker: RevivaTech SW loaded successfully');