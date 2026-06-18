import { useEffect, useRef, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import './CartAddedToast.css';

function buildMessage({ nombre, quantity } = {}) {
  const label = nombre?.trim() || 'Producto';
  const units = Number(quantity) || 1;

  if (units > 1) {
    return `${label} añadido al carrito (${units} unidades)`;
  }

  return `${label} añadido al carrito`;
}

export default function CartAddedToast() {
  const [toast, setToast] = useState(null);
  const hideTimeoutRef = useRef(null);

  useEffect(() => {
    const handleAdded = (event) => {
      const message = buildMessage(event.detail);
      const id = Date.now();

      setToast({ id, message });

      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
      }

      hideTimeoutRef.current = window.setTimeout(() => {
        setToast(null);
        hideTimeoutRef.current = null;
      }, 2800);
    };

    window.addEventListener('cart-item-added', handleAdded);

    return () => {
      window.removeEventListener('cart-item-added', handleAdded);
      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  if (!toast) return null;

  return (
    <div key={toast.id} className="cart-added-toast" role="status" aria-live="polite">
      <CheckCircle2 className="cart-added-toast__icon" aria-hidden="true" />
      <span>{toast.message}</span>
    </div>
  );
}
