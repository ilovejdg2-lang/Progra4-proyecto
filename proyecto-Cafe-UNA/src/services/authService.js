import { apiRequest } from "./apiClient";
import { decodeJwtPayload } from "../lib/jwt";

const AUTH_BASE_URL = `${import.meta.env.BACKEND_URL}/auth`;

async function request(url, options = {}) {
  return apiRequest(url, {
    ...options,
    skipAuth: true,
    errorPrefix: "Error de autenticación",
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
    errorPrefix: "Error de autenticación",
    timeoutMessage: "Tiempo de espera agotado al renovar la sesión.",
  });
}

export function mapAuthenticatedUser(token) {
  const payload = decodeJwtPayload(token);
  const roles = payload?.role
    ? (Array.isArray(payload.role) ? payload.role : [payload.role])
    : [];
  const isAdmin = roles.some((role) => role === "SuperAdmin" || role === "Admin");

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

export async function registrarUsuario(payload) {
  return request(`${AUTH_BASE_URL}/register`, {
    method: "POST",
    body: JSON.stringify(payload),
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
