import { useMemo, useState, useRef, useEffect } from 'react';
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
  const addTimerRef = useRef(null);

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

  const handleBuy = (product) => {
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

    if (unidadesEnCarrito >= stockDisponible) {
      window.alert('No hay más unidades disponibles de este producto.');
      return;
    }

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
        {!loading && !error && productCards.length === 0 && (
          <p>No hay productos disponibles en este momento.</p>
        )}
        {!loading && !error && productCards.map(({ product, precioNormal, precioConIVA, stockDisponible, estaAgotado }) => (
          <article className="products-page__card" key={product.id}>
            {product.imagen && (
              <img 
                className="products-page__card-image"
                src={product.imagen} 
                alt={product.nombre} 
              />
            )}
            <h2>{product.nombre}</h2>
            <p>
              <strong>Cantidad:</strong> {product.peso}
            </p>
            <p>
              <strong>Precio:</strong> CRC {precioNormal.toLocaleString('es-CR')}
            </p>
            <p>
              <strong>Precio con IVA:</strong> CRC {precioConIVA.toLocaleString('es-CR')}
            </p>
            <p>
              <strong>Disponibles:</strong> {stockDisponible}
            </p>
            <p className="products-page__description">
              {product.descripcion}
            </p>
            <button
              type="button"
              className="products-page__buy-button"
              onClick={() => handleBuy(product)}
              disabled={estaAgotado}
            >
              {estaAgotado ? 'Agotado' : 'Comprar'}
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