/**
 * Obioma Care — Service Worker
 * Caches static assets for offline study sessions
 * Version: 2026.08.16.01
 */

const CACHE_NAME = 'obioma-v20260816-01';
const STATIC_CACHE = 'obioma-static-v1';
const IMAGE_CACHE = 'obioma-images-v1';
const CONTENT_CACHE = 'obioma-content-v1';

// Assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/case-engine.html',
  '/free-nclex-checklist.html',
  '/readiness.html',
  '/downloads/',
  '/pricing.html',
  '/privacy.html',
  '/terms.html',
  '/success.html',
  '/assets/logo.svg',
  '/assets/obioma-logo.svg',
  '/favicon.ico',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/design-tokens/tokens.css',
  '/manifest.json'
];

// Routes that should always try network first, then cache
const NETWORK_FIRST_ROUTES = [
  '/api/',
  '/content/',
  '/quiz/',
  '/tutor/'
];

// Check if URL matches any pattern
function matchesPattern(url, patterns) {
  return patterns.some(pattern => url.includes(pattern));
}

// Install — pre-cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Pre-caching static assets');
        return cache.addAll(PRECACHE_ASSETS).catch(err => {
          console.warn('[SW] Some assets failed to pre-cache:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate — clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name.startsWith('obioma-') && name !== STATIC_CACHE && name !== IMAGE_CACHE && name !== CONTENT_CACHE)
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch — serve from cache, fall back to network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests (analytics, fonts, etc.)
  if (url.origin !== self.location.origin) return;

  // Skip Chrome extensions and other non-http(s) schemes
  if (!url.protocol.startsWith('http')) return;

  // API routes — network first, cache fallback (for offline viewing of previously loaded content)
  if (matchesPattern(url.pathname, NETWORK_FIRST_ROUTES)) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful GET responses
          if (response.ok && response.status === 200) {
            const clone = response.clone();
            caches.open(CONTENT_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(request).then(cached => {
            if (cached) return cached;
            // Return offline fallback for content pages
            if (url.pathname.startsWith('/content/')) {
              return caches.match('/content/');
            }
            throw new Error('Network unavailable and no cache');
          });
        })
    );
    return;
  }

  // Image assets — cache first, network fallback
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(cache =>
        cache.match(request).then(cached => {
          const fetchPromise = fetch(request).then(response => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Static assets (JS, CSS, fonts) — cache first, network fallback with cache update
  if (request.destination === 'script' || request.destination === 'style' || request.destination === 'font') {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache =>
        cache.match(request).then(cached => {
          const fetchPromise = fetch(request).then(response => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // HTML pages — stale-while-revalidate
  if (request.destination === 'document') {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache =>
        cache.match(request).then(cached => {
          const fetchPromise = fetch(request).then(response => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }

  // Default: try cache first, then network
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (!response.ok) return response;
        const clone = response.clone();
        caches.open(STATIC_CACHE).then(cache => cache.put(request, clone));
        return response;
      });
    })
  );
});

// Background sync for offline form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-leads') {
    event.waitUntil(syncPendingLeads());
  }
});

async function syncPendingLeads() {
  // Placeholder: would sync from IndexedDB to server
  console.log('[SW] Background sync: leads');
}

// Push notifications (future capability)
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'Obioma Care';
  const options = {
    body: data.body || 'Time for your daily NCLEX study session!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'study-reminder',
    requireInteraction: false,
    data: data.data || {}
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
