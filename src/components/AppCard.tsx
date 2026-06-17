import { useEffect, useState } from 'react'
import { useI18n } from '../i18n'
import type { MacApp } from '../types'
import {
  appId,
  getScreenshotUrls,
  normalizeCategoryKey,
  normalizeLanguageKey,
  toRawGitHubUrl,
} from '../utils/helpers'
import { GalleryModal } from './GalleryModal'

interface AppCardProps {
  app: MacApp
  isFavorite: boolean
  onToggleFavorite: (app: MacApp) => void
}

function getReleasesUrl(repoUrl: string): string {
  return repoUrl.replace(/\/$/, '') + '/releases'
}

export function AppCard({
  app,
  isFavorite,
  onToggleFavorite,
}: AppCardProps) {
  const { t, tc, tl, td, format } = useI18n()
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryIndex, setGalleryIndex] = useState(0)
  const [iconError, setIconError] = useState(false)

  const screenshots = getScreenshotUrls(app.screenshots)
  const iconUrl = toRawGitHubUrl(app.icon_url)
  const hasWebsite =
    app.official_site &&
    app.official_site.trim() &&
    app.official_site !== app.repo_url

  useEffect(() => {
    setGalleryOpen(false)
    setGalleryIndex(0)
    setIconError(false)
  }, [app.title, app.repo_url])

  const openGallery = (index: number) => {
    setGalleryIndex(index)
    setGalleryOpen(true)
  }

  return (
    <>
      <article className="app-card">
        <div className="app-card__top">
          <div className="app-card__icon-wrap">
            {!iconError && iconUrl ? (
              <img
                src={iconUrl}
                alt=""
                className="app-card__icon"
                loading="lazy"
                onError={() => setIconError(true)}
              />
            ) : (
              <div className="app-card__icon app-card__icon--fallback">
                {app.title.charAt(0)}
              </div>
            )}
          </div>

          <div className="app-card__heading">
            <h3>{app.title}</h3>
            <button
              type="button"
              className={`favorite-btn ${isFavorite ? 'favorite-btn--active' : ''}`}
              onClick={() => onToggleFavorite(app)}
              aria-label={isFavorite ? t.removeFavorite : t.addFavorite}
              aria-pressed={isFavorite}
            >
              <svg viewBox="0 0 24 24" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </button>
          </div>
        </div>

        <p className="app-card__desc">{td(app.short_description)}</p>

        <div className="app-card__tags">
          {app.categories?.slice(0, 3).map((cat) => (
            <span key={cat} className="tag tag--category">
              {tc(normalizeCategoryKey(cat))}
            </span>
          ))}
          {app.languages?.slice(0, 2).map((lang) => (
            <span key={lang} className="tag tag--lang">
              {tl(normalizeLanguageKey(lang))}
            </span>
          ))}
        </div>

        {screenshots.length > 0 && (
          <div className="app-card__screenshots">
            {screenshots.slice(0, 3).map((src, i) => (
              <button
                key={`${appId(app)}-shot-${i}`}
                type="button"
                className="screenshot-thumb"
                onClick={() => openGallery(i)}
                aria-label={format(t.screenshot, { n: i + 1 })}
              >
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
            {screenshots.length > 3 && (
              <button
                type="button"
                className="screenshot-more"
                onClick={() => openGallery(3)}
              >
                +{screenshots.length - 3}
              </button>
            )}
          </div>
        )}

        <div className="app-card__actions">
          <a
            href={app.repo_url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--primary"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.395-.135-.345-.72-1.395-1.23-1.875-.42-.405-1.155-.705-.015-.72 1.065-.015 1.815.99 2.07 1.395 1.2 2.055 3.12 1.485 3.885 1.125.12-.885.465-1.485.84-1.83-2.925-.33-6.015-1.485-6.015-6.615 0-1.485.525-2.685 1.395-3.63-.135-.33-.6-1.665.135-3.465 0 0 1.14-.345 3.735 1.395 1.08-.3 2.25-.45 3.405-.45 1.155 0 2.325.15 3.405.45 2.595-1.74 3.735-1.395 3.735-1.395.735 1.8.27 3.135.135 3.465.87.945 1.395 2.145 1.395 3.63 0 5.145-3.09 6.285-6.015 6.615.465.405.885 1.17.885 2.355 0 1.695-.015 3.06-.015 3.465 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            {t.github}
          </a>

          <a
            href={getReleasesUrl(app.repo_url)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--secondary"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
            </svg>
            {t.download}
          </a>

          {hasWebsite && (
            <a
              href={app.official_site}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn--ghost"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
              </svg>
              {t.website}
            </a>
          )}
        </div>
      </article>

      {galleryOpen && screenshots.length > 0 && (
        <GalleryModal
          key={`${appId(app)}-gallery`}
          images={screenshots}
          title={app.title}
          initialIndex={galleryIndex}
          onClose={() => setGalleryOpen(false)}
        />
      )}
    </>
  )
}
