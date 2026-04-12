// Service Worker — Bata, Takbo!
// Basic cache-first strategy for game assets

const CACHE_NAME = 'bata-takbo-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/assets/ui/Main_title.png',
  '/assets/ui/background.gif',
  '/assets/ui/chapter-1.png',
  '/assets/ui/chapter-2.png',
  '/assets/ui/chapter-3.png',
  '/assets/fonts/VCRosdNEUE.ttf',
  '/assets/fonts/DirtyHarold.ttf',
  '/assets/gui/buttons.png',
  '/assets/gui/GUISprite.png',
];

// Install — cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch — cache first for assets, network first for API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network only for Firebase API calls
  if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Cache first for static assets
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request)
        .then(cached => cached || fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        }))
    );
    return;
  }

  // Stale while revalidate for everything else
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        const fetched = fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
        return cached || fetched;
      })
  );
});
