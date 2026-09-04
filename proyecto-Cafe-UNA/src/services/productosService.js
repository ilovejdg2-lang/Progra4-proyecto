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

const LOCATION_CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,48}$/;

const FALLBACK_LOCATION_NAMES = Object.freeze({
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
  "categoria",
  "subcategoria",
  "esDestacado",
  "stockMinimo",
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
  const normalizedCode = String(code).trim().toUpperCase();
  if (!validarCodigoUbicacion(normalizedCode)) return null;
  const name = firstDefined(ubicacion, ["name", "Name", "nombre", "Nombre"]);
  const fallbackName = FALLBACK_LOCATION_NAMES[normalizedCode] || normalizedCode;
  const rawActivo = firstDefined(ubicacion, ["activo", "Activo"]);
  return {
    id: firstDefined(ubicacion, ["id", "Id"]) ?? null,
    code: normalizedCode,
    name: hasIdentity(name) ? String(name).trim() : fallbackName,
    activo: rawActivo === undefined || rawActivo === null ? true : toBoolean(rawActivo),
  };
}

export function validarCodigoUbicacion(locationCode) {
  if (typeof locationCode !== "string") return false;
  return LOCATION_CODE_PATTERN.test(locationCode.trim().toUpperCase());
}

export function validarStockPorUbicacion(stock) {
  return Number.isInteger(stock) && stock >= 0 && stock <= 2147483647;
}

function normalizarProductIdParaAjuste(productId) {
  if (typeof productId === "number") {
    return Number.isSafeInteger(productId) && productId > 0 ? String(productId) : null;
  }

  if (typeof productId !== "string" || !/^\d+$/.test(productId) || BigInt(productId) <= 0n) {
    return null;
  }

  return productId;
}

function normalizarRespuestaAjusteStock(data, fallback) {
  const productId = firstDefined(data, ["productId", "ProductId"]) ?? fallback.productId;
  const locationCode = firstDefined(data, ["locationCode", "LocationCode"]) ?? fallback.locationCode;
  const previousStock = firstDefined(data, ["previousStock", "PreviousStock"]);
  const stock = firstDefined(data, ["stock", "Stock"]);
  const reason = firstDefined(data, ["reason", "Reason"]) ?? fallback.reason;

  return {
    productId: String(productId),
    locationCode: String(locationCode),
    previousStock,
    stock,
    reason: String(reason).trim(),
  };
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
      categoria: firstDefined(producto, ["categoria", "Categoria"]) ?? "",
      subcategoria: firstDefined(producto, ["subcategoria", "Subcategoria"]) ?? "",
      esDestacado: toBoolean(firstDefined(producto, ["esDestacado", "EsDestacado"])),
      stockMinimo: Number(firstDefined(producto, ["stockMinimo", "StockMinimo"]) ?? 0) || 0,
      alertaStock: toBoolean(firstDefined(producto, ["alertaStock", "AlertaStock"])),
      disponible: firstDefined(producto, ["disponible", "Disponible"]) === undefined
        ? true
        : toBoolean(firstDefined(producto, ["disponible", "Disponible"])),
      stockTotal: Number(
        firstDefined(producto, ["stockTotal", "stock_total", "StockTotal"]) ??
          firstDefined(producto, ["stock", "Stock"]) ??
          0,
      ) || 0,
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

export async function obtenerStockDesglosadoProducto(productId) {
  if (!hasIdentity(productId)) throw new Error("El identificador del producto no es válido.");
  const data = await inventoryRequest(
    `${BASE_URL}/${encodeURIComponent(String(productId))}/stock`,
  );
  const locations = Array.isArray(data?.locations)
    ? data.locations
    : Array.isArray(data?.Locations)
      ? data.Locations
      : [];
  return {
    productId: String(data?.productId ?? data?.ProductId ?? productId),
    locations: locations.map((location) => ({
      code: String(location.code ?? location.Code ?? ""),
      name: String(location.name ?? location.Name ?? ""),
      stock: Number(location.stock ?? location.Stock) || 0,
    })),
    total: Number(data?.total ?? data?.Total) || 0,
  };
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

export async function crearUbicacion({ nombre, codigo } = {}) {
  const payload = { nombre };
  if (hasIdentity(codigo)) payload.codigo = String(codigo).trim().toUpperCase();

  const creada = await inventoryRequest(`${INVENTORY_BASE_URL}/ubicaciones`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  limpiarInventarioUbicacionCache();
  return normalizarUbicacion(creada);
}

export async function actualizarUbicacion(locationCode, cambios = {}) {
  if (!validarCodigoUbicacion(locationCode)) {
    throw new Error("El código de ubicación no es válido.");
  }
  if (String(locationCode).toUpperCase() === "BODEGA_CENTRAL") {
    throw new Error("Bodega Central no se puede editar ni inhabilitar.");
  }

  const payload = {};
  if (Object.prototype.hasOwnProperty.call(cambios, "nombre")) payload.nombre = cambios.nombre;
  if (Object.prototype.hasOwnProperty.call(cambios, "activo")) payload.activo = cambios.activo;

  const actualizada = await inventoryRequest(
    `${INVENTORY_BASE_URL}/ubicaciones/${encodeURIComponent(String(locationCode).trim().toUpperCase())}`,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
  limpiarInventarioUbicacionCache();
  return normalizarUbicacion(actualizada);
}

export async function ajustarStockPorUbicacion(locationCode, productId, stock, reason) {
  if (!validarCodigoUbicacion(locationCode)) {
    throw new Error("El código de ubicación no es válido.");
  }
  if (String(locationCode).toUpperCase() === "BODEGA_CENTRAL") {
    throw new Error("La ruta de ajustes solo admite puntos de venta.");
  }

  const normalizedProductId = normalizarProductIdParaAjuste(productId);
  if (!normalizedProductId) {
    throw new Error("El identificador del producto no es válido.");
  }
  if (!validarStockPorUbicacion(stock)) {
    throw new Error("La cantidad de stock debe ser un entero entre 0 y 2147483647.");
  }
  if (typeof reason !== "string") {
    throw new Error("El motivo del ajuste es obligatorio.");
  }

  const normalizedReason = reason.trim();
  if (normalizedReason.length === 0 || normalizedReason.length > 300) {
    throw new Error("El motivo del ajuste debe tener entre 1 y 300 caracteres.");
  }

  const actualizado = await inventoryRequest(
    `${INVENTORY_BASE_URL}/ubicaciones/${encodeURIComponent(locationCode)}/productos/${encodeURIComponent(normalizedProductId)}/stock`,
    {
      method: "PUT",
      body: JSON.stringify({ stock, reason: normalizedReason }),
    },
  );

  stockPorUbicacionCache.delete(locationCode);
  stockPorUbicacionInflight.delete(locationCode);

  return normalizarRespuestaAjusteStock(actualizado, {
    productId: normalizedProductId,
    locationCode,
    reason: normalizedReason,
  });
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

export async function obtenerAlertasStock() {
  const data = await apiRequest(`${BASE_URL}/alertas-stock`, {
    errorPrefix: "Error al consultar alertas de stock",
  });
  return (Array.isArray(data) ? data : []).map((item) => ({
    id: String(item?.id ?? item?.Id ?? ""),
    nombre: String(item?.nombre ?? item?.Nombre ?? ""),
    stockActual: Number(item?.stockActual ?? item?.StockActual ?? 0) || 0,
    stockMinimo: Number(item?.stockMinimo ?? item?.StockMinimo ?? 0) || 0,
    agotado: Boolean(item?.agotado ?? item?.Agotado),
    ubicaciones: (Array.isArray(item?.ubicaciones) ? item.ubicaciones : []).map((ubi) => ({
      codigo: String(ubi?.codigo ?? ubi?.Codigo ?? ""),
      nombre: String(ubi?.nombre ?? ubi?.Nombre ?? ""),
      stock: Number(ubi?.stock ?? ubi?.Stock ?? 0) || 0,
    })),
  }));
}

export async function eliminarProducto(id) {
  await request(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
  limpiarProductosCache();
  return true;
}
