// Service Worker for McKenzie Workout PWA
const CACHE_NAME = 'mckenzie-workout-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/workout.html',
  '/settings.html',
  '/css/theme.css',
  '/css/main.css',
  '/css/workout.css',
  '/css/settings.css',
  '/js/app.js',
  '/js/workout-app.js',
  '/js/settings-app.js',
  '/js/exercises.js',
  '/js/audio-manager.js',
  '/js/workout-engine.js',
  '/js/storage-service.js',
  '/js/badge-system.js',
  '/js/firebase-config.js',
  '/js/firebase-service.js',
  '/manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .then((fetchResponse) => {
            // Cache new resources
            return caches.open(CACHE_NAME)
              .then((cache) => {
                // Don't cache Firebase or external resources
                if (!event.request.url.includes('firebase') && 
                    !event.request.url.includes('google') &&
                    event.request.url.startsWith(self.location.origin)) {
                  cache.put(event.request, fetchResponse.clone());
                }
                return fetchResponse;
              });
          })
          .catch(() => {
            // Offline fallback
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
          });
      })
  );
});
