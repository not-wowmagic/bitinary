export async function clearBitinaryBrowserCache(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const scriptUrl = new URL(`${import.meta.env.BASE_URL}sw.js`, window.location.origin).href
    const registrations = await navigator.serviceWorker.getRegistrations()
    const appRegistrations = registrations.filter((registration) =>
      [registration.active, registration.waiting, registration.installing]
        .some((worker) => worker?.scriptURL === scriptUrl),
    )
    await Promise.all(appRegistrations.map((registration) => registration.unregister()))
  }

  if ('caches' in window) {
    const cacheNames = await caches.keys()
    const bitinaryCaches = cacheNames.filter((name) => name.startsWith('bitinary-'))
    await Promise.all(bitinaryCaches.map((name) => caches.delete(name)))
  }
}
