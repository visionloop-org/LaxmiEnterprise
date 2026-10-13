/**
 * Laxmi Supervisor — Service Worker
 * Version: 1.0.0
 * Provides offline caching for tablet workforce attendance in remote yards.
 */

const CACHE_NAME = 'laxmi-supervisor-v1'

const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png',
  './apple-touch-icon.png'
]

// 1. Install: Precache shell & immediately activate
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('Pre-caching assets warning:', err)
      })
    })
  )
  self.skipWaiting()
})

// 2. Activate: Clear outdated caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('laxmi-supervisor-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

// 3. Fetch: Cache-First for static assets, Network-First for HTML/APIs
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Do NOT intercept Google Apps Script or external data APIs
  if (url.hostname.includes('script.google.com') ||
      url.hostname.includes('googleusercontent.com') ||
      url.hostname.includes('googleapis.com')) {
    return
  }

  // Non-GET requests (mutations) pass straight to network
  if (request.method !== 'GET') {
    return
  }

  // Navigation requests: Network first, fall back to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME)
          const cachedIndex = await cache.match('./index.html') || await cache.match('/index.html')
          return cachedIndex || new Response('Offline - Laxmi Supervisor', {
            headers: { 'Content-Type': 'text/html' }
          })
        })
    )
    return
  }

  // Static Assets (JS, CSS, Images, Fonts): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return networkResponse
        })
        .catch(() => cachedResponse)

      return cachedResponse || fetchPromise
    })
  )
})
