import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(fileURLToPath(import.meta.url))
const CACHE_PATH = join(DIR, '../public/data/translations/descriptions.tr.json')
const DELAY_MS = 350

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function loadCache() {
  if (!existsSync(CACHE_PATH)) return {}
  try {
    return JSON.parse(readFileSync(CACHE_PATH, 'utf8'))
  } catch {
    return {}
  }
}

function saveCache(cache) {
  mkdirSync(dirname(CACHE_PATH), { recursive: true })
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2))
}

export function appKey(app) {
  return `${app.title}::${app.repo_url}`
}

async function translateText(text) {
  const encoded = encodeURIComponent(text.slice(0, 450))
  const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|tr`

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Translation HTTP ${res.status}`)

    const data = await res.json()
    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      return data.responseData.translatedText
    }

    if (data.responseStatus === 429) {
      await sleep(2000 * (attempt + 1))
      continue
    }

    throw new Error(data.responseDetails || 'Translation failed')
  }

  return text
}

export async function translateDescriptions(applications, { force = false } = {}) {
  const cache = force ? {} : loadCache()
  let translated = 0
  let skipped = 0

  for (const app of applications) {
    const key = appKey(app)
    const en =
      typeof app.short_description === 'string'
        ? app.short_description
        : app.short_description?.en ?? ''

    if (!en.trim()) {
      cache[key] = ''
      continue
    }

    if (!force && cache[key]) {
      skipped++
      continue
    }

    try {
      cache[key] = await translateText(en)
      translated++
      saveCache(cache)

      if (translated % 25 === 0) {
        console.log(`  Translated ${translated} descriptions...`)
      }

      await sleep(DELAY_MS)
    } catch (err) {
      console.warn(`  Skip "${app.title}": ${err.message}`)
      cache[key] = en
      saveCache(cache)
    }
  }

  console.log(`Descriptions: ${translated} translated, ${skipped} cached`)
  return cache
}

if (process.argv[1]?.endsWith('translate-descriptions.mjs')) {
  const appsPath = join(DIR, '../public/data/applications.raw.json')
  if (!existsSync(appsPath)) {
    console.error('Run fetch-data first to create applications.raw.json')
    process.exit(1)
  }

  const { applications } = JSON.parse(readFileSync(appsPath, 'utf8'))
  await translateDescriptions(applications, {
    force: process.argv.includes('--force'),
  })
}
