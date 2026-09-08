// service-worker.js
const CACHE_VERSION = 'v1';
const CACHE_NAME = `ta-myanmar-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', event => {
  const allowed = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (allowed.includes(k) ? null : caches.delete(k))))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const accept = req.headers.get('Accept') || '';

  if (accept.includes('text/html')) {
    event.respondWith(
      fetch(req).then(networkRes => {
        const copy = networkRes.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        return networkRes;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cachedRes => {
      const networkFetch = fetch(req).then(networkRes => {
        caches.open(CACHE_NAME).then(cache => {
          if (networkRes && networkRes.status === 200) {
            cache.put(req, networkRes.clone());
          }
        });
        return networkRes;
      }).catch(() => null);

      return cachedRes || networkFetch;
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
