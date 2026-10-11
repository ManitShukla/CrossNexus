const STATIC_CACHE_NAME = 'crossnexus-static-v1';
const CACHE_NAME = STATIC_CACHE_NAME;
const TIMETABLE_CACHE_NAME = 'crossnexus-timetable-cache-v1';
const TIMETABLE_CACHE = TIMETABLE_CACHE_NAME;
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon.svg'
];

// -----------------------------------------------------------------------------
// LIFECYCLE: INSTALL EVENT
// Pre-caches application shell assets and activates immediately.
// -----------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// -----------------------------------------------------------------------------
// LIFECYCLE: ACTIVATE EVENT
// Cleans up legacy cache versions and claims active clients.
// -----------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== TIMETABLE_CACHE) {
            console.log(`[SW_ACTIVATE] Purging obsolete cache: ${key}`);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// -----------------------------------------------------------------------------
// LIFECYCLE: FETCH EVENT (NETWORK PROXY & CACHE STRATEGIES)
// -----------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Bypass non-GET mutations (POST, PUT, DELETE, PATCH)
  if (request.method !== 'GET') {
    return;
  }

  // 2. Bypass WebSocket protocol upgrades and socket.io channels
  if (url.pathname.includes('/socket.io') || url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // 3. Network-First with Cache Fallback for Timetable API
  if (url.pathname.startsWith('/api/timetable') && request.method === 'GET') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(TIMETABLE_CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          console.warn('[SW_OFFLINE] Network unreachable for timetable. Intercepting with cache fallback.');
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          // Fallback: match any cached timetable record if cohort query differs slightly
          const timetableCache = await caches.open(TIMETABLE_CACHE_NAME);
          const allKeys = await timetableCache.keys();
          if (allKeys.length > 0) {
            return timetableCache.match(allKeys[0]);
          }

          return new Response(
            JSON.stringify({
              success: true,
              offline: true,
              message: 'OFFLINE_CACHE_DELIVERY',
              schedule: []
            }),
            { headers: { 'Content-Type': 'application/json' } }
          );
        })
    );
    return;
  }

  // 4. Standard Cache-First for static assets, Network-First for dynamic routes
  if (request.destination === 'style' || request.destination === 'script' || request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // 5. SPA Navigation Fallback: serve cached index.html when offline
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }
});

// -----------------------------------------------------------------------------
// LIFECYCLE: PUSH EVENT (VAPID BACKGROUND NOTIFICATION DISPATCH)
// -----------------------------------------------------------------------------
self.addEventListener('push', (event) => {
  let payload = { title: 'CAMPUS NOTICE // CROSSNEXUS', body: 'New transmission received.' };
  try {
    if (event.data) {
      payload = event.data.json();
    }
  } catch (e) {
    payload.body = event.data.text();
  }

  const options = {
    body: payload.body,
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    vibrate: [100, 50, 100],
    data: { url: payload.url || '/feed' }
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// -----------------------------------------------------------------------------
// LIFECYCLE: NOTIFICATION CLICK EVENT
// Focuses existing client window or opens target URL upon notification tap
// -----------------------------------------------------------------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      const targetUrl = event.notification.data?.url || '/feed';
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
