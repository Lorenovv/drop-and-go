import { useTranslation } from 'react-i18next'

const LANGS = ['ru', 'en']

export default function LanguageToggle() {
  const { i18n, t } = useTranslation()
  const current = i18n.resolvedLanguage || 'en'

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex rounded-full glass p-0.5 text-xs"
    >
      {LANGS.map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => i18n.changeLanguage(lng)}
          className={
            'px-3 py-1 rounded-full transition cursor-pointer font-medium ' +
            (current === lng
              ? 'bg-white text-black'
              : 'text-white/70 hover:text-white')
          }
        >
          {t(`lang.${lng}`)}
        </button>
      ))}
    </div>
  )
}
