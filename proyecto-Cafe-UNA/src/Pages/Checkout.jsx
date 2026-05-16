import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import './Checkout.css';

const CART_STORAGE_KEY = 'cart';

const formatCRC = (amount) => `CRC ${amount.toLocaleString('es-CR')}`;
const IVA_RATE = 0.13;

const Checkout = () => {
  const navigate = useNavigate();
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

  useEffect(() => {
    // Oculta la chrome (navbar + footer) mientras esta pagina este montada
    document.body.classList.add('hide-chrome');
    return () => {
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

  const subtotal = useMemo(
    () => cartItems.reduce((acc, i) => acc + (i.price * (i.units || 0)), 0),
    [cartItems]
  );
  const iva = useMemo(() => Math.round(subtotal * IVA_RATE), [subtotal]);
  const totalConIva = useMemo(() => subtotal + iva, [subtotal, iva]);

  const handleContinueShopping = () => {
    navigate({ to: '/productos' });
  };

  const handlePay = () => {
    // Simula pago: limpiar carrito, notificar y mostrar confirmación
    localStorage.removeItem(CART_STORAGE_KEY);
    window.dispatchEvent(new Event('cart-updated'));
    window.dispatchEvent(new CustomEvent('order-confirmed', { detail: { subtotal: totalConIva } }));
    setPaid(true);
    setTimeout(() => navigate({ to: '/' }), 2200);
  };

  if (paid) {
    return (
      <main className="checkout-page">
        <section className="checkout-page__card">
          <h2>Gracias por tu compra</h2>
          <p>Tu pedido fue procesado correctamente. Serás redirigido a inicio.</p>
        </section>
      </main>
    );
  }

  return (
    <main className="checkout-page">
      <section className="checkout-page__summary">
        <h1>Resumen de tu pedido</h1>
        {cartItems.length === 0 ? (
          <p>No hay productos en el carrito.</p>
        ) : (
          <>
            <div className="checkout-page__items">
              {cartItems.map((item) => (
                <div className="checkout-item" key={item.id}>
                  <div className="checkout-item__left">
                    <div className="checkout-item__name">{item.name}</div>
                    <div className="checkout-item__meta">{item.quantity} x {item.units}</div>
                  </div>
                  <div className="checkout-item__price">{formatCRC(item.price * item.units)}</div>
                </div>
              ))}
            </div>

            <div className="checkout-page__totals">
              <div className="checkout-page__subtotal-row">
                <span>Subtotal (sin IVA)</span>
                <strong>{formatCRC(subtotal)}</strong>
              </div>
              <div className="checkout-page__subtotal-row">
                <span>IVA (13%)</span>
                <strong>{formatCRC(iva)}</strong>
              </div>
              <div className="checkout-page__total-row">
                <span>Total (con IVA)</span>
                <strong>{formatCRC(totalConIva)}</strong>
              </div>
            </div>

            <div className="checkout-page__actions">
              <button className="checkout-page__pay" onClick={handlePay}>Pagar</button>
              <button className="checkout-page__continue" onClick={handleContinueShopping}>Seguir comprando</button>
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default Checkout;
