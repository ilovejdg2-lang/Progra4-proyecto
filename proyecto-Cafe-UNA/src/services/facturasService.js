import { apiRequest } from "./apiClient";
import { getActiveSessionUser } from "./sessionService";

const BASE_URL = `${import.meta.env.BACKEND_URL}/facturas`;

function buildQuery(params = {}) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "todos") return;
    search.set(key, String(value));
  });
  const text = search.toString();
  return text ? `?${text}` : "";
}

export function normalizarFactura(item) {
  if (!item) return null;
  const id = String(item.id ?? item.Id ?? "");
  const consecutivo = String(item.numeroConsecutivo ?? item.NumeroConsecutivo ?? id);
  const compra = item.compra || item.Compra || null;
  const usuario = item.usuario || item.Usuario || null;
  const items = (item.items || item.Items || []).map((it) => ({
    id: it.id ?? it.Id,
    descripcion: it.descripcion ?? it.Descripcion ?? "",
    cantidad: Number(it.cantidad ?? it.Cantidad ?? 1),
    precioUnitario: Number(it.precioUnitario ?? it.PrecioUnitario ?? 0),
    subtotal: Number(it.subtotal ?? it.Subtotal ?? 0),
  }));

  return {
    id,
    consecutivo,
    compraId: item.compraId ?? item.CompraId ?? compra?.id ?? compra?.Id ?? null,
    compraNumero: compra?.numero ?? compra?.Numero ?? "N/A",
    usuarioId: item.usuarioId ?? item.UsuarioId ?? null,
    clienteNombre: compra?.clienteNombre ?? compra?.ClienteNombre ?? usuario?.nombre ?? usuario?.Nombre ?? "Cliente General",
    clienteCorreo: compra?.clienteCorreo ?? compra?.ClienteCorreo ?? usuario?.correo ?? usuario?.Correo ?? "",
    fechaEmision: item.fechaEmision ?? item.FechaEmision ?? item.creadaEn ?? item.CreadaEn ?? new Date().toISOString(),
    subtotal: Number(item.subtotal ?? item.Subtotal ?? 0),
    impuestos: Number(item.impuestos ?? item.Impuestos ?? 0),
    total: Number(item.total ?? item.Total ?? 0),
    estado: String(item.estado ?? item.Estado ?? "Emitida"),
    urlPdf: item.urlPdf ?? item.UrlPdf ?? null,
    archivoPdf: item.archivoPdf ?? item.ArchivoPdf ?? null,
    items,
  };
}

/**
 * Listado de todas las facturas para el panel administrativo
 */
export async function obtenerFacturasAdmin(params = {}) {
  const data = await apiRequest(`${BASE_URL}${buildQuery(params)}`, {
    errorPrefix: "Error al consultar facturas",
  });
  const lista = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  return {
    items: lista.map(normalizarFactura).filter(Boolean),
    total: Number(data?.total ?? lista.length),
  };
}

/**
 * Facturas del cliente autenticado
 */
export async function obtenerMisFacturas(params = {}) {
  const data = await apiRequest(`${BASE_URL}/mias${buildQuery(params)}`, {
    errorPrefix: "Error al consultar tus facturas",
  });
  const lista = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  return {
    items: lista.map(normalizarFactura).filter(Boolean),
    total: Number(data?.total ?? lista.length),
  };
}

/**
 * Detalle de una factura por ID
 */
export async function obtenerFacturaPorId(id) {
  const data = await apiRequest(`${BASE_URL}/${encodeURIComponent(id)}`, {
    errorPrefix: "Error al obtener factura",
  });
  return normalizarFactura(data);
}

/**
 * Detalle de factura por ID de compra
 */
export async function obtenerFacturaPorCompraId(compraId) {
  const data = await apiRequest(`${BASE_URL}/compra/${encodeURIComponent(compraId)}`, {
    errorPrefix: "Error al obtener factura de la compra",
  });
  return normalizarFactura(data);
}

/**
 * URL directa para visualización del PDF
 */
export function obtenerUrlFacturaPdf(id, tokenAuth) {
  const user = getActiveSessionUser();
  const token = tokenAuth || user?.token;
  const base = `${BASE_URL}/${encodeURIComponent(id)}/pdf`;
  return token ? `${base}?token=${encodeURIComponent(token)}` : base;
}

/**
 * Descarga directa del archivo PDF en el navegador
 */
export async function descargarFacturaPdf(id, nombreArchivo = "factura.pdf") {
  const user = getActiveSessionUser();
  const url = `${BASE_URL}/${encodeURIComponent(id)}/pdf`;
  const headers = user?.token ? { Authorization: `Bearer ${user.token}` } : {};

  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error("No se pudo descargar el archivo PDF de la factura.");
  }

  const blob = await res.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = nombreArchivo.endsWith(".pdf") ? nombreArchivo : `${nombreArchivo}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
}
