import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, ChevronDown, Search, ShoppingCart, Store } from 'lucide-react';
import OptimizedImage from '../../Components/OptimizedImage/OptimizedImage';
import { PublicPageGate } from '../../Components/PublicPageGate/PublicPageGate';
import { usePublicPageLoadingGate } from '../../hooks/usePublicPageLoadingGate';
import { addProductToCart, pulseButton } from '../../lib/cartStorage';
import { getLoadingMessageForCacheKey } from '../../lib/pageLoadingMessages';
import { etiquetaCategoriaProducto } from '../../lib/categorias';
import { imagenPrincipalProducto, parsearImagenesProducto } from '../../lib/productoImagenes';
import { calcularPrecioConIVA, obtenerDisponibilidadPuntosVenta, obtenerProductoPorId, obtenerProductos } from '../../services/productosService';
import { clasificarDisponibilidad } from '../../lib/productoDisponibilidad';
import { useTraducir, useTraducirLista, useTraducirObjeto } from '../../hooks/useTraducir';
import { ST } from '../../Components/T/ST';
import { ImageLightbox } from '../../Components/ImageLightbox/ImageLightbox';
import './ProductDetail.css';

function formatCRC(value) {
  return `\u20A1${(Number(value) || 0).toLocaleString('es-CR')}`;
}

const CAMPOS_PRODUCTO = ['nombre', 'descripcion', 'categoria', 'subcategoria'];

