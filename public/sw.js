const CACHE_NAME = 'sunrichpet-v1';
const STATIC_ASSETS = [
  '/',
  '/shop',
  '/b',
  '/guide',
  '/help',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install: precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)));
    })
  );
  self.clients.claim();
});

// Fetch: cache-first for static, network-first for API/HTML
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // API and dynamic routes: network first
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }
  // Navigation: network first, fallback to cache then offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then(r => r || caches.match('/offline'));
      })
    );
    return;
  }
  // Static assets: cache first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((resp) => {
        if (resp.ok && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return resp;
      });
    })
  );
});
