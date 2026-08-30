import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Check, ShoppingBag, X } from 'lucide-react';
import { imagenPrincipalProducto } from '../../lib/productoImagenes';
import { useTraducir } from '../../hooks/useTraducir';
import './CartAddedToast.css';

function ToastBody({ toast, onDismiss }) {
  const tTituloOk = useTraducir('Añadido al carrito');
  const tTituloError = useTraducir('No se pudo agregar');
  const tUnidades = useTraducir('unidades');
  const tNombre = useTraducir(toast.nombre || 'Producto');
  const tErrorMsg = useTraducir(toast.errorMessage || 'Revisá la disponibilidad.');
  const tCerrar = useTraducir('Cerrar aviso');

  const esError = toast.type === 'error';
  const units = Number(toast.quantity) || 1;
  const title = esError ? tTituloError : tTituloOk;
  const message = esError
    ? tErrorMsg
    : units > 1
      ? `${tNombre} · ${units} ${tUnidades}`
      : tNombre;

  return (
    <div
      className={`cart-added-toast cart-added-toast--${toast.type}`}
      role={esError ? 'alert' : 'status'}
      aria-live={esError ? 'assertive' : 'polite'}
    >
      {toast.image ? (
        <img className="cart-added-toast__media" src={toast.image} alt="" />
      ) : (
        <span className="cart-added-toast__icon" aria-hidden="true">
          {esError ? <AlertCircle size={18} /> : <Check size={18} />}
        </span>
      )}

      <div className="cart-added-toast__copy">
        <p className="cart-added-toast__title">
          {!esError ? <ShoppingBag size={14} aria-hidden="true" /> : null}
          {title}
        </p>
        <p className="cart-added-toast__message">{message}</p>
      </div>

      <button
        type="button"
        className="cart-added-toast__close"
        onClick={onDismiss}
        aria-label={tCerrar}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
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
      const image = isError
        ? ''
        : imagenPrincipalProducto({ imagenes: detail.image, imagen: detail.image });

      setToast({
        id: Date.now(),
        type: isError ? 'error' : 'success',
        nombre: detail.nombre || detail.name || 'Producto',
        quantity: Number(detail.quantity) || 1,
        errorMessage: detail.message || 'Revisá la disponibilidad.',
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
    <ToastBody key={toast.id} toast={toast} onDismiss={dismiss} />,
    document.body,
  );
}
