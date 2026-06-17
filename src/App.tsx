import { Header } from './components/Header'
import { Filters } from './components/Filters'
import { AppGrid } from './components/AppGrid'
import { SyncLoader } from './components/SyncLoader'
import { useAppsData, useFavorites } from './hooks/useApps'
import { useFilteredApps } from './hooks/useFilteredApps'
import { useI18n } from './i18n'
import { getCacheAgeLabel } from './services/dataCache'
import './App.css'

function App() {
  const { t, format, locale } = useI18n()
  const {
    apps,
    loading,
    syncing,
    refreshing,
    error,
    progress,
    fetchedAt,
    reload,
  } = useAppsData()
  const { favorites, toggleFavorite, isFavorite, favoriteCount } = useFavorites()
  const { filters, setFilters, filteredApps, languages, categories } =
    useFilteredApps(apps, favorites)

  if (loading) {
    return (
      <div className="page">
        <SyncLoader progress={progress} />
      </div>
    )
  }

  if (error && apps.length === 0) {
    return (
      <div className="page">
        <div className="error-state">
          <h2>{t.loadError}</h2>
          <p>{error}</p>
          <p className="error-state__hint">{t.loadErrorHint}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      {refreshing && <SyncLoader progress={progress} overlay />}
      {syncing && !refreshing && (
        <SyncLoader progress={progress} compact />
      )}

      <Header appCount={apps.length} onRefresh={reload} refreshing={refreshing || syncing} />

      <main className="main">
        <Filters
          filters={filters}
          onChange={setFilters}
          categories={categories}
          languages={languages}
          totalCount={apps.length}
          filteredCount={filteredApps.length}
          favoriteCount={favoriteCount}
        />

        <AppGrid
          apps={filteredApps}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
        />
      </main>

      <footer className="footer">
        {fetchedAt && (
          <p className="footer__cache">
            {format(t.cacheInfo, {
              age: getCacheAgeLabel(fetchedAt, locale),
            })}
          </p>
        )}
        <p>
          {t.dataSource}{' '}
          <a
            href="https://github.com/serhii-londar/open-source-mac-os-apps"
            target="_blank"
            rel="noopener noreferrer"
          >
            open-source-mac-os-apps
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
