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
      : estadoRaw === "Recibido" || estadoRaw === "Enviada" || estadoRaw === "Enviado" || estadoRaw === "Pagado"
        ? "Entregado"
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
        return estado === "Entregado" ? Number(firstDefined(compra, ["total", "Total"]) || 0) : null;
      }
      return Number(raw);
    })(),
    ubicacionId: firstDefined(compra, ["ubicacionId", "UbicacionId"]) ?? null,
    ubicacionCodigo: String(firstDefined(compra, ["ubicacionCodigo", "UbicacionCodigo"]) || "") || null,
    ubicacionNombre: String(firstDefined(compra, ["ubicacionNombre", "UbicacionNombre"]) || "") || null,
    tieneComprobante: Boolean(firstDefined(compra, ["tieneComprobante", "TieneComprobante"])),
    cliente: (() => {
      const raw = firstDefined(compra, ["cliente", "Cliente"]);
      if (!raw || typeof raw !== "object") return null;
      return {
        tipo: String(firstDefined(raw, ["tipo", "Tipo"]) || "") || null,
        nombre: String(firstDefined(raw, ["nombre", "Nombre"]) || "") || null,
        apellidos: String(firstDefined(raw, ["apellidos", "Apellidos"]) || "") || null,
        correo: String(firstDefined(raw, ["correo", "Correo"]) || "") || null,
        telefono: String(firstDefined(raw, ["telefono", "Telefono"]) || "") || null,
        tipoDocumento: String(firstDefined(raw, ["tipoDocumento", "TipoDocumento"]) || "") || null,
        identificacion: String(firstDefined(raw, ["identificacion", "Identificacion"]) || "") || null,
        razonSocial: String(firstDefined(raw, ["razonSocial", "RazonSocial"]) || "") || null,
        nombreComercial: String(firstDefined(raw, ["nombreComercial", "NombreComercial"]) || "") || null,
        representanteLegal: String(firstDefined(raw, ["representanteLegal", "RepresentanteLegal"]) || "") || null,
        cedulaJuridica: String(firstDefined(raw, ["cedulaJuridica", "CedulaJuridica"]) || "") || null,
        direccionFiscal: String(firstDefined(raw, ["direccionFiscal", "DireccionFiscal"]) || "") || null,
        telefonoOficina: String(firstDefined(raw, ["telefonoOficina", "TelefonoOficina"]) || "") || null,
      };
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

export async function registrarCompra(payload, archivo) {
  const form = new FormData();
  form.append("clienteNombre", payload.clienteNombre || "");
  form.append("clienteCorreo", payload.clienteCorreo || "");
  form.append("metodoPago", payload.metodoPago || "Comprobante");
  form.append("ubicacionCodigo", payload.ubicacionCodigo || payload.ubicacion?.code || "");
  if (payload.ubicacionId != null) form.append("ubicacionId", String(payload.ubicacionId));
  form.append("items", JSON.stringify(payload.items || []));
  if (archivo) form.append("comprobante", archivo);
  const data = await apiRequest(BASE_URL, {
    method: "POST",
    body: form,
    errorPrefix: "Error al registrar la compra",
  });
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("compras-updated"));
  }
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
  try {
    const { limpiarInventarioUbicacionCache } = await import("./productosService");
    limpiarInventarioUbicacionCache();
  } catch {
    /* el stock de puntos de venta se recarga en la siguiente consulta */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("compras-updated"));
  }
  return normalizarCompra(data);
}

export async function obtenerVentasParaNotificaciones({ admin = false } = {}) {
  const consultar = admin ? obtenerComprasAdmin : obtenerMisCompras;
  const [pendientes, porEntregar] = await Promise.all([
    consultar({ estado: "Pendiente", page: 1, pageSize: 50 }),
    consultar({ estado: "Aceptado", page: 1, pageSize: 50 }),
  ]);
  const porId = new Map();
  for (const venta of [...(pendientes.data || []), ...(porEntregar.data || [])]) {
    const estado = String(venta?.estado || "");
    if (estado !== "Pendiente" && estado !== "Aceptado") continue;
    if (venta?.id) porId.set(String(venta.id), venta);
  }
  return Array.from(porId.values());
}

export async function obtenerBlobComprobanteCompra(id) {
  const data = await apiRequest(`${BASE_URL}/${encodeURIComponent(id)}/comprobante`, {
    responseType: "blob",
    errorPrefix: "Error al consultar el comprobante",
  });
  if (typeof Blob !== "undefined" && data instanceof Blob) {
    const tipo = String(data.type || "");
    if (tipo.includes("json") || tipo.includes("text")) {
      const texto = await data.text();
      try {
        const parsed = JSON.parse(texto);
        throw new Error(parsed?.message || "No se pudo cargar el comprobante.");
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new Error("No se pudo cargar el comprobante.");
        }
        throw error;
      }
    }
  }
  return data;
}
