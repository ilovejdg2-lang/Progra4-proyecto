import { getActiveSessionUser } from "./sessionService";

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/usuarios`;
const REQUEST_TIMEOUT_MS = 10000;

async function request(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Tiempo de espera agotado al consultar usuarios.", { cause: error });
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!res.ok) {
    let message = `Error en usuarios (${res.status})`;
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch {
      // ignore parse error and keep fallback message
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
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