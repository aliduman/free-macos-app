import type { MacApp } from '../types'
import { appId, deduplicateApps } from '../utils/helpers'
import { translateWithReuse, type TranslationTask } from './translate'

const GITHUB_URL =
  'https://raw.githubusercontent.com/serhii-londar/open-source-mac-os-apps/master/applications.json'

export type SyncPhase = 'cache' | 'fetch' | 'translate' | 'validate' | 'save'

export interface SyncProgress {
  phase: SyncPhase
  current?: number
  total?: number
  skipped?: number
}

export interface RawApplicationsResponse {
  applications: Array<
    Omit<MacApp, 'short_description'> & {
      short_description: string | { en: string; tr: string }
    }
  >
}

function sanitizeJson(text: string): string {
  return text.replace(/,\s*([\]}])/g, '$1')
}

function getEnglishDescription(
  value: string | { en: string; tr: string },
): string {
  if (typeof value === 'string') return value
  return value.en ?? ''
}

export async function fetchRawApplications(): Promise<RawApplicationsResponse> {
  const res = await fetch(GITHUB_URL)
  if (!res.ok) throw new Error(`GitHub fetch failed: ${res.status}`)

  const text = await res.text()
  return JSON.parse(sanitizeJson(text)) as RawApplicationsResponse
}

function buildPreviousMap(previousApps: MacApp[] | undefined): Map<string, MacApp> {
  const map = new Map<string, MacApp>()
  for (const app of previousApps ?? []) {
    map.set(appId(app), app)
  }
  return map
}

function buildTranslationTasks(
  raw: RawApplicationsResponse,
  previousApps: MacApp[] | undefined,
): TranslationTask[] {
  const previousMap = buildPreviousMap(previousApps)

  return raw.applications.map((app) => {
    const en = getEnglishDescription(app.short_description)
    const prev = previousMap.get(appId(app))

    if (
      prev &&
      prev.short_description.en === en &&
      prev.short_description.tr.trim()
    ) {
      return { en, reuseTr: prev.short_description.tr }
    }

    return { en }
  })
}

function mapRawToApps(
  raw: RawApplicationsResponse,
  tasks: TranslationTask[],
  translated: string[],
): MacApp[] {
  return raw.applications.map((app, index) => ({
    title: app.title,
    categories: app.categories ?? [],
    repo_url: app.repo_url,
    icon_url: app.icon_url,
    screenshots: app.screenshots ?? [],
    official_site: app.official_site ?? '',
    languages: app.languages ?? [],
    short_description: {
      en: tasks[index].en,
      tr: translated[index],
    },
  }))
}

export async function buildLocalizedApplications(
  raw: RawApplicationsResponse,
  previousApps?: MacApp[],
  onProgress?: (progress: SyncProgress) => void,
  onPartialApps?: (apps: MacApp[]) => void,
): Promise<MacApp[]> {
  const tasks = buildTranslationTasks(raw, previousApps)
  const translated: string[] = new Array(tasks.length)

  for (let i = 0; i < tasks.length; i++) {
    translated[i] = tasks[i].reuseTr ?? tasks[i].en
  }

  onProgress?.({ phase: 'translate', current: 0, total: tasks.length, skipped: 0 })

  const pendingCount = tasks.filter((task) => task.reuseTr === undefined).length
  const skipped = tasks.length - pendingCount

  if (pendingCount === 0) {
    onProgress?.({ phase: 'translate', current: 0, total: 0, skipped })
    return deduplicateApps(mapRawToApps(raw, tasks, translated))
  }

  const results = await translateWithReuse(
    tasks,
    (current, total, skippedCount) => {
      onProgress?.({ phase: 'translate', current, total, skipped: skippedCount })
    },
    (index, tr) => {
      translated[index] = tr
      onPartialApps?.(deduplicateApps(mapRawToApps(raw, tasks, translated)))
    },
  )

  return deduplicateApps(mapRawToApps(raw, tasks, results))
}
