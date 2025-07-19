const CACHE_NAME = 'juev-blog-v2'; // Updated version to force refresh
const STATIC_CACHE = 'juev-static-v2';
const PAGES_CACHE = 'juev-pages-v2';

// Resources to cache on install
const STATIC_RESOURCES = [
  '/',
  '/posts/',
  '/offline.html',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/juev.png',
  '/images/home.png',
];

// Install event - cache static resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching static resources');
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        console.log('Static resources cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Failed to cache static resources:', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== PAGES_CACHE &&
                cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle requests from our origin
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return; // Let browser handle external requests normally
  }

  // Handle CSS, JS, fonts, and images
  if (request.destination === 'style' || 
      request.destination === 'script' ||
      request.destination === 'font' ||
      request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(request).then(fetchResponse => {
            if (fetchResponse.ok) {
              const responseClone = fetchResponse.clone();
              caches.open(STATIC_CACHE)
                .then(cache => cache.put(request, responseClone));
            }
            return fetchResponse;
          });
        })
        .catch(() => {
          // Return a placeholder for failed image requests
          if (request.destination === 'image') {
            return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="#ddd"/><text x="50%" y="50%" text-anchor="middle" dy="0.3em" font-family="Arial" font-size="14" fill="#999">Изображение недоступно</text></svg>', {
              headers: { 'Content-Type': 'image/svg+xml' }
            });
          }
        })
    );
    return;
  }

  // Handle HTML pages
  if (request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(PAGES_CACHE)
              .then(cache => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(() => {
          // Try to serve from cache
          return caches.match(request)
            .then(response => {
              if (response) {
                return response;
              }
              // Serve offline page as fallback
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // For other requests, try cache first, then network
  event.respondWith(
    caches.match(request)
      .then(response => {
        return response || fetch(request);
      })
  );
});

// Background sync for future enhancements
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
  }
});

// Push notifications support (for future use)
self.addEventListener('push', event => {
  console.log('Push notification received');
}); 