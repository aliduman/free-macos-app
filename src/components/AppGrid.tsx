import { useI18n } from '../i18n'
import type { MacApp } from '../types'
import { appId } from '../utils/helpers'
import { AppCard } from './AppCard'

interface AppGridProps {
  apps: MacApp[]
  isFavorite: (app: MacApp) => boolean
  onToggleFavorite: (app: MacApp) => void
}

export function AppGrid({
  apps,
  isFavorite,
  onToggleFavorite,
}: AppGridProps) {
  const { t } = useI18n()

  if (apps.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">🔍</div>
        <h2>{t.noResults}</h2>
        <p>{t.noResultsHint}</p>
      </div>
    )
  }

  return (
    <div className="app-grid">
      {apps.map((app) => (
        <AppCard
          key={appId(app)}
          app={app}
          isFavorite={isFavorite(app)}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>
  )
}
