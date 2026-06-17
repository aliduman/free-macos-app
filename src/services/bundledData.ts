import type { MacApp } from '../types'
import { appId, deduplicateApps } from '../utils/helpers'

const BUNDLED_APPS_URL = '/data/applications.json'
const BUNDLED_TR_URL = '/data/translations/descriptions.tr.json'

function getEnglishDescription(
  value: string | { en: string; tr: string },
): string {
  if (typeof value === 'string') return value
  return value.en ?? ''
}

function getTurkishDescription(
  value: string | { en: string; tr: string },
  en: string,
): string {
  if (typeof value === 'string') return value
  const tr = value.tr?.trim() ?? ''
  if (tr && tr !== en) return tr
  return en
}

export async function loadBundledApplications(): Promise<MacApp[]> {
  const [appsRes, trRes] = await Promise.all([
    fetch(BUNDLED_APPS_URL),
    fetch(BUNDLED_TR_URL).catch(() => null),
  ])

  if (!appsRes.ok) {
    throw new Error(`Bundled data fetch failed: ${appsRes.status}`)
  }

  const data = (await appsRes.json()) as {
    applications: Array<
      Omit<MacApp, 'short_description'> & {
        short_description: string | { en: string; tr: string }
      }
    >
  }

  let trMap: Record<string, string> = {}
  if (trRes?.ok) {
    try {
      trMap = (await trRes.json()) as Record<string, string>
    } catch {
      trMap = {}
    }
  }

  return deduplicateApps(
    data.applications.map((app) => {
      const en = getEnglishDescription(app.short_description)
      const bundledTr = getTurkishDescription(app.short_description, en)
      const tr = trMap[appId(app)] ?? bundledTr

      return {
        title: app.title,
        categories: app.categories ?? [],
        repo_url: app.repo_url,
        icon_url: app.icon_url,
        screenshots: app.screenshots ?? [],
        official_site: app.official_site ?? '',
        languages: app.languages ?? [],
        short_description: { en, tr },
      }
    }),
  )
}
