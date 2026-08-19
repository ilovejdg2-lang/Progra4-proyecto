import { createDomainRequest, createListCache } from "./serviceHelpers";

const BASE_URL = `${import.meta.env.BACKEND_URL}/voluntariado/solicitudes`;
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = createListCache(CACHE_TTL_MS);
const request = createDomainRequest(
  "Error en voluntariado",
  "Tiempo de espera agotado al consultar voluntariado.",
);

export async function obtenerSolicitudes() {
  const cached = cache.get();
  if (cached) return cached;

  return cache.setPromise(request(BASE_URL));
}

export async function obtenerSolicitudesDeUsuario(userId) {
  const data = await request(`${BASE_URL}/usuario/${userId}`);
  return Array.isArray(data) ? data : [];
}

export async function crearSolicitud(nuevaSolicitud) {
  cache.clear();
  return request(BASE_URL, {
    method: "POST",
    data: nuevaSolicitud,
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
