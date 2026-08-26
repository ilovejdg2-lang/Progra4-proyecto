import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Coffee, CreditCard, ShoppingBasket } from 'lucide-react';
import { PublicPageGate } from '../../Components/PublicPageGate/PublicPageGate';
import { Switch } from '../../Components/ui/Switch';
import { usePublicPageLoadingGate } from '../../hooks/usePublicPageLoadingGate';
import { getLoadingMessageForCacheKey } from '../../lib/pageLoadingMessages';
import './Checkout.css';
import { ajustarStockProductos, calcularPrecioConIVA } from '../../services/productosService';
import { registrarCompra } from '../../services/comprasService';
import { getActiveSessionUser } from '../../services/sessionService';
import { clearCart, getStoredCart } from '../../lib/cartStorage';
import { registrarVenta } from '../../lib/ventasStorage';

const formatCRC = (amount) => {
  const value = Number.isFinite(amount) ? amount : 0;
  return `\u20A1${value.toLocaleString('es-CR')}`;
};

const getQuantity = (item) => Number(item.units) || 1;
const getUnitPriceWithoutIva = (item) => Number(item.precioNormal ?? item.priceWithoutIva ?? 0) || 0;
const getUnitPriceWithIva = (item) => calcularPrecioConIVA(getUnitPriceWithoutIva(item));
const getCurrentUser = () => getActiveSessionUser();
const canCompletePurchase = (user) => Boolean(user);

