export type Locale = 'en' | 'tr'

export interface LocalizedString {
  en: string
  tr: string
}

export interface UiTranslations {
  appName: string
  appSubtitle: string
  appsCount: string
  sourceList: string
  searchPlaceholder: string
  allCategories: string
  allLanguages: string
  favorites: string
  showingCount: string
  loading: string
  loadingCache: string
  fetchingData: string
  translatingData: string
  validatingImages: string
  validateProgress: string
  savingData: string
  syncProgress: string
  syncProgressReused: string
  syncingInBackground: string
  cacheInfo: string
  refreshData: string
  refreshingData: string
  loadError: string
  loadErrorHint: string
  noResults: string
  noResultsHint: string
  dataSource: string
  github: string
  download: string
  website: string
  addFavorite: string
  removeFavorite: string
  screenshot: string
  galleryLabel: string
  close: string
  previous: string
  next: string
  switchLanguage: string
  categoryFilter: string
  languageFilter: string
  searchLabel: string
}

export interface Translations {
  ui: UiTranslations
  categories: Record<string, string>
  progLanguages: Record<string, string>
}
