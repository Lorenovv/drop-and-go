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
        <p className="text-lg text-red-300">{t('guest.notFound')}</p>
        <Link
          to="/"
          className="rounded-lg bg-blue-500 hover:bg-blue-400 px-4 py-2 text-sm font-medium text-white transition"
        >
          {t('guest.back')}
        </Link>
      </CenteredCard>
    )
  }

  if (room.status === 'closed') {
    return (
      <CenteredCard>
        <p className="text-lg text-white/80">{t('guest.ended')}</p>
        <Link
          to="/host"
          className="rounded-lg bg-blue-500 hover:bg-blue-400 px-4 py-2 text-sm font-medium text-white transition"
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
        <Spinner />
        <p className="text-base text-white/70">
          {reconnecting
            ? t('guest.reconnecting')
            : t('guest.connecting', { code })}
        </p>
        <button
          type="button"
          onClick={handleLeave}
          className="rounded-lg bg-white/5 hover:bg-white/10 px-4 py-2 text-sm text-white/80 transition cursor-pointer"
        >
          {t('guest.leave')}
        </button>
      </CenteredCard>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center px-4 py-6">
      <div className="w-full max-w-2xl flex flex-col gap-5">
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-300 flex items-center gap-2">
          <Dot className="bg-green-400" />
          <span className="font-mono tracking-widest">{code}</span>
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
            className="rounded-lg bg-red-500/90 hover:bg-red-500 px-4 py-2 text-sm font-medium text-white transition cursor-pointer"
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
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-6 flex flex-col items-center gap-4 text-center">
        {children}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block w-6 h-6 rounded-full border-2 border-white/20 border-t-blue-400 animate-spin"
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
