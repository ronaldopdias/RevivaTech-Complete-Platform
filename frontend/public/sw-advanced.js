/**
 * Advanced Service Worker - Multi-strategy caching for RevivaTech
 * Implements cache-first, network-first, and stale-while-revalidate strategies
 */

const CACHE_NAME = 'revivatech-v1';
const STATIC_CACHE = 'revivatech-static-v1';
const API_CACHE = 'revivatech-api-v1';
const IMAGE_CACHE = 'revivatech-images-v1';

// Cache strategies configuration
const CACHE_STRATEGIES = {
  static: 'cache-first',
  api: 'network-first',
  images: 'stale-while-revalidate',
  fonts: 'cache-first',
  css: 'stale-while-revalidate',
  js: 'stale-while-revalidate'
};

// URLs to cache on install
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/images/revivatech-logo.svg',
  '/images/revivatech-icon.svg'
];

// API endpoints to cache
const API_ENDPOINTS = [
  '/api/devices',
  '/api/services',
  '/api/pricing'
];

// Cache duration settings (in seconds)
const CACHE_DURATION = {
  static: 7 * 24 * 60 * 60, // 7 days
  api: 30 * 60, // 30 minutes
  images: 24 * 60 * 60, // 24 hours
  default: 60 * 60 // 1 hour
};

/**
 * Install event - Cache static assets
 */
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then(cache => {
        return cache.addAll(STATIC_ASSETS);
      }),
      
      // Cache API responses
      caches.open(API_CACHE).then(cache => {
        return Promise.all(
          API_ENDPOINTS.map(endpoint => {
            return fetch(endpoint)
              .then(response => {
                if (response.ok) {
                  return cache.put(endpoint, response);
                }
              })
              .catch(error => {
                console.log(`[SW] Failed to cache ${endpoint}:`, error);
              });
          })
        );
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      return self.skipWaiting();
    })
  );
});

/**
 * Activate event - Clean up old caches
 */
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            // Remove old cache versions
            return cacheName.startsWith('revivatech-') && 
                   ![CACHE_NAME, STATIC_CACHE, API_CACHE, IMAGE_CACHE].includes(cacheName);
          })
          .map(cacheName => {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim();
    })
  );
});

/**
 * Fetch event - Implement caching strategies
 */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Determine cache strategy based on request type
  let strategy = 'network-first';
  let cacheName = CACHE_NAME;
  
  if (isStaticAsset(url.pathname)) {
    strategy = CACHE_STRATEGIES.static;
    cacheName = STATIC_CACHE;
  } else if (isApiRequest(url.pathname)) {
    strategy = CACHE_STRATEGIES.api;
    cacheName = API_CACHE;
  } else if (isImageRequest(url.pathname)) {
    strategy = CACHE_STRATEGIES.images;
    cacheName = IMAGE_CACHE;
  }
  
  event.respondWith(
    executeStrategy(request, strategy, cacheName)
  );
});

/**
 * Background sync for offline actions
 */
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

/**
 * Push notification handling
 */
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from RevivaTech',
    icon: '/images/revivatech-icon.svg',
    badge: '/images/revivatech-icon.svg',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/images/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/images/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('RevivaTech', options)
  );
});

/**
 * Cache-first strategy
 */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Check if cache is still valid
    const cacheTime = cachedResponse.headers.get('sw-cache-time');
    if (cacheTime && isValidCache(cacheTime, getCacheDuration(request.url))) {
      return cachedResponse;
    }
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Add timestamp header
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      await cache.put(request, modifiedResponse);
      return networkResponse;
    }
  } catch (error) {
    console.error('[SW] Network request failed:', error);
  }
  
  // Return cached response as fallback
  return cachedResponse || new Response('Offline content not available', { 
    status: 503,
    statusText: 'Service Unavailable' 
  });
}

/**
 * Network-first strategy
 */
async function networkFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Add timestamp header
      const responseToCache = networkResponse.clone();
      const headers = new Headers(responseToCache.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const modifiedResponse = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      });
      
      await cache.put(request, modifiedResponse);
      return networkResponse;
    }
  } catch (error) {
    console.error('[SW] Network request failed, trying cache:', error);
  }
  
  // Fallback to cache
  const cachedResponse = await cache.match(request);
  return cachedResponse || new Response('Content not available offline', { 
    status: 503,
    statusText: 'Service Unavailable' 
  });
}

/**
 * Stale-while-revalidate strategy
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Fetch in background to update cache
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      const headers = new Headers(networkResponse.headers);
      headers.set('sw-cache-time', Date.now().toString());
      
      const responseToCache = new Response(networkResponse.body, {
        status: networkResponse.status,
        statusText: networkResponse.statusText,
        headers: headers
      });
      
      cache.put(request, responseToCache);
    }
    return networkResponse;
  }).catch(error => {
    console.error('[SW] Background fetch failed:', error);
  });
  
  // Return cached response immediately, or wait for network
  return cachedResponse || fetchPromise;
}

/**
 * Execute caching strategy
 */
async function executeStrategy(request, strategy, cacheName) {
  switch (strategy) {
    case 'cache-first':
      return cacheFirst(request, cacheName);
    case 'network-first':
      return networkFirst(request, cacheName);
    case 'stale-while-revalidate':
      return staleWhileRevalidate(request, cacheName);
    default:
      return fetch(request);
  }
}

/**
 * Helper functions
 */
function isStaticAsset(pathname) {
  return pathname.match(/\.(css|js|woff|woff2|ttf|eot|ico|png|jpg|jpeg|gif|svg|webp|avif)$/);
}

function isApiRequest(pathname) {
  return pathname.startsWith('/api/');
}

function isImageRequest(pathname) {
  return pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|avif)$/);
}

function isValidCache(cacheTime, maxAge) {
  const now = Date.now();
  const cached = parseInt(cacheTime);
  return (now - cached) < (maxAge * 1000);
}

function getCacheDuration(url) {
  if (isStaticAsset(url)) return CACHE_DURATION.static;
  if (isApiRequest(url)) return CACHE_DURATION.api;
  if (isImageRequest(url)) return CACHE_DURATION.images;
  return CACHE_DURATION.default;
}

async function doBackgroundSync() {
  // Implement background sync logic
  console.log('[SW] Performing background sync...');
  
  try {
    // Sync offline actions
    const offlineActions = await getOfflineActions();
    for (const action of offlineActions) {
      await syncAction(action);
    }
    
    // Clear synced actions
    await clearSyncedActions();
    
    console.log('[SW] Background sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
    throw error;
  }
}

async function getOfflineActions() {
  // Get actions stored while offline
  return [];
}

async function syncAction(action) {
  // Sync individual action
  console.log('[SW] Syncing action:', action);
}

async function clearSyncedActions() {
  // Clear successfully synced actions
  console.log('[SW] Clearing synced actions');
}

// Performance monitoring
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'GET_CACHE_STATS') {
    getCacheStats().then(stats => {
      event.ports[0].postMessage(stats);
    });
  }
});

async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = {
      size: keys.length,
      keys: keys.map(request => request.url)
    };
  }
  
  return stats;
}