const API_KEY = import.meta.env.VITE_JSONBIN_API_KEY_CRUD_PRODUCTOS;
const BIN_ID = import.meta.env.VITE_JSONBIN_BIN_ID_PRODUCTOS;
const BASE_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

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

// ─── Helper: generar el próximo id único ────────────────────────────────────
function siguienteId(productos) {
  if (productos.length === 0) return 1;
  return Math.max(...productos.map((producto) => producto.id ?? 0)) + 1;
}

// ─── READ: obtener todos los productos ──────────────────────────────────────
export async function obtenerProductos() {
  const data = await leerBin();
  return obtenerListaProductos(data.record);
}

// ─── READ: obtener un producto por id ───────────────────────────────────────
export async function obtenerProductoPorId(id) {
  const productos = await obtenerProductos();
  return productos.find((producto) => producto.id === id) ?? null;
}

// ─── CREATE: agregar nuevo producto ─────────────────────────────────────────
export async function crearProducto(nuevoProducto) {
  const productos = await obtenerProductos();

  const productoCompleto = {
    ...nuevoProducto,
    id: siguienteId(productos),
  };

  await escribirBin([...productos, productoCompleto]);
  return productoCompleto;
}

// ─── UPDATE: actualizar campos de un producto ──────────────────────────────
export async function actualizarProducto(id, cambios) {
  const productos = await obtenerProductos();

  const actualizados = productos.map((producto) =>
    producto.id === id ? { ...producto, ...cambios, id } : producto
  );

  await escribirBin(actualizados);
  return actualizados.find((producto) => producto.id === id) ?? null;
}

// ─── DELETE: eliminar un producto ───────────────────────────────────────────
export async function eliminarProducto(id) {
  const productos = await obtenerProductos();
  const filtrados = productos.filter((producto) => producto.id !== id);
  await escribirBin(filtrados);
  return true;
}