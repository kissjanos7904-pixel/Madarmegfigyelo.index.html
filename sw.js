const CACHE_NAME = 'madar-cache-v200';

// Fájlok, amiket offline használatra eltárolunk
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon2.png'
];

// Telepítés: azonnali átvétel
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Aktiválás: a régi beragadt gyorsítótárak azonnali kitörlése
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Lekérés: HÁLÓZAT-ELSŐ stratégia (ha van net, az újat hozza be; ha nincs, az offline-t)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Ha sikeres a hálózati letöltés, frissítjük a gyorsítótárat a háttérben
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Ha nincs térerő/internet a terepen, a memóriából adja oda
        return caches.match(event.request);
      })
  );
});
