import { useTranslation } from 'react-i18next'

const LANGS = ['ru', 'en']

export default function LanguageToggle() {
  const { i18n, t } = useTranslation()
  const current = i18n.resolvedLanguage || 'en'

  return (
    <div
      role="group"
      aria-label="Language"
      className="glass inline-flex rounded-full p-0.5 text-xs"
    >
      {LANGS.map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => i18n.changeLanguage(lng)}
          aria-pressed={current === lng}
          className={
            'px-3 py-1.5 rounded-full font-medium tracking-wide transition cursor-pointer ' +
            (current === lng
              ? 'bg-[color:var(--color-fg)] text-[color:var(--color-bg)]'
              : 'text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]')
          }
        >
          {t(`lang.${lng}`)}
        </button>
      ))}
    </div>
  )
}
