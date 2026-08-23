import { createDomainRequest, createListCache } from "./serviceHelpers";
import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/voluntariado/solicitudes`;
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = createListCache(CACHE_TTL_MS);
const request = createDomainRequest(
  "Error en voluntariado",
  "Tiempo de espera agotado al consultar voluntariado.",
);

export async function obtenerSolicitudes(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    const normalizado = String(valor ?? "").trim();
    if (normalizado) params.set(clave, normalizado);
  });

  const query = params.toString();
  const url = query ? `${BASE_URL}?${query}` : BASE_URL;

  if (!query) {
    const cached = cache.get();
    if (cached) return cached;
    return cache.setPromise(request(url));
  }

  cache.clear();
  return request(url);
}

export async function obtenerSolicitudesDeUsuario(userId) {
  const data = await request(`${BASE_URL}/usuario/${userId}`);
  return Array.isArray(data) ? data : [];
}

export async function crearSolicitud(datos) {
  cache.clear();
  return request(BASE_URL, {
    method: "POST",
    data: datos,
  });
}

export async function actualizarSolicitud(id, cambios) {
  cache.clear();
  return request(`${BASE_URL}/${id}`, {
    method: "PUT",
    data: cambios,
  });
}

export async function eliminarSolicitud(id) {
  cache.clear();
  await request(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
  return true;
}
