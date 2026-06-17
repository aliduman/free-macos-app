import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { translateDescriptions, appKey } from './translate-descriptions.mjs'

const BASE =
  'https://raw.githubusercontent.com/serhii-londar/open-source-mac-os-apps/master'
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '../public/data')
const TR_CACHE = join(OUT_DIR, 'translations/descriptions.tr.json')

function loadTrCache() {
  if (!existsSync(TR_CACHE)) return {}
  try {
    return JSON.parse(readFileSync(TR_CACHE, 'utf8'))
  } catch {
    return {}
  }
}

const categoryI18n = {
  en: {
    audio: 'Audio', backup: 'Backup', browser: 'Browser', chat: 'Chat',
    cryptocurrency: 'Cryptocurrency', database: 'Database', development: 'Development',
    downloader: 'Downloader', editors: 'Editors', extensions: 'Extensions',
    finder: 'Finder', games: 'Games', git: 'Git', graphics: 'Graphics', ide: 'IDE',
    images: 'Images', 'ios--macos': 'iOS / macOS', macos: 'macOS',
    'json-parsing': 'JSON Parsing', keyboard: 'Keyboard', mail: 'Mail',
    markdown: 'Markdown', medical: 'Medical', menubar: 'Menubar', music: 'Music',
    news: 'News', notes: 'Notes', other: 'Other', 'other-development': 'Other Development',
    player: 'Player', podcast: 'Podcast', productivity: 'Productivity',
    screensaver: 'Screensaver', security: 'Security', 'sharing-files': 'Sharing Files',
    'social-networking': 'Social Networking', streaming: 'Streaming', system: 'System',
    terminal: 'Terminal', tex: 'TeX', text: 'Text', 'touch-bar': 'Touch Bar',
    utilities: 'Utilities', utility: 'Utilities', 'vpn--proxy': 'VPN & Proxy',
    video: 'Video', wallpaper: 'Wallpaper', 'window-management': 'Window Management',
    csv: 'CSV', json: 'JSON', 'web-development': 'Web Development',
    android: 'Android', blockchain: 'Blockchain', finance: 'Finance',
    'file transfare': 'File Transfer', subtitles: 'Subtitles',
  },
  tr: {
    audio: 'Ses', backup: 'Yedekleme', browser: 'Tarayıcı', chat: 'Sohbet',
    cryptocurrency: 'Kripto Para', database: 'Veritabanı', development: 'Geliştirme',
    downloader: 'İndirici', editors: 'Editörler', extensions: 'Eklentiler',
    finder: 'Finder', games: 'Oyunlar', git: 'Git', graphics: 'Grafik', ide: 'IDE',
    images: 'Görseller', 'ios--macos': 'iOS / macOS', macos: 'macOS',
    'json-parsing': 'JSON Ayrıştırma', keyboard: 'Klavye', mail: 'E-posta',
    markdown: 'Markdown', medical: 'Tıbbi', menubar: 'Menü Çubuğu', music: 'Müzik',
    news: 'Haberler', notes: 'Notlar', other: 'Diğer',
    'other-development': 'Diğer Geliştirme', player: 'Oynatıcı', podcast: 'Podcast',
    productivity: 'Verimlilik', screensaver: 'Ekran Koruyucu', security: 'Güvenlik',
    'sharing-files': 'Dosya Paylaşımı', 'social-networking': 'Sosyal Ağ',
    streaming: 'Yayın', system: 'Sistem', terminal: 'Terminal', tex: 'TeX', text: 'Metin',
    'touch-bar': 'Touch Bar', utilities: 'Araçlar', utility: 'Araçlar',
    'vpn--proxy': 'VPN ve Proxy', video: 'Video', wallpaper: 'Duvar Kağıdı',
    'window-management': 'Pencere Yönetimi', csv: 'CSV', json: 'JSON',
    'web-development': 'Web Geliştirme', android: 'Android', blockchain: 'Blockchain',
    finance: 'Finans', 'file transfare': 'Dosya Transferi', subtitles: 'Altyazı',
  },
}

function sanitizeJson(text) {
  return text.replace(/,\s*([\]}])/g, '$1')
}

function normalizeCategoryKey(cat) {
  const key = cat.trim().toLowerCase().replace(/_/g, '-')
  const aliases = { utility: 'utilities', macos: 'ios--macos' }
  return aliases[key] ?? key
}

function localizedCategory(id) {
  const key = normalizeCategoryKey(id)
  return {
    en: categoryI18n.en[key] ?? key.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' / '),
    tr: categoryI18n.tr[key] ?? categoryI18n.en[key] ?? key,
  }
}

async function fetchJson(path) {
  const res = await fetch(`${BASE}/${path}`)
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`)
  const text = await res.text()
  return JSON.parse(sanitizeJson(text))
}

mkdirSync(OUT_DIR, { recursive: true })

const [applications, categories] = await Promise.all([
  fetchJson('applications.json'),
  fetchJson('categories.json'),
])

writeFileSync(
  join(OUT_DIR, 'applications.raw.json'),
  JSON.stringify(applications, null, 2),
)

const skipTranslate = process.argv.includes('--skip-translate')
const trDescriptions = skipTranslate
  ? loadTrCache()
  : { ...loadTrCache(), ...(await translateDescriptions(applications.applications)) }

const localizedApps = {
  applications: applications.applications.map((app) => {
    const en =
      typeof app.short_description === 'string'
        ? app.short_description
        : app.short_description?.en ?? ''
    const key = appKey(app)

    return {
      ...app,
      short_description: {
        en,
        tr: trDescriptions[key] ?? (typeof app.short_description === 'object' ? app.short_description.tr : en),
      },
    }
  }),
}

const localizedCategories = {
  categories: categories.categories.map((cat) => ({
    ...cat,
    title: localizedCategory(cat.id),
    description: {
      en: cat.description || '',
      tr: cat.description || '',
    },
  })),
}

writeFileSync(
  join(OUT_DIR, 'applications.json'),
  JSON.stringify(localizedApps, null, 2),
)
writeFileSync(
  join(OUT_DIR, 'categories.json'),
  JSON.stringify(localizedCategories, null, 2),
)

console.log(`Saved ${localizedApps.applications.length} localized applications`)
