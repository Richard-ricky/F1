/**
 * F1 Timing — Service Worker
 *
 * PLACEMENT: /public/service-worker.js   (NOT inside src/)
 *
 * This file is plain JavaScript intentionally.
 * TypeScript cannot type-check service worker globals correctly when
 * the file lives inside a Vite/React project's src/ folder because
 * TypeScript sees it as a DOM context, not a ServiceWorkerGlobalScope.
 *
 * By placing it in /public/ as plain .js, Vite copies it to the build
 * root and the browser loads it at /service-worker.js — which is exactly
 * where usePWA.ts registers it.
 */

const CACHE_VERSION = 'f1-timing-v2';
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const API_CACHE     = `${CACHE_VERSION}-api`;

const STATIC_ASSETS = ['/', '/index.html'];

const API_PATTERNS = [
  'api.openf1.org/v1/sessions',
  'api.openf1.org/v1/drivers',
  'api.openf1.org/v1/meetings',
  'api.openf1.org/v1/laps',
  'api.openf1.org/v1/stints',
  'api.openf1.org/v1/position',
  'api.openf1.org/v1/weather',
  'api.openf1.org/v1/race_control',
  'api.openf1.org/v1/intervals',
  'api.openf1.org/v1/team_radio',
  'api.openf1.org/v1/car_data',
];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k.startsWith('f1-timing-') && k !== STATIC_CACHE && k !== API_CACHE)
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch ─────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (event.request.method !== 'GET') return;

  // OpenF1 API — stale-while-revalidate
  if (API_PATTERNS.some(p => url.includes(p))) {
    event.respondWith(staleWhileRevalidate(event.request, API_CACHE));
    return;
  }

  // Mapbox tiles — cache first (tiles don't change)
  if (url.includes('mapbox.com') || url.includes('api.mapbox') || url.includes('mapbox-gl')) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  // App shell — network first, fall back to cache
  if (url.includes(self.location.origin)) {
    event.respondWith(networkFirst(event.request));
  }
});

// ── Strategies ────────────────────────────────────────────────────────────────

async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  const revalidate = fetch(request)
    .then(res => { if (res.ok) cache.put(request, res.clone()); return res; })
    .catch(() => cached);

  return cached ?? revalidate;
}

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res.ok) (await caches.open(cacheName)).put(request, res.clone());
  return res;
}

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res.ok) (await caches.open(STATIC_CACHE)).put(request, res.clone());
    return res;
  } catch {
    const cached = await caches.match(request);
    return cached ?? caches.match('/');
  }
}