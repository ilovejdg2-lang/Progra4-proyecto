import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/movimientos`;

function firstDefined(value, aliases) {
  for (const alias of aliases) {
    if (value?.[alias] !== undefined) return value[alias];
  }
  return undefined;
}

export function normalizarMovimiento(raw) {
  const id = firstDefined(raw, ["id", "Id"]);
  if (id === undefined || id === null) return null;
  const fecha = firstDefined(raw, ["fecha", "Fecha"]);
  return {
    id: String(id),
    fecha: fecha ? String(fecha) : "",
    tipo: String(firstDefined(raw, ["tipo", "Tipo"]) || "").trim(),
    productoId: String(firstDefined(raw, ["productoId", "ProductoId"]) ?? ""),
    productoNombre: String(
      firstDefined(raw, ["productoNombre", "ProductoNombre"]) || "",
    ).trim(),
    cantidad: Number(firstDefined(raw, ["cantidad", "Cantidad"]) ?? 0),
    ubicacionOrigenId: firstDefined(raw, ["ubicacionOrigenId", "UbicacionOrigenId"]) ?? null,
    origenNombre: String(firstDefined(raw, ["origenNombre", "OrigenNombre"]) || "").trim(),
    ubicacionDestinoId: firstDefined(raw, ["ubicacionDestinoId", "UbicacionDestinoId"]) ?? null,
    destinoNombre: String(firstDefined(raw, ["destinoNombre", "DestinoNombre"]) || "").trim(),
    responsableId: firstDefined(raw, ["responsableId", "ResponsableId"]) ?? null,
    responsableNombre: String(
      firstDefined(raw, ["responsableNombre", "ResponsableNombre"]) || "",
    ).trim(),
    notas: String(firstDefined(raw, ["notas", "Notas"]) || "").trim(),
  };
}

export async function obtenerHistorialMovimientos({
  productoId,
  producto,
  tipo,
  ubicacionId,
  fechaDesde,
  fechaHasta,
  page = 1,
  limit = 25,
} = {}) {
  const params = new URLSearchParams();
  if (productoId) params.set("producto_id", String(productoId));
  if (producto) params.set("producto", String(producto));
  if (tipo) params.set("tipo", String(tipo));
  if (ubicacionId) params.set("ubicacion_id", String(ubicacionId));
  if (fechaDesde) params.set("fecha_desde", fechaDesde);
  if (fechaHasta) params.set("fecha_hasta", fechaHasta);
  params.set("page", String(page));
  params.set("limit", String(limit));

  const data = await apiRequest(`${BASE_URL}?${params}`, {
    errorPrefix: "Error en historial de movimientos",
  });

  const items = Array.isArray(data?.items)
    ? data.items.map(normalizarMovimiento).filter(Boolean)
    : [];

  return {
    items,
    total: Number(data?.total ?? items.length) || 0,
    page: Number(data?.page ?? page) || page,
    limit: Number(data?.limit ?? limit) || limit,
  };
}
