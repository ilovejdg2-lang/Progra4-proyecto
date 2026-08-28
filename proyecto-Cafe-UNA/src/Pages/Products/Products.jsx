import { useEffect, useMemo, useState } from 'react';
import { Link } from '@tanstack/react-router';
import {
  Check,
  ChevronDown,
  Coffee,
  Filter,
  Package,
  Search,
  Shirt,
  ShoppingCart,
  SlidersHorizontal,
  Tag,
  X,
} from 'lucide-react';
import BackToHomeLink from '../../Components/BackToHomeLink/BackToHomeLink';
import OptimizedImage from '../../Components/OptimizedImage/OptimizedImage';
import { HOME_SCROLL_SECTIONS } from '../../lib/homeScrollTarget';
import {
  categoriasUnicas,
  esCategoriaRaiz,
  filtrarPorCategoria,
  nombreCategoria,
  TIPO_CATEGORIA_PRODUCTO,
} from '../../lib/categorias';
import { imagenPrincipalProducto } from '../../lib/productoImagenes';
import './Products.css';
import { PublicPageGate } from '../../Components/PublicPageGate/PublicPageGate';
import { useCachedPublicPage } from '../../hooks/useCachedPublicPage';
import { addProductToCart, pulseButton } from '../../lib/cartStorage';
import { fetchProductsPageData } from '../../lib/productsPageData';
import { obtenerCategorias } from '../../services/categoriasService';
import { calcularPrecioConIVA } from '../../services/productosService';
import { clasificarDisponibilidad } from '../../lib/productoDisponibilidad';

const PRODUCTS_PER_PAGE = 10;

function coincidenciaBusqueda(producto, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return true;
  return String(producto?.nombre || '').toLowerCase().includes(q);
}

function mergeNombres(...listas) {
  return categoriasUnicas(listas.flat().map((nombre) => ({ categoria: nombre })));
}

