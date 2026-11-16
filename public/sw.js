const SHELL_CACHE = 'bitinary-shell-v2'
const ASSET_CACHE = 'bitinary-assets-v2'
const MANAGED_CACHES = [SHELL_CACHE, ASSET_CACHE]
const HASHED_ASSET = /\/assets\/.+-[\w-]{8,}\.(?:js|css|woff2?|png|jpe?g|svg|webp)$/

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.add(new URL('./', self.registration.scope).href))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith('bitinary-') && !MANAGED_CACHES.includes(key))
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const shell = await caches.match(new URL('./', self.registration.scope).href)
        return shell ?? new Response('This page is unavailable offline.', { status: 503 })
      }),
    )
    return
  }

  if (!HASHED_ASSET.test(url.pathname)) return
  event.respondWith(
    caches.open(ASSET_CACHE).then(async (cache) => {
      const cached = await cache.match(request)
      if (cached) return cached
      const response = await fetch(request)
      if (response.ok) await cache.put(request, response.clone())
      return response
    }),
  )
})
