// Basic service worker for PWA install + offline shell
const CACHE = 'morphcredit-cache-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/morpho_credit-logo.png',
  '/manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Only handle same-origin requests. Cross-origin (e.g., http://localhost:8787) should bypass SW.
  const sameOrigin = new URL(req.url).origin === self.location.origin;
  if (!sameOrigin) return;
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req)).catch(() => fetch(req))
  );
});


