import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Coffee, ShoppingCart, Store, UploadCloud } from 'lucide-react';
import { PublicPageGate } from '../../Components/PublicPageGate/PublicPageGate';
import { Switch } from '../../Components/ui/Switch';
import { usePublicPageLoadingGate } from '../../hooks/usePublicPageLoadingGate';
import { useTraducir, useTraducirLista } from '../../hooks/useTraducir';
import { ST } from '../../Components/T/ST';
import { t } from '../../lib/t';
import { getLoadingMessageForCacheKey } from '../../lib/pageLoadingMessages';
import { normalizeImageUrl } from '../../lib/imageUtils';
import './Checkout.css';
import { calcularPrecioConIVA, obtenerDisponibilidadPuntosVenta } from '../../services/productosService';
import { obtenerNavbar } from '../../services/informacionService';
import { registrarCompra } from '../../services/comprasService';
import { getActiveSessionUser } from '../../services/sessionService';
import { marcarIntentRegistroCliente, puedeComprar } from '../../services/authService';
import { clearCart, getStoredCart } from '../../lib/cartStorage';
import { registrarVenta } from '../../lib/ventasStorage';

const TIPOS_COMPROBANTE = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_COMPROBANTE_BYTES = 10 * 1024 * 1024;

const formatCRC = (amount) => {
  const value = Number.isFinite(amount) ? amount : 0;
  return `\u20A1${value.toLocaleString('es-CR')}`;
};

const getQuantity = (item) => Number(item.units) || 1;
const getUnitPriceWithoutIva = (item) => Number(item.precioNormal ?? item.priceWithoutIva ?? 0) || 0;
const getUnitPriceWithIva = (item) => calcularPrecioConIVA(getUnitPriceWithoutIva(item));
const getCurrentUser = () => getActiveSessionUser();
const canCompletePurchase = (user) => puedeComprar(user);

