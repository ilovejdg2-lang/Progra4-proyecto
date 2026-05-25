const API_KEY = import.meta.env.VITE_JSONBIN_API_KEY_CRUD_PRODUCTOS;
const BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID_PRODUCTOS;
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;
const IVA_RATE = 0.13;

const headers = {
  "Content-Type": "application/json",
  "X-Access-Key": API_KEY,
};

// ─── Helper: leer el bin completo ───────────────────────────────────────────
async function leerBin() {
  const res = await fetch(BASE_URL, { headers });
  if (!res.ok) throw new Error(`Error al leer el bin de productos: ${res.status}`);
  return res.json();
}

// ─── Helper: sobreescribir el bin completo ───────────────────────────────────
async function escribirBin(productos) {
  const res = await fetch(BASE_URL, {
    method: "PUT",
    headers,
    body: JSON.stringify({ productos }),
  });
  if (!res.ok) throw new Error(`Error al guardar productos: ${res.status}`);
  return res.json();
}

// ─── Helper: normalizar la respuesta del bin ────────────────────────────────
function obtenerListaProductos(record) {
  if (Array.isArray(record)) return record;
  return record?.productos ?? [];
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

// ─── Helper: generar el próximo id único ────────────────────────────────────
function siguienteId(productos) {
  if (productos.length === 0) return 1;
  return Math.max(...productos.map((producto) => producto.id ?? 0)) + 1;
}

// ─── READ: obtener todos los productos ──────────────────────────────────────
export async function obtenerProductos() {
  const data = await leerBin();
  return obtenerListaProductos(data.record).map(normalizarProducto);
}

// ─── READ: obtener un producto por id ───────────────────────────────────────
export async function obtenerProductoPorId(id) {
  const productos = await obtenerProductos();
  return productos.find((producto) => producto.id === id) ?? null;
}

// ─── CREATE: agregar nuevo producto ─────────────────────────────────────────
export async function crearProducto(nuevoProducto) {
  const productos = await obtenerProductos();

  const productoCompleto = normalizarProducto({
    ...nuevoProducto,
    id: siguienteId(productos),
  });

  await escribirBin([...productos, productoCompleto]);
  return productoCompleto;
}

// ─── UPDATE: actualizar campos de un producto ──────────────────────────────
export async function actualizarProducto(id, cambios) {
  const productos = await obtenerProductos();

  const actualizados = productos.map((producto) =>
    producto.id === id ? normalizarProducto({ ...producto, ...cambios, id }) : producto
  );

  await escribirBin(actualizados);
  return actualizados.find((producto) => producto.id === id) ?? null;
}

export async function ajustarStockProductos(carritoItems) {
  const productos = await obtenerProductos();
  const cambiosPorId = new Map(
    carritoItems
      .map((item) => ({
        id: item?.id,
        units: Number(item?.units) || 0,
      }))
      .filter((item) => Number.isFinite(item.id) && item.units > 0)
      .map((item) => [item.id, item.units])
  );

  const faltantes = [];

  for (const producto of productos) {
    const unidadesCompradas = cambiosPorId.get(producto.id) ?? 0;
    if (unidadesCompradas <= 0) {
      continue;
    }

    const stockActual = Number(producto.stock) || 0;
    const agotado = stockActual <= 0;
    const deshabilitado = producto.estado === "Deshabilitado";

    if (deshabilitado) {
      faltantes.push(`${producto.nombre} (deshabilitado)`);
      continue;
    }

    if (agotado) {
      faltantes.push(`${producto.nombre} (sin stock)`);
      continue;
    }

    if (stockActual < unidadesCompradas) {
      faltantes.push(`${producto.nombre} (${stockActual} disponibles, solicitadas ${unidadesCompradas})`);
    }
  }

  if (faltantes.length > 0) {
    const error = new Error(`No se puede completar la compra. Stock insuficiente para: ${faltantes.join(", ")}`);
    error.code = "STOCK_INSUFICIENTE";
    error.items = faltantes;
    throw error;
  }

  const actualizados = productos.map((producto) => {
    const unidadesCompradas = cambiosPorId.get(producto.id) ?? 0;
    if (unidadesCompradas <= 0) {
      return producto;
    }

    const stockRestante = Math.max((Number(producto.stock) || 0) - unidadesCompradas, 0);

    return {
      ...producto,
      stock: stockRestante,
      estado: producto.estado,
    };
  });

  await escribirBin(actualizados);
  return actualizados;
}

// ─── DELETE: eliminar un producto ───────────────────────────────────────────
export async function eliminarProducto(id) {
  const productos = await obtenerProductos();
  const filtrados = productos.filter((producto) => producto.id !== id);
  await escribirBin(filtrados);
  return true;
}