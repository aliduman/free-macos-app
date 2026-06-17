import type { MacApp } from '../types'
import { deduplicateApps } from '../utils/helpers'

export const DATA_CACHE_KEY = 'free-macos-app-data-v1'
export const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

export interface CachedAppsData {
  fetchedAt: number
  applications: MacApp[]
}

export function isCacheFresh(fetchedAt: number): boolean {
  return Date.now() - fetchedAt < ONE_WEEK_MS
}

export function loadFromStorage(): CachedAppsData | null {
  try {
    const raw = localStorage.getItem(DATA_CACHE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as CachedAppsData
    if (!parsed.fetchedAt || !Array.isArray(parsed.applications)) {
      return null
    }

    return {
      fetchedAt: parsed.fetchedAt,
      applications: deduplicateApps(parsed.applications),
    }
  } catch {
    return null
  }
}

export function saveToStorage(data: CachedAppsData): void {
  localStorage.setItem(DATA_CACHE_KEY, JSON.stringify(data))
}

export function clearStorage(): void {
  localStorage.removeItem(DATA_CACHE_KEY)
}

export function getCacheAgeLabel(fetchedAt: number, locale: 'en' | 'tr'): string {
  const days = Math.floor((Date.now() - fetchedAt) / (24 * 60 * 60 * 1000))
  if (days === 0) {
    return locale === 'tr' ? 'bugün güncellendi' : 'updated today'
  }
  if (days === 1) {
    return locale === 'tr' ? '1 gün önce güncellendi' : 'updated 1 day ago'
  }
  return locale === 'tr'
    ? `${days} gün önce güncellendi`
    : `updated ${days} days ago`
}
