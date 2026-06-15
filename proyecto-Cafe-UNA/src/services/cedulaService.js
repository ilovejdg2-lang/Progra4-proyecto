import { apiRequest } from "./apiClient";

const BASE_URL = `${import.meta.env.BACKEND_URL}/cedula`;

export async function consultarCedula(numero) {
  const normalizado = String(numero ?? "").replace(/\D/g, "");
  return apiRequest(`${BASE_URL}/${encodeURIComponent(normalizado)}`, {
    skipAuth: true,
    timeout: 35000,
    errorPrefix: "No se pudo consultar la cédula",
    timeoutMessage: "Tiempo de espera agotado al consultar la cédula.",
  });
}
