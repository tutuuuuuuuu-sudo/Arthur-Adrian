const CACHE_NAME = 'surf-ai-floripa-v1'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
]

// ─── Instalação: faz cache dos assets estáticos ───────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// ─── Ativação: limpa caches antigos ──────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// ─── Fetch: serve do cache quando possível ───────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Só intercepta navegação (HTML), deixa APIs e dados passarem normalmente
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match('/index.html')
      )
    )
  }
})

// ─── Push notifications reais ─────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = { title: 'Surf AI Floripa', body: event.data.text() }
  }

  const options = {
    body: data.body ?? 'Confira as condições agora!',
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    image: data.image,
    tag: data.tag ?? 'surf-ai',
    renotify: true,
    data: { url: data.url ?? '/' },
    actions: [
      { action: 'open', title: '🏄 Ver condições' },
      { action: 'dismiss', title: 'Fechar' },
    ],
    vibrate: [200, 100, 200],
  }

  event.waitUntil(
    self.registration.showNotification(data.title ?? '🌊 Surf AI Floripa', options)
  )
})

// ─── Click na notificação ─────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Se já tem uma janela aberta, foca nela
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      // Senão abre uma nova janela
      if (clients.openWindow) return clients.openWindow(url)
    })
  )
})
