import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isValidCode, normalizeCode } from '../utils/code.js'
import { useRoom } from '../hooks/useRoom.js'
import Chat from '../components/Chat.jsx'

export default function GuestPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const params = useParams()
  const code = normalizeCode(params.code || '')

  // If code looks invalid, bounce to home
  useEffect(() => {
    if (!isValidCode(code)) {
      navigate('/', { replace: true })
    }
  }, [code, navigate])

  const room = useRoom({ mode: 'guest', code: isValidCode(code) ? code : null })

  if (!isValidCode(code)) return null

  const handleLeave = () => {
    room.endSession()
    navigate('/')
  }

  if (room.status === 'error') {
    return (
      <CenteredCard>
        <h2 className="display text-3xl text-[color:var(--color-fg)]">
          {t('guest.notFound')}
        </h2>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-accent)] px-5 py-2.5 text-sm font-medium text-[color:var(--color-accent-fg)] hover:brightness-110 transition"
        >
          {t('guest.back')}
        </Link>
      </CenteredCard>
    )
  }

  if (room.status === 'closed') {
    return (
      <CenteredCard>
        <h2 className="display text-3xl sm:text-4xl text-[color:var(--color-fg)] max-w-md">
          {t('guest.ended')}
        </h2>
        <Link
          to="/host"
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-accent)] px-5 py-2.5 text-sm font-medium text-[color:var(--color-accent-fg)] hover:brightness-110 transition"
        >
          {t('guest.createOwn')}
        </Link>
      </CenteredCard>
    )
  }

  if (room.status !== 'connected') {
    const reconnecting = room.status === 'reconnecting'
    return (
      <CenteredCard>
        <span className="spinner" />
        <p className="text-base text-[color:var(--color-fg-soft)] max-w-sm">
          {reconnecting
            ? t('guest.reconnecting')
            : t('guest.connecting', { code })}
        </p>
        <button
          type="button"
          onClick={handleLeave}
          className="inline-flex items-center gap-2 rounded-full glass px-5 py-2.5 text-sm text-[color:var(--color-fg-soft)] hover:text-[color:var(--color-fg)] transition cursor-pointer"
        >
          {t('guest.leave')}
        </button>
      </CenteredCard>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center px-4 sm:px-6 py-6 sm:py-10">
      <div className="w-full max-w-3xl flex flex-col gap-5 fade-up">
        <div className="glass rounded-full px-4 py-2.5 flex items-center gap-3 text-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-[color:var(--color-ok)] pulse-dot" />
          <span className="text-[color:var(--color-fg)] font-medium">
            {t('guest.connected')}
          </span>
          <span className="text-[color:var(--color-fg-faint)]">·</span>
          <span className="mono text-[color:var(--color-fg-muted)] tracking-[0.2em]">
            {code}
          </span>
        </div>

        <Chat
          disabled={false}
          messages={room.messages}
          peerTyping={room.peerTyping}
          outgoing={room.outgoing}
          incoming={room.incoming}
          onSendText={room.sendText}
          onSendFiles={room.sendFiles}
          onTyping={room.sendTyping}
          onClear={room.clearChat}
        />

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleLeave}
            className="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-err-soft)] text-[color:var(--color-err)] hover:bg-[color:var(--color-err)] hover:text-white px-4 py-2 text-sm font-medium transition cursor-pointer border border-[color:var(--color-err)]/30"
          >
            {t('guest.leave')}
          </button>
        </div>
      </div>
    </div>
  )
}

function CenteredCard({ children }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 fade-up">
      <div className="glass rounded-3xl p-8 sm:p-10 flex flex-col items-center gap-5 text-center max-w-md w-full">
        {children}
      </div>
    </div>
  )
}
