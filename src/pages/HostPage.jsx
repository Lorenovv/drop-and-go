import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { generateRoomCode } from '../utils/code.js'
import { useRoom } from '../hooks/useRoom.js'
import Chat from '../components/Chat.jsx'

// Leaving a session inside the same page load occasionally leaves Trystero
// relay sockets, RTCPeerConnection resources, and module-level state
// (notably `selfId`) in a half-torn-down state. The next session is then
// flaky to peer up. A hard navigation to '/' guarantees the next session
// starts in a fresh JS context with no leftover signalling state.
const goHome = () => {
  window.location.assign('/')
}

export default function HostPage() {
  const { t } = useTranslation()
  const [code] = useState(() => generateRoomCode())
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const room = useRoom({ mode: 'host', code })

  const guestUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return window.location.origin + '/guest/' + code
  }, [code])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // ignore; some browsers without HTTPS can't access clipboard
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(guestUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 1500)
    } catch {
      // ignore
    }
  }

  const handleEnd = () => {
    try {
      room.endSession()
    } catch {
      // ignore
    }
    goHome()
  }

  const isConnected = room.status === 'connected'

  return (
    <div className="flex flex-1 flex-col items-center px-4 sm:px-6 py-6">
      <div className="w-full max-w-3xl flex flex-col gap-5 min-w-0">
        <section className="glass-strong rounded-3xl p-5 sm:p-7 flex flex-col sm:flex-row gap-6 items-center min-w-0">
          <div className="flex-1 flex flex-col items-center sm:items-start gap-3 order-2 sm:order-1 w-full min-w-0">
            <span className="text-[11px] uppercase tracking-[0.25em] text-white/40">
              {t('host.yourCode')}
            </span>
            <div className="font-mono text-4xl sm:text-5xl md:text-6xl font-bold tracking-[0.18em] brand-gradient select-all break-all max-w-full">
              {code}
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-1">
              <button type="button" onClick={copy} className="btn-ghost text-sm py-2">
                {copied ? t('host.copied') : t('host.copy')}
              </button>
              <button type="button" onClick={copyLink} className="btn-ghost text-sm py-2">
                {copiedLink ? t('host.copied') : t('host.copyLink')}
              </button>
            </div>
            <p className="text-xs text-white/50 mt-2 max-w-xs">
              {t('host.shareHint')}
            </p>
          </div>
          <div className="order-1 sm:order-2 shrink-0 rounded-2xl bg-white p-3 shadow-2xl shadow-black/40">
            <QRCodeSVG value={guestUrl} size={144} level="M" />
          </div>
        </section>

        <StatusBanner status={room.status} error={room.error} />

        <Chat
          disabled={!isConnected}
          messages={room.messages}
          peerTyping={room.peerTyping}
          outgoing={room.outgoing}
          incoming={room.incoming}
          onSendText={room.sendText}
          onSendFiles={room.sendFiles}
          onTyping={room.sendTyping}
          onClear={room.clearChat}
        />

        <div className="flex justify-between gap-3">
          <button
            type="button"
            onClick={handleEnd}
            className="btn-ghost text-sm py-2"
          >
            {t('host.back')}
          </button>
          <button
            type="button"
            onClick={handleEnd}
            className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-white bg-red-500/85 hover:bg-red-500 transition cursor-pointer"
          >
            {t('host.end')}
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusBanner({ status, error }) {
  const { t } = useTranslation()
  if (status === 'connected') {
    return (
      <div className="rounded-2xl glass border-emerald-400/30 px-4 py-2.5 text-sm text-emerald-200 flex items-center gap-2">
        <Dot className="bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,0.6)]" />
        <span>{t('host.guestJoined')}</span>
      </div>
    )
  }
  if (status === 'error') {
    let messageKey = 'guest.notFound'
    if (error === 'ROOM_BUSY') messageKey = 'hostError.roomBusy'
    else if (error === 'SIGNALING_ERROR') messageKey = 'hostError.signaling'
    return (
      <div className="rounded-2xl glass px-4 py-2.5 text-sm text-red-200 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between border-red-400/30">
        <span>{t(messageKey)}</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="self-start sm:self-auto rounded-lg bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 text-xs font-medium text-red-100 transition cursor-pointer"
        >
          {t('hostError.newRoom')}
        </button>
      </div>
    )
  }
  // initializing / waiting / reconnecting / closed
  return (
    <div className="rounded-2xl glass px-4 py-2.5 text-sm text-white/70 flex items-center gap-2">
      <Spinner />
      <span>{t('host.waiting')}</span>
    </div>
  )
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white/25 border-t-white animate-spin"
    />
  )
}

function Dot({ className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={'inline-block w-2 h-2 rounded-full ' + className}
    />
  )
}
