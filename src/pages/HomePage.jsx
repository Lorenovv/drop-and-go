import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { isValidCode, normalizeCode } from '../utils/code.js'

export default function HomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [showInput, setShowInput] = useState(false)
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  const handleJoin = (e) => {
    e.preventDefault()
    const normalized = normalizeCode(code)
    if (!isValidCode(normalized)) {
      setError(t('home.invalidCode'))
      return
    }
    setError('')
    navigate('/guest/' + normalized)
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl flex flex-col items-center gap-8 text-center">
        <span className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs text-white/70">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span className="tracking-wide">{t('home.badge')}</span>
        </span>

        <h1 className="text-6xl sm:text-7xl md:text-8xl font-extrabold tracking-tight leading-[0.95]">
          <span className="text-white">Drop</span>
          <span className="brand-gradient">&amp;Go</span>
        </h1>

        <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-xl">
          {t('app.tagline')}
        </p>

        <div className="w-full flex flex-col sm:flex-row gap-3 mt-2">
          <Link to="/host" className="btn-primary flex-1 text-base">
            <ArrowRightIcon />
            {t('home.createRoom')}
          </Link>
          <button
            type="button"
            onClick={() => setShowInput((v) => !v)}
            className="btn-ghost flex-1 text-base"
            aria-expanded={showInput}
          >
            <KeyIcon />
            {t('home.join')}
          </button>
        </div>

        {showInput && (
          <form onSubmit={handleJoin} className="w-full flex flex-col gap-2">
            <div className="flex gap-2">
              <input
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                value={code}
                onChange={(e) => {
                  setCode(normalizeCode(e.target.value))
                  if (error) setError('')
                }}
                placeholder={t('home.joinPlaceholder')}
                maxLength={7}
                autoFocus
                className="flex-1 rounded-2xl glass px-4 py-3 text-center font-mono uppercase tracking-[0.4em] text-lg placeholder:text-white/30 placeholder:font-sans placeholder:tracking-normal placeholder:normal-case outline-none focus:border-blue-400 transition"
              />
              <button
                type="submit"
                className="btn-primary px-5"
                disabled={!code}
              >
                {t('home.enter')}
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-400 text-left px-1">{error}</p>
            )}
          </form>
        )}

        <FeatureRow />

        <p className="mt-6 text-xs text-white/40 max-w-md">{t('app.footer')}</p>
      </div>
    </div>
  )
}

function FeatureRow() {
  const { t } = useTranslation()
  const items = [
    { icon: <BoltIcon />, label: t('home.featureFast') },
    { icon: <LockIcon />, label: t('home.featureEncrypted') },
    { icon: <SparkleIcon />, label: t('home.featureNoSignup') },
  ]
  return (
    <div className="mt-4 grid grid-cols-3 gap-3 w-full max-w-md text-[11px] sm:text-xs">
      {items.map((it, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-2 rounded-2xl glass px-3 py-3 text-white/80"
        >
          <span className="text-white/90">{it.icon}</span>
          <span className="leading-tight">{it.label}</span>
        </div>
      ))}
    </div>
  )
}

function ArrowRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}

function KeyIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
      <path d="m18 10-5.5 5.5" />
      <circle cx="7.5" cy="15.5" r="5.5" />
    </svg>
  )
}

function BoltIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="4.5"
        y="10.5"
        width="15"
        height="10"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 10.5V8a4 4 0 1 1 8 0v2.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}
