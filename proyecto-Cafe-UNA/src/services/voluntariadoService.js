import { getActiveSessionUser } from "./sessionService";

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/voluntariado/solicitudes`;

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
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  if (!res.ok) {
    let message = `Error en voluntariado (${res.status})`;
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

// ─── READ: obtener todas las solicitudes ────────────────────────────────────
export async function obtenerSolicitudes() {
  const data = await request(BASE_URL);
  return Array.isArray(data) ? data : [];
}

// ─── READ: obtener solicitudes de un usuario ────────────────────────────────
export async function obtenerSolicitudesDeUsuario(userId) {
  const data = await request(`${BASE_URL}/usuario/${userId}`);
  return Array.isArray(data) ? data : [];
}

// ─── CREATE: agregar nueva solicitud ────────────────────────────────────────
export async function crearSolicitud(nuevaSolicitud) {
  return request(BASE_URL, {
    method: "POST",
    body: JSON.stringify(nuevaSolicitud),
  });
}

// ─── UPDATE: actualizar campos de una solicitud ─────────────────────────────
export async function actualizarSolicitud(id, cambios) {
  return request(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(cambios),
  });
}

// ─── DELETE: eliminar una solicitud ─────────────────────────────────────────
export async function eliminarSolicitud(id) {
  await request(`${BASE_URL}/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ actorRoles: obtenerActorRoles() }),
  });
  return true;
}