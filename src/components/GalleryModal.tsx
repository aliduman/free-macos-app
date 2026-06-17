import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useI18n } from '../i18n'

interface GalleryModalProps {
  images: string[]
  title: string
  initialIndex: number
  onClose: () => void
}

export function GalleryModal({
  images,
  title,
  initialIndex,
  onClose,
}: GalleryModalProps) {
  const { t, format } = useI18n()
  const [index, setIndex] = useState(initialIndex)

  useEffect(() => {
    setIndex(initialIndex)
  }, [initialIndex, images])

  const goPrev = useCallback(() => {
    setIndex((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  const goNext = useCallback(() => {
    setIndex((i) => (i + 1) % images.length)
  }, [images.length])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'ArrowRight') goNext()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose, goPrev, goNext])

  const safeIndex = Math.min(index, Math.max(images.length - 1, 0))

  return createPortal(
    <div
      className="gallery-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={format(t.galleryLabel, { title })}
    >
      <div className="gallery-modal" onClick={(e) => e.stopPropagation()}>
        <header className="gallery-modal__header">
          <h2>{title}</h2>
          <span className="gallery-modal__counter">
            {safeIndex + 1} / {images.length}
          </span>
          <button
            type="button"
            className="gallery-modal__close"
            onClick={onClose}
            aria-label={t.close}
          >
            ×
          </button>
        </header>

        <div className="gallery-modal__stage">
          {images.length > 1 && (
            <button
              type="button"
              className="gallery-nav gallery-nav--prev"
              onClick={goPrev}
              aria-label={t.previous}
            >
              ‹
            </button>
          )}

          <img
            key={images[safeIndex]}
            src={images[safeIndex]}
            alt={format(t.screenshot, { n: safeIndex + 1 })}
            className="gallery-modal__image"
          />

          {images.length > 1 && (
            <button
              type="button"
              className="gallery-nav gallery-nav--next"
              onClick={goNext}
              aria-label={t.next}
            >
              ›
            </button>
          )}
        </div>

        {images.length > 1 && (
          <div className="gallery-modal__thumbs">
            {images.map((src, i) => (
              <button
                key={`${src}-${i}`}
                type="button"
                className={`gallery-thumb ${i === safeIndex ? 'gallery-thumb--active' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={format(t.screenshot, { n: i + 1 })}
              >
                <img src={src} alt="" loading="lazy" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
