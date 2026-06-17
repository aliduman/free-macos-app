import {
  buildLocalizedApplications,
  fetchRawApplications,
  type SyncProgress,
} from './dataFetcher'
import {
  isCacheFresh,
  loadFromStorage,
  saveToStorage,
  type CachedAppsData,
} from './dataCache'
import { validateApplications } from './urlValidator'
import { deduplicateApps } from '../utils/helpers'
import type { MacApp } from '../types'

export type { SyncProgress }

export async function loadApplications(
  onProgress?: (progress: SyncProgress) => void,
): Promise<{ apps: MacApp[]; fromCache: boolean; fetchedAt: number }> {
  const cached = loadFromStorage()

  if (cached && isCacheFresh(cached.fetchedAt)) {
    onProgress?.({ phase: 'cache' })
    const apps = deduplicateApps(cached.applications)
    if (apps.length !== cached.applications.length) {
      saveToStorage({ fetchedAt: cached.fetchedAt, applications: apps })
    }
    return {
      apps,
      fromCache: true,
      fetchedAt: cached.fetchedAt,
    }
  }

  try {
    return await refreshApplications(onProgress, cached?.applications)
  } catch (err) {
    if (cached) {
      return {
        apps: deduplicateApps(cached.applications),
        fromCache: true,
        fetchedAt: cached.fetchedAt,
      }
    }
    throw err
  }
}

export async function refreshApplications(
  onProgress?: (progress: SyncProgress) => void,
  previousApps?: MacApp[],
): Promise<{ apps: MacApp[]; fromCache: boolean; fetchedAt: number }> {
  const cached = loadFromStorage()
  const baseline = previousApps ?? cached?.applications

  onProgress?.({ phase: 'fetch' })

  const raw = await fetchRawApplications()
  const localized = await buildLocalizedApplications(raw, baseline, onProgress)

  const applications = deduplicateApps(
    await validateApplications(localized, (current, total) => {
      onProgress?.({ phase: 'validate', current, total })
    }),
  )

  onProgress?.({ phase: 'save' })

  const payload: CachedAppsData = {
    fetchedAt: Date.now(),
    applications,
  }

  saveToStorage(payload)

  return {
    apps: applications,
    fromCache: false,
    fetchedAt: payload.fetchedAt,
  }
}
