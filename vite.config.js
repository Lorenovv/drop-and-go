import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// PWA / service worker is intentionally disabled. This is a real-time P2P
// app where the host and guest must run the exact same bundle for the
// signalling protocol to line up — aggressive precaching from
// vite-plugin-pwa would have stale phone clients trying to talk to a
// fresh-bundle host (or vice versa) and silently fail. We trade installability
// for correctness here.
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
