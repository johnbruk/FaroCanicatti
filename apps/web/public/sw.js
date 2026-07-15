// Service worker della web app (Next export). Stale-while-revalidate:
// serve dalla cache e aggiorna in background — adatto agli asset con hash.
const CACHE = 'faro-web-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.open(CACHE).then(async (cache) => {
    const cached = await cache.match(event.request);
    const network = fetch(event.request)
      .then((res) => { if (res && res.ok) cache.put(event.request, res.clone()); return res; })
      .catch(() => cached);
    return cached || network;
  }));
});
