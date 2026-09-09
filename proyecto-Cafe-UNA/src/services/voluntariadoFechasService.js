import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/voluntariado/fechas`;

/**
 * Consulta pública de fechas disponibles de voluntariado (a partir de hoy).
 * Permite filtrar por tipo de voluntariado.
 */
export async function obtenerFechasDisponibles(tipo, desde, hasta) {
  const params = new URLSearchParams();
  if (tipo) params.set("tipo", tipo);
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const data = await apiRequest(`${BASE_URL}/disponibles${qs}`, {
    skipAuth: true,
  });
  return Array.isArray(data) ? data : [];
}

/**
 * Consulta pública del resumen de disponibilidad por tipo de voluntariado.
 */
export async function obtenerResumenTipos() {
  const data = await apiRequest(`${BASE_URL}/resumen-tipos`, {
    skipAuth: true,
  });
  const map = {};
  if (Array.isArray(data)) {
    for (const item of data) {
      const tipo = item?.tipo || item?.Tipo;
      const total = Number(item?.total ?? item?.Total) || 0;
      if (tipo) {
        map[tipo] = total;
        map[tipo.toLowerCase()] = total;
      }
    }
  } else if (data && typeof data === "object") {
    for (const [key, val] of Object.entries(data)) {
      const total = Number(val) || 0;
      map[key] = total;
      map[key.toLowerCase()] = total;
    }
  }

  // Homologar General con Apoyo General para compatibilidad total
  const conteoGeneral = map["general"] || 0;
  const conteoApoyo = map["apoyo general"] || 0;
  const totalApoyo = conteoApoyo + (conteoGeneral > 0 && conteoApoyo === 0 ? conteoGeneral : 0);
  if (totalApoyo > 0) {
    map["Apoyo General"] = totalApoyo;
    map["apoyo general"] = totalApoyo;
  }

  return map;
}

/**
 * Consulta administrativa de todas las fechas (habilitadas y deshabilitadas).
 * Permite filtrar por tipo de voluntariado.
 */
export async function obtenerTodasFechasAdmin(tipo, desde, hasta) {
  const params = new URLSearchParams();
  if (tipo) params.set("tipo", tipo);
  if (desde) params.set("desde", desde);
  if (hasta) params.set("hasta", hasta);
  const qs = params.toString() ? `?${params.toString()}` : "";
  const data = await apiRequest(`${BASE_URL}${qs}`);
  return Array.isArray(data) ? data : [];
}

/**
 * Habilitar una fecha desde el panel administrativo para un tipo de voluntariado.
 */
export async function habilitarFechaAdmin(tipo, fecha, payload = {}) {
  return apiRequest(BASE_URL, {
    method: "POST",
    data: {
      tipo,
      fecha,
      habilitada: true,
      horarios: payload.horarios ?? [],
      cupoMaximo: payload.cupoMaximo ?? null,
      observaciones: payload.observaciones ?? "",
    },
  });
}

/**
 * Actualizar el estado de una fecha (habilitar/deshabilitar) para un tipo.
 */
export async function actualizarEstadoFechaAdmin(tipo, fecha, habilitada, payload = {}) {
  const qs = tipo ? `?tipo=${encodeURIComponent(tipo)}` : "";
  return apiRequest(`${BASE_URL}/${fecha}${qs}`, {
    method: "PUT",
    data: {
      tipo,
      habilitada,
      horarios: payload.horarios ?? [],
      cupoMaximo: payload.cupoMaximo ?? null,
      observaciones: payload.observaciones ?? "",
    },
  });
}

/**
 * Alternar el estado (toggle) de una fecha para un tipo.
 */
export async function toggleFechaAdmin(tipo, fecha) {
  const qs = tipo ? `?tipo=${encodeURIComponent(tipo)}` : "";
  return apiRequest(`${BASE_URL}/${fecha}/toggle${qs}`, {
    method: "POST",
    data: { tipo },
  });
}

/**
 * Eliminar el registro de una fecha para un tipo específico.
 */
export async function eliminarFechaAdmin(tipo, fecha) {
  const qs = tipo ? `?tipo=${encodeURIComponent(tipo)}` : "";
  return apiRequest(`${BASE_URL}/${fecha}${qs}`, {
    method: "DELETE",
    data: { tipo },
  });
}
