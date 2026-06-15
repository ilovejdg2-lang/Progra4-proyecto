import { getActiveSessionUser } from "./sessionService";
import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/usuarios`;

async function request(url, options = {}) {
  return apiRequest(url, {
    ...options,
    errorPrefix: "Error en usuarios",
    timeoutMessage: "Tiempo de espera agotado al consultar usuarios.",
  });
}

// ─── READ: obtener todos los usuarios ────────────────────────────────────────
export async function obtenerUsuarios() {
  const data = await request(BASE_URL);
  return Array.isArray(data) ? data : [];
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

// ─── CREATE: agregar nuevo usuario ───────────────────────────────────────────
export async function crearUsuario(nuevoUsuario) {
  return request(BASE_URL, {
    method: "POST",
    body: JSON.stringify(nuevoUsuario),
  });
}

// ─── UPDATE: actualizar campos de un usuario ────────────────────────────────
export async function actualizarUsuario(id, cambios) {
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