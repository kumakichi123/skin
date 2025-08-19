self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('skin-v1').then((cache) => cache.addAll([
      '/',
      '/manifest.json'
    ]))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== 'skin-v1').map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // 静的ファイルは SW キャッシュ優先
  if (url.origin === location.origin && (url.pathname.startsWith('/icons/') || url.pathname === '/manifest.json')) {
    event.respondWith(
      caches.match(event.request).then(r => r || fetch(event.request).then(res => {
        const copy = res.clone()
        caches.open('skin-v1').then(c => c.put(event.request, copy))
        return res
      }))
    )
    return
  }

  // それ以外はネットワーク優先
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)))
})
