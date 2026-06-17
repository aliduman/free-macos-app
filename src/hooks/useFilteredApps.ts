import { useMemo, useState } from 'react'
import { useI18n } from '../i18n'
import type { FilterOption, FilterState, MacApp } from '../types'
import {
  appHasCategory,
  appHasLanguage,
  appId,
  getLocalizedText,
  normalizeCategoryKey,
  normalizeLanguageKey,
} from '../utils/helpers'

export function useFilteredApps(apps: MacApp[], favorites: Set<string>) {
  const { locale, tc, tl, td } = useI18n()

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    language: '',
    favoritesOnly: false,
  })

  const languages = useMemo(() => {
    const map = new Map<string, string>()

    for (const app of apps) {
      for (const lang of app.languages ?? []) {
        if (!lang?.trim()) continue
        const key = normalizeLanguageKey(lang)
        if (!map.has(key)) {
          map.set(key, tl(key))
        }
      }
    }

    return [...map.entries()]
      .sort((a, b) => a[1].localeCompare(b[1], locale))
      .map(([id, label]) => ({ id, label }))
  }, [apps, locale, tl])

  const categories = useMemo(() => {
    const map = new Map<string, string>()

    for (const app of apps) {
      for (const cat of app.categories ?? []) {
        if (!cat?.trim()) continue
        const key = normalizeCategoryKey(cat)
        if (!map.has(key)) {
          map.set(key, tc(key))
        }
      }
    }

    return [...map.entries()]
      .sort((a, b) => a[1].localeCompare(b[1], locale))
      .map(([id, label]) => ({ id, label })) satisfies FilterOption[]
  }, [apps, locale, tc])

  const filteredApps = useMemo(() => {
    const query = filters.search.trim().toLowerCase()

    return apps.filter((app) => {
      if (filters.favoritesOnly && !favorites.has(appId(app))) return false

      if (filters.category && !appHasCategory(app, filters.category)) {
        return false
      }

      if (filters.language && !appHasLanguage(app, filters.language)) {
        return false
      }

      if (!query) return true

      const haystack = [
        app.title,
        td(app.short_description),
        getLocalizedText(app.short_description, locale === 'tr' ? 'en' : 'tr'),
        ...(app.categories ?? []).map((cat) => tc(normalizeCategoryKey(cat))),
        ...(app.languages ?? []).map((lang) => tl(normalizeLanguageKey(lang))),
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(query)
    })
  }, [apps, favorites, filters, locale, tc, td, tl])

  return { filters, setFilters, filteredApps, languages, categories }
}
