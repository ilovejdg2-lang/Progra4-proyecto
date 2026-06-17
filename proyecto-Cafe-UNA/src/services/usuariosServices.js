import { getActiveSessionUser } from "./sessionService";
import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/usuarios`;
const CACHE_TTL_MS = 10 * 60 * 1000;
let usuariosCache = { expiresAt: 0, data: null };
let usuariosInflight = null;

function clearUsuariosCache() {
  usuariosCache = { expiresAt: 0, data: null };
  usuariosInflight = null;
}

async function request(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const isPublicRead = method === "GET";

  return apiRequest(url, {
    ...options,
    skipAuth: isPublicRead ? true : options.skipAuth,
    errorPrefix: "Error en usuarios",
    timeoutMessage: "Tiempo de espera agotado al consultar usuarios.",
  });
}

// ─── READ: obtener todos los usuarios ────────────────────────────────────────
export async function obtenerUsuarios() {
  if (usuariosCache.expiresAt > Date.now() && Array.isArray(usuariosCache.data)) {
    return usuariosCache.data;
  }

  if (usuariosInflight) {
    return usuariosInflight;
  }

  usuariosInflight = request(BASE_URL)
    .then((data) => {
      const list = Array.isArray(data) ? data : [];
      usuariosCache = { expiresAt: Date.now() + CACHE_TTL_MS, data: list };
      usuariosInflight = null;
      return list;
    })
    .catch((error) => {
      usuariosInflight = null;
      throw error;
    });

  return usuariosInflight;
}

// ─── READ: obtener sólo usuarios activos ────────────────────────────────────
export async function obtenerUsuariosActivos() {
  const data = await request(`${BASE_URL}/activos`);
  return Array.isArray(data) ? data : [];
}

// ─── READ: obtener un usuario por id ────────────────────────────────────────
export async function obtenerUsuarioPorId(id) {
  return request(`${BASE_URL}/${id}`);
}

// ─── CREATE: agregar nuevo usuario (con verificación de correo) ───────────────
export async function solicitarCreacionUsuario(nuevoUsuario) {
  clearUsuariosCache();
  return request(`${BASE_URL}/solicitar-creacion`, {
    method: "POST",
    body: JSON.stringify(nuevoUsuario),
  });
}

export async function confirmarCreacionUsuario({ correo, token }) {
  clearUsuariosCache();
  return request(`${BASE_URL}/confirmar-creacion`, {
    method: "POST",
    body: JSON.stringify({ correo, token }),
  });
}

export async function solicitarCambioCorreoUsuario(id, { nuevoCorreo, passwordActual }) {
  return request(`${BASE_URL}/${id}/solicitar-cambio-correo`, {
    method: "PUT",
    body: JSON.stringify({ nuevoCorreo, passwordActual }),
  });
}

export async function confirmarCambioCorreoUsuario(id, { nuevoCorreo, token }) {
  return request(`${BASE_URL}/${id}/confirmar-cambio-correo`, {
    method: "PUT",
    body: JSON.stringify({ nuevoCorreo, token }),
  });
}

// ─── CREATE: agregar nuevo usuario (deprecado, usar solicitar+confirmar) ────
export async function crearUsuario(nuevoUsuario) {
  clearUsuariosCache();
  return request(BASE_URL, {
    method: "POST",
    body: JSON.stringify(nuevoUsuario),
  });
}

// ─── UPDATE: actualizar campos de un usuario ────────────────────────────────
export async function actualizarUsuario(id, cambios) {
  clearUsuariosCache();
  const actor = getActiveSessionUser();

  return request(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify({
      ...cambios,
      actorId: Number(actor?.id) || null,
      actorRoles: Array.isArray(actor?.roles) ? actor.roles : [],
    }),
  });
}

// ─── TOGGLE ESTADO: activar o inactivar un usuario ──────────────────────────
/**
 * Alterna el estado del usuario entre "activo" e "inactivo".
 * Si se pasa el parámetro `forzar`, establece ese estado directamente.
 *
 * @param {number} id
 * @param {"activo"|"inactivo"|null} forzar  - opcional
 * @returns {Promise<object>} usuario actualizado
 */
export async function toggleEstadoUsuario(id, forzar = null) {
  clearUsuariosCache();
  const actor = getActiveSessionUser();

  return request(`${BASE_URL}/${id}/estado`, {
    method: "PATCH",
    body: JSON.stringify({
      estado: forzar ?? null,
      actorId: Number(actor?.id) || null,
      actorRoles: Array.isArray(actor?.roles) ? actor.roles : [],
    }),
  });
}

// ─── Atajos explícitos ───────────────────────────────────────────────────────
export const activarUsuario   = (id) => toggleEstadoUsuario(id, "activo");
export const inactivarUsuario = (id) => toggleEstadoUsuario(id, "inactivo");