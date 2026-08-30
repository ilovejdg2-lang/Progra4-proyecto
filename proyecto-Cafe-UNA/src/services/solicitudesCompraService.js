import { apiRequest } from "./apiClient";

const PROVEEDORES_URL = `${import.meta.env.BACKEND_URL}/proveedores`;
const SOLICITUDES_URL = `${import.meta.env.BACKEND_URL}/solicitudes-compra`;

function firstDefined(value, aliases) {
  for (const alias of aliases) {
    if (value?.[alias] !== undefined) return value[alias];
  }
  return undefined;
}

function responseList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export function normalizarProveedor(raw) {
  const id = firstDefined(raw, ["id", "Id"]);
  if (id === undefined || id === null) return null;
  return {
    id: String(id),
    nombre: String(firstDefined(raw, ["nombre", "Nombre"]) || "").trim(),
    correo: String(firstDefined(raw, ["correo", "Correo"]) || "").trim(),
    telefono: String(firstDefined(raw, ["telefono", "Telefono"]) || "").trim(),
    activo: Boolean(firstDefined(raw, ["activo", "Activo"]) ?? true),
  };
}

export function normalizarDetalle(raw) {
  return {
    id: String(firstDefined(raw, ["id", "Id"]) ?? ""),
    productoId: String(firstDefined(raw, ["productoId", "ProductoId"]) ?? ""),
    productoNombre: String(
      firstDefined(raw, ["productoNombre", "ProductoNombre", "nombreProducto"]) || "",
    ).trim(),
    cantidadSolicitada: Number(
      firstDefined(raw, ["cantidadSolicitada", "CantidadSolicitada"]) ?? 0,
    ),
  };
}

export function normalizarSolicitud(raw) {
  const id = firstDefined(raw, ["id", "Id"]);
  if (id === undefined || id === null) return null;
  const detallesRaw =
    firstDefined(raw, ["detalles", "Detalles", "items", "Items"]) || [];
  const historialRaw =
    firstDefined(raw, ["historialEstados", "HistorialEstados"]) || [];
  const fechaEstimada = firstDefined(raw, [
    "fechaEstimadaEntrega",
    "FechaEstimadaEntrega",
  ]);
  const creadoEn = firstDefined(raw, ["creadoEn", "CreadoEn", "fecha"]);

  return {
    id: String(id),
    proveedorId: String(firstDefined(raw, ["proveedorId", "ProveedorId"]) ?? ""),
    proveedorNombre: String(
      firstDefined(raw, ["proveedorNombre", "ProveedorNombre", "nombreProveedor"]) ||
        "",
    ).trim(),
    estado: String(firstDefined(raw, ["estado", "Estado"]) || "pendiente")
      .trim()
      .toLowerCase(),
    fechaEstimadaEntrega: fechaEstimada
      ? String(fechaEstimada).slice(0, 10)
      : "",
    urlProformaPdf: String(
      firstDefined(raw, ["urlProformaPdf", "UrlProformaPdf"]) || "",
    ).trim(),
    notas: String(firstDefined(raw, ["notas", "Notas"]) || "").trim(),
    creadoEn: creadoEn ? String(creadoEn) : "",
    cantidadItems: Number(
      firstDefined(raw, ["cantidadItems", "CantidadItems"]) ??
        (Array.isArray(detallesRaw) ? detallesRaw.length : 0),
    ),
    detalles: Array.isArray(detallesRaw)
      ? detallesRaw.map(normalizarDetalle)
      : [],
    historialEstados: Array.isArray(historialRaw) ? historialRaw : [],
  };
}

export async function obtenerProveedores({ incluirInactivos = false } = {}) {
  const query = incluirInactivos ? "?incluirInactivos=true" : "";
  const data = await apiRequest(`${PROVEEDORES_URL}${query}`, {
    errorPrefix: "Error en proveedores",
  });
  return responseList(data).map(normalizarProveedor).filter(Boolean);
}

export async function crearProveedor(payload) {
  const creado = await apiRequest(PROVEEDORES_URL, {
    method: "POST",
    body: JSON.stringify(payload),
    errorPrefix: "Error en proveedores",
  });
  return normalizarProveedor(creado);
}

export async function obtenerSolicitudesCompra({ estado, proveedorId } = {}) {
  const params = new URLSearchParams();
  if (estado) params.set("estado", estado);
  if (proveedorId) params.set("proveedorId", proveedorId);
  const query = params.toString() ? `?${params}` : "";
  const data = await apiRequest(`${SOLICITUDES_URL}${query}`, {
    errorPrefix: "Error en solicitudes de compra",
  });
  return responseList(data).map(normalizarSolicitud).filter(Boolean);
}

export async function obtenerSolicitudCompra(id) {
  const data = await apiRequest(`${SOLICITUDES_URL}/${encodeURIComponent(id)}`, {
    errorPrefix: "Error en solicitudes de compra",
  });
  return normalizarSolicitud(data);
}

export async function crearSolicitudCompra({
  proveedorId,
  fechaEstimadaEntrega,
  notas,
  detalles,
  proformaFile,
}) {
  const form = new FormData();
  form.append("proveedorId", String(proveedorId));
  if (fechaEstimadaEntrega) {
    form.append("fechaEstimadaEntrega", fechaEstimadaEntrega);
  }
  if (notas) form.append("notas", notas);
  form.append("detalles", JSON.stringify(detalles));
  if (proformaFile) form.append("proforma", proformaFile);

  const creado = await apiRequest(SOLICITUDES_URL, {
    method: "POST",
    body: form,
    errorPrefix: "Error al crear la solicitud de compra",
  });
  return normalizarSolicitud(creado);
}

export async function cambiarEstadoSolicitudCompra(id, estado) {
  const actualizado = await apiRequest(
    `${SOLICITUDES_URL}/${encodeURIComponent(id)}/estado`,
    {
      method: "PATCH",
      body: JSON.stringify({ estado }),
      errorPrefix: "Error al cambiar el estado de la solicitud",
    },
  );
  return normalizarSolicitud(actualizado);
}

export function urlAbsolutaProforma(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  const backend = String(import.meta.env.BACKEND_URL || "").replace(/\/api\/?$/, "");
  if (path.startsWith("/api/")) return `${backend}${path}`;
  return `${backend}/api${path.startsWith("/") ? path : `/${path}`}`;
}

/** Descarga la proforma con JWT (ya no es un static público). */
export async function descargarProformaAutenticada(solicitudId) {
  const id = String(solicitudId || "").trim();
  if (!id) throw new Error("Solicitud inválida.");
  const blob = await apiRequest(
    `${SOLICITUDES_URL}/${encodeURIComponent(id)}/proforma`,
    {
      method: "GET",
      responseType: "blob",
      errorPrefix: "Error al descargar la proforma",
    },
  );
  return blob instanceof Blob ? blob : new Blob([blob], { type: "application/pdf" });
}
