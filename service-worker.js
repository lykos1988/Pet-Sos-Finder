const CACHE_NAME = 'pet-sos-local-v1';
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
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
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

// Διαχείριση fetch με offline fallback
self.addEventListener('fetch', event => {
  const request = event.request;

  // Αν είναι HTML → Network first, fallback offline.html
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then(r => r || caches.match('/offline.html')))
    );
    return;
  }

  // Για όλα τα άλλα → Cache first
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