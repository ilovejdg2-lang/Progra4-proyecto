import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/compras`;

function firstDefined(value, aliases) {
  for (const alias of aliases) {
    if (value?.[alias] !== undefined) return value[alias];
  }
  return undefined;
}

export function normalizarCompra(compra) {
  if (!compra) return null;
  const id = firstDefined(compra, ["id", "Id"]);
  const numero = firstDefined(compra, ["numero", "Numero"]);
  if (id == null && !numero) return null;
  const itemsRaw = firstDefined(compra, ["items", "Items"]) || [];
  const estadoRaw = String(firstDefined(compra, ["estado", "Estado", "estadoPago"]) || "Pendiente");
  const estado =
    estadoRaw === "Aprobado" || estadoRaw === "Aprobada"
      ? "Aceptado"
      : estadoRaw === "Recibido" || estadoRaw === "Enviada" || estadoRaw === "Pagado"
        ? "Enviado"
        : estadoRaw === "Rechazada"
          ? "Rechazado"
          : estadoRaw;
  return {
    id: String(id ?? ""),
    numero: String(numero || id || ""),
    fecha: String(firstDefined(compra, ["fecha", "Fecha"]) || ""),
    clienteNombre: String(firstDefined(compra, ["clienteNombre", "ClienteNombre", "cliente"]) || ""),
    clienteCorreo: String(firstDefined(compra, ["clienteCorreo", "ClienteCorreo", "correo"]) || ""),
    cantidadProductos: Number(firstDefined(compra, ["cantidadProductos", "CantidadProductos"]) || 0),
    subtotal: Number(firstDefined(compra, ["subtotal", "Subtotal"]) || 0),
    impuestos: Number(firstDefined(compra, ["impuestos", "Impuestos", "iva", "Iva"]) || 0),
    total: Number(firstDefined(compra, ["total", "Total"]) || 0),
    metodoPago: String(firstDefined(compra, ["metodoPago", "MetodoPago", "metodo"]) || "Tarjeta"),
    estado,
    facturaId: firstDefined(compra, ["facturaId", "FacturaId"]) || null,
    editable: Boolean(
      firstDefined(compra, ["editable", "Editable"]) ??
        (estado === "Pendiente" || estado === "Aceptado" || estado === "Rechazado"),
    ),
    ganado: (() => {
      const raw = firstDefined(compra, ["ganado", "Ganado"]);
      if (raw === null || raw === undefined) {
        return estado === "Enviado" ? Number(firstDefined(compra, ["total", "Total"]) || 0) : null;
      }
      return Number(raw);
    })(),
    items: (Array.isArray(itemsRaw) ? itemsRaw : []).map((item) => ({
      productoId: String(firstDefined(item, ["productoId", "ProductoId", "id"]) || ""),
      nombre: String(firstDefined(item, ["nombre", "Nombre"]) || ""),
      cantidad: Number(firstDefined(item, ["cantidad", "Cantidad", "units"]) || 0),
      precioUnitario: Number(firstDefined(item, ["precioUnitario", "PrecioUnitario"]) || 0),
      subtotal: Number(firstDefined(item, ["subtotal", "Subtotal", "total"]) || 0),
    })),
  };
}

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "todos") return;
    search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

export async function registrarCompra(payload) {
  const data = await apiRequest(BASE_URL, {
    method: "POST",
    body: JSON.stringify(payload),
    errorPrefix: "Error al registrar la compra",
  });
  return normalizarCompra(data);
}

export async function obtenerMisCompras(params = {}) {
  const data = await apiRequest(`${BASE_URL}/mias${buildQuery(params)}`, {
    errorPrefix: "Error al consultar historial",
  });
  return {
    data: (Array.isArray(data?.data) ? data.data : []).map(normalizarCompra).filter(Boolean),
    page: Number(data?.page) || 1,
    pageSize: Number(data?.pageSize) || 10,
    total: Number(data?.total) || 0,
    totalPages: Number(data?.totalPages) || 1,
  };
}

export async function obtenerComprasAdmin(params = {}) {
  const data = await apiRequest(`${BASE_URL}${buildQuery(params)}`, {
    errorPrefix: "Error al consultar compras",
  });
  return {
    data: (Array.isArray(data?.data) ? data.data : []).map(normalizarCompra).filter(Boolean),
    page: Number(data?.page) || 1,
    pageSize: Number(data?.pageSize) || 10,
    total: Number(data?.total) || 0,
    totalPages: Number(data?.totalPages) || 1,
  };
}

export async function obtenerCompraPorId(id) {
  const data = await apiRequest(`${BASE_URL}/${encodeURIComponent(id)}`, {
    errorPrefix: "Error al consultar la compra",
  });
  return normalizarCompra(data);
}

export async function cambiarEstadoCompra(id, estado) {
  const data = await apiRequest(`${BASE_URL}/${encodeURIComponent(id)}/estado`, {
    method: "PATCH",
    body: JSON.stringify({ estado }),
    errorPrefix: "Error al actualizar el estado de la compra",
  });
  return normalizarCompra(data);
}
