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
    <div className="flex flex-1 items-center px-5 sm:px-8 py-10 sm:py-16">
      <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
        {/* Hero copy column */}
        <div className="lg:col-span-7 flex flex-col gap-7 fade-up">
          <span className="inline-flex items-center gap-2 self-start glass rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--color-fg-muted)]">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[color:var(--color-accent)] pulse-dot" />
            P2P · no signup
          </span>

          <h1 className="display text-[clamp(3.5rem,9vw,7rem)] text-[color:var(--color-fg)]">
            Drop<span className="display-italic text-[color:var(--color-accent)]">&amp;</span>Go.
          </h1>

          <p className="text-lg sm:text-xl text-[color:var(--color-fg-soft)] leading-relaxed max-w-xl">
            {t('app.tagline')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Link
              to="/host"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-accent)] px-6 py-3.5 font-medium text-[color:var(--color-accent-fg)] hover:brightness-110 transition shadow-[0_18px_40px_-15px_rgba(255,122,82,0.55)]"
            >
              <span>{t('home.createRoom')}</span>
              <Arrow />
            </Link>
            <button
              type="button"
              onClick={() => setShowInput((v) => !v)}
              className={
                'inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 font-medium transition cursor-pointer ' +
                (showInput
                  ? 'glass-strong text-[color:var(--color-fg)]'
                  : 'glass text-[color:var(--color-fg-soft)] hover:text-[color:var(--color-fg)]')
              }
              aria-expanded={showInput}
            >
              {t('home.join')}
            </button>
          </div>

          {showInput && (
            <form
              onSubmit={handleJoin}
              className="fade-up flex flex-col gap-2 max-w-md"
            >
              <div className="glass-strong rounded-2xl p-1.5 flex items-center gap-1">
                <input
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(normalizeCode(e.target.value))
                    if (error) setError('')
                  }}
                  placeholder={t('home.joinPlaceholder')}
                  maxLength={7}
                  autoFocus
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="characters"
                  className="mono flex-1 bg-transparent px-4 py-2.5 text-center text-lg uppercase tracking-[0.4em] placeholder:tracking-normal placeholder:font-sans placeholder:normal-case placeholder:text-[color:var(--color-fg-faint)] outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-[color:var(--color-fg)] text-[color:var(--color-bg)] px-4 py-2.5 text-sm font-medium hover:brightness-110 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!code}
                >
                  {t('home.enter')}
                </button>
              </div>
              {error && (
                <p className="text-sm text-[color:var(--color-err)]">{error}</p>
              )}
            </form>
          )}

          <p className="text-xs text-[color:var(--color-fg-faint)] mt-2 max-w-md">
            {t('app.footer')}
          </p>
        </div>

        {/* Decorative side panel */}
        <aside
          aria-hidden="true"
          className="lg:col-span-5 hidden lg:flex flex-col items-center justify-center"
        >
          <FlowDiagram />
        </aside>
      </div>
    </div>
  )
}

function Arrow() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="transition-transform group-hover:translate-x-0.5"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </svg>
  )
}

/**
 * Decorative side panel: two device cards connected by an organic dashed
 * curve, illustrating the peer-to-peer concept without resorting to clip-art.
 */
function FlowDiagram() {
  return (
    <div className="relative w-full max-w-sm aspect-[5/6]">
      <div className="absolute top-0 left-0 glass rounded-2xl px-5 py-4 w-48 rotate-[-4deg] shadow-[0_30px_60px_-25px_rgba(0,0,0,0.7)]">
        <span className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-fg-faint)]">
          host
        </span>
        <div className="mono mt-2 text-lg tracking-[0.3em] text-[color:var(--color-accent)]">
          X4K-9M2
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[color:var(--color-fg-muted)]">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[color:var(--color-ok)]" />
          waiting…
        </div>
      </div>

      <svg
        viewBox="0 0 200 240"
        className="absolute inset-0 w-full h-full"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <path
          d="M 55 60 C 110 90, 90 160, 150 190"
          className="text-[color:var(--color-line-strong)]"
          strokeDasharray="4 6"
          strokeLinecap="round"
        />
        <circle
          cx="55"
          cy="60"
          r="3"
          className="fill-[color:var(--color-accent)]"
          stroke="none"
        />
        <circle
          cx="150"
          cy="190"
          r="3"
          className="fill-[color:var(--color-ok)]"
          stroke="none"
        />
      </svg>

      <div className="absolute bottom-0 right-0 glass rounded-2xl px-5 py-4 w-52 rotate-[3deg] shadow-[0_30px_60px_-25px_rgba(0,0,0,0.7)]">
        <span className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--color-fg-faint)]">
          guest
        </span>
        <div className="mt-2 flex items-center gap-2 text-[color:var(--color-fg-soft)]">
          <span className="text-sm">Hey, did you get my file?</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[color:var(--color-fg-muted)]">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[color:var(--color-ok)] pulse-dot" />
          connected
        </div>
      </div>
    </div>
  )
}
