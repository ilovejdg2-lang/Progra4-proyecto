import { apiRequest } from "./apiClient";

const AUTH_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/auth`;

async function request(url, options = {}) {
  return apiRequest(url, {
    ...options,
    errorPrefix: "Error de autenticación",
    timeoutMessage: "Tiempo de espera agotado al autenticar.",
  });
}

export async function registrarUsuario(payload) {
  return request(`${AUTH_BASE_URL}/register`, {
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
