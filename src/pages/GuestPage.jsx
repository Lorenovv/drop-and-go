import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isValidCode, normalizeCode } from '../utils/code.js'
import { useRoom } from '../hooks/useRoom.js'
import Chat from '../components/Chat.jsx'

// Hard reload on any navigation away from the session. See the equivalent
// comment in HostPage.jsx — module-level Trystero state and stuck
// RTCPeerConnections leak across a soft React Router transition and make
// follow-up sessions flaky to peer up. A real navigation resets it.
const goHome = () => {
  window.location.assign('/')
}

const goHost = () => {
  window.location.assign('/host')
}

export default function GuestPage() {
  const { t } = useTranslation()
  const params = useParams()
  const code = normalizeCode(params.code || '')

  useEffect(() => {
    if (!isValidCode(code)) {
      window.location.replace('/')
    }
  }, [code])

  const room = useRoom({ mode: 'guest', code: isValidCode(code) ? code : null })

  if (!isValidCode(code)) return null

  const handleLeave = () => {
    try {
      room.endSession()
    } catch {
      // ignore
    }
    goHome()
  }

  if (room.status === 'error') {
    const isSignaling = room.error === 'SIGNALING_ERROR'
    return (
      <CenteredCard>
        <h2 className="text-2xl font-semibold text-white">
          {t(isSignaling ? 'guest.signalingTitle' : 'guest.notFoundTitle')}
        </h2>
        <p className="text-sm text-white/70 leading-relaxed">
          {t(isSignaling ? 'guest.signaling' : 'guest.notFound')}
        </p>
        <button type="button" onClick={goHome} className="btn-primary mt-2">
          {t('guest.back')}
        </button>
      </CenteredCard>
    )
  }

  if (room.status === 'closed') {
    return (
      <CenteredCard>
        <h2 className="text-2xl font-semibold text-white">
          {t('guest.endedTitle')}
        </h2>
        <p className="text-sm text-white/70 leading-relaxed">
          {t('guest.ended')}
        </p>
        <button type="button" onClick={goHost} className="btn-primary mt-2">
          {t('guest.createOwn')}
        </button>
      </CenteredCard>
    )
  }

  if (room.status !== 'connected') {
    const reconnecting = room.status === 'reconnecting'
    return (
      <CenteredCard>
        <BigSpinner />
        <h2 className="text-lg font-semibold text-white/90">
          {reconnecting ? t('guest.reconnecting') : t('guest.connectingTitle')}
        </h2>
        <p className="text-sm text-white/60 font-mono tracking-[0.3em]">
          {code}
        </p>
        <p className="text-xs text-white/40 max-w-xs">
          {t('guest.connectingHint')}
        </p>
        <button type="button" onClick={handleLeave} className="btn-ghost mt-2">
          {t('guest.leave')}
        </button>
      </CenteredCard>
    )
  }

  return (
    <div className="flex flex-1 flex-col items-center px-4 sm:px-6 py-6">
      <div className="w-full max-w-3xl flex flex-col gap-5 min-w-0">
        <div className="rounded-2xl glass border-emerald-400/30 px-4 py-2.5 text-sm text-emerald-200 flex items-center gap-2 min-w-0">
          <Dot className="bg-emerald-400 shadow-[0_0_12px_2px_rgba(52,211,153,0.6)]" />
          <span className="font-mono tracking-[0.3em] truncate">{code}</span>
          <span className="text-white/50 ml-auto text-xs shrink-0">
            {t('guest.connected')}
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
            className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium text-white bg-red-500/85 hover:bg-red-500 transition cursor-pointer"
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
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md rounded-3xl glass-strong p-7 flex flex-col items-center gap-4 text-center">
        {children}
      </div>
    </div>
  )
}

function BigSpinner() {
  return (
    <span
      aria-hidden="true"
      className="inline-block w-10 h-10 rounded-full border-2 border-white/15 border-t-blue-400 animate-spin"
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
