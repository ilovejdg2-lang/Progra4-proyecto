import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/ventas-presenciales`;

function firstDefined(value, aliases) {
  for (const alias of aliases) {
    if (value?.[alias] !== undefined) return value[alias];
  }
  return undefined;
}

export function normalizarPuntoPresencial(raw) {
  if (!raw) return null;
  const code = String(firstDefined(raw, ["code", "Codigo", "codigo"]) || "").trim();
  const id = firstDefined(raw, ["id", "Id"]);
  if (!code && id == null) return null;
  return {
    id: id != null ? Number(id) : null,
    code,
    name: String(firstDefined(raw, ["name", "Nombre", "nombre"]) || code),
    activo: firstDefined(raw, ["activo", "Activo"]) !== false,
  };
}

export function normalizarVentaPresencial(raw) {
  if (!raw) return null;
  return {
    id: String(firstDefined(raw, ["id", "Id"]) || ""),
    productoId: String(firstDefined(raw, ["productoId", "ProductoId"]) || ""),
    productoNombre: String(firstDefined(raw, ["productoNombre", "ProductoNombre"]) || ""),
    ubicacionId: Number(firstDefined(raw, ["ubicacionId", "UbicacionId"]) || 0),
    ubicacionCodigo: String(firstDefined(raw, ["ubicacionCodigo", "UbicacionCodigo"]) || ""),
    ubicacionNombre: String(firstDefined(raw, ["ubicacionNombre", "UbicacionNombre"]) || ""),
    cantidad: Number(firstDefined(raw, ["cantidad", "Cantidad"]) || 0),
    fecha: String(firstDefined(raw, ["fecha", "Fecha"]) || ""),
    notas: String(firstDefined(raw, ["notas", "Notas"]) || ""),
    stockRestante: Number(firstDefined(raw, ["stockRestante", "StockRestante"]) || 0),
    responsableId: firstDefined(raw, ["responsableId", "ResponsableId"]) ?? null,
  };
}

export async function obtenerPuntosVentaPresencial() {
  const data = await apiRequest(`${BASE_URL}/puntos`, {
    errorPrefix: "Error al cargar puntos de venta",
  });
  const rows = Array.isArray(data) ? data : data?.data || [];
  return rows.map(normalizarPuntoPresencial).filter(Boolean);
}

export async function registrarVentaPresencial(payload) {
  const data = await apiRequest(BASE_URL, {
    method: "POST",
    body: JSON.stringify(payload),
    errorPrefix: "Error al registrar la venta presencial",
  });
  return normalizarVentaPresencial(data);
}
