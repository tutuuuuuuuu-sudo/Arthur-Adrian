const CACHE_NAME = 'surf-ai-v1'
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  const isApiCall = [
    'api.windy.com', 'marine-api.open-meteo.com', 'api.open-meteo.com',
    'api.stormglass.io', 'supabase.co', 'coastwatch.pfeg.noaa.gov',
  ].some((domain) => url.hostname.includes(domain))

  if (isApiCall) return

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached
      return fetch(event.request).then((response) => {
        if (response.ok && url.origin === location.origin) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      }).catch(() => {
        if (event.request.destination === 'document') {
          return caches.match('/index.html')
        }
      })
    })
  )
})