const ProductDetail = () => {
  const navigate = useNavigate();
  const { productId } = useParams({ strict: false });
  const [product, setProduct] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [fotoActiva, setFotoActiva] = useState(0);
  const [lightboxAbierto, setLightboxAbierto] = useState(false);
  const [specsAbiertas, setSpecsAbiertas] = useState(true);
  const [puntosVenta, setPuntosVenta] = useState([]);

  const tVolver = useTraducir('Volver al catálogo');
  const tIva = useTraducir('IVA incluido');
  const tPresentacion = useTraducir('Presentación');
  const tCantidad = useTraducir('Cantidad');
  const tAgotado = useTraducir('Agotado');
  const tAnadir = useTraducir('Añadir al carrito');
  const tFicha = useTraducir('Información del producto');
  const tCategoria = useTraducir('Categoría');
  const tSubcategoria = useTraducir('Subcategoría');
  const tPrecioSin = useTraducir('Precio (sin IVA)');
  const tInicio = useTraducir('Inicio');
  const tProductos = useTraducir('Productos');
  const tTambien = useTraducir('También te puede gustar');
  const tVerCat = useTraducir('Ver catálogo');
  const tUnidades = useTraducir('unidades');
  const tPuntosVenta = useTraducir('Disponible por punto de venta');

  const productoUi = useTraducirObjeto(
    product ?? { nombre: '', descripcion: '', categoria: '', subcategoria: '' },
    CAMPOS_PRODUCTO,
  );
  const relacionadosUi = useTraducirLista(relacionados, ['nombre']);
  const display = product ? (productoUi || product) : null;

  const numericId = Number(productId);
  const isReady = !loading;
  const showLoading = usePublicPageLoadingGate('product-detail', isReady);
  const loadingMessage = getLoadingMessageForCacheKey('product-detail');

  useEffect(() => {
    let active = true;

    const loadProduct = async () => {
      if (!Number.isFinite(numericId)) {
        if (active) {
          setLoadError('Producto no encontrado.');
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setLoadError('');
        const [data, catalogo] = await Promise.all([
          obtenerProductoPorId(numericId),
          obtenerProductos().catch(() => []),
        ]);

        if (!active) return;

        if (!data || data.estado === 'Deshabilitado') {
          setProduct(null);
          setRelacionados([]);
          setLoadError('Producto no encontrado o no disponible.');
        } else {
          setProduct(data);
          setQuantity(1);
          setFotoActiva(0);
          setLightboxAbierto(false);
          setRelacionados(
            (Array.isArray(catalogo) ? catalogo : [])
              .filter((item) => String(item.id) !== String(data.id) && item.estado !== 'Deshabilitado' && imagenPrincipalProducto(item))
              .slice(0, 4),
          );
          obtenerDisponibilidadPuntosVenta([data.id])
            .then((disp) => {
              if (!active) return;
              const row = (disp.porProducto || []).find((item) => String(item.productoId) === String(data.id));
              setPuntosVenta(row?.puntos || []);
            })
            .catch(() => {
              if (active) setPuntosVenta([]);
            });
        }
      } catch {
        if (active) {
          setProduct(null);
          setLoadError('No se pudo cargar el producto.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProduct();

    return () => {
      active = false;
    };
  }, [numericId]);

  const fotos = useMemo(() => parsearImagenesProducto(product), [product]);
  const fotoActual = fotos[fotoActiva] || fotos[0] || '';
  const precioNormal = useMemo(
    () => Number(product?.precioNormal ?? product?.priceWithoutIva ?? product?.price ?? 0) || 0,
    [product],
  );
  const precioConIVA = useMemo(() => calcularPrecioConIVA(precioNormal), [precioNormal]);
  const stockPosMax = useMemo(
    () => puntosVenta.reduce((max, punto) => Math.max(max, Number(punto.stock) || 0), 0),
    [puntosVenta],
  );
  const stockDisponible = stockPosMax > 0 ? stockPosMax : Number(product?.stock) || 0;
  const disponibilidad = clasificarDisponibilidad(
    puntosVenta.length > 0
      ? { ...(product || {}), stock: stockPosMax, stockTotal: stockPosMax }
      : product || { stock: 0 },
  );
  const estaAgotado = disponibilidad.codigo === 'agotado';

  const changeQuantity = (delta) => {
    setQuantity((current) => {
      const nextValue = current + delta;
      return Math.min(Math.max(nextValue, 1), stockDisponible || 1);
    });
  };

  const handleAddToCart = (event) => {
    if (!product) return;
    if (addProductToCart(product, quantity)) {
      pulseButton(event.currentTarget);
    }
  };

  const handleBack = () => {
    navigate({ to: '/productos' });
  };

  return (
    <PublicPageGate
      showLoading={showLoading}
      loadingMessage={loadingMessage}
      isError={Boolean(loadError) && !loading}
      error={loadError}
      errorMessage={loadError}
      onRetry={() => window.location.reload()}
    >
      <main className="product-detail-page">
        <div className="product-detail-page__top">
          <Link to="/productos" className="product-detail-page__back">
            <ArrowLeft size={16} aria-hidden="true" />
            {tVolver}
          </Link>
          {product && display ? (
            <nav className="product-detail-page__crumb" aria-label="breadcrumb">
              <Link to="/">{tInicio}</Link>
              <span aria-hidden="true">/</span>
              <Link to="/productos">{tProductos}</Link>
              {display.categoria ? (
                <>
                  <span aria-hidden="true">/</span>
                  <span>{display.categoria}</span>
                </>
              ) : null}
              <span aria-hidden="true">/</span>
              <strong>{display.nombre}</strong>
            </nav>
          ) : null}
        </div>

        {!product && !loading ? (
          <section className="product-detail-page__empty">
            <p>{loadError || 'Producto no encontrado.'}</p>
            <button type="button" className="product-detail-page__close-btn" onClick={handleBack}>{tVolver}</button>
          </section>
        ) : null}

        {product && display ? (
          <>
          <article className="product-detail-page__layout">
            <div className="product-detail-page__gallery">
              <div
                className="product-detail-page__media"
                role={fotoActual ? 'button' : undefined}
                tabIndex={fotoActual ? 0 : undefined}
                onClick={() => {
                  if (fotoActual) setLightboxAbierto(true);
                }}
                onKeyDown={(event) => {
                  if (!fotoActual) return;
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setLightboxAbierto(true);
                  }
                }}
                aria-label={fotoActual ? `Ampliar imagen de ${display.nombre}` : undefined}
              >
                {fotoActual ? (
                  <OptimizedImage
                    src={fotoActual}
                    alt={display.nombre}
                    width={960}
                    height={960}
                    priority
                    className="product-detail-page__image"
                  />
                ) : (
                  <div className="product-detail-page__media-placeholder" aria-hidden="true" />
                )}
                {fotoActual ? (
                  <span className="product-detail-page__zoom" aria-hidden="true">
                    <Search size={16} strokeWidth={2.2} />
                  </span>
                ) : null}
              </div>
              {fotos.length > 0 ? (
                <div className="product-detail-page__thumbs" role="list">
                  {fotos.map((src, index) => (
                    <button
                      key={`${src}-${index}`}
                      type="button"
                      className={`product-detail-page__thumb${index === fotoActiva ? ' is-active' : ''}`}
                      onClick={() => setFotoActiva(index)}
                      aria-label={`Foto ${index + 1} de ${display.nombre}`}
                    >
                      <img src={src} alt="" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="product-detail-page__content">
              <header className="product-detail-page__header">
                {display.categoria ? <p className="product-detail-page__eyebrow">{display.categoria}</p> : null}
                <h1>{display.nombre}</h1>
                {(() => {
                  const etiquetaRaw = etiquetaCategoriaProducto(product);
                  const etiqueta = etiquetaRaw ? (
                    <ST>{etiquetaRaw}</ST>
                  ) : null;
                  if (product.peso && etiquetaRaw) {
                    return (
                      <p className="product-detail-page__series">
                        <ST>{etiquetaRaw}</ST>
                        {` · ${product.peso}`}
                      </p>
                    );
                  }
                  if (product.peso) return <p className="product-detail-page__series">{product.peso}</p>;
                  if (etiqueta) return <p className="product-detail-page__series">{etiqueta}</p>;
                  return null;
                })()}
              </header>

              <p className="product-detail-page__price">{formatCRC(precioConIVA)}</p>
              <p className="product-detail-page__vat">{tIva}</p>

              {display.descripcion ? (
                <p className="product-detail-page__description">{display.descripcion}</p>
              ) : null}

              {product.peso ? (
                <div className="product-detail-page__chips">
                  <p className="product-detail-page__chips-label">{tPresentacion}</p>
                  <span className="product-detail-page__chip is-active">{product.peso}</span>
                </div>
              ) : null}

              {puntosVenta.length > 0 ? (
                <div className="product-detail-page__pos">
                  <p className="product-detail-page__pos-title">{tPuntosVenta}</p>
                  <ul>
                    {puntosVenta.map((punto) => (
                      <li key={punto.code}>
                        <span className="product-detail-page__pos-name">
                          <Store size={16} aria-hidden="true" />
                          {punto.name}
                        </span>
                        <strong>
                          {Number(punto.stock) > 0
                            ? `${punto.stock} ${tUnidades}`
                            : tAgotado}
                        </strong>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="product-detail-page__quantity-row">
                <span className="product-detail-page__quantity-label">{tCantidad}</span>
                <div className="product-detail-page__quantity-stepper" aria-label={tCantidad}>
                  <button
                    type="button"
                    className="product-detail-page__quantity-btn"
                    onClick={() => changeQuantity(-1)}
                    disabled={quantity <= 1}
                    aria-label="−"
                  >
                    −
                  </button>
                  <span className="product-detail-page__quantity-value" aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    className="product-detail-page__quantity-btn"
                    onClick={() => changeQuantity(1)}
                    disabled={quantity >= stockDisponible}
                    aria-label="+"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="product-detail-page__actions">
                <button
                  type="button"
                  className="product-detail-page__buy-btn"
                  onClick={handleAddToCart}
                  disabled={estaAgotado}
                >
                  <ShoppingCart size={18} aria-hidden="true" />
                  {estaAgotado ? tAgotado : tAnadir}
                </button>
                <button type="button" className="product-detail-page__close-btn" onClick={handleBack}>
                  <ArrowLeft size={16} aria-hidden="true" />
                  {tVolver}
                </button>
              </div>
            </div>

            <aside className="product-detail-page__specs">
              <button
                type="button"
                className="product-detail-page__accordion-trigger"
                onClick={() => setSpecsAbiertas((open) => !open)}
                aria-expanded={specsAbiertas}
              >
                {tFicha}
                <ChevronDown size={18} className={specsAbiertas ? 'is-open' : ''} aria-hidden="true" />
              </button>
              {specsAbiertas ? (
                <dl className="product-detail-page__meta">
                  <div className="product-detail-page__meta-row">
                    <dt>{tCategoria}</dt>
                    <dd>{display.categoria || '—'}</dd>
                  </div>
                  {display.subcategoria ? (
                    <div className="product-detail-page__meta-row">
                      <dt>{tSubcategoria}</dt>
                      <dd>{display.subcategoria}</dd>
                    </div>
                  ) : null}
                  <div className="product-detail-page__meta-row">
                    <dt>{tPresentacion}</dt>
                    <dd>{product.peso || '—'}</dd>
                  </div>
                  <div className="product-detail-page__meta-row">
                    <dt>{tPrecioSin}</dt>
                    <dd>{formatCRC(precioNormal)}</dd>
                  </div>
                </dl>
              ) : null}
            </aside>
          </article>

          {(relacionadosUi || relacionados).length > 0 ? (
            <section className="product-detail-page__related" aria-labelledby="productos-relacionados-title">
              <div className="product-detail-page__related-header">
                <h2 id="productos-relacionados-title">{tTambien}</h2>
                <Link to="/productos">{tVerCat}</Link>
              </div>
              <div className="product-detail-page__related-grid">
                {(relacionadosUi || relacionados).map((item) => (
                  <Link
                    key={item.id}
                    to="/productos/$productId"
                    params={{ productId: String(item.id) }}
                    className="product-detail-page__related-card"
                  >
                    <img src={imagenPrincipalProducto(item)} alt="" />
                    <h3>{item.nombre}</h3>
                    <p>{formatCRC(calcularPrecioConIVA(item.precioNormal))}</p>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
          <ImageLightbox
            images={fotos}
            index={lightboxAbierto ? fotoActiva : -1}
            onClose={() => setLightboxAbierto(false)}
            onIndexChange={setFotoActiva}
            alt={display.nombre}
          />
          </>
        ) : null}
      </main>
    </PublicPageGate>
  );
};

export default ProductDetail;
