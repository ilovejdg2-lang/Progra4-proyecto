import { apiRequest } from "./apiClient";
import { decodeJwtPayload } from "../lib/jwt";
import { tienePermiso } from "../lib/permisos";

const AUTH_BASE_URL = `${import.meta.env.BACKEND_URL}/auth`;

async function request(url, options = {}) {
  return apiRequest(url, {
    ...options,
    skipAuth: true,
    errorPrefix: "Error de autenticaci\u00f3n",
    timeoutMessage: "Tiempo de espera agotado al autenticar.",
  });
}

export async function iniciarSesion({ identifier, password }) {
  return request(`${AUTH_BASE_URL}/login`, {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
}

export async function renovarToken() {
  return apiRequest(`${AUTH_BASE_URL}/refresh`, {
    method: "POST",
    skipRefresh: true,
    skipSessionClear: true,
    errorPrefix: "Error de autenticaci\u00f3n",
    timeoutMessage: "Tiempo de espera agotado al renovar la sesi\u00f3n.",
  });
}

export function mapAuthenticatedUser(token) {
  const payload = decodeJwtPayload(token);
  const roles = payload?.role
    ? (Array.isArray(payload.role) ? payload.role : [payload.role])
    : [];
  const isAdmin = tienePermiso(roles, "ver_panel_administrativo");

  return {
    id: Number(payload?.sub),
    username: payload?.unique_name || "",
    email: payload?.email || "",
    name: payload?.unique_name || "",
    role: isAdmin ? "admin" : "user",
    roles,
    token,
  };
}

export function puedeComprar(user) {
  return tienePermiso(user?.roles, "comprar_productos");
}

const REGISTRO_CLIENTE_INTENT_KEY = "registroClienteDesdeCheckout";

/** Marca que la persona llegó al registro porque quiere pagar el carrito. */
export function marcarIntentRegistroCliente() {
  try {
    sessionStorage.setItem(REGISTRO_CLIENTE_INTENT_KEY, "1");
  } catch {
    /* ignore */
  }
}

/** Solo se permite /registro si viene del checkout o ya empezó verificación. */
export function puedeAbrirRegistroCliente() {
  try {
    if (sessionStorage.getItem(REGISTRO_CLIENTE_INTENT_KEY) === "1") return true;
    if (sessionStorage.getItem("registroClienteCorreo")) return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function limpiarIntentRegistroCliente() {
  try {
    sessionStorage.removeItem(REGISTRO_CLIENTE_INTENT_KEY);
  } catch {
    /* ignore */
  }
}

export async function registrarUsuario(payload) {
  return request(`${AUTH_BASE_URL}/register`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registrarCliente(payload) {
  return request(`${AUTH_BASE_URL}/register-cliente`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function completarCliente(payload) {
  return apiRequest(`${AUTH_BASE_URL}/completar-cliente`, {
    method: "POST",
    body: JSON.stringify(payload),
    errorPrefix: "Error al completar perfil de cliente",
    timeoutMessage: "Tiempo de espera agotado al completar el perfil.",
  });
}

export async function verificarRegistro(payload) {
  return request(`${AUTH_BASE_URL}/verify-registration`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function solicitarRecuperacion(identifier) {
  return request(`${AUTH_BASE_URL}/forgot-password`, {
    method: "POST",
    body: JSON.stringify({ identifier }),
  });
}

export async function restablecerPassword(payload) {
  return request(`${AUTH_BASE_URL}/reset-password`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
