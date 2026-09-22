import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/solicitudes`;

export async function obtenerMisSolicitudes(params = {}) {
  const query = new URLSearchParams();
  if (params.tipo && params.tipo !== "todos") query.set("tipo", params.tipo);
  if (params.estado && params.estado !== "todos") query.set("estado", params.estado);
  const qs = query.toString();
  return apiRequest(`${BASE_URL}/mias${qs ? `?${qs}` : ""}`, {
    errorPrefix: "Error al cargar solicitudes",
    timeoutMessage: "Tiempo de espera agotado al cargar solicitudes.",
  });
}

export async function obtenerDetalleSolicitudPropia(tipo, id) {
  return apiRequest(`${BASE_URL}/mias/${encodeURIComponent(tipo)}/${encodeURIComponent(id)}`, {
    errorPrefix: "Error al cargar el detalle",
    timeoutMessage: "Tiempo de espera agotado al cargar el detalle.",
  });
}
