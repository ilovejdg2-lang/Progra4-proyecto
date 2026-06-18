import { useMemo, useState, useRef, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import BackToHomeLink from '../../Components/BackToHomeLink/BackToHomeLink';
import OptimizedImage from '../../Components/OptimizedImage/OptimizedImage';
import { HOME_SCROLL_SECTIONS } from '../../lib/homeScrollTarget';
import './Products.css';
import { PublicPageGate } from '../../Components/PublicPageGate/PublicPageGate';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useCachedPublicPage } from '../../hooks/useCachedPublicPage';
import { fetchProductsPageData } from '../../lib/productsPageData';
import { calcularPrecioConIVA } from '../../services/productosServices';

const PRODUCTS_PER_PAGE = 8;
const CART_STORAGE_KEY = 'cart';

function getStoredCart() {
  try {
    const rawCart = localStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = rawCart ? JSON.parse(rawCart) : [];
    return Array.isArray(parsedCart) ? parsedCart : [];
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY);
    return [];
  }
}

function pulseButton(element) {
  if (!element) return;
  element.classList.add('is-pressed');
  window.setTimeout(() => element.classList.remove('is-pressed'), 220);
}

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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const productDialogRef = useRef(null);

  useBodyScrollLock(Boolean(selectedProduct));

  const openProduct = (card) => {
    setSelectedProduct(card);
    setSelectedQuantity(1);
  };

  const closeProduct = () => {
    setSelectedProduct(null);
    setSelectedQuantity(1);
  };

  useEffect(() => {
    const dialog = productDialogRef.current;
    if (!dialog) return undefined;

    if (selectedProduct) {
      if (!dialog.open) dialog.showModal();
    } else if (dialog.open) {
      dialog.close();
    }

    return undefined;
  }, [selectedProduct]);

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') closeProduct();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const changeQuantity = (delta) => {
    if (!selectedProduct) return;

    setSelectedQuantity((current) => {
      const nextValue = current + delta;
      return Math.min(Math.max(nextValue, 1), selectedProduct.stockDisponible);
    });
  };

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

  const handleBuy = (product, quantity = 1) => {
    const stockDisponible = Number(product.stock) || 0;
    const parsedCart = getStoredCart();

    const existingProductIndex = parsedCart.findIndex((item) => item.id === product.id);
    const unidadesEnCarrito = existingProductIndex >= 0 ? (Number(parsedCart[existingProductIndex].units) || 0) : 0;

    if (product.estado === 'Deshabilitado') {
      window.alert('Este producto está deshabilitado.');
      return;
    }

    if (stockDisponible <= 0) {
      window.alert('Este producto está agotado.');
      return;
    }

    if (unidadesEnCarrito + quantity > stockDisponible) {
      window.alert('No hay más unidades disponibles de este producto.');
      return;
    }

    if (existingProductIndex >= 0) {
      parsedCart[existingProductIndex] = {
        ...parsedCart[existingProductIndex],
        units: (parsedCart[existingProductIndex].units || 1) + quantity,
      };
    } else {
      parsedCart.push({
        ...product,
        units: quantity,
      });
    }

    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(parsedCart));
    window.dispatchEvent(new Event('cart-updated'));
  };

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
          const { product, precioNormal, precioConIVA, stockDisponible, estaAgotado } = card;

          return (
          <article
            className="products-page__card"
            key={product.id}
          >
            {product.imagen ? (
              <div className="products-page__card-media">
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
              <div className="products-page__card-media products-page__card-media--placeholder" aria-hidden="true" />
            )}

            <div className="products-page__card-body">
              <h2>{product.nombre}</h2>
              <p className="products-page__price">CRC {precioConIVA.toLocaleString('es-CR')}</p>
            </div>

            <div className="products-page__card-actions">
              <button
                type="button"
                className="products-page__details-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  openProduct(card);
                }}
              >
                Detalles
              </button>

              <button
                type="button"
                className="products-page__quick-buy"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBuy(product, 1);
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

      <dialog
        ref={productDialogRef}
        className="product-modal"
        aria-labelledby="product-modal-title"
        onCancel={(event) => {
          event.preventDefault();
          closeProduct();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeProduct();
        }}
      >
        {selectedProduct ? (
          <>
            <button type="button" className="product-modal__close" onClick={closeProduct} aria-label="Cerrar">×</button>
            <div className="product-modal__image">
              {selectedProduct.product.imagen && (
                <OptimizedImage
                  src={selectedProduct.product.imagen}
                  alt={selectedProduct.product.nombre}
                  priority
                  className="product-modal__image-media"
                />
              )}
            </div>
            <div className="product-modal__content">
              <h2 id="product-modal-title">{selectedProduct.product.nombre}</h2>
              <p className="product-modal__price"><strong>CRC {selectedProduct.precioConIVA.toLocaleString('es-CR')}</strong></p>
              <p>{selectedProduct.product.descripcion}</p>
              <ul className="product-modal__meta">
                <li><strong>Cantidad:</strong> {selectedProduct.product.peso}</li>
                <li><strong>Precio (sin IVA):</strong> CRC {selectedProduct.precioNormal.toLocaleString('es-CR')}</li>
                <li><strong>Disponibles:</strong> {selectedProduct.stockDisponible}</li>
              </ul>
              <div className="product-modal__quantity-row">
                <label className="product-modal__quantity-label" htmlFor="product-quantity">Cantidad</label>
                <div className="product-modal__quantity-stepper" aria-label="Selector de cantidad">
                  <button
                    type="button"
                    className="product-modal__quantity-stepper-button"
                    onClick={() => changeQuantity(-1)}
                    disabled={selectedQuantity <= 1}
                    aria-label="Disminuir cantidad"
                  >
                    −
                  </button>
                  <div className="product-modal__quantity-value" aria-live="polite">{selectedQuantity}</div>
                  <button
                    type="button"
                    className="product-modal__quantity-stepper-button"
                    onClick={() => changeQuantity(1)}
                    disabled={selectedQuantity >= selectedProduct.stockDisponible}
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="product-modal__actions">
                <button
                  type="button"
                  className="products-page__buy-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBuy(selectedProduct.product, selectedQuantity);
                    pulseButton(e.currentTarget);
                  }}
                  disabled={selectedProduct.estaAgotado}
                >
                  {selectedProduct.estaAgotado ? 'Agotado' : 'Añadir al carrito'}
                </button>
                <button type="button" className="products-page__page-button" onClick={closeProduct}>Cerrar</button>
              </div>
            </div>
          </>
        ) : null}
      </dialog>
    </main>
    </PublicPageGate>
  );
};

export default Products;