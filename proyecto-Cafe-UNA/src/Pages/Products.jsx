import { useMemo, useState, useRef, useEffect } from 'react';
import './Products.css';

const PRODUCTS = [
  { id: 1, name: 'Catuai Honey', quantity: '250 g', price: 6500 },
  { id: 2, name: 'Geisha Lavado', quantity: '340 g', price: 9800 },
  { id: 3, name: 'Bourbon Natural', quantity: '500 g', price: 11200 },
];

const PRODUCTS_PER_PAGE = 8;
const CART_STORAGE_KEY = 'cart';

const Products = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [lastAddedProductId, setLastAddedProductId] = useState(null);
  const addTimerRef = useRef(null);

  const totalPages = Math.ceil(PRODUCTS.length / PRODUCTS_PER_PAGE);

  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return PRODUCTS.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [currentPage]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) {
      return;
    }
    setCurrentPage(page);
  };

  const handleBuy = (product) => {
    const rawCart = localStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = rawCart ? JSON.parse(rawCart) : [];

    const existingProductIndex = parsedCart.findIndex((item) => item.id === product.id);

    if (existingProductIndex >= 0) {
      parsedCart[existingProductIndex] = {
        ...parsedCart[existingProductIndex],
        units: (parsedCart[existingProductIndex].units || 1) + 1,
      };
    } else {
      parsedCart.push({
        ...product,
        units: 1,
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
  };

  useEffect(() => () => {
    if (addTimerRef.current) {
      window.clearTimeout(addTimerRef.current);
      addTimerRef.current = null;
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
        {currentProducts.map((product) => (
          <article className="products-page__card" key={product.id}>
            <h2>{product.name}</h2>
            <p>
              <strong>Cantidad:</strong> {product.quantity}
            </p>
            <p>
              <strong>Precio:</strong> CRC {product.price.toLocaleString('es-CR')}
            </p>
            <button
              type="button"
              className="products-page__buy-button"
              onClick={() => handleBuy(product)}
            >
              Comprar
            </button>
            {lastAddedProductId === product.id ? (
              <p className="products-page__added" aria-live="polite">Producto agregado al carrito.</p>
            ) : null}
          </article>
        ))}
      </section>

      <nav className="products-page__pagination" aria-label="Paginacion de productos">
        <button
          type="button"
          className="products-page__page-button"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Anterior
        </button>

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

        <button
          type="button"
          className="products-page__page-button"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Siguiente
        </button>
      </nav>
    </main>
  );
};

export default Products;
