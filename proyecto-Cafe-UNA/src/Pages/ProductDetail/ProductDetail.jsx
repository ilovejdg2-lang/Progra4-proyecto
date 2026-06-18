import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, ShoppingBag } from 'lucide-react';
import OptimizedImage from '../../Components/OptimizedImage/OptimizedImage';
import { PublicPageGate } from '../../Components/PublicPageGate/PublicPageGate';
import { usePublicPageLoadingGate } from '../../hooks/usePublicPageLoadingGate';
import { addProductToCart, pulseButton } from '../../lib/cartStorage';
import { getLoadingMessageForCacheKey } from '../../lib/pageLoadingMessages';
import { calcularPrecioConIVA, obtenerProductoPorId } from '../../services/productosServices';
import './ProductDetail.css';

function formatCRC(value) {
  return `CRC ${(Number(value) || 0).toLocaleString('es-CR')}`;
}

const ProductDetail = () => {
  const navigate = useNavigate();
  const { productId } = useParams({ strict: false });
  const [product, setProduct] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

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
        const data = await obtenerProductoPorId(numericId);

        if (!active) return;

        if (!data || data.estado === 'Deshabilitado') {
          setProduct(null);
          setLoadError('Producto no encontrado o no disponible.');
        } else {
          setProduct(data);
          setQuantity(1);
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

  const precioNormal = useMemo(
    () => Number(product?.precioNormal ?? product?.priceWithoutIva ?? product?.price ?? 0) || 0,
    [product],
  );
  const precioConIVA = useMemo(() => calcularPrecioConIVA(precioNormal), [precioNormal]);
  const stockDisponible = Number(product?.stock) || 0;
  const estaAgotado = stockDisponible <= 0;

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
          <ArrowLeft size={18} aria-hidden="true" />
          Volver al catálogo
        </Link>

        {!product && !loading ? (
          <section className="product-detail-page__empty">
            <p>{loadError || 'Producto no encontrado.'}</p>
            <button type="button" className="product-detail-page__close-btn" onClick={handleBack}>
              Volver al catálogo
            </button>
          </section>
        ) : null}

        {product ? (
          <article className="product-detail-page__layout">
            <div className="product-detail-page__media">
              {product.imagen ? (
                <OptimizedImage
                  src={product.imagen}
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

            <div className="product-detail-page__content">
              <header className="product-detail-page__header">
                <h1>{product.nombre}</h1>
                <p className="product-detail-page__price">{formatCRC(precioConIVA)}</p>
              </header>

              {product.descripcion ? (
                <p className="product-detail-page__description">{product.descripcion}</p>
              ) : null}

              <dl className="product-detail-page__meta">
                <div className="product-detail-page__meta-row">
                  <dt>Cantidad</dt>
                  <dd>{product.peso || '—'}</dd>
                </div>
                <div className="product-detail-page__meta-row">
                  <dt>Precio (sin IVA)</dt>
                  <dd>{formatCRC(precioNormal)}</dd>
                </div>
                <div className="product-detail-page__meta-row">
                  <dt>Disponibles</dt>
                  <dd>
                    <span className={`product-detail-page__stock${estaAgotado ? ' product-detail-page__stock--out' : ''}`}>
                      <span className="product-detail-page__stock-dot" aria-hidden="true" />
                      {estaAgotado ? 'Agotado' : `${stockDisponible} unidades`}
                    </span>
                  </dd>
                </div>
              </dl>

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
                  {estaAgotado ? 'Agotado' : 'Añadir al carrito'}
                </button>
                <button type="button" className="product-detail-page__close-btn" onClick={handleBack}>
                  Cerrar
                </button>
              </div>
            </div>
          </article>
        ) : null}
      </main>
    </PublicPageGate>
  );
};

export default ProductDetail;
