import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Coffee, CreditCard, ShoppingBasket } from 'lucide-react';
import './Checkout.css';
import { ajustarStockProductos, calcularPrecioConIVA } from '../../services/productosServices';

const CART_STORAGE_KEY = 'cart';

const formatCRC = (amount) => {
  const value = Number.isFinite(amount) ? amount : 0;
  return `CRC ${value.toLocaleString('es-CR')}`;
};

const getQuantity = (item) => Number(item.units) || 1;
const getUnitPriceWithoutIva = (item) => Number(item.precioNormal ?? item.priceWithoutIva ?? 0) || 0;
const getUnitPriceWithIva = (item) => calcularPrecioConIVA(getUnitPriceWithoutIva(item));

const Checkout = () => {
  const navigate = useNavigate();
  const redirectTimeoutRef = useRef(null);
  const [cartItems, setCartItems] = useState(() => {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    try {
      return raw ? JSON.parse(raw) : [];
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
  });
  const [paid, setPaid] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState(null);

  useEffect(() => {
    // Oculta la chrome (navbar + footer) mientras esta pagina este montada
    document.body.classList.add('hide-chrome');
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
      document.body.classList.remove('hide-chrome');
    };
  }, []);

  useEffect(() => {
    const onCartUpdated = () => {
      const r = localStorage.getItem(CART_STORAGE_KEY);
      try {
        setCartItems(r ? JSON.parse(r) : []);
      } catch {
        localStorage.removeItem(CART_STORAGE_KEY);
        setCartItems([]);
      }
    };
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

  const handlePay = async () => {
    if (cartItems.length === 0 || processingPayment) {
      return;
    }

    try {
      setProcessingPayment(true);
      setPaymentError(null);

      handleValidateCartItems(cartItems);
      await ajustarStockProductos(cartItems);

      localStorage.removeItem(CART_STORAGE_KEY);
      window.dispatchEvent(new Event('cart-updated'));
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

  if (paid) {
    return (
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
    );
  }

  return (
    <main className="checkout-page">
      <section className="checkout-page__summary">
        <header className="checkout-page__header">
          <button type="button" className="checkout-page__back" onClick={() => navigate({ to: '/productos' })} aria-label="Volver al catálogo">
            <ArrowLeft size={22} strokeWidth={2.4} aria-hidden="true" />
          </button>
          <h1>Resumen de tu pedido</h1>
        </header>
        {paymentError ? <p style={{ color: '#b91c1c', marginBottom: '12px' }}>{paymentError}</p> : null}
        {cartItems.length === 0 ? (
          <p>No hay productos en el carrito.</p>
        ) : (
          <>
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
                    <div className="checkout-item__prices">
                      <span className="checkout-item__price-pill">Sin IVA: {formatCRC(getUnitPriceWithoutIva(item))}</span>
                      <span className="checkout-item__price-pill checkout-item__price-pill--strong">Con IVA: {formatCRC(getUnitPriceWithIva(item))}</span>
                    </div>
                    <div className="checkout-item__meta">{item.peso || item.quantity || 'Cantidad no disponible'} x {getQuantity(item)}</div>
                  </div>
                  <div className="checkout-item__price">{formatCRC(getUnitPriceWithIva(item) * getQuantity(item))}</div>
                </div>
              ))}
            </div>

            <div className="checkout-page__totals">
              <p className="checkout-page__totals-label">Resumen del pago</p>
              <div className="checkout-page__subtotal-row">
                <span>Subtotal</span>
                <strong>{formatCRC(subtotalSinIva)}</strong>
              </div>
              <div className="checkout-page__subtotal-row">
                <span>IVA</span>
                <strong>{formatCRC(ivaTotal)}</strong>
              </div>
              <div className="checkout-page__total-row">
                <span>Total</span>
                <strong>{formatCRC(totalConIva)}</strong>
              </div>
            </div>

            <div className="checkout-page__actions">
              <button className="checkout-page__pay" onClick={handlePay} disabled={processingPayment}>
                <CreditCard size={18} strokeWidth={2.3} aria-hidden="true" className="checkout-page__button-icon" />
                {processingPayment ? 'Procesando...' : 'Pagar'}
              </button>
              <button className="checkout-page__continue" onClick={handleContinueShopping}>
                <ShoppingBasket size={18} strokeWidth={2.3} aria-hidden="true" className="checkout-page__button-icon" />
                <span>Seguir comprando</span>
              </button>
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default Checkout;