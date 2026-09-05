import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/voluntariado/fechas`;

/**
 * Consulta pública de fechas disponibles de voluntariado (a partir de hoy).
 */
export async function obtenerFechasDisponibles(desde, hasta) {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const data = await apiRequest(`${BASE_URL}/disponibles${qs}`, {
    skipAuth: true,
  });
  return Array.isArray(data) ? data : [];
}

/**
 * Consulta administrativa de todas las fechas (habilitadas y deshabilitadas).
 */
export async function obtenerTodasFechasAdmin(desde, hasta) {
  const params = new URLSearchParams();
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const data = await apiRequest(`${BASE_URL}${qs}`);
  return Array.isArray(data) ? data : [];
}

/**
 * Habilitar una fecha desde el panel administrativo.
 */
export async function habilitarFechaAdmin(fecha, payload = {}) {
  return apiRequest(BASE_URL, {
    method: "POST",
    data: {
      fecha,
      habilitada: true,
      cupoMaximo: payload.cupoMaximo ?? null,
      observaciones: payload.observaciones ?? "",
    },
  });
}

/**
 * Actualizar el estado de una fecha (habilitar/deshabilitar).
 */
export async function actualizarEstadoFechaAdmin(fecha, habilitada, payload = {}) {
  return apiRequest(`${BASE_URL}/${fecha}`, {
    method: "PUT",
    data: {
      habilitada,
      cupoMaximo: payload.cupoMaximo ?? null,
      observaciones: payload.observaciones ?? "",
    },
  });
}

/**
 * Alternar el estado (toggle) de una fecha.
 */
export async function toggleFechaAdmin(fecha) {
  return apiRequest(`${BASE_URL}/${fecha}/toggle`, {
    method: "POST",
  });
}

/**
 * Eliminar el registro de una fecha.
 */
export async function eliminarFechaAdmin(fecha) {
  return apiRequest(`${BASE_URL}/${fecha}`, {
    method: "DELETE",
  });
}
