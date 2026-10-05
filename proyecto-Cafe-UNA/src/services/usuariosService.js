import { createDomainRequest, createListCache } from "./serviceHelpers";

const BASE_URL = `${import.meta.env.BACKEND_URL}/usuarios`;
const CACHE_TTL_MS = 10 * 60 * 1000;
const cache = createListCache(CACHE_TTL_MS);
const request = createDomainRequest(
  "Error en usuarios",
  "Tiempo de espera agotado al consultar usuarios.",
);

export async function obtenerUsuarios() {
  const cached = cache.get();
  if (cached) return cached;

  return cache.setPromise(request(BASE_URL));
}

export async function obtenerUsuarioPorId(id) {
  return request(`${BASE_URL}/${id}`);
}

export async function solicitarCreacionUsuario(nuevoUsuario) {
  cache.clear();
  return request(`${BASE_URL}/solicitar-creacion`, {
    method: "POST",
    data: nuevoUsuario,
  });
}

export async function confirmarCreacionUsuario({ correo, token }) {
  cache.clear();
  return request(`${BASE_URL}/confirmar-creacion`, {
    method: "POST",
    data: { correo, token },
  });
}

export async function solicitarCambioCorreoUsuario(id, { nuevoCorreo, passwordActual }) {
  return request(`${BASE_URL}/${id}/solicitar-cambio-correo`, {
    method: "PUT",
    data: { nuevoCorreo, passwordActual },
  });
}

export async function confirmarCambioCorreoUsuario(id, { nuevoCorreo, token }) {
  cache.clear();
  return request(`${BASE_URL}/${id}/confirmar-cambio-correo`, {
    method: "PUT",
    data: { nuevoCorreo, token },
  });
}

export async function actualizarUsuario(id, cambios) {
  cache.clear();
  return request(`${BASE_URL}/${id}`, {
    method: "PUT",
    data: cambios,
  });
}

export async function cambiarEstadoUsuario(id, estado = null) {
  cache.clear();
  return request(`${BASE_URL}/${id}/estado`, {
    method: "PATCH",
    data: { estado },
  });
}

export async function obtenerAsignacionesPunto(vendedorId) {
  return request(`${BASE_URL}/${vendedorId}/asignaciones-puntos`);
}

export async function obtenerPuntosAsignables() {
  return request(`${BASE_URL}/asignaciones-puntos/elegibles`);
}

export async function asignarPuntosVendedor(vendedorId, ubicacionIds) {
  return request(`${BASE_URL}/${vendedorId}/asignaciones-puntos`, {
    method: "POST",
    data: { ubicacionIds },
  });
}

export async function cambiarEstadoAsignacionPunto(vendedorId, ubicacionId, activo) {
  return request(`${BASE_URL}/${vendedorId}/asignaciones-puntos/${ubicacionId}`, {
    method: "PATCH",
    data: { activo },
  });
}

export async function cambiarPuntoAsignado(vendedorId, desdeUbicacionId, haciaUbicacionId) {
  return request(`${BASE_URL}/${vendedorId}/asignaciones-puntos/cambiar`, {
    method: "POST",
    data: { desdeUbicacionId, haciaUbicacionId },
  });
}
