import { invalidateAllPageCaches } from "../lib/pageDataCache";
import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/productos`;
const INVENTORY_BASE_URL = `${import.meta.env.BACKEND_URL}/inventario`;
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
let ubicacionesCache = { expiresAt: 0, data: null };
let ubicacionesInflight = null;
const stockPorUbicacionCache = new Map();
const stockPorUbicacionInflight = new Map();

const CANONICAL_LOCATION_NAMES = Object.freeze({
  BODEGA_CENTRAL: "Bodega Central",
  POS_FUNA_UNA: "FUNA-UNA",
  POS_EDITORIAL: "Editorial",
  POS_STAND_FERIAS: "Stand Ferias",
});

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

export function limpiarInventarioUbicacionCache() {
  ubicacionesCache = { expiresAt: 0, data: null };
  ubicacionesInflight = null;
  stockPorUbicacionCache.clear();
  stockPorUbicacionInflight.clear();
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

async function inventoryRequest(url, options = {}) {
  return apiRequest(url, {
    ...options,
    errorPrefix: "Error en inventario",
    timeoutMessage: "Tiempo de espera agotado al consultar inventario.",
  });
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

export function normalizarUbicacion(ubicacion) {
  const code = firstDefined(ubicacion, ["code", "Code", "codigo", "Codigo", "locationCode", "LocationCode"]);
  if (!hasIdentity(code)) return null;
  const canonicalCode = String(code).trim();
  const canonicalName = CANONICAL_LOCATION_NAMES[canonicalCode];
  if (!canonicalName) return null;
  const name = firstDefined(ubicacion, ["name", "Name", "nombre", "Nombre"]);
  return { code: canonicalCode, name: hasIdentity(name) ? String(name) : canonicalName };
}

export function validarCodigoUbicacion(locationCode) {
  return Boolean(CANONICAL_LOCATION_NAMES[locationCode]);
}

export function validarStockPorUbicacion(stock) {
  return Number.isInteger(stock) && stock >= 0 && stock <= 2147483647;
}

export function normalizarStockPorUbicacion(stock) {
  const productId = firstDefined(stock, ["productId", "ProductId", "id", "Id", "ID"]);
  const rawLocationCode = firstDefined(stock, ["locationCode", "LocationCode", "code", "Code", "codigo", "Codigo"]);
  if (!hasIdentity(productId) || !hasIdentity(rawLocationCode)) return null;
  const locationCode = String(rawLocationCode).trim();
  if (!validarCodigoUbicacion(locationCode)) return null;
  const rawStock = firstDefined(stock, ["stock", "Stock"]);
  const normalizedStock = rawStock === undefined || rawStock === null ? null : rawStock;
  return {
    productId: String(productId),
    locationCode,
    stock: validarStockPorUbicacion(normalizedStock) ? normalizedStock : null,
    provisioned: toBoolean(firstDefined(stock, ["provisioned", "Provisioned"])),
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

function responseList(data) {
  return Array.isArray(data) ? data : Array.isArray(data?.value) ? data.value : [];
}

export async function obtenerUbicaciones() {
  const now = Date.now();
  if (ubicacionesCache.data && ubicacionesCache.expiresAt > now) return ubicacionesCache.data;
  if (ubicacionesInflight) return ubicacionesInflight;
  ubicacionesInflight = inventoryRequest(`${INVENTORY_BASE_URL}/ubicaciones`)
    .then((data) => {
      const normalized = responseList(data).map(normalizarUbicacion).filter(Boolean);
      ubicacionesCache = { expiresAt: Date.now() + CACHE_TTL_MS, data: normalized };
      ubicacionesInflight = null;
      return normalized;
    })
    .catch((error) => {
      ubicacionesInflight = null;
      throw error;
    });
  return ubicacionesInflight;
}

export async function obtenerStockPorUbicacion(locationCode) {
  if (!validarCodigoUbicacion(locationCode)) throw new Error("El código de ubicación no es válido.");
  const now = Date.now();
  const cached = stockPorUbicacionCache.get(locationCode);
  if (cached?.expiresAt > now) return cached.data;
  stockPorUbicacionCache.delete(locationCode);
  if (stockPorUbicacionInflight.has(locationCode)) return stockPorUbicacionInflight.get(locationCode);
  const url = `${INVENTORY_BASE_URL}/stock?locationCode=${encodeURIComponent(locationCode)}`;
  const inflight = inventoryRequest(url)
    .then((data) => {
      const normalized = responseList(data)
        .map(normalizarStockPorUbicacion)
        .filter((item) => item?.locationCode === locationCode);
      stockPorUbicacionCache.set(locationCode, { expiresAt: Date.now() + CACHE_TTL_MS, data: normalized });
      stockPorUbicacionInflight.delete(locationCode);
      return normalized;
    })
    .catch((error) => {
      stockPorUbicacionInflight.delete(locationCode);
      throw error;
    });
  stockPorUbicacionInflight.set(locationCode, inflight);
  return inflight;
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
