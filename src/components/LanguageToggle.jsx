import { useTranslation } from 'react-i18next'

const LANGS = ['ru', 'en']

export default function LanguageToggle() {
  const { i18n, t } = useTranslation()
  const current = i18n.resolvedLanguage || 'en'

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex rounded-lg border border-white/10 bg-white/5 p-0.5 text-xs"
    >
      {LANGS.map((lng) => (
        <button
          key={lng}
          type="button"
          onClick={() => i18n.changeLanguage(lng)}
          className={
            'px-2.5 py-1 rounded-md transition cursor-pointer ' +
            (current === lng
              ? 'bg-blue-500 text-white'
              : 'text-white/70 hover:text-white')
          }
        >
          {t(`lang.${lng}`)}
        </button>
      ))}
    </div>
  )
}
