// sw.js — Service Worker Surf AI Floripa
// Versão: incrementar esse número a cada deploy para forçar atualização
const CACHE_VERSION = 'surf-ai-v4'

// Ao instalar nova versão, limpa TODOS os caches antigos imediatamente
self.addEventListener('install', () => {
  self.skipWaiting() // ativa imediatamente sem esperar o browser fechar
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => caches.delete(k))) // deleta TODOS os caches
    ).then(() => self.clients.claim()) // toma controle de todas as abas abertas
  )
})

// Estratégia: Network Only — nunca serve do cache, sempre busca da rede
// Isso evita o problema de arquivos JS antigos sendo servidos
self.addEventListener('fetch', (event) => {
  // Deixa tudo passar direto para a rede
  // O browser faz o cache normal via HTTP headers
  if (event.request.method !== 'GET') return
  
  event.respondWith(
    fetch(event.request).catch(() => {
      // Só se offline: tenta retornar página principal
      if (event.request.destination === 'document') {
        return caches.match('/index.html') as Promise<Response>
      }
      return new Response('Offline', { status: 503 })
    })
  )
})
