import { useCallback, useEffect, useMemo, useState } from 'react';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { normalizeImageUrl } from '../../lib/imageUtils';
import OptimizedImage from '../OptimizedImage/OptimizedImage';
import './Gallery.css';

const DEFAULT_PAGE_SIZE = 10;

function getGalleryItemClassName(index, count) {
  const classes = ['gallery__item'];

  if (index === 0) {
    classes.push('gallery__item--featured');
  }

  if (index === count - 1 && count > 1) {
    const remaining = count - 1;

    if (remaining % 2 === 1) {
      classes.push('gallery__item--fill-mobile');
    }

    if (count > 5 && (count - 5) % 4 === 1) {
      classes.push('gallery__item--fill-desktop');
    }
  }

  return classes.join(' ');
}

const Gallery = ({
  items = [],
  pageSize = DEFAULT_PAGE_SIZE,
  title = 'Galería de fotos',
  ariaLabel = 'Galería de fotos',
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [activeIndex, setActiveIndex] = useState(null);

  const totalPages = Math.ceil(items.length / pageSize) || 1;

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [currentPage, items, pageSize]);

  const activeItem = activeIndex !== null ? pageItems[activeIndex] : null;
  const activeImageUrl = activeItem
    ? normalizeImageUrl(activeItem.image, { width: 1920 })
    : '';

  useBodyScrollLock(activeIndex !== null);

  const closeLightbox = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const showPrevious = useCallback(() => {
    setActiveIndex((index) => {
      if (index === null || pageItems.length <= 1) return index;
      return index === 0 ? pageItems.length - 1 : index - 1;
    });
  }, [pageItems.length]);

  const showNext = useCallback(() => {
    setActiveIndex((index) => {
      if (index === null || pageItems.length <= 1) return index;
      return index === pageItems.length - 1 ? 0 : index + 1;
    });
  }, [pageItems.length]);

  useEffect(() => {
    if (activeIndex === null) return undefined;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') showPrevious();
      if (event.key === 'ArrowRight') showNext();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeIndex, closeLightbox, showNext, showPrevious]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setActiveIndex(null);
    setCurrentPage(page);
  };

  if (items.length === 0) return null;

  return (
    <section className="gallery" aria-label={ariaLabel}>
      <header className="gallery__header">
        <h2 className="section-title gallery__title">{title}</h2>
      </header>

      <div className="gallery__bento" data-count={pageItems.length}>
        {pageItems.map((item, index) => {
          const label = item.title
            ? `Ver foto: ${item.title}`
            : `Ver foto ${index + 1}`;

          return (
            <figure
              key={item.id ?? `${currentPage}-${index}`}
              className={getGalleryItemClassName(index, pageItems.length)}
            >
              <button
                type="button"
                className="gallery__trigger"
                onClick={() => setActiveIndex(index)}
                aria-label={label}
              >
                <OptimizedImage
                  src={item.image}
                  alt={item.title || 'Imagen de galería'}
                  priority={index === 0 && currentPage === 1}
                  className="gallery__media"
                />
              </button>
              {item.title ? (
                <figcaption className="gallery__caption">{item.title}</figcaption>
              ) : null}
            </figure>
          );
        })}
      </div>

      {totalPages > 1 ? (
        <nav className="pagination gallery__pagination" aria-label="Paginación de galería">
          <button
            type="button"
            className="pagination__button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Página anterior"
          >
            ‹
          </button>
          {Array.from({ length: totalPages }, (_, i) => {
            const pageNumber = i + 1;
            return (
              <button
                key={pageNumber}
                type="button"
                className={`pagination__button${currentPage === pageNumber ? ' is-active' : ''}`}
                onClick={() => goToPage(pageNumber)}
                aria-current={currentPage === pageNumber ? 'page' : undefined}
              >
                {pageNumber}
              </button>
            );
          })}
          <button
            type="button"
            className="pagination__button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Página siguiente"
          >
            ›
          </button>
        </nav>
      ) : null}

      {activeItem && activeImageUrl ? (
        <div
          className="gallery-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={activeItem.title || 'Vista ampliada de foto'}
        >
          <button
            type="button"
            className="gallery-lightbox__backdrop"
            onClick={closeLightbox}
            aria-label="Cerrar vista ampliada"
          />
          <div className="gallery-lightbox__panel">
            <button
              type="button"
              className="gallery-lightbox__close"
              onClick={closeLightbox}
              aria-label="Cerrar"
            >
              ×
            </button>

            {pageItems.length > 1 ? (
              <button
                type="button"
                className="gallery-lightbox__nav gallery-lightbox__nav--prev"
                onClick={showPrevious}
                aria-label="Foto anterior"
              >
                ‹
              </button>
            ) : null}

            <figure className="gallery-lightbox__figure">
              <img
                src={activeImageUrl}
                alt={activeItem.title || 'Imagen de galería'}
                className="gallery-lightbox__image"
              />
              {activeItem.title ? (
                <figcaption className="gallery-lightbox__caption">{activeItem.title}</figcaption>
              ) : null}
            </figure>

            {pageItems.length > 1 ? (
              <button
                type="button"
                className="gallery-lightbox__nav gallery-lightbox__nav--next"
                onClick={showNext}
                aria-label="Foto siguiente"
              >
                ›
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Gallery;
