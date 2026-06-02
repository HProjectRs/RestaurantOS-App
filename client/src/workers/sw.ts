const CACHE_NAME = 'restaurantos-v1';
const STATIC_ASSETS = ['/', '/index.html', '/static/js/bundle.js', '/static/js/main.chunk.js', '/static/js/0.chunk.js', '/static/css/main.chunk.css', '/manifest.json', '/favicon.ico'];
const API_CACHE = 'restaurantos-api-v1';
const OFFLINE_URL = '/offline.html';
const sw = self as any;
sw.addEventListener('install', (event: any) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache: any) => cache.addAll(STATIC_ASSETS)));
  sw.skipWaiting();
});
sw.addEventListener('activate', (event: any) => {
  event.waitUntil(caches.keys().then((cacheNames: string[]) => Promise.all(cacheNames.filter((name) => name !== CACHE_NAME && name !== API_CACHE).map((name) => caches.delete(name)))));
});
sw.addEventListener('fetch', (event: any) => {
  const { request } = event;
  if (request.url.includes('/api/')) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});
sw.addEventListener('message', (event: any) => {
  if (event.data?.type === 'SKIP_WAITING') sw.skipWaiting();
});
async function networkFirst(request: Request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}
async function cacheFirst(request: Request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}
export {}
