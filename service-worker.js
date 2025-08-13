const CACHE_NAME = 'pet-sos-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/styles.css',  // αν έχεις ξεχωριστό CSS
  '/app.js',      // αν έχεις ξεχωριστό JS αρχείο
  '/favicon.ico',
  '/manifest.json',
  // πρόσθεσε εδώ τυχόν εικόνες/logo που θες offline
];

// Εγκατάσταση και cache αρχείων
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('📦 Caching app assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Ενεργοποίηση και καθαρισμός παλιών cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch αιτήματα - πρώτα cache, μετά δίκτυο
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return (
        response ||
        fetch(event.request).then(fetchRes => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, fetchRes.clone());
            return fetchRes;
          });
        })
      );
    })
  );
});
