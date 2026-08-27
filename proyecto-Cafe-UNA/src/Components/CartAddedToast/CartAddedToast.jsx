import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Check, ShoppingBag, X } from 'lucide-react';
import { imagenPrincipalProducto } from '../../lib/productoImagenes';
import './CartAddedToast.css';

function buildSuccessCopy({ nombre, quantity } = {}) {
  const label = nombre?.trim() || 'Producto';
  const units = Number(quantity) || 1;

  return {
    title: 'Añadido al carrito',
    message: units > 1 ? `${label} · ${units} unidades` : label,
  };
}

export default function CartAddedToast() {
  const [toast, setToast] = useState(null);
  const hideTimeoutRef = useRef(null);

  const clearHide = () => {
    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const dismiss = () => {
    clearHide();
    setToast(null);
  };

  useEffect(() => {
    const handleAdded = (event) => {
      const detail = event.detail || {};
      const isError = detail.type === 'error';
      const copy = isError
        ? { title: 'No se pudo agregar', message: detail.message || 'Revisá la disponibilidad.' }
        : buildSuccessCopy(detail);
      const image = isError ? '' : imagenPrincipalProducto({ imagenes: detail.image, imagen: detail.image });

      setToast({
        id: Date.now(),
        type: isError ? 'error' : 'success',
        title: copy.title,
        message: copy.message,
        image,
      });

      clearHide();
      hideTimeoutRef.current = window.setTimeout(() => {
        setToast(null);
        hideTimeoutRef.current = null;
      }, isError ? 3600 : 2800);
    };

    window.addEventListener('cart-item-added', handleAdded);

    return () => {
      window.removeEventListener('cart-item-added', handleAdded);
      clearHide();
    };
  }, []);

  if (!toast || typeof document === 'undefined') return null;

  return createPortal(
    <div
      key={toast.id}
      className={`cart-added-toast cart-added-toast--${toast.type}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      {toast.image ? (
        <img className="cart-added-toast__media" src={toast.image} alt="" />
      ) : (
        <span className="cart-added-toast__icon" aria-hidden="true">
          {toast.type === 'error' ? <AlertCircle size={18} /> : <Check size={18} />}
        </span>
      )}

      <div className="cart-added-toast__copy">
        <p className="cart-added-toast__title">
          {toast.type === 'success' ? <ShoppingBag size={14} aria-hidden="true" /> : null}
          {toast.title}
        </p>
        <p className="cart-added-toast__message">{toast.message}</p>
      </div>

      <button
        type="button"
        className="cart-added-toast__close"
        onClick={dismiss}
        aria-label="Cerrar aviso"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>,
    document.body,
  );
}
