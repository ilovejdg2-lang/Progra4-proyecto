import { invalidateAllPageCaches } from "../lib/pageDataCache";
import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/productos`;
const IVA_RATE = 0.13;
const CACHE_TTL_MS = 30 * 60 * 1000;
let productosCache = {
  expiresAt: 0,
  data: null,
};
let productosInflight = null;
let productosRawCache = {
  expiresAt: 0,
  data: null,
};
let productosRawInflight = null;

const CATALOG_FIELDS = [
  "nombre",
  "descripcion",
  "imagen",
  "precioNormal",
  "precioConIVA",
  "estado",
  "peso",
  "esDestacado",
];

function limpiarProductosCache() {
  productosCache = { expiresAt: 0, data: null };
  productosInflight = null;
  productosRawCache = { expiresAt: 0, data: null };
  productosRawInflight = null;
  invalidateAllPageCaches();
}

async function request(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const isPublicRead = method === "GET";

  return apiRequest(url, {
    ...options,
    skipAuth: isPublicRead ? true : options.skipAuth,
    errorPrefix: "Error en productos",
    timeoutMessage: "Tiempo de espera agotado al consultar productos.",
  });
}

export function calcularPrecioConIVA(precioNormal) {
  const base = Number(precioNormal) || 0;
  return Math.round(base * (1 + IVA_RATE));
}

function firstDefined(value, aliases) {
  for (const alias of aliases) {
    if (value?.[alias] !== undefined) return value[alias];
  }
  return undefined;
}

function hasIdentity(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function toBoolean(value) {
  if (value === undefined || value === null || value === false || value === "false") return false;
  if (value === true || value === "true") return true;
  return Boolean(value);
}

export function validarStockCentral(stock) {
  return Number.isInteger(stock) && stock >= 0 && stock <= 2147483647;
}

export function normalizarStockCentral(producto) {
  const productId = firstDefined(producto, ["productId", "ProductId", "id", "Id", "ID"]);
  if (!hasIdentity(productId)) return null;

  const rawStock = firstDefined(producto, ["stock", "Stock"]);
  const parsedStock = rawStock === undefined ? null : Number(rawStock);
  const known = rawStock !== undefined && validarStockCentral(parsedStock);

  return {
    productId: String(productId),
    locationCode: "BODEGA_CENTRAL",
    stock: known ? parsedStock : null,
    confidence: known ? "known" : "unknown",
  };
}

export function adaptarProducto(producto) {
  const id = firstDefined(producto, ["id", "Id", "ID"]);
  if (!hasIdentity(id)) return null;

  const precioNormalRaw = firstDefined(producto, [
    "precioNormal",
    "PrecioNormal",
    "priceWithoutIva",
    "price",
  ]);
  const precioNormal = Number.isFinite(Number(precioNormalRaw)) ? Number(precioNormalRaw) : 0;
  const precioConIVARaw = firstDefined(producto, ["precioConIVA", "PrecioConIVA"]);
  const precioConIVA = precioConIVARaw === undefined
    ? calcularPrecioConIVA(precioNormal)
    : (Number.isFinite(Number(precioConIVARaw)) ? Number(precioConIVARaw) : calcularPrecioConIVA(precioNormal));
  const estado = firstDefined(producto, ["estado", "Estado"]);

  return {
    catalog: {
      id: String(id),
      nombre: firstDefined(producto, ["nombre", "Nombre"]) ?? "",
      descripcion: firstDefined(producto, ["descripcion", "Descripcion"]) ?? "",
      imagen: firstDefined(producto, ["imagen", "Imagen"]) ?? "",
      precioNormal,
      precioConIVA,
      estado: estado === "Deshabilitado" ? "Deshabilitado" : "Habilitado",
      peso: firstDefined(producto, ["peso", "Peso"]) ?? "",
      esDestacado: toBoolean(firstDefined(producto, ["esDestacado", "EsDestacado"])),
    },
    centralStock: normalizarStockCentral({ ...producto, id }),
  };
}

export function construirPayloadCatalogo(producto = {}) {
  return Object.fromEntries(CATALOG_FIELDS.map((field) => [field, producto[field]]));
}

function normalizarProducto(producto) {
  const mapped = adaptarProducto(producto);
  if (!mapped) return null;

  return {
    ...mapped.catalog,
    stock: mapped.centralStock?.confidence === "known" ? mapped.centralStock.stock : 0,
  };
}

async function obtenerProductosRaw() {
  const now = Date.now();
  if (productosRawCache.data && productosRawCache.expiresAt > now) return productosRawCache.data;
  if (productosRawInflight) return productosRawInflight;

  productosRawInflight = request(BASE_URL)
    .then((data) => {
      const list = Array.isArray(data) ? data : Array.isArray(data?.value) ? data.value : [];
      productosRawCache = { expiresAt: Date.now() + CACHE_TTL_MS, data: list };
      productosRawInflight = null;
      return list;
    })
    .catch((error) => {
      productosRawInflight = null;
      throw error;
    });

  return productosRawInflight;
}

export async function obtenerProductos() {
  const now = Date.now();
  if (productosCache.data && productosCache.expiresAt > now) {
    return productosCache.data;
  }

  if (productosInflight) {
    return productosInflight;
  }

  productosInflight = request(BASE_URL)
    .then((data) => {
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.value)
          ? data.value
          : [];
      const normalized = list.map(normalizarProducto).filter(Boolean);
      productosCache = {
        expiresAt: Date.now() + CACHE_TTL_MS,
        data: normalized,
      };
      productosInflight = null;
      return normalized;
    })
    .catch((error) => {
      productosInflight = null;
      throw error;
    });

  return productosInflight;
}

export async function obtenerCatalogoProductos() {
  const productos = await obtenerProductosRaw();
  return productos.map((producto) => adaptarProducto(producto)?.catalog).filter(Boolean);
}

export async function obtenerStockCentral() {
  const productos = await obtenerProductosRaw();
  return productos.map(normalizarStockCentral).filter(Boolean);
}

export async function obtenerProductoPorId(id) {
  const productos = await obtenerProductos();
  return productos.find((producto) => String(producto.id) === String(id)) ?? null;
}

export async function crearProducto(nuevoProducto) {
  const creado = await request(BASE_URL, {
    method: "POST",
    body: JSON.stringify(construirPayloadCatalogo(nuevoProducto)),
  });
  limpiarProductosCache();
  return normalizarProducto(creado);
}

export async function actualizarProducto(id, cambios) {
  const actualizado = await request(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(construirPayloadCatalogo(cambios)),
  });
  limpiarProductosCache();
  return actualizado ? normalizarProducto(actualizado) : null;
}

export async function actualizarStockCentral(productId, stock) {
  if (!hasIdentity(productId) || !validarStockCentral(stock)) {
    throw new Error("La cantidad de stock central debe ser un entero entre 0 y 2147483647.");
  }

  const actualizado = await request(`${BASE_URL}/${productId}/stock-central`, {
    method: "PUT",
    body: JSON.stringify({ stock }),
  });
  limpiarProductosCache();
  return normalizarStockCentral({ ...actualizado, productId });
}

export async function ajustarStockProductos(carritoItems) {
  const payload = (Array.isArray(carritoItems) ? carritoItems : []).map((item) => ({
    id: Number(item?.id) || 0,
    units: Number(item?.units) || 0,
  }));
  const actualizados = await request(`${BASE_URL}/ajustar-stock`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  limpiarProductosCache();
  return (Array.isArray(actualizados) ? actualizados : []).map(normalizarProducto);
}

export async function eliminarProducto(id) {
  await request(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
  limpiarProductosCache();
  return true;
}
