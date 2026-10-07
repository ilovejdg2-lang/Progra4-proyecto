import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/inventario`;

async function request(url, options = {}) {
  return apiRequest(url, {
    ...options,
    errorPrefix: "Error en salidas de inventario",
    timeoutMessage: "Tiempo de espera agotado al consultar las salidas de inventario.",
  });
}

export async function obtenerMotivosSalida() {
  const data = await request(`${BASE_URL}/motivos-salida`);
  const motivos = Array.isArray(data) ? data : Array.isArray(data?.value) ? data.value : [];

  return motivos
    .map((motivo) => ({
      id: Number(motivo?.id ?? motivo?.Id),
      nombre: String(motivo?.nombre ?? motivo?.Nombre ?? "").trim(),
    }))
    .filter((motivo) => Number.isInteger(motivo.id) && motivo.id > 0 && motivo.nombre);
}

export async function registrarSalidaInventario(payload) {
  return request(`${BASE_URL}/salidas`, {
    method: "POST",
    data: payload,
  });
}
