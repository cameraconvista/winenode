/* eslint-env serviceworker */
/* eslint-disable no-console */

// STEP 3 - Service Worker per cache busting realtime fix
const CACHE_VERSION = 'wn-rt-202510030022'; // Incrementa per invalidare cache
const CACHE_NAME = `winenode-cache-${CACHE_VERSION}`;

// Installa nuovo service worker immediatamente
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', CACHE_VERSION);
  self.skipWaiting(); // Forza attivazione immediata
});

// Attiva nuovo service worker e pulisci cache vecchie
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Prendi controllo di tutti i client immediatamente
      return self.clients.claim();
    })
  );
});

// Strategia cache: Network First per HTML, Cache First per assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip per richieste non-GET o cross-origin (inclusi WebSocket)
  if (request.method !== 'GET' || url.origin !== location.origin) {
    return;
  }

  // Network First per HTML e API
  if (request.destination === 'document' || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache solo risposte OK
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback a cache se network fail
          return caches.match(request);
        })
    );
    return;
  }

  // Cache First per assets statici
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(request).then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Message handler per controllo da client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});
