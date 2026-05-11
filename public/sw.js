// Kill-switch service worker.
//
// Some users still have an old vite-plugin-pwa (Workbox) service worker
// installed from before the PWA was removed. That SW precached the
// pre-Trystero bundles and intercepts every navigation — while it is
// active, the new index.html (and its inline kill-switch script) never
// reaches them. They keep getting served the stale cached page, the JS
// keeps trying to speak the old PeerJS signalling protocol to a host
// running fresh Trystero code, and after a few seconds they see
// "Комната недоступна".
//
// Browsers automatically re-fetch the registered SW URL on every
// navigation (max 24h bypass-cache window). With THIS file present at
// /sw.js the browser's update check finally returns a real JS body
// (instead of Vercel's SPA fallback HTML), the new SW installs, and
// then we use the install + activate handlers to:
//
//   1. Wipe every CacheStorage entry the old SW populated.
//   2. Unregister ourselves so subsequent navigations bypass any SW.
//   3. Take control of every open tab and force it to reload onto the
//      fresh, SW-free network response.
//
// After that one navigation the user is permanently off the legacy SW
// and Trystero peers can find each other again.

self.addEventListener('install', () => {
  // Activate immediately on the next event loop tick instead of waiting
  // for the old SW to release its clients.
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      } catch {
        /* ignore */
      }

      try {
        await self.registration.unregister()
      } catch {
        /* ignore */
      }

      try {
        await self.clients.claim()
        const clients = await self.clients.matchAll({ type: 'window' })
        clients.forEach((client) => {
          try {
            // Re-navigate the tab to its current URL. This bypasses any
            // remaining SW interception and goes straight to the
            // network for a fresh document.
            client.navigate(client.url)
          } catch {
            /* ignore */
          }
        })
      } catch {
        /* ignore */
      }
    })(),
  )
})

// Pass-through: no fetch handler means the browser hits the network
// directly. Even before activate() finishes we never want to serve a
// cached response — the whole point is to get fresh bundles to the user.