const Checkout = () => {
  const navigate = useNavigate();
  const redirectTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const [cartItems, setCartItems] = useState(getStoredCart);
  const [paid, setPaid] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [pedidoRevisado, setPedidoRevisado] = useState(true);
  const [puntosVenta, setPuntosVenta] = useState([]);
  const [stockPorProducto, setStockPorProducto] = useState({});
  const [ubicacionCodigo, setUbicacionCodigo] = useState('');
  const [comprobante, setComprobante] = useState(null);
  const [dropActivo, setDropActivo] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  const tGracias = useTraducir('Gracias por tu compra');
  const tPedidoPendiente = useTraducir(
    'Tu pedido quedó pendiente de revisión. Te avisamos cuando se apruebe y envíe.',
  );
  const tRedirigido = useTraducir('Serás redirigido a inicio automáticamente en unos segundos.');
  const tVolverInicio = useTraducir('Volver al inicio');
  const tSeguir = useTraducir('Seguir comprando');
  const tResumen = useTraducir('Resumen de tu pedido');
  const tResumenLead = useTraducir('Revisa los productos, elegí un punto de venta y completá tu compra.');
  const tProductosPedido = useTraducir('Productos en tu pedido');
  const tDetallesCompra = useTraducir('Detalles de tu compra');
  const tSubirComprobante = useTraducir('Subí una imagen del comprobante de tu pago.');
  const tConfirmCantidades = useTraducir('Confirmá que los productos y cantidades son correctos.');
  const tVolverCatalogo = useTraducir('Volver al catálogo');
  const tVacio = useTraducir('No hay productos en el carrito.');
  const tPago = useTraducir('Pago');
  const tTotalPedido = useTraducir('Total del pedido');
  const tSubtotal = useTraducir('Subtotal (sin IVA)');
  const tIva = useTraducir('IVA (13%)');
  const tTotal = useTraducir('Total');
  const tYaRevise = useTraducir('Ya revisé mi pedido');
  const tActivaSwitch = useTraducir('Activá el switch para confirmar el pedido.');
  const tProcesando = useTraducir('Procesando...');
  const tFinalizar = useTraducir('Finalizar pedido');
  const tCantidadNoDisp = useTraducir('Cantidad no disponible');
  const tPuntoVenta = useTraducir('Punto de venta');
  const tElegiPunto = useTraducir('Elegí dónde retirar o realizar tu compra. Solo se listan puntos con stock para todos los productos del carrito.');
  const tDisponible = useTraducir('Disponible');
  const tUnidades = useTraducir('unidades');
  const tSinStockPos = useTraducir('Sin stock suficiente para este pedido');
  const tComprobante = useTraducir('Comprobante de pago');
  const tComprobanteCta = useTraducir('Arrastrá o seleccioná una imagen del comprobante');
  const tComprobanteHint = useTraducir('JPG, PNG o WEBP. Máximo 10 MB.');
  const tQuitarImagen = useTraducir('Quitar imagen');

  const showLoading = usePublicPageLoadingGate('checkout', true);
  const loadingMessage = getLoadingMessageForCacheKey('checkout');

  const cartItemsConNombre = useMemo(
    () =>
      cartItems.map((item) => ({
        ...item,
        nombre: item.nombre || item.name || 'Producto',
      })),
    [cartItems],
  );
  const cartItemsUi = useTraducirLista(cartItemsConNombre, ['nombre']);

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    let activo = true;
    obtenerNavbar()
      .then((navbar) => {
        if (!activo) return;
        setLogoUrl(typeof navbar?.logoUrl === 'string' ? navbar.logoUrl.trim() : '');
      })
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    const onCartUpdated = () => setCartItems(getStoredCart());
    window.addEventListener('cart-updated', onCartUpdated);
    return () => window.removeEventListener('cart-updated', onCartUpdated);
  }, []);

  useEffect(() => {
    let activo = true;
    const ids = cartItems.map((item) => item.id).filter(Boolean);
    if (ids.length === 0) {
      setPuntosVenta([]);
      setStockPorProducto({});
      return undefined;
    }
    obtenerDisponibilidadPuntosVenta(ids)
      .then((data) => {
        if (!activo) return;
        setPuntosVenta(data.puntosVenta || []);
        const mapa = {};
        (data.porProducto || []).forEach((row) => {
          mapa[String(row.productoId)] = {};
          (row.puntos || []).forEach((punto) => {
            mapa[String(row.productoId)][punto.code] = Number(punto.stock) || 0;
          });
        });
        setStockPorProducto(mapa);
      })
      .catch(() => {
        if (!activo) return;
        setPuntosVenta([]);
        setStockPorProducto({});
      });
    return () => {
      activo = false;
    };
  }, [cartItems]);

  const puntosConDisponibilidad = useMemo(
    () =>
      puntosVenta.map((punto) => {
        const faltantes = [];
        let cubrePedido = true;
        cartItems.forEach((item) => {
          const disponible = Number(stockPorProducto[String(item.id)]?.[punto.code]) || 0;
          const cantidad = getQuantity(item);
          if (disponible < cantidad) {
            cubrePedido = false;
            faltantes.push({
              nombre: item.nombre || item.name || 'Producto',
              disponible,
              cantidad,
            });
          }
        });
        return { ...punto, cubrePedido, faltantes };
      }),
    [puntosVenta, stockPorProducto, cartItems],
  );

  useEffect(() => {
    if (!ubicacionCodigo) return;
    const actual = puntosConDisponibilidad.find((punto) => punto.code === ubicacionCodigo);
    if (actual && !actual.cubrePedido) setUbicacionCodigo('');
  }, [puntosConDisponibilidad, ubicacionCodigo]);

  const totalConIva = useMemo(
    () => cartItems.reduce((acc, item) => acc + (getUnitPriceWithIva(item) * getQuantity(item)), 0),
    [cartItems]
  );
  const subtotalSinIva = useMemo(
    () => cartItems.reduce((acc, item) => acc + (getUnitPriceWithoutIva(item) * getQuantity(item)), 0),
    [cartItems]
  );
  const ivaTotal = useMemo(() => totalConIva - subtotalSinIva, [totalConIva, subtotalSinIva]);

  const handleContinueShopping = () => {
    if (redirectTimeoutRef.current) {
      window.clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
    navigate({ to: '/productos' });
  };

  const handleValidateCartItems = (items) => {
    const deshabilitados = items.filter((item) => item.estado === 'Deshabilitado');
    if (deshabilitados.length > 0) {
      const nombres = deshabilitados.map((item) => item.nombre || item.name || 'Producto').join(', ');
      throw new Error(`No se puede completar la compra porque estos productos están deshabilitados: ${nombres}`);
    }
  };

  const redirectToLoginForPurchase = () => {
    sessionStorage.setItem('postLoginRedirect', '/checkout');
    navigate({ to: '/login' });
  };

  const redirectToRegistroCliente = () => {
    sessionStorage.setItem('postLoginRedirect', '/checkout');
    marcarIntentRegistroCliente();
    navigate({ to: '/registro' });
  };

  const ensureCanPurchase = () => {
    const user = getCurrentUser();
    if (!user) {
      redirectToLoginForPurchase();
      return false;
    }
    if (!canCompletePurchase(user)) {
      redirectToRegistroCliente();
      return false;
    }
    return true;
  };

  const asignarComprobante = (fileList) => {
    const file = Array.from(fileList || [])[0];
    if (!file) return;
    if (!TIPOS_COMPROBANTE.has(file.type)) {
      setPaymentError('El comprobante debe ser una imagen JPG, PNG o WEBP.');
      return;
    }
    if (file.size > MAX_COMPROBANTE_BYTES) {
      setPaymentError('El comprobante debe pesar máximo 10 MB.');
      return;
    }
    if (comprobante?.preview) URL.revokeObjectURL(comprobante.preview);
    setPaymentError(null);
    setComprobante({
      file,
      preview: URL.createObjectURL(file),
    });
  };

  const quitarComprobante = () => {
    if (comprobante?.preview) URL.revokeObjectURL(comprobante.preview);
    setComprobante(null);
  };

  const handlePay = async () => {
    if (cartItems.length === 0 || processingPayment) {
      return;
    }

    if (!pedidoRevisado) {
      setPaymentError('Confirmá que ya revisaste tu pedido.');
      return;
    }

    if (!ubicacionCodigo) {
      setPaymentError('Seleccioná el punto de venta.');
      return;
    }

    const punto = puntosConDisponibilidad.find((item) => item.code === ubicacionCodigo);
    if (!punto?.cubrePedido) {
      setPaymentError('El punto de venta seleccionado no tiene stock suficiente para este pedido.');
      return;
    }

    if (!comprobante?.file) {
      setPaymentError('Adjuntá el comprobante de pago.');
      return;
    }

    if (!ensureCanPurchase()) {
      return;
    }

    try {
      setProcessingPayment(true);
      setPaymentError(null);

      handleValidateCartItems(cartItems);

      const usuario = getCurrentUser();
      const payload = {
        clienteNombre: usuario?.name || usuario?.username || usuario?.email || "Cliente",
        clienteCorreo: usuario?.email || usuario?.correo || "",
        items: cartItems.map((item) => ({
          id: item.id,
          nombre: item.nombre || item.name || "Producto",
          cantidad: getQuantity(item),
        })),
        metodoPago: "Comprobante",
        ubicacionCodigo,
        ubicacionId: punto.id,
      };

      try {
        await registrarCompra(payload, comprobante.file);
      } catch (error) {
        const status = error?.cause?.response?.status;
        if (status === 401) {
          redirectToLoginForPurchase();
          return;
        }
        if (status === 403) {
          redirectToRegistroCliente();
          return;
        }
        registrarVenta({
          cliente: payload.clienteNombre,
          correo: payload.clienteCorreo,
          items: cartItems.map((item) => ({
            id: item.id,
            nombre: item.nombre || item.name || "Producto",
            units: getQuantity(item),
            precioUnitario: getUnitPriceWithIva(item),
            total: getUnitPriceWithIva(item) * getQuantity(item),
          })),
          subtotal: subtotalSinIva,
          iva: ivaTotal,
          total: totalConIva,
          estadoPago: "Pendiente",
          metodo: payload.metodoPago,
          puntoVenta: punto.name,
        });
      }

      clearCart();
      quitarComprobante();
      window.dispatchEvent(new CustomEvent('order-confirmed', { detail: { total: totalConIva } }));
      setPaid(true);
      redirectTimeoutRef.current = window.setTimeout(() => {
        redirectTimeoutRef.current = null;
        navigate({ to: '/' });
      }, 8000);
    } catch (error) {
      const message = error?.message || 'No se pudo completar la compra por falta de stock.';
      setPaymentError(message);
      window.alert(t(message));
    } finally {
      setProcessingPayment(false);
    }
  };

  return (
    <PublicPageGate showLoading={showLoading} loadingMessage={loadingMessage}>
      {paid ? (
      <main className="checkout-page">
        <section className="checkout-success-card" aria-live="polite">
          <div className="checkout-success-card__top">
            <Coffee size={88} strokeWidth={1.9} aria-hidden="true" className="checkout-success-card__icon" />
          </div>
          <div className="checkout-success-card__body">
            <h2>{tGracias}</h2>
            <p>{tPedidoPendiente}</p>
            <span className="checkout-success-card__hint">{tRedirigido}</span>
          </div>
          <div className="checkout-success-card__actions">
            <button type="button" className="checkout-success-card__primary" onClick={() => navigate({ to: '/' })}>
              {tVolverInicio}
            </button>
            <button type="button" className="checkout-success-card__secondary" onClick={handleContinueShopping}>
              {tSeguir}
            </button>
          </div>
          <p className="checkout-success-card__brand">Café UNA</p>
        </section>
      </main>
      ) : (
    <main className="checkout-page">
      <div className="checkout-shell">
      <section className="checkout-shell__order">
        <header className="checkout-page__header">
          <div className="checkout-page__header-copy">
            <button type="button" className="checkout-page__back" onClick={() => navigate({ to: '/productos' })} aria-label={tVolverCatalogo}>
              <ArrowLeft size={20} strokeWidth={2.4} aria-hidden="true" />
            </button>
            <div>
              <h1>{tResumen}</h1>
              <p className="checkout-page__lead">{tResumenLead}</p>
            </div>
          </div>
          {logoUrl ? (
            <img
              className="checkout-brand-logo"
              src={normalizeImageUrl(logoUrl, { width: 240 })}
              alt="Café UNA"
            />
          ) : null}
        </header>
        {paymentError && cartItems.length === 0 ? <p className="checkout-page__error"><ST>{paymentError}</ST></p> : null}
        {cartItems.length === 0 ? (
          <p className="checkout-page__empty">{tVacio}</p>
        ) : (
            <div className="checkout-page__catalog">
              <h2 className="checkout-page__section-title">{tProductosPedido}</h2>
              <div className="checkout-page__items">
              {cartItemsUi.map((item) => (
                <div className="checkout-item" key={item.id}>
                  <div className="checkout-item__media">
                    {item.imagen ? (
                      <img className="checkout-item__image" src={item.imagen} alt={item.nombre || 'Producto'} />
                    ) : (
                      <div className="checkout-item__image checkout-item__image--placeholder" aria-hidden="true" />
                    )}
                  </div>
                  <div className="checkout-item__left">
                    <div className="checkout-item__name">{item.nombre}</div>
                    <div className="checkout-item__meta">{item.peso || item.quantity || tCantidadNoDisp} × {getQuantity(item)}</div>
                  </div>
                  <div className="checkout-item__price">{formatCRC(getUnitPriceWithIva(item) * getQuantity(item))}</div>
                </div>
              ))}
              </div>
            </div>
        )}

        {cartItems.length > 0 ? (
          <section className="checkout-pos" aria-labelledby="checkout-pos-title">
            <h2 id="checkout-pos-title">
              <Store size={18} strokeWidth={2.2} aria-hidden="true" />
              {tPuntoVenta}
            </h2>
            <p className="checkout-pos__hint">{tElegiPunto}</p>
            {puntosConDisponibilidad.length === 0 ? (
              <p className="checkout-page__hint"><ST>No hay puntos de venta disponibles en este momento.</ST></p>
            ) : (
              <div className="checkout-pos__grid">
                {puntosConDisponibilidad.map((punto) => {
                  const seleccionado = ubicacionCodigo === punto.code;
                  return (
                    <button
                      key={punto.code}
                      type="button"
                      className={`checkout-pos__card${seleccionado ? ' is-selected' : ''}${punto.cubrePedido ? '' : ' is-disabled'}`}
                      disabled={!punto.cubrePedido}
                      aria-pressed={seleccionado}
                      onClick={() => {
                        setUbicacionCodigo(punto.code);
                        setPaymentError(null);
                      }}
                    >
                      <span className="checkout-pos__radio" aria-hidden="true" />
                      <span className="checkout-pos__card-icon"><Store size={18} aria-hidden="true" /></span>
                      <span className="checkout-pos__card-body">
                        <span className="checkout-pos__card-name">{punto.name}</span>
                        {punto.cubrePedido ? (
                          <ul className="checkout-pos__stock">
                            {cartItems.map((item) => {
                              const disponible = Number(stockPorProducto[String(item.id)]?.[punto.code]) || 0;
                              return (
                                <li key={`${punto.code}-${item.id}`}>
                                  {item.nombre || item.name}: {disponible} {tUnidades}
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <span className="checkout-pos__card-meta">{tSinStockPos}</span>
                        )}
                        {punto.cubrePedido ? (
                          <span className="checkout-pos__badge">{tDisponible}</span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        ) : null}
      </section>

      {cartItems.length > 0 ? (
      <aside className="checkout-shell__pay">
        <p className="checkout-pay__title">{tPago}</p>
        <h2 className="checkout-pay__heading">{tTotalPedido}</h2>
        <p className="checkout-pay__lead">{tDetallesCompra}</p>
            {paymentError ? <p className="checkout-page__error"><ST>{paymentError}</ST></p> : null}
            <div className="checkout-page__totals">
              <div className="checkout-page__subtotal-row">
                <span>{tSubtotal}</span>
                <strong>{formatCRC(subtotalSinIva)}</strong>
              </div>
              <div className="checkout-page__subtotal-row">
                <span>{tIva}</span>
                <strong>{formatCRC(ivaTotal)}</strong>
              </div>
              <div className="checkout-page__total-row">
                <span>{tTotal}</span>
                <strong>{formatCRC(totalConIva)}</strong>
              </div>
            </div>

            <div className="checkout-comprobante">
              <p className="checkout-comprobante__label">{tComprobante}</p>
              <p className="checkout-comprobante__hint">{tSubirComprobante}</p>
              <div
                className={`checkout-dropzone${dropActivo ? ' is-active' : ''}`}
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') fileInputRef.current?.click();
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDropActivo(true);
                }}
                onDragLeave={() => setDropActivo(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDropActivo(false);
                  asignarComprobante(event.dataTransfer.files);
                }}
              >
                <UploadCloud size={26} aria-hidden="true" />
                <p>{tComprobanteCta}</p>
                <small>{tComprobanteHint}</small>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={(event) => {
                  asignarComprobante(event.target.files);
                  event.target.value = '';
                }}
              />
              {comprobante ? (
                <div className="checkout-comprobante__preview">
                  <img src={comprobante.preview} alt="" />
                  <button type="button" onClick={quitarComprobante}>{tQuitarImagen}</button>
                </div>
              ) : null}
            </div>

            <div className="checkout-confirm">
              <Switch
                id="checkout-confirm"
                checked={pedidoRevisado}
                onCheckedChange={(value) => {
                  setPedidoRevisado(value);
                  if (value) setPaymentError(null);
                }}
                label={tYaRevise}
              />
              <p className="checkout-confirm__hint">{tConfirmCantidades}</p>
              {!pedidoRevisado ? (
                <p className="checkout-page__hint">{tActivaSwitch}</p>
              ) : null}
            </div>

            <div className="checkout-page__actions">
              <button className="checkout-page__pay" type="button" onClick={handlePay} disabled={processingPayment}>
                <Store size={18} strokeWidth={2.3} aria-hidden="true" className="checkout-page__button-icon" />
                <span className="checkout-page__pay-label">
                  {processingPayment ? tProcesando : tFinalizar}
                </span>
              </button>
              <button className="checkout-page__continue" type="button" onClick={handleContinueShopping}>
                <ShoppingCart size={18} strokeWidth={2.3} aria-hidden="true" className="checkout-page__button-icon" />
                <span>{tSeguir}</span>
              </button>
            </div>
      </aside>
      ) : null}
      </div>
    </main>
      )}
    </PublicPageGate>
  );
};

export default Checkout;
