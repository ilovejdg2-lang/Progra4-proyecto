import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/transferencias`;

function firstDefined(value, aliases) {
  for (const alias of aliases) {
    if (value?.[alias] !== undefined) return value[alias];
  }
  return undefined;
}

export function normalizarTransferencia(raw) {
  const id = firstDefined(raw, ["id", "Id"]);
  if (id === undefined || id === null) return null;
  const fecha = firstDefined(raw, ["fecha", "Fecha"]);
  return {
    id: String(id),
    fecha: fecha ? String(fecha) : "",
    productoId: String(firstDefined(raw, ["productoId", "ProductoId"]) ?? ""),
    productoNombre: String(
      firstDefined(raw, ["productoNombre", "ProductoNombre"]) || "",
    ).trim(),
    cantidad: Number(firstDefined(raw, ["cantidad", "Cantidad"]) ?? 0),
    destinoCodigo: String(
      firstDefined(raw, ["destinoCodigo", "DestinoCodigo"]) || "",
    ).trim(),
    destinoNombre: String(
      firstDefined(raw, ["destinoNombre", "DestinoNombre"]) || "",
    ).trim(),
    responsableId: firstDefined(raw, ["responsableId", "ResponsableId"]) ?? null,
    responsableNombre: String(
      firstDefined(raw, ["responsableNombre", "ResponsableNombre"]) || "",
    ).trim(),
    notas: String(firstDefined(raw, ["notas", "Notas"]) || "").trim(),
  };
}

export async function crearTransferencia(payload) {
  return apiRequest(BASE_URL, {
    method: "POST",
    body: JSON.stringify(payload),
    errorPrefix: "Error al registrar la distribución",
  });
}

export async function obtenerHistorialTransferencias({
  fechaDesde,
  fechaHasta,
  ubicacionDestino,
  page = 1,
  pageSize = 20,
} = {}) {
  const params = new URLSearchParams();
  if (fechaDesde) params.set("fechaDesde", fechaDesde);
  if (fechaHasta) params.set("fechaHasta", fechaHasta);
  if (ubicacionDestino) params.set("ubicacionDestino", ubicacionDestino);
  params.set("page", String(page));
  params.set("pageSize", String(Math.min(pageSize, 20)));

  const data = await apiRequest(`${BASE_URL}?${params}`, {
    errorPrefix: "Error en historial de transferencias",
  });

  const items = Array.isArray(data?.items)
    ? data.items.map(normalizarTransferencia).filter(Boolean)
    : Array.isArray(data)
      ? data.map(normalizarTransferencia).filter(Boolean)
      : [];

  return {
    items,
    total: Number(data?.total ?? items.length) || 0,
    page: Number(data?.page ?? page) || page,
    pageSize: Number(data?.pageSize ?? pageSize) || pageSize,
  };
}
