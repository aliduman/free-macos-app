import { useI18n } from '../i18n'
import { useTheme, type Theme } from '../theme'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()

  return (
    <div className="theme-switcher" role="group" aria-label={t.switchTheme}>
      {(['dark', 'light'] as Theme[]).map((mode) => (
        <button
          key={mode}
          type="button"
          className={`theme-switcher__btn ${theme === mode ? 'theme-switcher__btn--active' : ''}`}
          onClick={() => setTheme(mode)}
          aria-pressed={theme === mode}
          aria-label={mode === 'dark' ? t.darkMode : t.lightMode}
          title={mode === 'dark' ? t.darkMode : t.lightMode}
        >
          {mode === 'dark' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          )}
        </button>
      ))}
    </div>
  )
}
