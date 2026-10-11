/**
 * NSUT Connect // Tactical Operations Service Worker
 * Protocol: Mil-Spec Offline Resilience & Autonomous Timetable Cache
 * Caches: nsut-static-v1, nsut-timetable-cache-v1
 */

const STATIC_CACHE_NAME = 'nsut-static-v1';
const TIMETABLE_CACHE_NAME = 'nsut-timetable-cache-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon.svg',
];

// -----------------------------------------------------------------------------
// LIFECYCLE: INSTALL EVENT
// Pre-caches application shell assets and activates immediately.
// -----------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      console.log('[SW_INSTALL] Pre-caching tactical application shell assets.');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// -----------------------------------------------------------------------------
// LIFECYCLE: ACTIVATE EVENT
// Cleans up legacy cache versions and claims active clients.
// -----------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE_NAME, TIMETABLE_CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!currentCaches.includes(cacheName)) {
            console.log(`[SW_ACTIVATE] Purging obsolete cache archive: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW_ACTIVATE] Tactical Service Worker active. Controlling clients.');
      return self.clients.claim();
    })
  );
});

// -----------------------------------------------------------------------------
// LIFECYCLE: FETCH EVENT (NETWORK PROXY & CACHE STRATEGIES)
// -----------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never intercept non-GET mutations (POST, PUT, DELETE, PATCH)
  if (request.method !== 'GET') {
    return;
  }

  // 2. Never intercept WebSocket protocol upgrades or socket.io channels
  if (url.pathname.includes('/socket.io') || url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // 3. MISSION-CRITICAL TIMETABLE: NETWORK-FIRST WITH CACHE-FALLBACK
  if (url.pathname.includes('/api/timetable')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // If network returns a valid status, update dynamic timetable cache
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(TIMETABLE_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async (fetchError) => {
          console.warn('[SW_OFFLINE] Network unreachable for timetable. Intercepting with local cache fallback.');
          const cache = await caches.open(TIMETABLE_CACHE_NAME);

          // Attempt exact match for specific cohort query
          const cachedResponse = await cache.match(request);
          if (cachedResponse) {
            console.log('[SW_OFFLINE] Exact cohort timetable match delivered from cache.');
            return cachedResponse;
          }

          // Fallback: match any cached timetable record if cohort query slightly differs
          const allCachedKeys = await cache.keys();
          if (allCachedKeys.length > 0) {
            console.log('[SW_OFFLINE] Delivering closest available cached cohort schedule.');
            return await cache.match(allCachedKeys[0]);
          }

          // If cache is empty, return tactical offline JSON message
          return new Response(
            JSON.stringify({
              success: false,
              status: 'OFFLINE_CACHE_EMPTY',
              message: 'Autonomous disconnected mode active, but no local timetable matrix was found in storage.',
            }),
            {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        })
    );
    return;
  }

  // 4. STATIC ASSETS & APPLICATION SHELL: CACHE-FIRST / STALE-WHILE-REVALIDATE
  // Matches HTML navigations, CSS, JS chunks, and SVG assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Revalidate in background if online
        fetch(request).then((freshResponse) => {
          if (freshResponse && freshResponse.status === 200) {
            caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, freshResponse));
          }
        }).catch(() => {/* Offline: silence revalidation failure */});
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseClone = networkResponse.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // SPA Fallback: for HTML navigation requests when offline, serve cached index.html
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});
