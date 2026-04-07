const CACHE_NAME = 'analisi-tracker-v1';
const OFFLINE_URL = '/offline.html';

// Assets to cache immediately on install
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  // Add your static assets here
  // '/styles.css',
  // '/main.js',
];

// API endpoints that will be cached with network-first strategy
const API_CACHE_PATTERN = /\/api\/analytics\/.*/;

// Runtime cache configuration
const RUNTIME_CACHE_CONFIG = [
  {
    urlPattern: /\.js$/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'js-cache',
      expiration: {
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
      }
    }
  },
  {
    urlPattern: /\.css$/i,
    handler: 'StaleWhileRevalidate',
    options: {
      cacheName: 'css-cache',
      expiration: {
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
      }
    }
  },
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'image-cache',
      expiration: {
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
      }
    }
  },
  {
    urlPattern: /\.(?:woff|woff2|ttf|otf)$/i,
    handler: 'CacheFirst',
    options: {
      cacheName: 'font-cache',
      expiration: {
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
      }
    }
  }
];

// Install event - precache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event triggered');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Precache failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event triggered');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && !cacheName.startsWith('analisi-tracker-')) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }

  // Handle API requests with network-first strategy
  if (API_CACHE_PATTERN.test(url.pathname)) {
    event.respondWith(networkFirstStrategy(request));
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  // Handle static assets with appropriate strategies
  const cacheConfig = RUNTIME_CACHE_CONFIG.find(config =>
    config.urlPattern.test(url.pathname)
  );

  if (cacheConfig) {
    event.respondWith(
      applyStrategy(request, cacheConfig.handler, cacheConfig.options)
    );
  } else {
    // Default to network-first for unknown requests
    event.respondWith(networkFirstStrategy(request));
  }
});

// Handle navigation requests (SPA routing)
async function handleNavigation(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache the response
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache');
    // If network fails, try cache
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // If nothing in cache, return offline page
    return caches.match(OFFLINE_URL);
  }
}

// Network-first strategy (for API and navigation requests)
async function networkFirstStrategy(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for:', request.url);

    // If network fails, try cache
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      console.log('[SW] Serving from cache:', request.url);
      return cachedResponse;
    }

    // Return error response
    return new Response(JSON.stringify({
      error: 'Network unavailable',
      message: 'No cached data available for this request'
    }), {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Stale-while-revalidate strategy (for JS, CSS)
async function staleWhileRevalidateStrategy(request, options = {}) {
  const cacheName = options.cacheName || CACHE_NAME;
  const cache = await caches.open(cacheName);

  // Check cache first
  const cachedResponse = await cache.match(request);

  // Fetch in background
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  });

  // Return cached response immediately, or wait for network
  return cachedResponse || fetchPromise;
}

// Cache-first strategy (for images, fonts)
async function cacheFirstStrategy(request, options = {}) {
  const cacheName = options.cacheName || CACHE_NAME;
  const cache = await caches.open(cacheName);

  // Check cache first
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  // If not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());

      // Clean up old entries if needed
      if (options.expiration) {
        await cleanCache(cache, options.expiration);
      }
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', request.url, error);
    throw error;
  }
}

// Apply the appropriate strategy
async function applyStrategy(request, strategy, options = {}) {
  switch (strategy) {
    case 'NetworkFirst':
      return networkFirstStrategy(request);

    case 'StaleWhileRevalidate':
      return staleWhileRevalidateStrategy(request, options);

    case 'CacheFirst':
      return cacheFirstStrategy(request, options);

    default:
      return networkFirstStrategy(request);
  }
}

// Clean up old cache entries
async function cleanCache(cache, expiration) {
  if (!expiration.maxEntries && !expiration.maxAgeSeconds) {
    return;
  }

  const requests = await cache.keys();
  const now = Date.now();

  // Remove expired entries
  if (expiration.maxAgeSeconds) {
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const cacheTime = new Date(response.headers.get('date')).getTime();
        const age = (now - cacheTime) / 1000;

        if (age > expiration.maxAgeSeconds) {
          await cache.delete(request);
        }
      }
    }
  }

  // Limit number of entries
  if (expiration.maxEntries) {
    const allRequests = await cache.keys();
    if (allRequests.length > expiration.maxEntries) {
      const requestsToDelete = allRequests.slice(0, allRequests.length - expiration.maxEntries);
      await Promise.all(requestsToDelete.map(request => cache.delete(request)));
    }
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);

  if (event.tag === 'sync-lab-results') {
    event.waitUntil(syncLabResults());
  }
});

// Sync lab results when back online
async function syncLabResults() {
  try {
    // Get pending results from IndexedDB
    const pendingResults = await getPendingResults();

    for (const result of pendingResults) {
      try {
        const response = await fetch('/api/lab-results', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(result)
        });

        if (response.ok) {
          await removePendingResult(result.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync result:', result.id, error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// IndexedDB operations for offline queue
async function getPendingResults() {
  // Implementation would use IndexedDB to store pending actions
  return [];
}

async function removePendingResult(id) {
  // Implementation would remove synced result from IndexedDB
}

// Push notification support (optional)
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');

  let data = {
    title: 'Analisi Tracker',
    body: 'You have new updates',
    icon: '/icons/icon-192x192.png'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (error) {
      console.error('[SW] Failed to parse push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/'
      }
    })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

// Message event for cache management
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[SW] Service worker loaded');
