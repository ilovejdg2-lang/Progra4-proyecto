import { invalidateAllPageCaches } from "../lib/pageDataCache";
import { getActiveSessionUser } from "./sessionService";
import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/productos`;
const IVA_RATE = 0.13;
const CACHE_TTL_MS = 30 * 60 * 1000;
let productosCache = {
  expiresAt: 0,
  data: null,
};
let productosInflight = null;

function limpiarProductosCache() {
  productosCache = { expiresAt: 0, data: null };
  productosInflight = null;
  invalidateAllPageCaches();
}

function obtenerActorRoles() {
  try {
    const user = getActiveSessionUser();
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    if (String(user?.role || "").toLowerCase() === "admin" && !roles.some((rol) => String(rol).toLowerCase() === "admin")) {
      return [...roles, "Admin"];
    }
    return roles;
  } catch {
    return [];
  }
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

function normalizarProducto(producto) {
  const precioNormal = Number(producto?.precioNormal ?? producto?.priceWithoutIva ?? producto?.price ?? 0) || 0;
  const stock = Number(producto?.stock ?? 0) || 0;
  const estado = producto?.estado === "Deshabilitado" ? "Deshabilitado" : "Habilitado";
  const esDestacado = Boolean(producto?.esDestacado ?? producto?.EsDestacado);

  return {
    ...producto,
    precioNormal,
    precioConIVA: calcularPrecioConIVA(precioNormal),
    stock,
    estado,
    esDestacado,
  };
}

// ─── READ: obtener todos los productos ──────────────────────────────────────
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
      const normalized = list.map(normalizarProducto);
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

// ─── READ: obtener un producto por id ───────────────────────────────────────
export async function obtenerProductoPorId(id) {
  const productos = await obtenerProductos();
  return productos.find((producto) => producto.id === id) ?? null;
}

// ─── CREATE: agregar nuevo producto ─────────────────────────────────────────
export async function crearProducto(nuevoProducto) {
  const creado = await request(BASE_URL, {
    method: "POST",
    body: JSON.stringify({ ...nuevoProducto, actorRoles: obtenerActorRoles() }),
  });
  limpiarProductosCache();
  return normalizarProducto(creado);
}

// ─── UPDATE: actualizar campos de un producto ──────────────────────────────
export async function actualizarProducto(id, cambios) {
  const actualizado = await request(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...cambios, actorRoles: obtenerActorRoles() }),
  });
  limpiarProductosCache();
  return actualizado ? normalizarProducto(actualizado) : null;
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

// ─── DELETE: eliminar un producto ───────────────────────────────────────────
export async function eliminarProducto(id) {
  await request(`${BASE_URL}/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ actorRoles: obtenerActorRoles() }),
  });
  limpiarProductosCache();
  return true;
}