function iconoDeCategoria(nombre) {
  const n = String(nombre || '').toLowerCase();
  if (n.includes('caf')) return Coffee;
  if (n.includes('camisa') || n.includes('ropa') || n.includes('shirt') || n.includes('polo')) {
    return Shirt;
  }
  return Tag;
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
  const [categoria, setCategoria] = useState('todas');
  const [subcategoria, setSubcategoria] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [categoriasApi, setCategoriasApi] = useState([]);
  const [abiertas, setAbiertas] = useState({});

  useEffect(() => {
    let activo = true;
    obtenerCategorias(TIPO_CATEGORIA_PRODUCTO)
      .then((lista) => {
        if (activo) setCategoriasApi(lista);
      })
      .catch(() => {
        if (activo) setCategoriasApi([]);
      });
    return () => {
      activo = false;
    };
  }, []);

  const visibleProducts = useMemo(
    () => products.filter((product) => product.estado !== 'Deshabilitado'),
    [products],
  );

  const categoriasRaizApi = useMemo(
    () => categoriasApi.filter(esCategoriaRaiz).map((item) => item.nombre),
    [categoriasApi],
  );

  const categorias = useMemo(
    () => mergeNombres(categoriasRaizApi, categoriasUnicas(visibleProducts)),
    [categoriasRaizApi, visibleProducts],
  );

  const subcategoriasPorCategoria = useMemo(() => {
    const mapa = {};
    for (const nombre of categorias) {
      const desdeApi = categoriasApi
        .filter(
          (item) =>
            nombreCategoria(item.padre).toLowerCase() === nombre.toLowerCase(),
        )
        .map((item) => item.nombre);
      const desdeProductos = categoriasUnicas(
        filtrarPorCategoria(visibleProducts, nombre),
        (item) => item?.subcategoria,
      );
      mapa[nombre] = mergeNombres(desdeApi, desdeProductos);
    }
    return mapa;
  }, [categorias, categoriasApi, visibleProducts]);

  useEffect(() => {
    if (!categorias.length) return;
    setAbiertas((actual) => {
      const siguiente = { ...actual };
      let cambio = false;
      for (const nombre of categorias) {
        if ((subcategoriasPorCategoria[nombre] || []).length > 0 && siguiente[nombre] == null) {
          siguiente[nombre] = true;
          cambio = true;
        }
      }
      return cambio ? siguiente : actual;
    });
  }, [categorias, subcategoriasPorCategoria]);

  useEffect(() => {
    if (categoria === 'todas') return;
    setAbiertas((actual) => ({ ...actual, [categoria]: true }));
  }, [categoria]);

  const productosFiltrados = useMemo(() => {
    const porCategoria = filtrarPorCategoria(visibleProducts, categoria);
    const porSub = filtrarPorCategoria(porCategoria, subcategoria, (item) => item?.subcategoria);
    return porSub.filter((producto) => coincidenciaBusqueda(producto, busqueda));
  }, [visibleProducts, categoria, subcategoria, busqueda]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categoria, subcategoria, busqueda]);

  const cambiarCategoria = (valor) => {
    setCategoria(valor);
    setSubcategoria('todas');
    if (valor !== 'todas') {
      setAbiertas((actual) => ({ ...actual, [valor]: true }));
    }
    setFiltrosAbiertos(false);
  };

  const cambiarSubcategoria = (cat, sub) => {
    setCategoria(cat);
    setSubcategoria(sub);
    setAbiertas((actual) => ({ ...actual, [cat]: true }));
    setFiltrosAbiertos(false);
  };

  const toggleGrupo = (nombre) => {
    setAbiertas((actual) => ({ ...actual, [nombre]: !actual[nombre] }));
  };

  const totalPages = Math.ceil(productosFiltrados.length / PRODUCTS_PER_PAGE) || 1;

  const currentProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return productosFiltrados.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [currentPage, productosFiltrados]);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const etiquetaActiva =
    categoria === 'todas'
      ? 'Todas'
      : subcategoria !== 'todas'
        ? `${categoria} · ${subcategoria}`
        : categoria;

  const hayFiltros =
    categoria !== 'todas' || subcategoria !== 'todas' || Boolean(String(busqueda).trim());

  const productCards = currentProducts.map((product) => {
    const precioNormal = Number(product.precioNormal ?? product.priceWithoutIva ?? product.price ?? 0) || 0;
    const precioConIVA = calcularPrecioConIVA(precioNormal);
    const disponibilidad = clasificarDisponibilidad(product);
    const estaAgotado = disponibilidad.codigo === 'agotado';

    return {
      product,
      precioNormal,
      precioConIVA,
      stockDisponible: disponibilidad.stock,
      disponibilidad,
      estaAgotado,
    };
  });

  const asideNav = (
    <nav className="products-page__aside-nav" aria-label={"Categor\u00edas del cat\u00e1logo"}>
      <button
        type="button"
        className={`products-page__aside-link${categoria === 'todas' ? ' is-active' : ''}`}
        onClick={() => cambiarCategoria('todas')}
      >
        {categoria === 'todas' ? (
          <Check size={16} aria-hidden="true" />
        ) : (
          <Package size={16} aria-hidden="true" />
        )}
        <span>Todas</span>
      </button>

      {categorias.map((nombre) => {
        const activa = nombreCategoria(categoria).toLowerCase() === nombre.toLowerCase();
        const hijas = subcategoriasPorCategoria[nombre] || [];
        const expandida = Boolean(abiertas[nombre]) || activa;
        const Icono = iconoDeCategoria(nombre);
        const categoriaSeleccionada = activa && subcategoria === 'todas';
        return (
          <div key={nombre} className={`products-page__aside-group${activa ? ' is-open' : ''}`}>
            <div className="products-page__aside-row">
              <button
                type="button"
                className={`products-page__aside-link${categoriaSeleccionada ? ' is-active' : ''}${activa ? ' is-current' : ''}`}
                onClick={() => cambiarCategoria(nombre)}
              >
                {categoriaSeleccionada ? (
                  <Check size={16} aria-hidden="true" />
                ) : (
                  <Icono size={16} aria-hidden="true" />
                )}
                <span>{nombre}</span>
              </button>
              {hijas.length > 0 ? (
                <button
                  type="button"
                  className={`products-page__aside-toggle${expandida ? ' is-open' : ''}`}
                  onClick={() => toggleGrupo(nombre)}
                  aria-expanded={expandida}
                  aria-label={expandida ? `Ocultar subcategor\u00edas de ${nombre}` : `Ver subcategor\u00edas de ${nombre}`}
                >
                  <ChevronDown size={16} aria-hidden="true" />
                </button>
              ) : null}
            </div>
            {hijas.length > 0 && expandida ? (
              <ul className="products-page__aside-sublist">
                {hijas.map((sub) => (
                  <li key={sub}>
                    <button
                      type="button"
                      className={`products-page__aside-sublink${
                        activa &&
                        nombreCategoria(subcategoria).toLowerCase() === sub.toLowerCase()
                          ? ' is-active'
                          : ''
                      }`}
                      onClick={() => cambiarSubcategoria(nombre, sub)}
                    >
                      <span className="products-page__aside-dot" aria-hidden="true" />
                      <span>{sub}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </nav>
  );

  return (
    <PublicPageGate
      showLoading={showLoading}
      loadingMessage={loadingMessage}
      isError={isError}
      error={loadError}
      errorMessage={"No se pudo cargar el cat\u00e1logo."}
      onRetry={reload}
    >
      <main className="products-page">
        <BackToHomeLink homeSection={HOME_SCROLL_SECTIONS.products} />
        <section className="products-page__hero">
          <div className="products-page__hero-copy">
            <h1>Productos</h1>
            <p className="products-page__hero-lead">Explora nuestro catálogo disponible.</p>
          </div>
          <p className="products-page__count-badge" aria-live="polite">
            <Package size={15} aria-hidden="true" />
            <span>
              {productosFiltrados.length}{' '}
              {productosFiltrados.length === 1 ? 'producto' : 'productos'}
              {etiquetaActiva !== 'Todas' ? ` · ${etiquetaActiva}` : ''}
            </span>
          </p>
        </section>

        <div className="products-page__shop">
          <aside className="products-page__aside" aria-label="Filtros">
            <div className="products-page__aside-head">
              <h2>
                <Filter size={16} aria-hidden="true" />
                Filtros
              </h2>
              {hayFiltros ? (
                <button
                  type="button"
                  className="products-page__aside-clear"
                  onClick={() => {
                    setCategoria('todas');
                    setSubcategoria('todas');
                    setBusqueda('');
                  }}
                >
                  Limpiar
                </button>
              ) : null}
            </div>
            <div className="products-page__aside-block">
              <h3>Categoría</h3>
              {asideNav}
            </div>
          </aside>

          <div className="products-page__catalog">
            <div className="products-page__toolbar">
              <label className="products-page__search">
                <Search className="products-page__search-icon" size={18} aria-hidden="true" />
                <span className="sr-only">Buscar productos</span>
                <input
                  type="search"
                  value={busqueda}
                  onChange={(event) => setBusqueda(event.target.value)}
                  placeholder="Buscar productos."
                  aria-label="Buscar productos"
                  autoComplete="off"
                />
                {busqueda ? (
                  <button
                    type="button"
                    className="products-page__search-clear"
                    onClick={() => setBusqueda('')}
                    aria-label={"Limpiar b\u00fasqueda"}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                ) : null}
              </label>

              <button
                type="button"
                className="products-page__filters-toggle"
                onClick={() => setFiltrosAbiertos(true)}
                aria-expanded={filtrosAbiertos}
              >
                <SlidersHorizontal size={16} aria-hidden="true" />
                Filtros
              </button>

              <div className="products-page__pills" role="group" aria-label={"Filtro r\u00e1pido por categor\u00eda"}>
                <button
                  type="button"
                  className={`products-page__pill${categoria === 'todas' ? ' is-active' : ''}`}
                  onClick={() => cambiarCategoria('todas')}
                >
                  Todas
                </button>
                {categorias.map((nombre) => {
                  const activa = nombreCategoria(categoria).toLowerCase() === nombre.toLowerCase();
                  return (
                    <button
                      key={nombre}
                      type="button"
                      className={`products-page__pill${activa ? ' is-active' : ''}`}
                      onClick={() => cambiarCategoria(nombre)}
                    >
                      {nombre}
                    </button>
                  );
                })}
              </div>
            </div>

            <section className="products-page__grid" aria-label="Lista de productos">
              {productCards.length === 0 && (
                <p className="products-page__empty">
                  {hayFiltros
                    ? 'No hay productos con esos filtros. Prob\u00e1 otra b\u00fasqueda o categor\u00eda.'
                    : 'No hay productos disponibles en este momento.'}
                </p>
              )}
              {productCards.map((card, index) => {
                const { product, precioConIVA, estaAgotado, disponibilidad } = card;
                const foto = imagenPrincipalProducto(product);

                return (
                  <article
                    className={`products-page__card${estaAgotado ? ' products-page__card--agotado' : ''}`}
                    key={product.id}
                  >
                    <Link
                      to="/productos/$productId"
                      params={{ productId: String(product.id) }}
                      className="products-page__card-hit"
                    >
                      <span className="sr-only">{`Ver detalles de ${product.nombre}`}</span>
                    </Link>

                    {foto ? (
                      <div className="products-page__card-media">
                        <OptimizedImage
                          src={foto}
                          alt={product.nombre}
                          width={640}
                          height={480}
                          priority={index < 4}
                          className="products-page__card-image"
                        />
                      </div>
                    ) : (
                      <div
                        className="products-page__card-media products-page__card-media--placeholder"
                        aria-hidden="true"
                      />
                    )}

                    <div className="products-page__card-body">
                      <h2>{product.nombre}</h2>
                      <p className="products-page__price">CRC {precioConIVA.toLocaleString('es-CR')}</p>
                      <p className="products-page__stock-line">
                        {estaAgotado
                          ? 'Sin unidades disponibles'
                          : `${disponibilidad.stock} unidad${disponibilidad.stock === 1 ? '' : 'es'} en bodega`}
                      </p>
                    </div>

                    <div className="products-page__card-actions">
                      <Link
                        to="/productos/$productId"
                        params={{ productId: String(product.id) }}
                        className="products-page__details-btn"
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
                        aria-label={`A\u00f1adir ${product.nombre} al carrito`}
                      >
                        <ShoppingCart className="products-page__quick-buy-icon" aria-hidden="true" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>

            {totalPages > 1 ? (
              <nav className="products-page__pagination" aria-label={"Paginaci\u00f3n de productos"}>
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
            ) : null}
          </div>
        </div>

        {filtrosAbiertos ? (
          <div className="products-page__drawer" role="dialog" aria-modal="true" aria-label="Filtros">
            <button
              type="button"
              className="products-page__drawer-backdrop"
              aria-label="Cerrar filtros"
              onClick={() => setFiltrosAbiertos(false)}
            />
            <div className="products-page__drawer-panel">
              <div className="products-page__aside-head">
                <h2>
                  <Filter size={16} aria-hidden="true" />
                  Filtros
                </h2>
                <button
                  type="button"
                  className="products-page__drawer-close"
                  onClick={() => setFiltrosAbiertos(false)}
                  aria-label="Cerrar"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
              <div className="products-page__aside-block">
                <h3>Categoría</h3>
                {asideNav}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </PublicPageGate>
  );
};

export default Products;
