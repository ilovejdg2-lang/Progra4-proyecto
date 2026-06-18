export const CART_STORAGE_KEY = 'cart';

export function getStoredCart() {
  try {
    const rawCart = localStorage.getItem(CART_STORAGE_KEY);
    const parsedCart = rawCart ? JSON.parse(rawCart) : [];
    return Array.isArray(parsedCart) ? parsedCart : [];
  } catch {
    localStorage.removeItem(CART_STORAGE_KEY);
    return [];
  }
}

export function addProductToCart(product, quantity = 1) {
  const stockDisponible = Number(product.stock) || 0;
  const parsedCart = getStoredCart();
  const existingProductIndex = parsedCart.findIndex((item) => item.id === product.id);
  const unidadesEnCarrito = existingProductIndex >= 0
    ? (Number(parsedCart[existingProductIndex].units) || 0)
    : 0;

  if (product.estado === 'Deshabilitado') {
    window.alert('Este producto está deshabilitado.');
    return false;
  }

  if (stockDisponible <= 0) {
    window.alert('Este producto está agotado.');
    return false;
  }

  if (unidadesEnCarrito + quantity > stockDisponible) {
    window.alert('No hay más unidades disponibles de este producto.');
    return false;
  }

  if (existingProductIndex >= 0) {
    parsedCart[existingProductIndex] = {
      ...parsedCart[existingProductIndex],
      units: (parsedCart[existingProductIndex].units || 1) + quantity,
    };
  } else {
    parsedCart.push({
      ...product,
      units: quantity,
    });
  }

  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(parsedCart));
  window.dispatchEvent(new CustomEvent('cart-item-added', {
    detail: {
      nombre: product.nombre,
      quantity,
    },
  }));
  window.dispatchEvent(new Event('cart-updated'));
  return true;
}

export function pulseButton(element) {
  if (!element) return;
  element.classList.add('is-pressed');
  window.setTimeout(() => element.classList.remove('is-pressed'), 220);
}
