const VERSION = 'v2';
const SHELL_CACHE = `shell-${VERSION}`;
const ASSET_CACHE = `assets-${VERSION}`;
const TILE_CACHE = `tiles-${VERSION}`;
const API_CACHE = `api-${VERSION}`;
const MAX_TILES = 400;

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(['/', '/manifest.webmanifest', '/icons/icon.svg'])));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const keep = new Set([SHELL_CACHE, ASSET_CACHE, TILE_CACHE, API_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => !keep.has(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((key) => cache.delete(key)));
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(fallbackUrl ?? request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(fallbackUrl ?? request);
    if (cached) return cached;
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(event, cacheName, max) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(event.request);
  const network = fetch(event.request).then((response) => {
    if (response.ok || response.type === 'opaque') {
      cache.put(event.request, response.clone());
      trim(cacheName, max);
    }
    return response;
  });
  if (cached) {
    event.waitUntil(network.catch(() => {}));
    return cached;
  }
  return network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, SHELL_CACHE, '/'));
  } else if (url.origin === self.location.origin && url.pathname.startsWith('/assets/')) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
  } else if (url.hostname.endsWith('tile.openstreetmap.org')) {
    event.respondWith(staleWhileRevalidate(event, TILE_CACHE, MAX_TILES));
  } else if (url.pathname.startsWith('/api/') && !url.pathname.includes('/stream') && !request.headers.has('Authorization')) {
    event.respondWith(networkFirst(request, API_CACHE));
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag !== 'sync-reports') return;
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then((clients) => clients.forEach((client) => client.postMessage({ type: 'SYNC_REPORTS' }))),
  );
});
