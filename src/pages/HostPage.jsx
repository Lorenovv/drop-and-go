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

  // Status helpers for header strip
  const isConnected = room.status === 'connected'

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-6">
      <div className="w-full max-w-2xl flex flex-col gap-5">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-center">
          <div className="flex-1 flex flex-col items-center sm:items-start gap-3 order-2 sm:order-1 w-full">
            <span className="text-xs uppercase tracking-widest text-white/40">
              {t('host.yourCode')}
            </span>
            <div className="font-mono text-4xl sm:text-5xl font-bold tracking-widest text-blue-400 select-all">
              {code}
            </div>
            <button
              type="button"
              onClick={copy}
              className="rounded-lg bg-blue-500/90 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-400 transition cursor-pointer"
            >
              {copied ? t('host.copied') : t('host.copy')}
            </button>
            <p className="text-xs text-white/50">{t('host.shareHint')}</p>
          </div>
          <div className="order-1 sm:order-2 shrink-0 rounded-lg bg-white p-2">
            <QRCodeSVG value={guestUrl} size={128} level="M" />
          </div>
        </div>

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
            className="rounded-lg bg-white/5 hover:bg-white/10 px-4 py-2 text-sm text-white/80 transition"
          >
            {t('host.back')}
          </Link>
          <button
            type="button"
            onClick={handleEnd}
            className="rounded-lg bg-red-500/90 hover:bg-red-500 px-4 py-2 text-sm font-medium text-white transition cursor-pointer"
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
      <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-300 flex items-center gap-2">
        <Dot className="bg-green-400" />
        <span>{t('host.guestJoined')}</span>
      </div>
    )
  }
  if (status === 'error') {
    let messageKey = 'guest.notFound'
    if (error === 'ROOM_BUSY') messageKey = 'hostError.roomBusy'
    else if (error === 'SIGNALING_ERROR') messageKey = 'hostError.signaling'
    return (
      <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300 flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between">
        <span>{t(messageKey)}</span>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="self-start sm:self-auto rounded-md bg-red-500/20 hover:bg-red-500/30 px-2 py-1 text-xs font-medium text-red-100 transition cursor-pointer"
        >
          {t('hostError.newRoom')}
        </button>
      </div>
    )
  }
  // initializing / waiting / reconnecting / closed
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 flex items-center gap-2">
      <Spinner />
      <span>{t('host.waiting')}</span>
    </div>
  )
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block w-3 h-3 rounded-full border-2 border-white/30 border-t-white/80 animate-spin"
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
