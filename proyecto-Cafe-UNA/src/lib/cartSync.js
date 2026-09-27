import { clearCart, getStoredCart, saveCart } from "./cartStorage";
import { guardarCarritoRemoto, obtenerCarritoRemoto } from "../services/carritoService";
import { obtenerProductos } from "../services/productosService";
import {
  SESSION_UPDATED_EVENT,
  getStoredUser,
  isLoggingOut,
  isSessionExpired,
} from "../services/sessionService";

/** Id del usuario dueño del carrito local; sin valor = carrito de invitado. */
const CART_OWNER_KEY = "cartOwner";
/** Marca de cambios locales que aún no llegan al servidor. */
const CART_DIRTY_KEY = "cartDirty";
const GUARDADO_DEBOUNCE_MS = 600;
const GUARDADO_LOGOUT_TIMEOUT_MS = 2500;

let iniciado = false;
let aplicandoRemoto = false;
let usuarioSincronizado = null;
let temporizador = null;
let cola = Promise.resolve();

function usuarioActivo() {
  if (isLoggingOut()) return null;
  const user = getStoredUser();
  if (!user?.token || !user.id || isSessionExpired(user)) return null;
  return user;
}

function aItemsRemotos(cart) {
  return cart
    .map((item) => ({ productoId: String(item?.id ?? ""), cantidad: Number(item?.units) || 0 }))
    .filter((item) => /^\d+$/.test(item.productoId) && item.cantidad > 0);
}

function escribirLocal(escribir) {
  aplicandoRemoto = true;
  try {
    escribir();
  } finally {
    aplicandoRemoto = false;
  }
}

async function armarCarrito(remotos, locales) {
  const productos = await obtenerProductos();
  const porId = new Map(productos.map((producto) => [String(producto.id), producto]));
  const unidades = new Map();
  for (const { productoId, cantidad } of remotos) {
    unidades.set(productoId, (unidades.get(productoId) ?? 0) + cantidad);
  }
  for (const item of locales) {
    const id = String(item?.id ?? "");
    unidades.set(id, (unidades.get(id) ?? 0) + (Number(item?.units) || 0));
  }

  const items = [];
  for (const [id, units] of unidades) {
    const producto = porId.get(id);
    if (!producto || units <= 0) continue;
    const stock = Number(producto.stock) || 0;
    items.push({ ...producto, units: stock > 0 ? Math.min(units, stock) : units });
  }
  return items;
}

async function guardarPendiente(token) {
  window.clearTimeout(temporizador);
  temporizador = null;
  const marca = localStorage.getItem(CART_DIRTY_KEY);
  if (!marca) return;
  await guardarCarritoRemoto(aItemsRemotos(getStoredCart()), { token });
  if (localStorage.getItem(CART_DIRTY_KEY) === marca) {
    localStorage.removeItem(CART_DIRTY_KEY);
  }
}

async function sincronizar() {
  const user = usuarioActivo();
  const owner = localStorage.getItem(CART_OWNER_KEY);

  if (!user) {
    usuarioSincronizado = null;
    if (owner) {
      localStorage.removeItem(CART_OWNER_KEY);
      localStorage.removeItem(CART_DIRTY_KEY);
      escribirLocal(clearCart);
    }
    return;
  }

  const userId = String(user.id);
  if (usuarioSincronizado === userId) return;

  if (owner === userId && localStorage.getItem(CART_DIRTY_KEY)) {
    await guardarPendiente();
    usuarioSincronizado = userId;
    return;
  }

  const esInvitado = !owner;
  const locales = esInvitado ? getStoredCart() : [];
  const remotos = await obtenerCarritoRemoto();
  const items = await armarCarrito(remotos, locales);
  if (String(usuarioActivo()?.id ?? "") !== userId) return;

  escribirLocal(() => saveCart(items));
  localStorage.setItem(CART_OWNER_KEY, userId);
  usuarioSincronizado = userId;
  if (locales.length > 0) {
    await guardarCarritoRemoto(aItemsRemotos(items));
  }
}

function programarSincronizacion() {
  cola = cola.then(sincronizar).catch(() => {});
}

function alCambiarCarrito() {
  if (aplicandoRemoto) return;
  const user = usuarioActivo();
  if (!user || localStorage.getItem(CART_OWNER_KEY) !== String(user.id)) return;

  localStorage.setItem(CART_DIRTY_KEY, String(Date.now()));
  window.clearTimeout(temporizador);
  temporizador = window.setTimeout(() => {
    guardarPendiente().catch(() => {});
  }, GUARDADO_DEBOUNCE_MS);
}

/**
 * CLI-P08: el carrito se guarda por cuenta. Al iniciar sesión, lo que había como
 * invitado se suma al carrito guardado; en otro dispositivo se recupera igual.
 */
export function iniciarSincronizacionCarrito() {
  if (iniciado) return;
  iniciado = true;
  window.addEventListener(SESSION_UPDATED_EVENT, programarSincronizacion);
  window.addEventListener("cart-updated", alCambiarCarrito);
  programarSincronizacion();
}

/**
 * Llamar antes de borrar la sesión: sube los cambios pendientes y saca del
 * navegador el carrito de la cuenta (queda guardado en el servidor).
 */
export async function soltarCarritoAlCerrarSesion() {
  const user = getStoredUser();
  const owner = localStorage.getItem(CART_OWNER_KEY);
  usuarioSincronizado = null;
  if (!user?.token || !owner || owner !== String(user.id)) return;

  try {
    await Promise.race([
      guardarPendiente(user.token),
      new Promise((resolve) => window.setTimeout(resolve, GUARDADO_LOGOUT_TIMEOUT_MS)),
    ]);
  } catch {
    // Si falla, el carrito del servidor queda como estaba en el último guardado.
  }

  localStorage.removeItem(CART_OWNER_KEY);
  localStorage.removeItem(CART_DIRTY_KEY);
  escribirLocal(clearCart);
}
