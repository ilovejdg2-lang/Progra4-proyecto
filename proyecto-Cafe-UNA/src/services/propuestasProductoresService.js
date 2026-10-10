import { apiRequest } from "./apiClient";

const BASE = `${import.meta.env.BACKEND_URL}/propuestas-productores`;
const PUBLICAS = `${import.meta.env.BACKEND_URL}/productores`;
const NOTIFICACIONES = `${import.meta.env.BACKEND_URL}/notificaciones`;

function avisar() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("propuestas-updated"));
  }
}

export async function crearPropuestaProductor(formData) {
  const data = await apiRequest(BASE, {
    method: "POST",
    data: formData,
    timeout: 60000,
    errorPrefix: "No se pudo enviar la propuesta",
  });
  avisar();
  return data;
}

export async function obtenerMisPropuestas() {
  const data = await apiRequest(`${BASE}/mias`, {
    errorPrefix: "No se pudieron cargar tus propuestas",
  });
  return Array.isArray(data) ? data : [];
}

export async function obtenerMiPropuesta(id) {
  return apiRequest(`${BASE}/mias/${encodeURIComponent(id)}`, {
    errorPrefix: "No se pudo cargar la propuesta",
  });
}

export async function obtenerProductoresPublicos() {
  const data = await apiRequest(PUBLICAS, {
    skipAuth: true,
    errorPrefix: "No se pudieron cargar los productores",
  });
  return Array.isArray(data) ? data : [];
}

export async function obtenerPropuestasAdmin(filtros = {}) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([clave, valor]) => {
    const texto = String(valor ?? "").trim();
    if (texto) params.set(clave, texto);
  });
  const query = params.toString();
  return apiRequest(query ? `${BASE}?${query}` : BASE, {
    errorPrefix: "No se pudieron cargar las propuestas",
  });
}

export async function obtenerPropuestaAdmin(id) {
  return apiRequest(`${BASE}/${encodeURIComponent(id)}`, {
    errorPrefix: "No se pudo cargar la propuesta",
  });
}

export async function aprobarPropuesta(id) {
  const data = await apiRequest(`${BASE}/${encodeURIComponent(id)}/aprobar`, {
    method: "POST",
    errorPrefix: "No se pudo aprobar la propuesta",
  });
  avisar();
  return data;
}

export async function rechazarPropuesta(id, motivo) {
  const data = await apiRequest(`${BASE}/${encodeURIComponent(id)}/rechazar`, {
    method: "POST",
    body: JSON.stringify({ motivo }),
    errorPrefix: "No se pudo rechazar la propuesta",
  });
  avisar();
  return data;
}

export async function obtenerBlobImagenPropuesta(nombre) {
  return apiRequest(`${PUBLICAS}/imagenes/${encodeURIComponent(nombre)}`, {
    responseType: "blob",
    errorPrefix: "No se pudo cargar la imagen",
  });
}

export async function obtenerNotificacionesPropias() {
  const data = await apiRequest(NOTIFICACIONES, {
    errorPrefix: "No se pudieron cargar las notificaciones",
  });
  return {
    noLeidas: Number(data?.noLeidas || 0),
    data: Array.isArray(data?.data) ? data.data : [],
  };
}

export async function marcarNotificacionLeida(id) {
  const data = await apiRequest(`${NOTIFICACIONES}/${encodeURIComponent(id)}/leida`, {
    method: "POST",
    errorPrefix: "No se pudo actualizar la notificación",
  });
  avisar();
  return data;
}
