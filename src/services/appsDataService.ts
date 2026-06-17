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
import { loadBundledApplications } from './bundledData'
import { validateApplications } from './urlValidator'
import { deduplicateApps } from '../utils/helpers'
import type { MacApp } from '../types'

export type { SyncProgress }

export interface LoadResult {
  apps: MacApp[]
  fromCache: boolean
  fetchedAt: number
  backgroundSync: boolean
}

export interface SyncCallbacks {
  onProgress?: (progress: SyncProgress) => void
  onAppsUpdate?: (apps: MacApp[]) => void
}

async function resolveInitialApps(cached: CachedAppsData | null): Promise<MacApp[]> {
  if (cached?.applications.length) {
    return deduplicateApps(cached.applications)
  }

  return loadBundledApplications()
}

async function syncApplications(
  previousApps: MacApp[],
  callbacks?: SyncCallbacks,
): Promise<{ apps: MacApp[]; fetchedAt: number }> {
  const { onProgress, onAppsUpdate } = callbacks ?? {}

  onProgress?.({ phase: 'fetch' })

  const raw = await fetchRawApplications()
  const localized = await buildLocalizedApplications(
    raw,
    previousApps,
    onProgress,
    onAppsUpdate,
  )

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
  onAppsUpdate?.(applications)

  return {
    apps: applications,
    fetchedAt: payload.fetchedAt,
  }
}

export async function loadApplications(
  callbacks?: SyncCallbacks,
): Promise<LoadResult> {
  const cached = loadFromStorage()

  if (cached && isCacheFresh(cached.fetchedAt)) {
    callbacks?.onProgress?.({ phase: 'cache' })
    const apps = deduplicateApps(cached.applications)
    if (apps.length !== cached.applications.length) {
      saveToStorage({ fetchedAt: cached.fetchedAt, applications: apps })
    }
    return {
      apps,
      fromCache: true,
      fetchedAt: cached.fetchedAt,
      backgroundSync: false,
    }
  }

  let initialApps: MacApp[]
  try {
    initialApps = await resolveInitialApps(cached)
  } catch (err) {
    if (cached) {
      initialApps = deduplicateApps(cached.applications)
    } else {
      throw err
    }
  }

  return {
    apps: initialApps,
    fromCache: Boolean(cached),
    fetchedAt: cached?.fetchedAt ?? 0,
    backgroundSync: true,
  }
}

export async function runBackgroundSync(
  previousApps: MacApp[],
  callbacks?: SyncCallbacks,
): Promise<{ apps: MacApp[]; fetchedAt: number }> {
  try {
    return await syncApplications(previousApps, callbacks)
  } catch (err) {
    const cached = loadFromStorage()
    if (cached) {
      return {
        apps: deduplicateApps(cached.applications),
        fetchedAt: cached.fetchedAt,
      }
    }
    throw err
  }
}

export async function refreshApplications(
  callbacks?: SyncCallbacks,
  previousApps?: MacApp[],
): Promise<{ apps: MacApp[]; fromCache: boolean; fetchedAt: number }> {
  const cached = loadFromStorage()
  const baseline = previousApps ?? cached?.applications ?? []

  const result = await syncApplications(baseline, callbacks)

  return {
    apps: result.apps,
    fromCache: false,
    fetchedAt: result.fetchedAt,
  }
}
