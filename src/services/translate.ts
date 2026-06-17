const DELAY_MS = 400
const MAX_CHARS = 450

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function requestTranslation(text: string): Promise<string> {
  const encoded = encodeURIComponent(text.slice(0, MAX_CHARS))
  const url = `https://api.mymemory.translated.net/get?q=${encoded}&langpair=en|tr`

  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

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

export async function translateToTurkish(text: string): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) return ''
  return requestTranslation(trimmed)
}

export interface TranslationTask {
  en: string
  reuseTr?: string
}

export async function translateWithReuse(
  tasks: TranslationTask[],
  onProgress?: (current: number, total: number, skipped: number) => void,
  onItemComplete?: (index: number, translated: string) => void,
): Promise<string[]> {
  const results: string[] = new Array(tasks.length)
  const pending: number[] = []

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i]
    if (task.reuseTr !== undefined) {
      results[i] = task.reuseTr
    } else {
      pending.push(i)
    }
  }

  const skipped = tasks.length - pending.length
  onProgress?.(0, pending.length, skipped)

  if (pending.length === 0) {
    return results
  }

  for (let p = 0; p < pending.length; p++) {
    const index = pending[p]
    const en = tasks[index].en

    try {
      results[index] = await translateToTurkish(en)
    } catch {
      results[index] = en
    }

    onItemComplete?.(index, results[index])
    onProgress?.(p + 1, pending.length, skipped)

    if (p < pending.length - 1) {
      await sleep(DELAY_MS)
    }
  }

  return results
}

export const translateDelayMs = DELAY_MS
