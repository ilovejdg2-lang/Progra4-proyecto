import { useMemo, useState, useRef, useEffect } from 'react';
import './Products.css';

const PRODUCTS_PER_PAGE = 8;
const CART_STORAGE_KEY = 'cart';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastAddedProductId, setLastAddedProductId] = useState(null);
  const addTimerRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${import.meta.env.VITE_JSONBIN_BIN_ID_PRODUCTOS}`, {
          headers: {
            'X-Access-Key': import.meta.env.VITE_JSONBIN_API_KEY_LECTURA_PRODUCTOS
          }
        });
        if (!response.ok) {
          throw new Error('Error al cargar los productos');
        }
        const data = await response.json();
        setProducts(data.record.productos);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const totalPages = Math.ceil(products.length / PRODUCTS_PER_PAGE) || 1;

  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return products.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [currentPage, products]);

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
        {loading && <p>Cargando productos...</p>}
        {error && <p>Error: {error}</p>}
        {!loading && !error && currentProducts.map((product) => (
          <article className="products-page__card" key={product.id}>
            {product.imagen && (
              <img 
                src={product.imagen} 
                alt={product.nombre} 
                style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', marginBottom: '16px' }} 
              />
            )}
            <h2>{product.nombre}</h2>
            <p>
              <strong>Cantidad:</strong> {product.peso}
            </p>
            <p>
              <strong>Precio:</strong> CRC {product.precioNormal.toLocaleString('es-CR')}
            </p>
            <p style={{ fontSize: '0.85em', color: '#666', marginBottom: '12px' }}>
              {product.descripcion}
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
  );
};

export default Products;