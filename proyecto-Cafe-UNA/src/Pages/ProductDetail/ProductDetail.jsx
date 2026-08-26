import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, ChevronDown, ShoppingBag } from 'lucide-react';
import OptimizedImage from '../../Components/OptimizedImage/OptimizedImage';
import { PublicPageGate } from '../../Components/PublicPageGate/PublicPageGate';
import { usePublicPageLoadingGate } from '../../hooks/usePublicPageLoadingGate';
import { addProductToCart, pulseButton } from '../../lib/cartStorage';
import { getLoadingMessageForCacheKey } from '../../lib/pageLoadingMessages';
import { etiquetaCategoriaProducto } from '../../lib/categorias';
import { imagenPrincipalProducto, parsearImagenesProducto } from '../../lib/productoImagenes';
import { calcularPrecioConIVA, obtenerProductoPorId, obtenerProductos } from '../../services/productosService';
import { clasificarDisponibilidad } from '../../lib/productoDisponibilidad';
import './ProductDetail.css';

function formatCRC(value) {
  return `\u20A1${(Number(value) || 0).toLocaleString('es-CR')}`;
}

const ProductDetail = () => {
  const navigate = useNavigate();
  const { productId } = useParams({ strict: false });
  const [product, setProduct] = useState(null);
  const [relacionados, setRelacionados] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [fotoActiva, setFotoActiva] = useState(0);
  const [specsAbiertas, setSpecsAbiertas] = useState(true);

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
          setRelacionados(
            (Array.isArray(catalogo) ? catalogo : [])
              .filter((item) => String(item.id) !== String(data.id) && item.estado !== 'Deshabilitado' && imagenPrincipalProducto(item))
              .slice(0, 4),
          );
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
  const stockDisponible = Number(product?.stock) || 0;
  const disponibilidad = clasificarDisponibilidad(product || { stock: 0 });
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
        <Link to="/productos" className="product-detail-page__back">
          <ArrowLeft size={18} aria-hidden="true" />{"Volver al cat\u00e1logo"}</Link>

        {!product && !loading ? (
          <section className="product-detail-page__empty">
            <p>{loadError || 'Producto no encontrado.'}</p>
            <button type="button" className="product-detail-page__close-btn" onClick={handleBack}>{"Volver al cat\u00e1logo"}</button>
          </section>
        ) : null}

        {product ? (
          <>
          <article className="product-detail-page__layout">
            <div className="product-detail-page__gallery">
              <div className="product-detail-page__media">
                {fotoActual ? (
                  <OptimizedImage
                    src={fotoActual}
                    alt={product.nombre}
                    width={960}
                    height={960}
                    priority
                    className="product-detail-page__image"
                  />
                ) : (
                  <div className="product-detail-page__media-placeholder" aria-hidden="true" />
                )}
              </div>
              {fotos.length > 1 ? (
                <div className="product-detail-page__thumbs" role="list">
                  {fotos.map((src, index) => (
                    <button
                      key={`${src}-${index}`}
                      type="button"
                      className={`product-detail-page__thumb${index === fotoActiva ? ' is-active' : ''}`}
                      onClick={() => setFotoActiva(index)}
                      aria-label={`Foto ${index + 1} de ${product.nombre}`}
                    >
                      <img src={src} alt="" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="product-detail-page__content">
              <header className="product-detail-page__header">
                <h1>{product.nombre}</h1>
                {(() => {
                  const etiqueta = etiquetaCategoriaProducto(product);
                  if (product.peso && etiqueta) {
                    return <p className="product-detail-page__series">{`${etiqueta} · ${product.peso}`}</p>;
                  }
                  if (product.peso) return <p className="product-detail-page__series">{product.peso}</p>;
                  if (etiqueta) return <p className="product-detail-page__series">{etiqueta}</p>;
                  return null;
                })()}
              </header>

              <p className="product-detail-page__price">{formatCRC(precioConIVA)}</p>
              <p className="product-detail-page__vat">IVA incluido</p>

              {product.descripcion ? (
                <p className="product-detail-page__description">{product.descripcion}</p>
              ) : null}

              {product.peso ? (
                <div className="product-detail-page__chips">
                  <p className="product-detail-page__chips-label">{"Presentaci\u00f3n"}</p>
                  <span className="product-detail-page__chip is-active">{product.peso}</span>
                </div>
              ) : null}

              <div className="product-detail-page__quantity-row">
                <span className="product-detail-page__quantity-label">Cantidad</span>
                <div className="product-detail-page__quantity-stepper" aria-label="Selector de cantidad">
                  <button
                    type="button"
                    className="product-detail-page__quantity-btn"
                    onClick={() => changeQuantity(-1)}
                    disabled={quantity <= 1}
                    aria-label="Disminuir cantidad"
                  >
                    −
                  </button>
                  <span className="product-detail-page__quantity-value" aria-live="polite">{quantity}</span>
                  <button
                    type="button"
                    className="product-detail-page__quantity-btn"
                    onClick={() => changeQuantity(1)}
                    disabled={quantity >= stockDisponible}
                    aria-label="Aumentar cantidad"
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
                  <ShoppingBag size={18} aria-hidden="true" />
                  {estaAgotado ? 'Agotado' : 'A\u00f1adir al carrito'}
                </button>
                <button type="button" className="product-detail-page__close-btn" onClick={handleBack}>
                  {"Volver al cat\u00e1logo"}
                </button>
              </div>

              <div className="product-detail-page__accordion">
                <button
                  type="button"
                  className="product-detail-page__accordion-trigger"
                  onClick={() => setSpecsAbiertas((open) => !open)}
                  aria-expanded={specsAbiertas}
                >
                  {"Ficha t\u00e9cnica"}
                  <ChevronDown size={18} className={specsAbiertas ? 'is-open' : ''} aria-hidden="true" />
                </button>
                {specsAbiertas ? (
                  <dl className="product-detail-page__meta">
                    <div className="product-detail-page__meta-row">
                      <dt>Categoría</dt>
                      <dd>{product.categoria || '—'}</dd>
                    </div>
                    {product.subcategoria ? (
                      <div className="product-detail-page__meta-row">
                        <dt>Subcategoría</dt>
                        <dd>{product.subcategoria}</dd>
                      </div>
                    ) : null}
                    <div className="product-detail-page__meta-row">
                      <dt>{"Presentaci\u00f3n"}</dt>
                      <dd>{product.peso || '—'}</dd>
                    </div>
                    <div className="product-detail-page__meta-row">
                      <dt>Precio (sin IVA)</dt>
                      <dd>{formatCRC(precioNormal)}</dd>
                    </div>
                    <div className="product-detail-page__meta-row">
                      <dt>Disponibles</dt>
                      <dd>
                        <span className={`product-detail-page__stock product-detail-page__stock--${disponibilidad.codigo}`}>
                          <span className="product-detail-page__stock-dot" aria-hidden="true" />
                          {disponibilidad.etiqueta}
                          {disponibilidad.codigo !== 'agotado' ? ` · ${stockDisponible} unidades` : ''}
                        </span>
                      </dd>
                    </div>
                  </dl>
                ) : null}
              </div>
            </div>
          </article>

          {relacionados.length > 0 ? (
            <section className="product-detail-page__related" aria-labelledby="productos-relacionados-title">
              <div className="product-detail-page__related-header">
                <h2 id="productos-relacionados-title">{"Tambi\u00e9n te puede gustar"}</h2>
                <Link to="/productos">{"Ver catálogo"}</Link>
              </div>
              <div className="product-detail-page__related-grid">
                {relacionados.map((item) => (
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
          </>
        ) : null}
      </main>
    </PublicPageGate>
  );
};

export default ProductDetail;
