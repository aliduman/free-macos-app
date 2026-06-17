import { useI18n, type Locale } from '../i18n'

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n()

  return (
    <div className="lang-switcher" role="group" aria-label={t.switchLanguage}>
      {(['tr', 'en'] as Locale[]).map((code) => (
        <button
          key={code}
          type="button"
          className={`lang-switcher__btn ${locale === code ? 'lang-switcher__btn--active' : ''}`}
          onClick={() => setLocale(code)}
          aria-pressed={locale === code}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
