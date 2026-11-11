/** Keys de sessionStorage para flujo compra → registro/login. Sin imports (rompe ciclos). */

export const REGISTRO_CLIENTE_INTENT_KEY = "registroClienteDesdeCheckout";
export const POST_LOGIN_REDIRECT_KEY = "postLoginRedirect";
export const REGISTRO_CLIENTE_CORREO_KEY = "registroClienteCorreo";
/** Id estable del borrador de checkout (caféUNA{id}) hasta completar la compra. */
export const CHECKOUT_BORRADOR_COMPRA_ID_KEY = "checkoutBorradorCompraId";

export function leerBorradorCompraId() {
  try {
    const raw = String(sessionStorage.getItem(CHECKOUT_BORRADOR_COMPRA_ID_KEY) || "").trim();
    return /^\d+$/.test(raw) && Number(raw) > 0 ? raw : "";
  } catch {
    return "";
  }
}

export function guardarBorradorCompraId(id) {
  try {
    const valor = String(id ?? "").trim();
    if (/^\d+$/.test(valor) && Number(valor) > 0) {
      sessionStorage.setItem(CHECKOUT_BORRADOR_COMPRA_ID_KEY, valor);
    }
  } catch {
    /* ignore */
  }
}

export function limpiarBorradorCompraId() {
  try {
    sessionStorage.removeItem(CHECKOUT_BORRADOR_COMPRA_ID_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Limpia redirects e intents de compra/registro al cerrar sesión o cambiar de cuenta.
 * Evita que la siguiente persona herede /checkout o el formulario de cliente.
 */
export function limpiarEstadoCompraSesion() {
  try {
    sessionStorage.removeItem(REGISTRO_CLIENTE_INTENT_KEY);
    sessionStorage.removeItem(REGISTRO_CLIENTE_CORREO_KEY);
    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
    sessionStorage.removeItem(CHECKOUT_BORRADOR_COMPRA_ID_KEY);
  } catch {
    /* ignore */
  }
}
