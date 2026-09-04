import { apiRequest } from "./apiClient";

const BASE = `${import.meta.env.BACKEND_URL}/v1/donaciones`;

function firstDefined(value, aliases) {
  for (const alias of aliases) {
    if (value?.[alias] !== undefined) return value[alias];
  }
  return undefined;
}

export function normalizarNecesidad(raw) {
  const id = firstDefined(raw, ["id", "Id"]);
  if (id === undefined || id === null) return null;
  return {
    id: Number(id),
    uuid: String(firstDefined(raw, ["uuid", "Uuid"]) || ""),
    titulo: String(firstDefined(raw, ["titulo", "Titulo"]) || "").trim(),
    descripcion: String(firstDefined(raw, ["descripcion", "Descripcion"]) || "").trim(),
    prioridad: String(firstDefined(raw, ["prioridad", "Prioridad"]) || "").toUpperCase(),
    cantidadRequerida: firstDefined(raw, ["cantidadRequerida", "CantidadRequerida"]) ?? null,
    estado: String(firstDefined(raw, ["estado", "Estado"]) || "").toUpperCase(),
  };
}

export function normalizarSolicitudDonacion(raw) {
  const id = firstDefined(raw, ["id", "Id"]);
  if (id === undefined || id === null) return null;
  const fecha = firstDefined(raw, ["fechaPropuesta", "FechaPropuesta"]);
  return {
    id: Number(id),
    tipo: String(firstDefined(raw, ["tipo", "Tipo"]) || "").trim(),
    descripcion: String(firstDefined(raw, ["descripcion", "Descripcion"]) || "").trim(),
    fechaPropuesta: fecha ? String(fecha).slice(0, 10) : "",
    estado: String(firstDefined(raw, ["estado", "Estado"]) || "").trim(),
    necesidadTitulo: String(
      firstDefined(raw, ["necesidadTitulo", "NecesidadTitulo"]) || "",
    ).trim(),
    usuarioNombre: String(firstDefined(raw, ["usuarioNombre", "UsuarioNombre"]) || "").trim(),
    createdAt: firstDefined(raw, ["createdAt", "CreatedAt"]) || "",
  };
}

export async function obtenerNecesidadesPublicas() {
  const data = await apiRequest(`${BASE}/necesidades`, {
    skipAuth: true,
    errorPrefix: "Error al consultar necesidades",
  });
  return (Array.isArray(data) ? data : []).map(normalizarNecesidad).filter(Boolean);
}

export async function obtenerNecesidadesAdmin() {
  const data = await apiRequest(`${BASE}/necesidades/gestion`, {
    errorPrefix: "Error al consultar necesidades",
  });
  return (Array.isArray(data) ? data : []).map(normalizarNecesidad).filter(Boolean);
}

export async function crearNecesidad(payload) {
  return normalizarNecesidad(
    await apiRequest(`${BASE}/necesidades`, {
      method: "POST",
      body: JSON.stringify(payload),
      errorPrefix: "Error al crear la necesidad",
    }),
  );
}

export async function actualizarNecesidad(id, payload) {
  return normalizarNecesidad(
    await apiRequest(`${BASE}/necesidades/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
      errorPrefix: "Error al actualizar la necesidad",
    }),
  );
}

export async function inactivarNecesidad(id) {
  return normalizarNecesidad(
    await apiRequest(`${BASE}/necesidades/${id}/inactivar`, {
      method: "PATCH",
      errorPrefix: "Error al inactivar la necesidad",
    }),
  );
}

export async function enviarSolicitudDonacion(payload) {
  return normalizarSolicitudDonacion(
    await apiRequest(`${BASE}/solicitudes`, {
      method: "POST",
      body: JSON.stringify(payload),
      errorPrefix: "Error al enviar la solicitud de donación",
    }),
  );
}

export async function obtenerMisSolicitudesDonacion() {
  const data = await apiRequest(`${BASE}/solicitudes/mias`, {
    errorPrefix: "Error al consultar donaciones",
  });
  return (Array.isArray(data) ? data : []).map(normalizarSolicitudDonacion).filter(Boolean);
}

export async function obtenerSolicitudesDonacionAdmin() {
  const data = await apiRequest(`${BASE}/solicitudes`, {
    errorPrefix: "Error al consultar solicitudes de donación",
  });
  return (Array.isArray(data) ? data : []).map(normalizarSolicitudDonacion).filter(Boolean);
}
