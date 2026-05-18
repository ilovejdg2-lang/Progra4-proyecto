import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import './Checkout.css';

const CART_STORAGE_KEY = 'cart';

const formatCRC = (amount) => {
  const value = Number.isFinite(amount) ? amount : 0;
  return `CRC ${value.toLocaleString('es-CR')}`;
};

const getQuantity = (item) => Number(item.units) || 1;
const getUnitPriceWithoutIva = (item) => Number(item.precioNormal ?? item.priceWithoutIva ?? 0) || 0;
const getUnitPriceWithIva = (item) => Number(item.precioConIVA ?? item.priceWithIva ?? item.price ?? 0) || 0;

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
    navigate({ to: '/productos' });
  };

  const handlePay = () => {
    // Simula pago: limpiar carrito, notificar y mostrar confirmación
    localStorage.removeItem(CART_STORAGE_KEY);
    window.dispatchEvent(new Event('cart-updated'));
    window.dispatchEvent(new CustomEvent('order-confirmed', { detail: { total: totalConIva } }));
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