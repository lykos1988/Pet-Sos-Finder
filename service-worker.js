const CACHE_NAME = 'pet-sos-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  '/offline.html'
];

// Εγκατάσταση και cache βασικών αρχείων
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Ενεργοποίηση και καθαρισμός παλιών caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch με offline υποστήριξη
self.addEventListener('fetch', event => {
  const request = event.request;

  // HTML → Network first, fallback σε offline.html
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then(r => r || caches.match('/offline.html')))
    );
    return;
  }

  // Εικόνες → Cache first (πιάνει και Backendless image URLs)
  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request).then(fetchRes => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, fetchRes.clone());
            return fetchRes;
          });
        });
      })
    );
    return;
  }

  // Άλλα αρχεία → Cache first
  event.respondWith(
    caches.match(request).then(response => {
      return response || fetch(request).then(fetchRes => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(request, fetchRes.clone());
          return fetchRes;
        });
      });
    })
  );
});