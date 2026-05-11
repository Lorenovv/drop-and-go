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
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
      <div className="w-full max-w-md flex flex-col items-center gap-6">
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
          <span className="text-white">Drop</span>
          <span className="text-blue-500">&amp;Go</span>
        </h1>
        <p className="text-white/70 leading-relaxed max-w-sm">
          {t('app.tagline')}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
          <Link
            to="/host"
            className="flex-1 rounded-lg bg-blue-500 px-4 py-3 font-medium text-white hover:bg-blue-400 transition shadow-lg shadow-blue-500/20"
          >
            {t('home.createRoom')}
          </Link>
          <button
            type="button"
            onClick={() => setShowInput((v) => !v)}
            className={
              'flex-1 rounded-lg px-4 py-3 font-medium transition cursor-pointer ' +
              (showInput
                ? 'bg-white/10 text-white'
                : 'bg-white/5 text-white/80 hover:bg-white/10')
            }
            aria-expanded={showInput}
          >
            {t('home.join')}
          </button>
        </div>

        {showInput && (
          <form onSubmit={handleJoin} className="w-full flex flex-col gap-2">
            <div className="flex gap-2">
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
                className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-3 text-center font-mono uppercase tracking-widest placeholder:text-white/30 placeholder:font-sans placeholder:tracking-normal outline-none focus:border-blue-500 transition"
              />
              <button
                type="submit"
                className="rounded-lg bg-blue-500 px-4 py-3 font-medium text-white hover:bg-blue-400 transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!code}
              >
                {t('home.enter')}
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-400 text-left">{error}</p>
            )}
          </form>
        )}

        <p className="mt-6 text-xs text-white/40">{t('app.footer')}</p>
      </div>
    </div>
  )
}
