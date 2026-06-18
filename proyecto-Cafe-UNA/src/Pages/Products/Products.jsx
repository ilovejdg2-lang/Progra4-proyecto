import { useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { ShoppingCart } from 'lucide-react';
import BackToHomeLink from '../../Components/BackToHomeLink/BackToHomeLink';
import OptimizedImage from '../../Components/OptimizedImage/OptimizedImage';
import { HOME_SCROLL_SECTIONS } from '../../lib/homeScrollTarget';
import './Products.css';
import { PublicPageGate } from '../../Components/PublicPageGate/PublicPageGate';
import { useCachedPublicPage } from '../../hooks/useCachedPublicPage';
import { addProductToCart, pulseButton } from '../../lib/cartStorage';
import { fetchProductsPageData } from '../../lib/productsPageData';
import { calcularPrecioConIVA } from '../../services/productosServices';

const PRODUCTS_PER_PAGE = 8;

const Products = () => {
  const {
    data,
    showLoading,
    isError,
    error: loadError,
    reload,
    loadingMessage,
  } = useCachedPublicPage('products', fetchProductsPageData);
  const products = data?.products ?? [];

  const [currentPage, setCurrentPage] = useState(1);

  const visibleProducts = useMemo(
    () => products.filter((product) => product.estado !== 'Deshabilitado'),
    [products]
  );

  const totalPages = Math.ceil(visibleProducts.length / PRODUCTS_PER_PAGE) || 1;

  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return visibleProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [currentPage, visibleProducts]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) {
      return;
    }
    setCurrentPage(page);
  };

  const productCards = currentProducts.map((product) => {
    const precioNormal = Number(product.precioNormal ?? product.priceWithoutIva ?? product.price ?? 0) || 0;
    const precioConIVA = calcularPrecioConIVA(precioNormal);
    const stockDisponible = Number(product.stock) || 0;
    const estaAgotado = stockDisponible <= 0 || product.estado === 'Deshabilitado';

    return {
      product,
      precioNormal,
      precioConIVA,
      stockDisponible,
      estaAgotado,
    };
  });

  return (
    <PublicPageGate
      showLoading={showLoading}
      loadingMessage={loadingMessage}
      isError={isError}
      error={loadError}
      errorMessage="No se pudo cargar el catálogo."
      onRetry={reload}
    >
    <main className="products-page">
      <BackToHomeLink homeSection={HOME_SCROLL_SECTIONS.products} />
      <section className="products-page__hero">
        <h1>Catálogo de Cafés</h1>
        <p>
          Explora nuestros productos y elige el grano ideal para tu rutina.
        </p>
      </section>

      <section className="products-page__grid" aria-label="Lista de productos de cafe">
        {productCards.length === 0 && (
          <p>No hay productos disponibles en este momento.</p>
        )}
        {productCards.map((card, index) => {
          const { product, precioConIVA, estaAgotado } = card;

          return (
          <article
            className={`products-page__card${estaAgotado ? ' products-page__card--agotado' : ''}`}
            key={product.id}
          >
            {product.imagen ? (
              <div className="products-page__card-media">
                {estaAgotado ? (
                  <span className="products-page__agotado-badge" role="status">
                    Agotado
                  </span>
                ) : null}
                <OptimizedImage
                  src={product.imagen}
                  alt={product.nombre}
                  width={640}
                  height={480}
                  priority={index < 4}
                  className="products-page__card-image"
                />
              </div>
            ) : (
              <div className="products-page__card-media products-page__card-media--placeholder" aria-hidden="true">
                {estaAgotado ? (
                  <span className="products-page__agotado-badge" role="status">
                    Agotado
                  </span>
                ) : null}
              </div>
            )}

            <div className="products-page__card-body">
              <h2>{product.nombre}</h2>
              <p className="products-page__price">CRC {precioConIVA.toLocaleString('es-CR')}</p>
            </div>

            <div className="products-page__card-actions">
              <Link
                to="/productos/$productId"
                params={{ productId: String(product.id) }}
                className="products-page__details-btn"
                onClick={(e) => e.stopPropagation()}
              >
                Detalles
              </Link>

              <button
                type="button"
                className="products-page__quick-buy"
                onClick={(e) => {
                  e.stopPropagation();
                  addProductToCart(product, 1);
                  pulseButton(e.currentTarget);
                  e.currentTarget.blur();
                }}
                disabled={estaAgotado}
                aria-label={`Añadir ${product.nombre} al carrito`}
              >
                <ShoppingCart className="products-page__quick-buy-icon" aria-hidden="true" />
              </button>
            </div>
          </article>
          );
        })}
      </section>

      <nav className="products-page__pagination" aria-label="Paginacion de productos">
        {Array.from({ length: totalPages }, (_, index) => {
          const pageNumber = index + 1;
          return (
            <button
              key={pageNumber}
              type="button"
              className={`products-page__page-button ${
                currentPage === pageNumber ? 'is-active' : ''
              }`}
              onClick={() => goToPage(pageNumber)}
              aria-current={currentPage === pageNumber ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          );
        })}
      </nav>
    </main>
    </PublicPageGate>
  );
};

export default Products;
