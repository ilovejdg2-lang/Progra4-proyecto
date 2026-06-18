import { useMemo, useState } from 'react';
import OptimizedImage from '../OptimizedImage/OptimizedImage';
import './Gallery.css';

const DEFAULT_PAGE_SIZE = 10;

const Gallery = ({ items = [], pageSize = DEFAULT_PAGE_SIZE, ariaLabel = 'Galería de fotos' }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / pageSize) || 1;

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [currentPage, items, pageSize]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  if (items.length === 0) return null;

  return (
    <section className="gallery" aria-label={ariaLabel}>
      <div
        className="gallery__bento"
        data-count={pageItems.length}
        key={currentPage}
      >
        {pageItems.map((item, index) => (
          <figure
            key={item.id ?? `${currentPage}-${index}`}
            className="gallery__item"
          >
            <OptimizedImage
              src={item.image}
              alt={item.title || 'Imagen de galería'}
              priority={index === 0 && currentPage === 1}
              className="gallery__media"
            />
            {item.title ? (
              <figcaption className="gallery__caption">{item.title}</figcaption>
            ) : null}
          </figure>
        ))}
      </div>

      {totalPages > 1 ? (
        <nav className="pagination" aria-label="Paginación de galería">
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
    </section>
  );
};

export default Gallery;
