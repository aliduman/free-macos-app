import { useI18n } from '../i18n'
import type { SyncProgress } from '../services/appsDataService'

interface SyncLoaderProps {
  progress: SyncProgress | null
  overlay?: boolean
}

export function SyncLoader({ progress, overlay = false }: SyncLoaderProps) {
  const { t, format } = useI18n()

  const message = (() => {
    if (!progress) return t.loading

    switch (progress.phase) {
      case 'cache':
        return t.loadingCache
      case 'fetch':
        return t.fetchingData
      case 'translate':
        if (progress.total === 0) {
          return progress.skipped
            ? format(t.syncProgressReused, {
                current: 0,
                total: 0,
                skipped: progress.skipped,
              })
            : t.translatingData
        }
        if (progress.skipped) {
          return `${t.translatingData} ${format(t.syncProgressReused, {
            current: progress.current ?? 0,
            total: progress.total ?? 0,
            skipped: progress.skipped,
          })}`
        }
        return progress.total
          ? `${t.translatingData} ${format(t.syncProgress, {
              current: progress.current ?? 0,
              total: progress.total,
            })}`
          : t.translatingData
      case 'validate':
        return progress.total
          ? `${t.validatingImages} ${format(t.validateProgress, {
              current: progress.current ?? 0,
              total: progress.total,
            })}`
          : t.validatingImages
      case 'save':
        return t.savingData
      default:
        return t.loading
    }
  })()

  const percent = (() => {
    if (!progress) return 5
    if (
      (progress.phase === 'translate' || progress.phase === 'validate') &&
      progress.total
    ) {
      return Math.round(((progress.current ?? 0) / progress.total) * 100)
    }
    if (progress.phase === 'fetch') return 15
    if (progress.phase === 'save') return 95
    if (progress.phase === 'cache') return 100
    return 5
  })()

  return (
    <div className={`sync-loader ${overlay ? 'sync-loader--overlay' : ''}`}>
      <div className="loading">
        <div className="loading__spinner" />
        <p>{message}</p>
        {progress && progress.phase !== 'cache' && (
          <div className="loading__progress">
            <div className="loading__progress-bar" style={{ width: `${percent}%` }} />
          </div>
        )}
      </div>
    </div>
  )
}
