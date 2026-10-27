import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/voluntariado/fechas`;

export const ZONA_HORARIA_PREDETERMINADA = "America/Costa_Rica";

/**
 * Retorna la fecha 'hoy' en formato 'YYYY-MM-DD' según la zona horaria indicada.
 * Usa 'America/Costa_Rica' por defecto para consistencia con el servidor.
 */
export function obtenerHoyIso(timeZone = ZONA_HORARIA_PREDETERMINADA) {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: ZONA_HORARIA_PREDETERMINADA,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  }
}

/**
 * Obtener configuración de zona horaria y fecha hoy vigente del servidor.
 */
export async function obtenerConfigFechas() {
  try {
    const data = await apiRequest(`${BASE_URL}/config`, { skipAuth: true });
    return data;
  } catch {
    return {
      zonaHoraria: ZONA_HORARIA_PREDETERMINADA,
      hoy: obtenerHoyIso(ZONA_HORARIA_PREDETERMINADA),
    };
  }
}

/**
 * Consulta pública de fechas disponibles de voluntariado (a partir de hoy según zona horaria).
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
 * Consulta administrativa de todas las fechas (habilitadas y deshabilitadas, incluyendo históricas).
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
 * Consulta las solicitudes vinculadas a una fecha y tipo para detectar participantes antes de retirar la fecha.
 */
export async function obtenerSolicitudesVinculadasFecha(tipo, fecha) {
  const qs = tipo ? `?tipo=${encodeURIComponent(tipo)}` : "";
  return apiRequest(`${BASE_URL}/${fecha}/solicitudes-vinculadas${qs}`);
}

/**
 * Cancela la actividad de una fecha y la retira (deshabilita o elimina):
 * Conserva las solicitudes, las actualiza a 'Cancelada' y notifica a cada participante.
 */
export async function cancelarActividadYRetirarFecha(tipo, fecha, payload = {}) {
  const qs = tipo ? `?tipo=${encodeURIComponent(tipo)}` : "";
  return apiRequest(`${BASE_URL}/${fecha}/cancelar-actividad${qs}`, {
    method: "POST",
    data: {
      tipo,
      accion: payload.accion || "deshabilitar",
      orientacion: payload.orientacion || payload.motivoCancelacion || "",
    },
  });
}

/**
 * Reintenta el envío de avisos de cancelación a participantes pendientes sin duplicar avisos.
 */
export async function reintentarNotificacionesCancelacion(tipo, fecha, orientacion = "") {
  const qs = tipo ? `?tipo=${encodeURIComponent(tipo)}` : "";
  return apiRequest(`${BASE_URL}/${fecha}/reintentar-notificaciones${qs}`, {
    method: "POST",
    data: { tipo, orientacion },
  });
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
 * Permite enviar confirmarCancelacion y motivoCancelacion si existen inscritos.
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
      confirmarCancelacion: Boolean(payload.confirmarCancelacion),
      motivoCancelacion: payload.motivoCancelacion ?? payload.orientacion ?? "",
    },
  });
}

/**
 * Alternar el estado (toggle) de una fecha para un tipo.
 */
export async function toggleFechaAdmin(tipo, fecha, payload = {}) {
  const qs = tipo ? `?tipo=${encodeURIComponent(tipo)}` : "";
  return apiRequest(`${BASE_URL}/${fecha}/toggle${qs}`, {
    method: "POST",
    data: {
      tipo,
      confirmarCancelacion: Boolean(payload.confirmarCancelacion),
      motivoCancelacion: payload.motivoCancelacion ?? payload.orientacion ?? "",
    },
  });
}

/**
 * Eliminar el registro de una fecha para un tipo específico.
 */
export async function eliminarFechaAdmin(tipo, fecha, payload = {}) {
  const qs = tipo ? `?tipo=${encodeURIComponent(tipo)}` : "";
  return apiRequest(`${BASE_URL}/${fecha}${qs}`, {
    method: "DELETE",
    data: {
      tipo,
      confirmarCancelacion: Boolean(payload?.confirmarCancelacion),
      motivoCancelacion: payload?.motivoCancelacion ?? payload?.orientacion ?? "",
    },
  });
}
