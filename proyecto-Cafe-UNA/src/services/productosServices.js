const BASE_URL = `${import.meta.env.VITE_BACKEND_URL}/productos`;
const IVA_RATE = 0.13;

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

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
  const data = await request(BASE_URL);
  return (Array.isArray(data) ? data : []).map(normalizarProducto);
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
    body: JSON.stringify(nuevoProducto),
  });
  return normalizarProducto(creado);
}

// ─── UPDATE: actualizar campos de un producto ──────────────────────────────
export async function actualizarProducto(id, cambios) {
  const actualizado = await request(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(cambios),
  });
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
  return (Array.isArray(actualizados) ? actualizados : []).map(normalizarProducto);
}

// ─── DELETE: eliminar un producto ───────────────────────────────────────────
export async function eliminarProducto(id) {
  await request(`${BASE_URL}/${id}`, { method: "DELETE" });
  return true;
}