const Checkout = () => {
  const navigate = useNavigate();
  const redirectTimeoutRef = useRef(null);
  const [cartItems, setCartItems] = useState(getStoredCart);
  const [paid, setPaid] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const [pedidoRevisado, setPedidoRevisado] = useState(true);

  const showLoading = usePublicPageLoadingGate('checkout', true);
  const loadingMessage = getLoadingMessageForCacheKey('checkout');

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const onCartUpdated = () => setCartItems(getStoredCart());
    window.addEventListener('cart-updated', onCartUpdated);
    return () => window.removeEventListener('cart-updated', onCartUpdated);
  }, []);

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

  const handlePay = async () => {
    if (cartItems.length === 0 || processingPayment) {
      return;
    }

    if (!pedidoRevisado) {
      setPaymentError('Confirmá que ya revisaste tu pedido.');
      return;
    }

    if (!canCompletePurchase(getCurrentUser())) {
      redirectToLoginForPurchase();
      return;
    }

    try {
      setProcessingPayment(true);
      setPaymentError(null);

      handleValidateCartItems(cartItems);
      await ajustarStockProductos(cartItems);

      const usuario = getCurrentUser();
      const payload = {
        clienteNombre: usuario?.name || usuario?.username || usuario?.email || "Cliente",
        clienteCorreo: usuario?.email || usuario?.correo || "",
        items: cartItems.map((item) => ({
          id: item.id,
          nombre: item.nombre || item.name || "Producto",
          cantidad: getQuantity(item),
          precioUnitario: getUnitPriceWithIva(item),
          subtotal: getUnitPriceWithIva(item) * getQuantity(item),
        })),
        subtotal: subtotalSinIva,
        impuestos: ivaTotal,
        total: totalConIva,
        estado: "Pagado",
        metodoPago: "Tarjeta",
      };

      try {
        await registrarCompra(payload);
      } catch {
        registrarVenta({
          cliente: payload.clienteNombre,
          correo: payload.clienteCorreo,
          items: payload.items.map((item) => ({
            id: item.id,
            nombre: item.nombre,
            units: item.cantidad,
            precioUnitario: item.precioUnitario,
            total: item.subtotal,
          })),
          subtotal: payload.subtotal,
          iva: payload.impuestos,
          total: payload.total,
          estadoPago: payload.estado,
          metodo: payload.metodoPago,
        });
      }

      clearCart();
      window.dispatchEvent(new CustomEvent('order-confirmed', { detail: { total: totalConIva } }));
      setPaid(true);
      redirectTimeoutRef.current = window.setTimeout(() => {
        redirectTimeoutRef.current = null;
        navigate({ to: '/' });
      }, 8000);
    } catch (error) {
      const message = error?.message || 'No se pudo completar la compra por falta de stock.';
      setPaymentError(message);
      window.alert(message);
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
            <h2>Gracias por tu compra</h2>
            <p>Tu pedido fue procesado correctamente.</p>
            <span className="checkout-success-card__hint">Serás redirigido a inicio automáticamente en unos segundos.</span>
          </div>
          <div className="checkout-success-card__actions">
            <button type="button" className="checkout-success-card__primary" onClick={() => navigate({ to: '/' })}>
              Volver al inicio
            </button>
            <button type="button" className="checkout-success-card__secondary" onClick={handleContinueShopping}>
              Seguir comprando
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
          <button type="button" className="checkout-page__back" onClick={() => navigate({ to: '/productos' })} aria-label="Volver al catálogo">
            <ArrowLeft size={22} strokeWidth={2.4} aria-hidden="true" />
          </button>
          <h1>Resumen de tu pedido</h1>
        </header>
        {paymentError && cartItems.length === 0 ? <p className="checkout-page__error">{paymentError}</p> : null}
        {cartItems.length === 0 ? (
          <p className="checkout-page__empty">No hay productos en el carrito.</p>
        ) : (
            <div className="checkout-page__items">
              {cartItems.map((item) => (
                <div className="checkout-item" key={item.id}>
                  <div className="checkout-item__media">
                    {item.imagen ? (
                      <img className="checkout-item__image" src={item.imagen} alt={item.nombre || item.name || 'Producto'} />
                    ) : (
                      <div className="checkout-item__image checkout-item__image--placeholder" aria-hidden="true" />
                    )}
                  </div>
                  <div className="checkout-item__left">
                    <div className="checkout-item__name">{item.nombre || item.name || 'Producto'}</div>
                    <div className="checkout-item__meta">{item.peso || item.quantity || 'Cantidad no disponible'} × {getQuantity(item)}</div>
                  </div>
                  <div className="checkout-item__price">{formatCRC(getUnitPriceWithIva(item) * getQuantity(item))}</div>
                </div>
              ))}
            </div>
        )}
      </section>

      {cartItems.length > 0 ? (
      <aside className="checkout-shell__pay">
        <p className="checkout-pay__title">Pago</p>
        <h2 className="checkout-pay__heading">Total del pedido</h2>
            {paymentError ? <p className="checkout-page__error">{paymentError}</p> : null}
            <div className="checkout-page__totals">
              <div className="checkout-page__subtotal-row">
                <span>Subtotal (sin IVA)</span>
                <strong>{formatCRC(subtotalSinIva)}</strong>
              </div>
              <div className="checkout-page__subtotal-row">
                <span>IVA (13%)</span>
                <strong>{formatCRC(ivaTotal)}</strong>
              </div>
              <div className="checkout-page__total-row">
                <span>Total</span>
                <strong>{formatCRC(totalConIva)}</strong>
              </div>
            </div>

            <Switch
              id="checkout-confirm"
              checked={pedidoRevisado}
              onCheckedChange={(value) => {
                setPedidoRevisado(value);
                if (value) setPaymentError(null);
              }}
              label="Ya revisé mi pedido"
            />
            {!pedidoRevisado ? (
              <p className="checkout-page__hint">Activá el switch para confirmar el pedido.</p>
            ) : null}

            <div className="checkout-page__actions">
              <button className="checkout-page__pay" type="button" onClick={handlePay} disabled={processingPayment}>
                <CreditCard size={18} strokeWidth={2.3} aria-hidden="true" className="checkout-page__button-icon" />
                {processingPayment ? 'Procesando...' : 'Finalizar pedido'}
              </button>
              <button className="checkout-page__continue" type="button" onClick={handleContinueShopping}>
                <ShoppingBasket size={18} strokeWidth={2.3} aria-hidden="true" className="checkout-page__button-icon" />
                <span>Seguir comprando</span>
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
