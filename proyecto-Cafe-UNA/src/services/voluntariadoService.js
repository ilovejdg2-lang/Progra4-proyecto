import { getActiveSessionUser } from "./sessionService";
import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/voluntariado/solicitudes`;
const CACHE_TTL_MS = 10 * 60 * 1000;
let solicitudesCache = { expiresAt: 0, data: null };
let solicitudesInflight = null;

function clearSolicitudesCache() {
  solicitudesCache = { expiresAt: 0, data: null };
  solicitudesInflight = null;
}

function obtenerActorRoles() {
  try {
    const user = getActiveSessionUser();
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    if (String(user?.role || "").toLowerCase() === "admin" && !roles.some((rol) => String(rol).toLowerCase() === "admin")) {
      return [...roles, "Admin"];
    }
    return roles;
  } catch {
    return [];
  }
}

async function request(url, options = {}) {
  return apiRequest(url, {
    ...options,
    errorPrefix: "Error en voluntariado",
    timeoutMessage: "Tiempo de espera agotado al consultar voluntariado.",
  });
}

// ─── READ: obtener todas las solicitudes ────────────────────────────────────
export async function obtenerSolicitudes() {
  if (solicitudesCache.expiresAt > Date.now() && Array.isArray(solicitudesCache.data)) {
    return solicitudesCache.data;
  }

  if (solicitudesInflight) {
    return solicitudesInflight;
  }

  solicitudesInflight = request(BASE_URL)
    .then((data) => {
      const list = Array.isArray(data) ? data : [];
      solicitudesCache = { expiresAt: Date.now() + CACHE_TTL_MS, data: list };
      solicitudesInflight = null;
      return list;
    })
    .catch((error) => {
      solicitudesInflight = null;
      throw error;
    });

  return solicitudesInflight;
}

// ─── READ: obtener solicitudes de un usuario ────────────────────────────────
export async function obtenerSolicitudesDeUsuario(userId) {
  const data = await request(`${BASE_URL}/usuario/${userId}`);
  return Array.isArray(data) ? data : [];
}

// ─── CREATE: agregar nueva solicitud ────────────────────────────────────────
export async function crearSolicitud(nuevaSolicitud) {
  clearSolicitudesCache();
  return request(BASE_URL, {
    method: "POST",
    body: JSON.stringify(nuevaSolicitud),
  });
}

// ─── UPDATE: actualizar campos de una solicitud ─────────────────────────────
export async function actualizarSolicitud(id, cambios) {
  clearSolicitudesCache();
  return request(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(cambios),
  });
}

// ─── DELETE: eliminar una solicitud ─────────────────────────────────────────
export async function eliminarSolicitud(id) {
  clearSolicitudesCache();
  await request(`${BASE_URL}/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ actorRoles: obtenerActorRoles() }),
  });
  return true;
}