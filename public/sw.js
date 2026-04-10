// sw.js — Service Worker do Surf AI Floripa
// Cache das páginas principais para funcionar offline (leitura do cache)
// Dados de surf são sempre buscados da rede (não faz sentido servir cache de ondas)

const CACHE_NAME = 'surf-ai-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

// Instala e faz cache dos assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Ativa e limpa caches antigos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Estratégia: Network First para APIs, Cache First para assets estáticos
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // APIs de surf/meteo — sempre da rede, sem cache
  const isApiCall = [
    'api.windy.com',
    'marine-api.open-meteo.com',
    'api.open-meteo.com',
    'api.stormglass.io',
    'supabase.co',
    'coastwatch.pfeg.noaa.gov',
  ].some((domain) => url.hostname.includes(domain))

  if (isApiCall) return // deixa passar direto

  // Assets estáticos — Cache First
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached
        return fetch(event.request).then((response) => {
          // Só cacheia respostas válidas de mesma origem
          if (response.ok && url.origin === self.location.origin) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
          }
          return response
        }).catch(() => {
          // Offline e não tem cache — retorna página principal
          if (event.request.destination === 'document') {
            return caches.match('/index.html') as Promise<Response>
          }
          return new Response('Offline', { status: 503 })
        })
      })
    )
  }
})
