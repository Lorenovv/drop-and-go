# Drop&Go

> Мгновенный P2P-обмен сообщениями и файлами без регистрации.
> Instant peer-to-peer messaging and file sharing — no signup, no backend.

Drop&Go is a static React app that uses WebRTC (via [PeerJS](https://peerjs.com))
to establish a direct, encrypted connection between two browsers. There is no
backend storing messages or files: everything is exchanged peer-to-peer and
disappears the moment the host closes the tab.

## Features

- **No signup, no backend** — purely static, deployable to Vercel / GitHub Pages.
- **6-character room codes** (`X4K-9M2`) with QR-code sharing.
- **Real-time chat** with text, files, drag & drop, paste-from-clipboard, and
  inline image previews.
- **Large file transfers** up to **500 MB** with chunked streaming and a live
  progress bar (PeerJS's raw `send()` would otherwise stall around 16 MiB).
- **Typing indicator** and **notification sound + vibration** when the tab is
  hidden.
- **Auto-reconnect** for guests on flaky connections.
- **PWA installable** on mobile (manifest + auto-updating service worker).
- **Russian + English** UI with language toggle.
- **Dark theme**, minimal Tailwind v4 styling.
- **TURN fallback** via the public Open Relay Project servers for symmetric NAT
  traversal.

## Tech stack

- [Vite](https://vite.dev) + React 19
- [React Router DOM](https://reactrouter.com) for routing
- [Tailwind CSS v4](https://tailwindcss.com) (via `@tailwindcss/vite`)
- [PeerJS](https://peerjs.com) on the public `0.peerjs.com` signaling server
- [qrcode.react](https://github.com/zpao/qrcode.react)
- [i18next](https://www.i18next.com) + [react-i18next](https://react.i18next.com)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app)

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve the production build locally
npm run lint
```

## Deployment

The project is configured for Vercel out of the box:

1. Push to GitHub and import the repository in the Vercel dashboard.
2. Vercel auto-detects the Vite preset — leave the defaults (`npm run build`,
   `dist`).
3. `vercel.json` rewrites all routes to `index.html` so deep links like
   `/guest/X4K-9M2` work after a refresh.

Vercel will create a preview deployment for every PR.

## How a session works

1. **Host** visits `/host`. A 6-character code is generated and used as the
   PeerJS peer id (`dg-<code>`). The page shows the code and a QR code that
   encodes the deep link `https://<host>/guest/<code>`.
2. **Guest** opens `/guest/<code>` (typed manually, scanned from QR, or pasted
   into the home page) and the browser registers a random PeerJS peer id, then
   calls `peer.connect(dg-<code>, { reliable: true })`.
3. As soon as the `DataConnection` opens, the chat is unlocked on both sides.
4. Text messages and chunked file transfers flow over the same channel as
   JSON-tagged messages. Files larger than 64 KiB are sent as a `file-meta`
   envelope followed by `file-chunk` messages and a `file-end` marker.
5. Closing the tab triggers `beforeunload`, which tears down the `Peer` and the
   `DataConnection`. The guest then receives a `close` event and is told the
   host ended the session.

## Project layout

```
src/
  App.jsx                    # top-level routes
  i18n.js                    # i18next setup
  index.css                  # Tailwind import + small custom styles
  main.jsx                   # entry point (BrowserRouter + i18n)
  locales/{ru,en}.json       # translations
  components/
    Chat.jsx                 # shared chat UI (text + files)
    Message.jsx              # individual message bubble
    ProgressBar.jsx          # file-transfer progress bar
    LanguageToggle.jsx       # RU/EN switcher
  hooks/
    useRoom.js               # Peer lifecycle + message/file plumbing
  pages/
    HomePage.jsx             # /
    HostPage.jsx             # /host
    GuestPage.jsx            # /guest/:code
  utils/
    code.js                  # generate / validate room codes
    fileTransfer.js          # chunked sendFile + receiver
    peerConfig.js            # ICE config (STUN + TURN)
```

## Privacy & security

- DataChannel traffic is encrypted by DTLS (browser default for WebRTC).
- Messages live only in component state (`useState`). No `localStorage`, no
  `IndexedDB`.
- No analytics, no third-party scripts beyond the PeerJS signaling server.
- The 6-character code is **not** a security boundary — anyone with the code can
  join while the host is online. Treat it like a one-time meeting link.
