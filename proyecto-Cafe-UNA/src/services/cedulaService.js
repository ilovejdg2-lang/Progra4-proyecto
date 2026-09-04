import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/cedula`;

export async function consultarCedula(numero) {
  const normalizado = String(numero ?? "").replace(/\D/g, "");
  return apiRequest(`${BASE_URL}/${encodeURIComponent(normalizado)}`, {
    timeout: 35000,
    errorPrefix: "No se pudo consultar la c\u00e9dula",
    timeoutMessage: "Tiempo de espera agotado al consultar la c\u00e9dula.",
  });
}

export async function consultarCedulaDetallada(numero) {
  const normalizado = String(numero ?? "").replace(/\D/g, "");
  return apiRequest(`${BASE_URL}/${encodeURIComponent(normalizado)}/detalle`, {
    timeout: 35000,
    errorPrefix: "No se pudo consultar la c\u00e9dula",
    timeoutMessage: "Tiempo de espera agotado al consultar la c\u00e9dula.",
  });
}
