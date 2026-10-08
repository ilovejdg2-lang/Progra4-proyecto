import { apiRequest } from "./apiClient";

const BASE = `${import.meta.env.BACKEND_URL}/ajustes/catalogos`;

export const TIPOS_CATALOGO = {
  presentacion: "presentacion_producto",
  unidadPresentacion: "unidad_presentacion",
  estadoArticulo: "estado_articulo_donacion",
  metodoPago: "metodo_pago",
  iconoSitio: "icono_sitio",
};

const cache = new Map();

function normalizar(item) {
  if (!item) return null;
  return {
    id: Number(item.id ?? item.Id),
    tipo: String(item.tipo ?? item.Tipo ?? ""),
    nombre: String(item.nombre ?? item.Nombre ?? "").trim(),
    icono: String(item.icono ?? item.Icono ?? "").trim(),
    orden: Number(item.orden ?? item.Orden ?? 0) || 0,
  };
}

export async function listarCatalogo(tipo, { forzar = false } = {}) {
  if (!forzar && cache.has(tipo)) return cache.get(tipo);
  const promesa = apiRequest(`${BASE}/${encodeURIComponent(tipo)}`, { skipAuth: true })
    .then((data) => (Array.isArray(data) ? data : []).map(normalizar).filter((i) => i?.nombre))
    .catch((err) => {
      cache.delete(tipo);
      throw err;
    });
  cache.set(tipo, promesa);
  return promesa;
}

export async function crearItemCatalogo(tipo, { nombre, icono = "" }) {
  const data = await apiRequest(BASE, { method: "POST", data: { tipo, nombre, icono } });
  cache.delete(tipo);
  return normalizar(data);
}

export async function actualizarItemCatalogo(tipo, id, cambios) {
  const data = await apiRequest(`${BASE}/${id}`, { method: "PUT", data: cambios });
  cache.delete(tipo);
  return normalizar(data);
}

export async function eliminarItemCatalogo(tipo, id) {
  await apiRequest(`${BASE}/${id}`, { method: "DELETE" });
  cache.delete(tipo);
}
