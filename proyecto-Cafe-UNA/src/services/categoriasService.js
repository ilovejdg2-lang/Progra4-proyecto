import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/categorias`;

async function request(url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  return apiRequest(url, {
    ...options,
    skipAuth: method === "GET" ? true : options.skipAuth,
    errorPrefix: "Error en categor\u00edas",
    timeoutMessage: "Tiempo de espera agotado al consultar categor\u00edas.",
  });
}

function normalizar(item) {
  if (!item) return null;
  return {
    id: String(item.id ?? item.Id ?? ""),
    nombre: String(item.nombre ?? item.Nombre ?? "").trim(),
    tipo: String(item.tipo ?? item.Tipo ?? "").trim().toLowerCase(),
    padre: String(item.padre ?? item.Padre ?? "").trim(),
    usos: Number(item.usos ?? item.Usos ?? 0) || 0,
  };
}

export async function obtenerCategorias(tipo, padre) {
  const params = new URLSearchParams();
  if (tipo) params.set("tipo", tipo);
  if (padre !== undefined) params.set("padre", padre ?? "");
  const query = params.toString() ? `?${params.toString()}` : "";
  const data = await request(`${BASE_URL}${query}`);
  const lista = Array.isArray(data) ? data : [];
  return lista.map(normalizar).filter((item) => item?.nombre);
}

export async function crearCategoria({ nombre, tipo, padre = "" }) {
  const result = await request(BASE_URL, {
    method: "POST",
    data: { nombre, tipo, padre: padre || "" },
  });
  return normalizar(result);
}

export async function eliminarCategoria(id) {
  await request(`${BASE_URL}/${id}`, { method: "DELETE" });
  return true;
}
