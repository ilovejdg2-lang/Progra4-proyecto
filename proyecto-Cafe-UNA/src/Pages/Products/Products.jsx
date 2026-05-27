import { useMemo, useState, useRef, useEffect } from 'react';
import { ShoppingCart } from 'lucide-react';
import './Products.css';
import { calcularPrecioConIVA, obtenerProductos } from '../../services/productosServices';

const PRODUCTS_PER_PAGE = 8;
const CART_STORAGE_KEY = 'cart';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastAddedProductId, setLastAddedProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationVisible, setConfirmationVisible] = useState(false);
  const addTimerRef = useRef(null);
  const confirmationTimerRef = useRef(null);

  const openProduct = (card) => {
    setSelectedProduct(card);
    setSelectedQuantity(1);
    setConfirmationMessage('');
    setConfirmationVisible(false);
  };

  const closeProduct = () => {
    setSelectedProduct(null);
    setSelectedQuantity(1);
    setConfirmationVisible(false);
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') closeProduct(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      setSelectedQuantity(1);
      setConfirmationMessage('');
      setConfirmationVisible(false);
    }
  }, [selectedProduct]);

  const changeQuantity = (delta) => {
    if (!selectedProduct) return;

    setSelectedQuantity((current) => {
      const nextValue = current + delta;
      return Math.min(Math.max(nextValue, 1), selectedProduct.stockDisponible);
    });
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await obtenerProductos();
        setProducts(data);
      } catch (err) {
        setError(err.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
    const rawCart = localStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = rawCart ? JSON.parse(rawCart) : [];

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
    setLastAddedProductId(product.id);

    if (addTimerRef.current) {
      window.clearTimeout(addTimerRef.current);
    }

    addTimerRef.current = window.setTimeout(() => {
      setLastAddedProductId(null);
      addTimerRef.current = null;
    }, 2100);

    setConfirmationMessage(`Se añadieron ${quantity} unidad${quantity === 1 ? '' : 'es'} de ${product.nombre} al carrito.`);
    setConfirmationVisible(true);

    if (confirmationTimerRef.current) {
      window.clearTimeout(confirmationTimerRef.current);
    }

    confirmationTimerRef.current = window.setTimeout(() => {
      setConfirmationVisible(false);
    }, 2000);

    window.setTimeout(() => {
      setConfirmationMessage('');
      confirmationTimerRef.current = null;
    }, 2300);
  };

  useEffect(() => () => {
    if (addTimerRef.current) {
      window.clearTimeout(addTimerRef.current);
      addTimerRef.current = null;
    }
    if (confirmationTimerRef.current) {
      window.clearTimeout(confirmationTimerRef.current);
      confirmationTimerRef.current = null;
    }
  }, []);

  return (
    <main className="products-page">
      <section className="products-page__hero">
        <h1>Catálogo de Cafés</h1>
        <p>
          Explora nuestros productos y elige el grano ideal para tu rutina.
        </p>
      </section>

      <section className="products-page__grid" aria-label="Lista de productos de cafe">
        {loading && <p>Cargando productos...</p>}
        {error && <p>Error: {error}</p>}
        {!loading && !error && productCards.length === 0 && (
          <p>No hay productos disponibles en este momento.</p>
        )}
        {!loading && !error && productCards.map(({ product, precioNormal, precioConIVA, stockDisponible, estaAgotado }) => (
          <article
            className={`products-page__card`}
            key={product.id}
            onClick={() => openProduct({ product, precioNormal, precioConIVA, stockDisponible, estaAgotado })}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openProduct({ product, precioNormal, precioConIVA, stockDisponible, estaAgotado }); } }}
          >
            {product.imagen && (
              <img
                className="products-page__card-image"
                src={product.imagen}
                alt={product.nombre}
              />
            )}

            <h2>{product.nombre}</h2>

            <p className="products-page__price"><strong>CRC {precioConIVA.toLocaleString('es-CR')}</strong></p>

            <button
              type="button"
              className="products-page__quick-buy"
              onClick={(e) => {
                e.stopPropagation();
                handleBuy(product, 1);
                e.currentTarget.blur();
              }}
              disabled={estaAgotado}
              aria-label={`Compra rápida de ${product.nombre}`}
            >
              <ShoppingCart className="products-page__quick-buy-icon" aria-hidden="true" />
              <span className="products-page__quick-buy-text">Compra rápida</span>
            </button>
          </article>
        ))}
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

      {selectedProduct ? (
        <div className="product-modal-overlay" onClick={closeProduct}>
          <div className="product-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <button className="product-modal__close" onClick={closeProduct} aria-label="Cerrar">×</button>
            <div className="product-modal__image">
              {selectedProduct.product.imagen && (
                <img src={selectedProduct.product.imagen} alt={selectedProduct.product.nombre} />
              )}
            </div>
            <div className="product-modal__content">
              <h2>{selectedProduct.product.nombre}</h2>
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

              {confirmationMessage ? (
                <p
                  className={`product-modal__confirmation ${confirmationVisible ? 'is-visible' : 'is-hiding'}`}
                  aria-live="polite"
                >
                  {confirmationMessage}
                </p>
              ) : null}

              <div className="product-modal__actions">
                <button
                  type="button"
                  className="products-page__buy-button"
                  onClick={(e) => { e.stopPropagation(); handleBuy(selectedProduct.product, selectedQuantity); }}
                  disabled={selectedProduct.estaAgotado}
                >
                  {selectedProduct.estaAgotado ? 'Agotado' : 'Añadir al carrito'}
                </button>
                <button type="button" className="products-page__page-button" onClick={closeProduct}>Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
};

export default Products;