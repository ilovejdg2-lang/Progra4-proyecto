import { getActiveSessionUser } from "./sessionService";

const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/productos`;
const IVA_RATE = 0.13;
const REQUEST_TIMEOUT_MS = 10000;
const CACHE_TTL_MS = 15000;
let productosCache = {
  expiresAt: 0,
  promise: null,
};

function limpiarProductosCache() {
  productosCache = { expiresAt: 0, promise: null };
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
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Tiempo de espera agotado al consultar productos.", { cause: error });
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!res.ok) {
    let message = `Error en productos (${res.status})`;
    try {
      const data = await res.json();
      message = data?.message || message;
    } catch {
      // ignore parse error and keep fallback message
    }
    throw new Error(message);
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

export function calcularPrecioConIVA(precioNormal) {
  const base = Number(precioNormal) || 0;
  return Math.round(base * (1 + IVA_RATE));
}

function normalizarProducto(producto) {
  const precioNormal = Number(producto?.precioNormal ?? producto?.priceWithoutIva ?? producto?.price ?? 0) || 0;
  const stock = Number(producto?.stock ?? 0) || 0;
  const estado = producto?.estado === "Deshabilitado" ? "Deshabilitado" : "Habilitado";

  return {
    ...producto,
    precioNormal,
    precioConIVA: calcularPrecioConIVA(precioNormal),
    stock,
    estado,
  };
}

// ─── READ: obtener todos los productos ──────────────────────────────────────
export async function obtenerProductos() {
  const now = Date.now();
  if (productosCache.promise && productosCache.expiresAt > now) {
    return productosCache.promise;
  }

  productosCache.promise = request(BASE_URL)
    .then((data) => {
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.value)
          ? data.value
          : [];
      return list.map(normalizarProducto);
    })
    .catch((error) => {
      limpiarProductosCache();
      throw error;
    });
  productosCache.expiresAt = now + CACHE_TTL_MS;

  return productosCache.promise;
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