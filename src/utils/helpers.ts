import type { MacApp } from '../types'

const FAVORITES_KEY = 'free-macos-app-favorites'

export function loadFavorites(): Set<string> {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as string[]
    return new Set(parsed)
  } catch {
    return new Set()
  }
}

export function saveFavorites(favorites: Set<string>) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites]))
}

export function appId(app: { title: string; repo_url: string }) {
  const title = app.title.trim()
  const repo = app.repo_url.trim().replace(/\/$/, '')
  return `${title}::${repo}`
}

export function deduplicateApps(apps: MacApp[]): MacApp[] {
  const map = new Map<string, MacApp>()

  for (const app of apps) {
    const id = appId(app)
    const existing = map.get(id)

    if (!existing) {
      map.set(id, normalizeApp(app))
      continue
    }

    map.set(id, mergeAppRecords(existing, app))
  }

  return [...map.values()]
}

function normalizeApp(app: MacApp): MacApp {
  return {
    ...app,
    title: app.title.trim(),
    repo_url: app.repo_url.trim().replace(/\/$/, ''),
    categories: [...new Set(app.categories ?? [])],
    languages: [...new Set(app.languages ?? [])],
    screenshots: getScreenshotUrls(app.screenshots),
  }
}

function mergeAppRecords(a: MacApp, b: MacApp): MacApp {
  const merged = normalizeApp({
    ...a,
    categories: [...new Set([...(a.categories ?? []), ...(b.categories ?? [])])],
    languages: [...new Set([...(a.languages ?? []), ...(b.languages ?? [])])],
    screenshots: getScreenshotUrls([...(a.screenshots ?? []), ...(b.screenshots ?? [])]),
    icon_url: a.icon_url || b.icon_url,
    official_site: a.official_site || b.official_site,
    short_description:
      a.short_description.en.length >= b.short_description.en.length
        ? a.short_description
        : b.short_description,
  })

  return merged
}

export function normalizeLanguageKey(lang: string): string {
  return lang.trim().toLowerCase().replace(/_/g, '-')
}

export function normalizeCategoryKey(cat: string): string {
  const key = cat.trim().toLowerCase().replace(/_/g, '-')
  const aliases: Record<string, string> = {
    utility: 'utilities',
    macos: 'ios--macos',
  }
  return aliases[key] ?? key
}

export function appHasLanguage(
  app: { languages?: string[] },
  languageKey: string,
): boolean {
  return (app.languages ?? []).some(
    (lang) => normalizeLanguageKey(lang) === languageKey,
  )
}

export function appHasCategory(
  app: { categories?: string[] },
  categoryKey: string,
): boolean {
  return (app.categories ?? []).some(
    (cat) => normalizeCategoryKey(cat) === categoryKey,
  )
}

export function toRawGitHubUrl(url: string): string {
  if (!url?.trim()) return url
  if (url.includes('raw.githubusercontent.com')) return url
  if (url.includes('github.com') && url.includes('/blob/')) {
    return url
      .replace('https://github.com/', 'https://raw.githubusercontent.com/')
      .replace('/blob/', '/')
  }
  return url
}

export function getScreenshotUrls(screenshots: string[] | undefined): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const url of screenshots ?? []) {
    if (!url?.trim()) continue
    const normalized = toRawGitHubUrl(url.trim())
    if (seen.has(normalized)) continue
    seen.add(normalized)
    result.push(normalized)
  }

  return result
}

export function getLocalizedText(
  value: { en: string; tr: string } | string,
  locale: 'en' | 'tr',
): string {
  if (typeof value === 'string') return value
  return value[locale] || value.en
}
