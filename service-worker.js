const CACHE_NAME = 'pet-sos-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/manifest.json',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2' // βιβλιοθήκη supabase
];

// Εγκατάσταση SW και cache βασικών αρχείων
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Ενεργοποίηση SW και καθαρισμός παλιών caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Διαχείριση fetch requests
self.addEventListener('fetch', event => {
  const request = event.request;

  // Αν είναι εικόνα ή αρχείο supabase, προτίμησε cache-first
  if (request.url.match(/\.(png|jpg|jpeg|gif|webp)$/i) ||
      request.url.includes('supabase.co/storage')) {
    event.respondWith(
      caches.match(request).then(response =>
        response || fetch(request).then(fetchRes => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(request, fetchRes.clone());
            return fetchRes;
          });
        })
      )
    );
    return;
  }

  // Για όλα τα άλλα: network-first με fallback στο cache
  event.respondWith(
    fetch(request).then(fetchRes => {
      return caches.open(CACHE_NAME).then(cache => {
        cache.put(request, fetchRes.clone());
        return fetchRes;
      });
    }).catch(() => caches.match(request))
  );
});
