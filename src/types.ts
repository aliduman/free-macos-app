import type { LocalizedString } from './i18n/types'

export type { LocalizedString }

export interface MacApp {
  title: string
  short_description: LocalizedString
  categories: string[]
  repo_url: string
  icon_url: string
  screenshots: string[]
  official_site: string
  languages: string[]
}

export interface Category {
  title: LocalizedString
  id: string
  description: LocalizedString
  parent?: string
}

export interface ApplicationsData {
  applications: MacApp[]
}

export interface CategoriesData {
  categories: Category[]
}

export interface FilterState {
  search: string
  category: string
  language: string
  favoritesOnly: boolean
}

export interface FilterOption {
  id: string
  label: string
}
