/** Keys de sessionStorage para flujo compra → registro/login. Sin imports (rompe ciclos). */

export const REGISTRO_CLIENTE_INTENT_KEY = "registroClienteDesdeCheckout";
export const POST_LOGIN_REDIRECT_KEY = "postLoginRedirect";
export const REGISTRO_CLIENTE_CORREO_KEY = "registroClienteCorreo";

/**
 * Limpia redirects e intents de compra/registro al cerrar sesión o cambiar de cuenta.
 * Evita que la siguiente persona herede /checkout o el formulario de cliente.
 */
export function limpiarEstadoCompraSesion() {
  try {
    sessionStorage.removeItem(REGISTRO_CLIENTE_INTENT_KEY);
    sessionStorage.removeItem(REGISTRO_CLIENTE_CORREO_KEY);
    sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  } catch {
    /* ignore */
  }
}
