import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { en } from './locales/en'
import { tr } from './locales/tr'
import type { Locale, LocalizedString, Translations } from './types'

const LOCALE_KEY = 'free-macos-app-locale'

const locales: Record<Locale, Translations> = { en, tr }

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations['ui']
  tc: (categoryId: string) => string
  tl: (langKey: string) => string
  td: (value: LocalizedString | string) => string
  format: (template: string, vars: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

function loadLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_KEY)
    if (stored === 'en' || stored === 'tr') return stored
  } catch {
    /* ignore */
  }
  return 'tr'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(loadLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    localStorage.setItem(LOCALE_KEY, next)
    document.documentElement.lang = next
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  const value = useMemo<I18nContextValue>(() => {
    const dict = locales[locale]

    return {
      locale,
      setLocale,
      t: dict.ui,
      tc: (categoryId: string) => dict.categories[categoryId] ?? categoryId,
      tl: (langKey: string) => dict.progLanguages[langKey] ?? langKey,
      td: (value: LocalizedString | string) => {
        if (typeof value === 'string') return value
        return value[locale] || value.en
      },
      format: (template, vars) =>
        template.replace(/\{(\w+)\}/g, (_, key: string) =>
          String(vars[key] ?? `{${key}}`),
        ),
    }
  }, [locale, setLocale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
