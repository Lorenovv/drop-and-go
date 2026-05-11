import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { QRCodeSVG } from 'qrcode.react'
import { generateRoomCode } from '../utils/code.js'
import { useRoom } from '../hooks/useRoom.js'
import Chat from '../components/Chat.jsx'

export default function HostPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [code] = useState(() => generateRoomCode())
  const [copied, setCopied] = useState(false)

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

  const handleEnd = () => {
    room.endSession()
    navigate('/')
  }

  const isConnected = room.status === 'connected'

  return (
    <div className="flex flex-1 flex-col items-center px-4 sm:px-6 py-6 sm:py-10">
      <div className="w-full max-w-3xl flex flex-col gap-6 fade-up">
        {/* Bento card: code + QR + share */}
        <section className="glass rounded-[2rem] p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6 sm:gap-10 items-center">
          <div className="flex flex-col items-center sm:items-start gap-4 text-center sm:text-left">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[color:var(--color-fg-faint)]">
              {t('host.yourCode')}
            </span>
            <div className="mono text-[clamp(2.5rem,8vw,4.5rem)] font-semibold tracking-[0.18em] text-[color:var(--color-fg)] leading-none select-all">
              {code}
            </div>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-accent)] px-4 py-2 text-sm font-medium text-[color:var(--color-accent-fg)] hover:brightness-110 transition cursor-pointer shadow-[0_12px_30px_-12px_rgba(255,122,82,0.6)]"
            >
              {copied ? <Check /> : <Copy />}
              <span>{copied ? t('host.copied') : t('host.copy')}</span>
            </button>
            <p className="text-xs text-[color:var(--color-fg-muted)] max-w-xs">
              {t('host.shareHint')}
            </p>
          </div>

          <div className="self-center rounded-2xl bg-[color:var(--color-fg)] p-3 sm:p-4">
            <QRCodeSVG
              value={guestUrl}
              size={128}
              level="M"
              bgColor="transparent"
              fgColor="#0E0E10"
            />
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
          <Link
            to="/"
            onClick={() => room.endSession()}
            className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm text-[color:var(--color-fg-soft)] hover:text-[color:var(--color-fg)] transition"
          >
            <ArrowLeft />
            <span>{t('host.back')}</span>
          </Link>
          <button
            type="button"
            onClick={handleEnd}
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-err-soft)] text-[color:var(--color-err)] hover:bg-[color:var(--color-err)] hover:text-white px-4 py-2 text-sm font-medium transition cursor-pointer border border-[color:var(--color-err)]/30"
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
      <div className="glass rounded-full px-4 py-2.5 flex items-center gap-2.5 text-sm">
        <span className="inline-block w-2 h-2 rounded-full bg-[color:var(--color-ok)] pulse-dot" />
        <span className="text-[color:var(--color-fg)] font-medium">
          {t('host.guestJoined')}
        </span>
      </div>
    )
  }
  if (status === 'error') {
    const key =
      error === 'ROOM_BUSY' ? 'host.errorBusy' : 'host.errorSignaling'
    return (
      <div className="rounded-2xl border border-[color:var(--color-err)]/30 bg-[color:var(--color-err-soft)] px-4 py-3 text-sm text-[color:var(--color-err)]">
        {t(key)}
      </div>
    )
  }
  return (
    <div className="glass rounded-full px-4 py-2.5 flex items-center gap-3 text-sm text-[color:var(--color-fg-muted)]">
      <span className="spinner shrink-0" />
      <span>{t('host.waiting')}</span>
    </div>
  )
}

function Copy() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  )
}

function Check() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12l4.5 4.5L20 6" />
    </svg>
  )
}

function ArrowLeft() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="m11 19-7-7 7-7" />
    </svg>
  )
}
