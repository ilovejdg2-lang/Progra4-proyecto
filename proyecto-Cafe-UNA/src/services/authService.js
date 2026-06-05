import { apiRequest } from "./apiClient";

const AUTH_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/auth`;

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

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    return JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
  } catch {
    return null;
  }
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
