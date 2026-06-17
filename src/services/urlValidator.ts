import { toRawGitHubUrl, appId } from '../utils/helpers'
import type { MacApp } from '../types'

const URL_CACHE_KEY = 'free-macos-app-url-cache-v1'
const CONCURRENCY = 10
const TIMEOUT_MS = 8000

interface UrlCacheEntry {
  valid: boolean
}

let memoryCache: Record<string, UrlCacheEntry> | null = null

function getCache(): Record<string, UrlCacheEntry> {
  if (memoryCache) return memoryCache
  try {
    const raw = localStorage.getItem(URL_CACHE_KEY)
    memoryCache = raw ? JSON.parse(raw) : {}
  } catch {
    memoryCache = {}
  }
  return memoryCache!
}

function flushCache() {
  if (!memoryCache) return
  try {
    localStorage.setItem(URL_CACHE_KEY, JSON.stringify(memoryCache))
  } catch {
    /* quota exceeded */
  }
}

function getCachedValidity(url: string): boolean | null {
  const entry = getCache()[url]
  return entry ? entry.valid : null
}

function rememberValidity(url: string, valid: boolean) {
  getCache()[url] = { valid }
}

export function checkImageUrl(url: string): Promise<boolean> {
  const normalized = url.trim()
  if (!normalized) return Promise.resolve(false)

  const cached = getCachedValidity(normalized)
  if (cached !== null) return Promise.resolve(cached)

  return new Promise((resolve) => {
    const img = new Image()
    let settled = false

    const finish = (valid: boolean) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      rememberValidity(normalized, valid)
      resolve(valid)
    }

    const timer = setTimeout(() => finish(false), TIMEOUT_MS)

    img.onload = () => finish(true)
    img.onerror = () => finish(false)
    img.src = normalized
  })
}

async function mapPool<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0
  let done = 0

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++
      results[index] = await mapper(items[index], index)
      done++
      onProgress?.(done, items.length)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  )

  return results
}

export async function validateApplications(
  apps: MacApp[],
  onProgress?: (current: number, total: number) => void,
): Promise<MacApp[]> {
  const iconByApp = new Map<string, string>()
  const allUrls = new Set<string>()

  for (const app of apps) {
    const id = appId(app)
    const icon = toRawGitHubUrl(app.icon_url)
    if (icon) {
      iconByApp.set(id, icon)
      allUrls.add(icon)
    }

    for (const shot of app.screenshots ?? []) {
      const url = toRawGitHubUrl(shot)
      if (url) allUrls.add(url)
    }
  }

  const urlList = [...allUrls]

  const validityResults = await mapPool(
    urlList,
    CONCURRENCY,
    (url) => checkImageUrl(url),
    onProgress,
  )

  flushCache()

  const validity = new Map<string, boolean>()
  urlList.forEach((url, i) => validity.set(url, validityResults[i]))

  return apps
    .filter((app) => {
      const id = appId(app)
      const icon = iconByApp.get(id)
      return icon ? validity.get(icon) === true : false
    })
    .map((app) => ({
      ...app,
      icon_url: toRawGitHubUrl(app.icon_url),
      screenshots: (app.screenshots ?? [])
        .map((shot) => toRawGitHubUrl(shot))
        .filter((url) => url && validity.get(url) === true),
    }))
}

export function clearUrlCache() {
  memoryCache = null
  localStorage.removeItem(URL_CACHE_KEY)
}
