import { useCallback, useEffect, useState } from 'react'
import type { MacApp } from '../types'
import { appId, loadFavorites, saveFavorites } from '../utils/helpers'
import {
  loadApplications,
  refreshApplications,
  type SyncProgress,
} from '../services/appsDataService'

export function useFavorites() {
  const [favorites, setFavorites] = useState<Set<string>>(() => loadFavorites())

  const toggleFavorite = useCallback((app: MacApp) => {
    const id = appId(app)
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      saveFavorites(next)
      return next
    })
  }, [])

  const isFavorite = useCallback(
    (app: MacApp) => favorites.has(appId(app)),
    [favorites],
  )

  return { favorites, toggleFavorite, isFavorite, favoriteCount: favorites.size }
}

export function useAppsData() {
  const [apps, setApps] = useState<MacApp[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<SyncProgress | null>(null)
  const [fetchedAt, setFetchedAt] = useState<number | null>(null)
  const [fromCache, setFromCache] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const result = await loadApplications((p) => {
          if (!cancelled) setProgress(p)
        })

        if (cancelled) return

        setApps(result.apps)
        setFetchedAt(result.fetchedAt)
        setFromCache(result.fromCache)
        setLoading(false)
        setProgress(null)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error')
          setLoading(false)
          setProgress(null)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const reload = useCallback(async () => {
    setRefreshing(true)
    setError(null)

    try {
      const result = await refreshApplications(setProgress)
      setApps(result.apps)
      setFetchedAt(result.fetchedAt)
      setLoading(false)
      setProgress(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setProgress(null)
    } finally {
      setRefreshing(false)
    }
  }, [])

  return {
    apps,
    loading,
    refreshing,
    error,
    progress,
    fetchedAt,
    fromCache,
    reload,
  }
}
