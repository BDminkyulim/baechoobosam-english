const CACHE_NAME = 'english1800-v6';
const ASSETS = [
  './index.html',
  './learn.html',
  './login.html',
  './privacy.html',
  './manifest.json',
  './icon.svg',
  './stages_2_6.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isNavigation = event.request.mode === 'navigate' ||
    event.request.headers.get('accept')?.includes('text/html');

  if (isNavigation) {
    // Network-first for pages, so updates show up; fall back to cache, then to learn.html.
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return res;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match('./learn.html'))
        )
    );
    return;
  }

  // Cache-first for other assets (icons, scripts), with network fallback.
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone));
          return res;
        })
        .catch(() => cached);
    })
  );
});
