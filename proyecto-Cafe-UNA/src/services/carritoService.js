import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/carrito`;

function normalizarLista(data) {
  const lista = Array.isArray(data) ? data : [];
  return lista
    .map((item) => ({
      productoId: String(item?.productoId ?? item?.ProductoId ?? ""),
      cantidad: Number(item?.cantidad ?? item?.Cantidad) || 0,
    }))
    .filter((item) => item.productoId && item.cantidad > 0);
}

export async function obtenerCarritoRemoto() {
  const data = await apiRequest(BASE_URL, {
    errorPrefix: "No se pudo cargar el carrito",
    skipSessionClear: true,
  });
  return normalizarLista(data);
}

/** Con `token` se usa ese JWT aunque la sesión ya esté cerrándose. */
export async function guardarCarritoRemoto(items, { token } = {}) {
  const data = await apiRequest(BASE_URL, {
    method: "PUT",
    data: { items },
    errorPrefix: "No se pudo guardar el carrito",
    skipSessionClear: true,
    ...(token
      ? { skipAuth: true, headers: { Authorization: `Bearer ${token}` } }
      : {}),
  });
  return normalizarLista(data);
}
