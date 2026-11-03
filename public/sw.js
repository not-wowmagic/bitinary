/* Bitinary service worker: offline app shell + cached imagery. */
const SHELL = 'bitinary-shell-v1'
const IMAGES = 'bitinary-img-v1'
const scope = self.registration.scope

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll([scope, `${scope}manifest.webmanifest`, `${scope}icons/icon-192.png`]))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => ![SHELL, IMAGES].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)

  // SPA navigations: network first, fall back to cached shell
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(SHELL).then((c) => c.put(scope, res.clone()))
          return res
        })
        .catch(() => caches.match(scope)),
    )
    return
  }

  // photos: cache first
  if (url.hostname === 'images.unsplash.com') {
    e.respondWith(
      caches.open(IMAGES).then(async (c) => {
        const hit = await c.match(req)
        if (hit) return hit
        const res = await fetch(req)
        if (res.ok || res.type === 'opaque') c.put(req, res.clone())
        return res
      }),
    )
    return
  }

  // same-origin assets: stale while revalidate
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.open(SHELL).then(async (c) => {
        const hit = await c.match(req)
        const net = fetch(req)
          .then((res) => {
            if (res.ok) c.put(req, res.clone())
            return res
          })
          .catch(() => hit)
        return hit || net
      }),
    )
  }
})
