import type { FilterState, FilterOption } from '../types'
import { useI18n } from '../i18n'

interface FiltersProps {
  filters: FilterState
  onChange: (next: FilterState) => void
  categories: FilterOption[]
  languages: FilterOption[]
  totalCount: number
  filteredCount: number
  favoriteCount: number
}

export function Filters({
  filters,
  onChange,
  categories,
  languages,
  totalCount,
  filteredCount,
  favoriteCount,
}: FiltersProps) {
  const { t, format } = useI18n()

  return (
    <section className="filters">
      <div className="filters__main">
        <div className="search-box">
          <svg className="search-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" />
          </svg>
          <input
            type="search"
            placeholder={t.searchPlaceholder}
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            aria-label={t.searchLabel}
          />
        </div>

        <select
          className="filters__select filters__select--category"
          value={filters.category}
          onChange={(e) => onChange({ ...filters, category: e.target.value })}
          aria-label={t.categoryFilter}
        >
          <option value="">{t.allCategories}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.label}
            </option>
          ))}
        </select>

        <select
          className="filters__select filters__select--language"
          value={filters.language}
          onChange={(e) => onChange({ ...filters, language: e.target.value })}
          aria-label={t.languageFilter}
        >
          <option value="">{t.allLanguages}</option>
          {languages.map((lang) => (
            <option key={lang.id} value={lang.id}>
              {lang.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          className={`chip-btn ${filters.favoritesOnly ? 'chip-btn--active' : ''}`}
          onClick={() =>
            onChange({ ...filters, favoritesOnly: !filters.favoritesOnly })
          }
          aria-label={`${t.favorites} (${favoriteCount})`}
        >
          <svg viewBox="0 0 24 24" fill={filters.favoritesOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span className="chip-btn__label">{t.favorites}</span>
          <span className="chip-btn__count">({favoriteCount})</span>
        </button>
      </div>

      <p className="filters__meta">
        {format(t.showingCount, { filtered: filteredCount, total: totalCount })}
      </p>
    </section>
  )
}
